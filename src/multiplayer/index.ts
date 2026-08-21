import {
	CanvasTexture,
	CapsuleGeometry,
	CircleGeometry,
	Group,
	Mesh,
	MeshStandardMaterial,
	SphereGeometry,
	Sprite,
	SpriteMaterial,
	SRGBColorSpace,
	Vector3
} from "three";
import {joinRoom, type MessageAction, type Room} from "trystero";
import {createClient, type RealtimeChannel, type SupabaseClient} from "@supabase/supabase-js";
import Core from "../core";
import Character from "../character";
import {ON_CHANGE_VISITOR_NAME, ON_SEND_CHAT} from "../Constants";

type PosePayload = Record<string, string | number | boolean>;
type ChatPayload = Record<string, string>;

type RemoteVisitor = {
	root: Group;
	name: string;
	nameLabel: Sprite;
	target: Vector3;
	targetYaw: number;
	leftArm: Group;
	rightArm: Group;
	leftLeg: Group;
	rightLeg: Group;
	moving: boolean;
	walkPhase: number;
};

const APP_ID = "vn-x23d8-baotoancuaquakhu-1996-2006-v1";
const DEFAULT_ROOM = "bao-tang-chinh";
const SEND_INTERVAL = 100;
const HEARTBEAT_INTERVAL = 2000;
const MAX_VISIBLE_VISITORS = 20;

export default class Multiplayer {
	private core: Core;
	private character: Character;
	private room: Room | null = null;
	private poseAction: MessageAction<PosePayload> | null = null;
	private chatAction: MessageAction<ChatPayload> | null = null;
	private realtimeClient: SupabaseClient | null = null;
	private realtimeChannel: RealtimeChannel | null = null;
	private realtimeSubscribed = false;
	private useCentralRealtime = false;
	private clientId = crypto.randomUUID();
	private visitors = new Map<string, RemoteVisitor>();
	private connected = false;
	private lastPosition = new Vector3();
	private lastSentPosition = new Vector3(Number.POSITIVE_INFINITY, 0, 0);
	private lastSentAt = 0;
	private lastYaw = 0;
	private visitorName = this.getVisitorName();
	private lastChatAt = 0;
	private peerChatTimes = new Map<string, number>();
	private activeRoomId = DEFAULT_ROOM;
	private centralFallbackTimer: number | null = null;

	constructor(character: Character) {
		this.core = new Core();
		this.character = character;
		this.lastPosition.copy(character.position);
		this.core.$on(ON_SEND_CHAT, this.handleSendChat.bind(this));
		this.core.$on(ON_CHANGE_VISITOR_NAME, this.handleChangeVisitorName.bind(this));
	}

	connect() {
		if (this.connected) return;
		this.connected = true;
		this.core.ui.updateMultiplayerStatus("connecting");

		const requestedRoom = new URLSearchParams(window.location.search).get("phong");
		const roomId = requestedRoom?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || DEFAULT_ROOM;
		this.activeRoomId = roomId;
		const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
		const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

		if (supabaseUrl && supabaseKey) {
			try {
				this.connectCentralRealtime(roomId, supabaseUrl, supabaseKey);
			} catch (error) {
				console.warn("Cấu hình Supabase Realtime không hợp lệ; chuyển sang WebRTC dự phòng", error);
				this.useCentralRealtime = false;
				this.connectPeerFallback(roomId);
			}
			return;
		}

		console.warn("Chưa cấu hình Supabase Realtime; đang dùng kết nối WebRTC dự phòng.");
		this.connectPeerFallback(roomId);
	}

	private connectPeerFallback(roomId: string) {
		try {
			this.room = joinRoom(
				{appId: APP_ID},
				roomId,
				{onJoinError: details => console.warn("Một relay WebRTC không khả dụng", details.error)}
			);
			this.poseAction = this.room.makeAction<PosePayload>("visitor-pose");
			this.poseAction.onMessage = (payload, {peerId}) => this.receivePose(peerId, payload);
			this.chatAction = this.room.makeAction<ChatPayload>("visitor-chat");
			this.chatAction.onMessage = (payload, {peerId}) => this.receiveChat(peerId, payload);
			this.room.onPeerJoin = peerId => {
				this.sendPose(peerId);
				this.updateVisitorCount();
			};
			this.room.onPeerLeave = peerId => {
				this.removeVisitor(peerId);
				this.updateVisitorCount();
			};
			this.core.ui.updateMultiplayerStatus("fallback", 1);
			window.addEventListener("pagehide", () => void this.room?.leave(), {once: true});
		} catch (error) {
			console.warn("Không thể mở phòng WebRTC dự phòng", error);
			this.core.ui.updateMultiplayerStatus("offline");
		}
	}

	private connectCentralRealtime(roomId: string, supabaseUrl: string, supabaseKey: string) {
		this.useCentralRealtime = true;
		this.realtimeClient = createClient(supabaseUrl, supabaseKey, {
			auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
			realtime: {params: {eventsPerSecond: 20}}
		});
		this.realtimeChannel = this.realtimeClient.channel(`museum:${roomId}`, {
			config: {
				broadcast: {self: false, ack: false},
				presence: {key: this.clientId},
				private: false
			}
		});
		this.realtimeChannel
			.on("broadcast", {event: "pose"}, ({payload}) => {
				if (payload?.id && payload.id !== this.clientId) this.receivePose(String(payload.id), payload as PosePayload);
			})
			.on("broadcast", {event: "chat"}, ({payload}) => {
				if (payload?.id && payload.id !== this.clientId) this.receiveChat(String(payload.id), payload as ChatPayload);
			})
			.on("presence", {event: "sync"}, () => this.syncCentralPresence())
			.subscribe(async status => {
				if (status === "SUBSCRIBED") {
					this.clearCentralFallback();
					this.realtimeSubscribed = true;
					await this.realtimeChannel?.track({id: this.clientId, name: this.visitorName, onlineAt: Date.now()});
					this.sendPose();
					this.syncCentralPresence();
					return;
				}
				if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
					this.realtimeSubscribed = false;
					this.core.ui.updateMultiplayerStatus("reconnecting", Math.max(1, this.visitors.size + 1));
					this.schedulePeerFallback();
				}
				if (status === "CLOSED" && this.connected) {
					this.realtimeSubscribed = false;
					this.core.ui.updateMultiplayerStatus("reconnecting", Math.max(1, this.visitors.size + 1));
					this.schedulePeerFallback();
				}
			});
		this.schedulePeerFallback();

		window.addEventListener("pagehide", () => {
			void this.realtimeChannel?.untrack();
			if (this.realtimeClient && this.realtimeChannel) void this.realtimeClient.removeChannel(this.realtimeChannel);
		}, {once: true});
	}

	private schedulePeerFallback() {
		if (!this.useCentralRealtime || this.centralFallbackTimer !== null) return;
		this.centralFallbackTimer = window.setTimeout(() => {
			this.centralFallbackTimer = null;
			if (!this.useCentralRealtime || this.realtimeSubscribed) return;
			console.warn("Supabase Realtime chưa kết nối sau 12 giây; chuyển sang WebRTC dự phòng.");
			if (this.realtimeClient && this.realtimeChannel) void this.realtimeClient.removeChannel(this.realtimeChannel);
			this.realtimeClient = null;
			this.realtimeChannel = null;
			this.useCentralRealtime = false;
			for (const peerId of [...this.visitors.keys()]) this.removeVisitor(peerId);
			this.connectPeerFallback(this.activeRoomId);
		}, 12000);
	}

	private clearCentralFallback() {
		if (this.centralFallbackTimer === null) return;
		window.clearTimeout(this.centralFallbackTimer);
		this.centralFallbackTimer = null;
	}

	update(delta: number) {
		if (!this.poseAction && !this.realtimeChannel) return;

		const current = this.character.position;
		const movementX = current.x - this.lastPosition.x;
		const movementZ = current.z - this.lastPosition.z;
		if (movementX * movementX + movementZ * movementZ > 0.00001) {
			this.lastYaw = Math.atan2(movementX, movementZ);
		}
		this.lastPosition.copy(current);

		const now = performance.now();
		const moved = current.distanceToSquared(this.lastSentPosition) > 0.0025;
		if ((moved && now - this.lastSentAt >= SEND_INTERVAL) || now - this.lastSentAt >= HEARTBEAT_INTERVAL) {
			this.sendPose();
		}

		const smoothing = 1 - Math.exp(-delta * 10);
		for (const visitor of this.visitors.values()) {
			visitor.root.position.lerp(visitor.target, smoothing);
			const yawDifference = Math.atan2(
				Math.sin(visitor.targetYaw - visitor.root.rotation.y),
				Math.cos(visitor.targetYaw - visitor.root.rotation.y)
			);
			visitor.root.rotation.y += yawDifference * smoothing;
			visitor.walkPhase += delta * (visitor.moving ? 8 : 2);
			const swing = visitor.moving ? Math.sin(visitor.walkPhase) * .5 : Math.sin(visitor.walkPhase) * .035;
			visitor.leftArm.rotation.x = swing;
			visitor.rightArm.rotation.x = -swing;
			visitor.leftLeg.rotation.x = -swing * .7;
			visitor.rightLeg.rotation.x = swing * .7;
		}
	}

	private sendPose(target?: string) {
		if (!this.poseAction && !this.realtimeChannel) return;
		const position = this.character.position;
		const moved = position.distanceToSquared(this.lastSentPosition) > 0.0025;
		const payload: PosePayload = {
			id: this.clientId,
			x: Number(position.x.toFixed(3)),
			y: Number(position.y.toFixed(3)),
			z: Number(position.z.toFixed(3)),
			yaw: Number(this.lastYaw.toFixed(3)),
			moving: moved,
			name: this.visitorName
		};
		this.lastSentPosition.copy(position);
		this.lastSentAt = performance.now();
		if (this.useCentralRealtime && this.realtimeChannel && this.realtimeSubscribed) {
			void this.realtimeChannel.send({type: "broadcast", event: "pose", payload}).catch(() => undefined);
		} else if (this.poseAction) {
			void this.poseAction.send(payload, target ? {target} : undefined).catch(() => undefined);
		}
	}

	private receivePose(peerId: string, payload: PosePayload) {
		const x = Number(payload.x);
		const y = Number(payload.y);
		const z = Number(payload.z);
		const yaw = Number(payload.yaw);
		if (![x, y, z, yaw].every(Number.isFinite) || Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) > 1000) return;

		let visitor = this.visitors.get(peerId);
		if (!visitor) {
			if (this.visitors.size >= MAX_VISIBLE_VISITORS) return;
			visitor = this.createVisitor(peerId, this.safeName(payload.name));
			visitor.root.position.set(x, y - 5, z);
			this.visitors.set(peerId, visitor);
			this.core.scene.add(visitor.root);
			this.updateVisitorCount();
		}
		const nextName = this.safeName(payload.name);
		if (nextName !== visitor.name) {
			visitor.root.remove(visitor.nameLabel);
			visitor.nameLabel.material.map?.dispose();
			visitor.nameLabel.material.dispose();
			visitor.nameLabel = this.createNameLabel(nextName);
			visitor.name = nextName;
			visitor.root.add(visitor.nameLabel);
		}
		visitor.target.set(x, y - 5, z);
		visitor.targetYaw = yaw;
		visitor.moving = payload.moving === true;
	}

	private handleSendChat([rawMessage]: [string]) {
		if (!this.chatAction && !this.realtimeChannel) return;
		if (this.useCentralRealtime && !this.realtimeSubscribed) return;
		const text = this.safeMessage(rawMessage);
		const now = Date.now();
		if (!text || now - this.lastChatAt < 500) return;
		this.lastChatAt = now;
		this.core.ui.appendChatMessage(this.visitorName, text, true, now);
		const payload: ChatPayload = {id: this.clientId, name: this.visitorName, text};
		if (this.useCentralRealtime && this.realtimeChannel && this.realtimeSubscribed) {
			void this.realtimeChannel.send({type: "broadcast", event: "chat", payload}).catch(() => undefined);
		} else if (this.chatAction) {
			void this.chatAction.send(payload).catch(() => undefined);
		}
	}

	private handleChangeVisitorName([rawName]: [string]) {
		const name = this.safeName(rawName);
		this.visitorName = name;
		sessionStorage.setItem("museum-visitor-name", name);
		if (this.useCentralRealtime && this.realtimeChannel && this.realtimeSubscribed) {
			void this.realtimeChannel.track({id: this.clientId, name, onlineAt: Date.now()});
		}
		this.sendPose();
	}

	private receiveChat(peerId: string, payload: ChatPayload) {
		const now = Date.now();
		const previousMessageAt = this.peerChatTimes.get(peerId) || 0;
		if (now - previousMessageAt < 300) return;
		const text = this.safeMessage(payload.text);
		if (!text) return;
		this.peerChatTimes.set(peerId, now);
		this.core.ui.appendChatMessage(this.safeName(payload.name), text, false, now);
	}

	private createVisitor(peerId: string, name: string): RemoteVisitor {
		const root = new Group();
		root.name = `online-visitor-${peerId}`;
		const clay = new MeshStandardMaterial({color: 0xf5f2e9, roughness: .92, metalness: 0});
		const accentColors = [0x8b2328, 0xc69e3c, 0x2f6655, 0x315b7c];
		const hash = [...peerId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
		const accent = new MeshStandardMaterial({color: accentColors[hash % accentColors.length], roughness: .8});

		const body = new Mesh(new CapsuleGeometry(.56, 1.25, 6, 12), clay);
		body.position.y = 2.55;
		body.scale.set(1, 1, .76);
		const head = new Mesh(new SphereGeometry(.58, 18, 14), clay);
		head.position.set(0, 4.05, 0);
		head.scale.set(1, 1.08, .96);
		const badge = new Mesh(new CircleGeometry(.13, 16), accent);
		badge.position.set(0, 2.85, .53);

		const leftArm = this.createLimb(clay, .28, 1.55);
		leftArm.position.set(-.57, 3.15, 0);
		leftArm.rotation.z = .13 + (hash % 3) * .08;
		const rightArm = this.createLimb(clay, .28, 1.55);
		rightArm.position.set(.57, 3.15, 0);
		rightArm.rotation.z = -.13 - (hash % 2) * .1;
		const leftLeg = this.createLimb(clay, .31, 1.7);
		leftLeg.position.set(-.3, 1.62, 0);
		const rightLeg = this.createLimb(clay, .31, 1.7);
		rightLeg.position.set(.3, 1.62, 0);

		const nameLabel = this.createNameLabel(name);
		root.add(body, head, badge, leftArm, rightArm, leftLeg, rightLeg, nameLabel);
		root.traverse(object => {
			if (object instanceof Mesh) {
				object.castShadow = true;
				object.receiveShadow = true;
			}
		});

		return {
			root,
			name,
			nameLabel,
			target: new Vector3(),
			targetYaw: 0,
			leftArm,
			rightArm,
			leftLeg,
			rightLeg,
			moving: false,
			walkPhase: (hash % 10) * .4
		};
	}

	private createLimb(material: MeshStandardMaterial, radius: number, length: number): Group {
		const pivot = new Group();
		const limb = new Mesh(new CapsuleGeometry(radius, length - radius * 2, 5, 10), material);
		limb.position.y = -length / 2;
		pivot.add(limb);
		return pivot;
	}

	private createNameLabel(name: string): Sprite {
		const canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = 128;
		const context = canvas.getContext("2d")!;
		context.fillStyle = "rgba(49, 11, 13, .9)";
		context.strokeStyle = "#d6ad4f";
		context.lineWidth = 5;
		context.beginPath();
		context.roundRect(7, 12, 498, 102, 28);
		context.fill();
		context.stroke();
		context.fillStyle = "#fff3d0";
		context.font = "700 44px 'Segoe UI', Arial, sans-serif";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillText(name, 256, 64, 450);
		const texture = new CanvasTexture(canvas);
		texture.colorSpace = SRGBColorSpace;
		const label = new Sprite(new SpriteMaterial({map: texture, transparent: true, depthTest: true}));
		label.position.set(0, 5.15, 0);
		label.scale.set(2.6, .65, 1);
		label.renderOrder = 30;
		return label;
	}

	private safeName(value: unknown): string {
		if (typeof value !== "string") return "Khách tham quan";
		return value.replace(/[<>]/g, "").trim().slice(0, 24) || "Khách tham quan";
	}

	private safeMessage(value: unknown): string {
		if (typeof value !== "string") return "";
		return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 280);
	}

	private getVisitorName(): string {
		const storageKey = "museum-visitor-name";
		const existing = sessionStorage.getItem(storageKey);
		if (existing) return existing;
		const generated = `Khách ${String(Math.floor(100 + Math.random() * 900))}`;
		sessionStorage.setItem(storageKey, generated);
		return generated;
	}

	private removeVisitor(peerId: string) {
		const visitor = this.visitors.get(peerId);
		if (!visitor) return;
		this.core.scene.remove(visitor.root);
		visitor.root.traverse(object => {
			if (object instanceof Mesh) object.geometry.dispose();
			const material = (object as Mesh).material;
			if (material instanceof MeshStandardMaterial) material.dispose();
			if (object instanceof Sprite) {
				object.material.map?.dispose();
				object.material.dispose();
			}
		});
		this.visitors.delete(peerId);
		this.peerChatTimes.delete(peerId);
	}

	private syncCentralPresence() {
		if (!this.realtimeChannel || !this.realtimeSubscribed) return;
		const state = this.realtimeChannel.presenceState() as Record<string, Array<{id?: string}>>;
		const presentIds = new Set<string>();
		Object.values(state).flat().forEach(presence => {
			if (presence.id) presentIds.add(String(presence.id));
		});
		presentIds.add(this.clientId);
		for (const peerId of this.visitors.keys()) {
			if (!presentIds.has(peerId)) this.removeVisitor(peerId);
		}
		this.core.ui.updateMultiplayerStatus("online", presentIds.size);
	}

	private updateVisitorCount() {
		if (this.useCentralRealtime) {
			this.syncCentralPresence();
			return;
		}
		const peerCount = this.room ? Object.keys(this.room.getPeers()).length : this.visitors.size;
		this.core.ui.updateMultiplayerStatus("fallback", peerCount + 1);
	}
}

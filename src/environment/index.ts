import Core from "../core";
import Loader from "../loader";
import {BAMBOO_FURNITURE_URL, COLLISION_SCENE_URL, EXHIBITS, EXHIBITS_BY_SLOT, ON_LOAD_MODEL_FINISH, ON_LOAD_PROGRESS, STATIC_SCENE_URL} from "../Constants";
import {
	Box3,
	CanvasTexture,
	Group,
	Material,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	PlaneGeometry,
	Texture,
	Vector3
} from "three";
import {isLight, isMesh} from "../utils/typeAssert";
import {MeshBVH, MeshBVHOptions, StaticGeometryGenerator} from "three-mesh-bvh";
import {Reflector} from "../lib/Reflector";

export default class Environment {
	private core: Core;
	private loader: Loader;
	private collision_scene: Group | undefined;
	collider: Mesh | undefined;
	private texture_boards: Record<string, Texture> = {};
	private gallery_boards: Record<string, Mesh> = {};
	raycast_objects: Object3D[] = [];
	is_load_finished = false;

	constructor() {
		this.core = new Core();
		this.loader = this.core.loader;
		this._loadScenes();
	}

	/*
	* Load all scene objects (map, frames, textures, and floor reflection)
	* */
	private async _loadScenes() {
		try {
			await this._loadSceneAndCollisionDetection();
			await this._loadStaticScene();
			await this._loadBoardsTexture();
			this._configureGallery();
			this._createFixedStageSigns();
			this._createSpecularReflection();
			this.is_load_finished = true;
			this.core.$emit(ON_LOAD_MODEL_FINISH);
		} catch (e) {
			console.log(e);
		}
	}

	private async _loadBoardsTexture(): Promise<void> {
		for (const exhibit of EXHIBITS) {
			const source_texture = await this.loader.texture_loader.loadAsync(exhibit.image);
			this.texture_boards[exhibit.slot] = this._createExhibitTexture(source_texture, exhibit.period, exhibit.order);
		}

		return Promise.resolve();
	}

	private _createExhibitTexture(source: Texture, period: string, order: number): Texture {
		const canvas = document.createElement("canvas");
		canvas.width = 1200;
		canvas.height = 1200;
		const context = canvas.getContext("2d")!;
		const source_image = source.image as HTMLImageElement;

		context.fillStyle = "#ead9b9";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = "#5b1717";
		context.fillRect(34, 34, 1132, 1132);
		context.fillStyle = "#d1a84b";
		context.fillRect(54, 54, 1092, 1092);
		context.fillStyle = "#15110d";
		context.fillRect(68, 68, 1064, 860);

		const frame = {x: 76, y: 76, width: 1048, height: 844};
		const source_ratio = source_image.width / source_image.height;
		const frame_ratio = frame.width / frame.height;
		let sx = 0;
		let sy = 0;
		let sw = source_image.width;
		let sh = source_image.height;
		if (source_ratio > frame_ratio) {
			sw = source_image.height * frame_ratio;
			sx = (source_image.width - sw) / 2;
		} else {
			sh = source_image.width / frame_ratio;
			sy = (source_image.height - sh) / 2;
		}
		context.filter = "sepia(.24) contrast(1.06) saturate(.82)";
		context.drawImage(source_image, sx, sy, sw, sh, frame.x, frame.y, frame.width, frame.height);
		context.filter = "none";
		context.fillStyle = "rgba(74, 18, 18, .92)";
		context.fillRect(68, 928, 1064, 218);
		context.fillStyle = "#f2cf65";
		context.font = "700 42px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.fillText(`CHẶNG ${String(order).padStart(2, "0")}`.normalize("NFC"), 112, 1000);
		context.fillStyle = "#fff7df";
		context.font = "700 76px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.fillText(period.normalize("NFC"), 112, 1084);
		context.fillStyle = "#f2cf65";
		context.beginPath();
		context.arc(1010, 1038, 62, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = "#5b1717";
		context.font = "700 52px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.textAlign = "center";
		context.fillText(String(order), 1010, 1056);

		const texture = new CanvasTexture(canvas);
		texture.needsUpdate = true;
		source.dispose();
		return texture;
	}

	/*
	* Configure artwork userData and texture orientation
	* */
	private _configureGallery() {
		for (const key in this.texture_boards) {
			const board = this.gallery_boards[`gallery${key}_board`];
			const exhibit = EXHIBITS_BY_SLOT[key];
			if (!board || !exhibit) continue;
			const board_material = board.material;
			(board_material as MeshBasicMaterial).map = this.texture_boards[key];
			board.userData = {
				name: board.name,
				title: `${exhibit.period} · ${exhibit.title}`,
				exhibit,
				index: key,
				src: exhibit.image,
				show_boards: true
			};

			// Flip the texture
			if ([4, 5, 6, 7, 9].includes(+key)) {
				board.rotation.y = -Math.PI / 2;
			}
			if (8 === +key) {
				board.rotation.y = Math.PI;
			}

			(board_material as MeshBasicMaterial).needsUpdate = true;
		}
	}

	private _createFixedStageSigns() {
		[
			{x: -3.12, y: 15.65, z: -33.52, anchorSlot: 3, title: "1996–2000", subtitle: "XÂY DỰNG NĂNG LỰC"},
			{x: 28.18, y: 13.7, z: 8.9, anchorSlot: 5, title: "2001–2005", subtitle: "ĐỊNH HÌNH THỂ CHẾ"},
			{x: 5.71, y: 9.6, z: 13.84, anchorSlot: 10, title: "2006", subtitle: "ĐỔI MỚI TOÀN DIỆN"},
			{x: -0.32, y: 9.6, z: 5.43, anchorSlot: 8, title: "11/2006", subtitle: "HỘI NHẬP ĐA PHƯƠNG"}
		].forEach(stage => {
			const label = this._createStageSign(stage.title, stage.subtitle);
			const anchor = this.gallery_boards[`gallery${stage.anchorSlot}_board`];
			label.position.set(stage.x, stage.y, stage.z);
			if (anchor) {
				anchor.updateWorldMatrix(true, false);
				anchor.getWorldQuaternion(label.quaternion);
			}
			this.core.scene.add(label);
		});
	}

	private _createStageSign(title: string, subtitle: string) {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 300;
		const context = canvas.getContext("2d")!;
		context.fillStyle = "rgba(45, 11, 12, .92)";
		context.fillRect(16, 16, 992, 268);
		context.strokeStyle = "#caa64c";
		context.lineWidth = 12;
		context.strokeRect(30, 30, 964, 240);
		context.fillStyle = "#f4cf68";
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.font = "700 84px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.fillText(title.normalize("NFC"), 512, 112);
		context.fillStyle = "#fff6df";
		context.font = "700 40px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.fillText(subtitle.normalize("NFC"), 512, 210);
		const texture = new CanvasTexture(canvas);
		texture.needsUpdate = true;
		const material = new MeshBasicMaterial({map: texture, transparent: true, depthWrite: false});
		const sign = new Mesh(new PlaneGeometry(10.2, 3), material);
		sign.name = "fixed-stage-sign";
		sign.userData.fixedStageSign = true;
		sign.renderOrder = 2;
		return sign;
	}

	private _localizeTodoBoard(root: Object3D) {
		let localized_texture: Texture | undefined;
		root.traverse(item => {
			if (!isMesh(item)) return;
			const materials = Array.isArray(item.material) ? item.material : [item.material];
			materials.forEach(material => {
				const mapped_material = material as MeshBasicMaterial;
				if (mapped_material.name !== "Material.002" || !mapped_material.map) return;
				localized_texture ??= this._createLocalizedTodoTexture(mapped_material.map);
				mapped_material.map = localized_texture;
				mapped_material.needsUpdate = true;
			});
		});
	}

	private _createLocalizedTodoTexture(source: Texture) {
		const source_image = source.image as HTMLImageElement;
		const canvas = document.createElement("canvas");
		canvas.width = source_image.width;
		canvas.height = source_image.height;
		const context = canvas.getContext("2d")!;
		context.drawImage(source_image, 0, 0, canvas.width, canvas.height);

		const paper_color = context.getImageData(250, 150, 1, 1).data;
		context.fillStyle = `rgb(${paper_color[0]}, ${paper_color[1]}, ${paper_color[2]})`;
		context.beginPath();
		context.moveTo(16, 24);
		context.lineTo(494, 24);
		context.lineTo(507, 39);
		context.lineTo(507, 701);
		context.lineTo(493, 717);
		context.lineTo(14, 717);
		context.lineTo(0, 703);
		context.lineTo(0, 39);
		context.closePath();
		context.fill();

		const ink = "#6a4315";
		context.fillStyle = ink;
		context.textAlign = "center";
		context.textBaseline = "middle";
		context.font = "700 48px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.fillText("VIỆC CẦN LÀM".normalize("NFC"), 253, 92, 420);

		const tasks = [
			{label: "Mã nguồn TypeScript", checked: true},
			{label: "Không gian WebGL", checked: true},
			{label: "Chỉnh sửa nội dung", checked: true},
			{label: "Kiểm tra tư liệu", checked: false}
		];
		context.font = "600 30px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.textAlign = "left";
		tasks.forEach((task, index) => {
			const y = 246 + index * 84;
			context.lineWidth = 4;
			context.strokeStyle = ink;
			context.strokeRect(92, y - 17, 30, 30);
			if (task.checked) {
				context.beginPath();
				context.moveTo(97, y - 2);
				context.lineTo(107, y + 9);
				context.lineTo(127, y - 19);
				context.stroke();
			}
			context.fillText(task.label.normalize("NFC"), 140, y, 330);
		});

		context.textAlign = "center";
		context.font = "600 32px 'Segoe UI', Tahoma, Arial, sans-serif";
		context.fillText("by x23d8", 253, 673);

		const texture = new CanvasTexture(canvas);
		texture.colorSpace = source.colorSpace;
		texture.flipY = source.flipY;
		texture.wrapS = source.wrapS;
		texture.wrapT = source.wrapT;
		texture.repeat.copy(source.repeat);
		texture.offset.copy(source.offset);
		texture.center.copy(source.center);
		texture.rotation = source.rotation;
		texture.minFilter = source.minFilter;
		texture.magFilter = source.magFilter;
		texture.generateMipmaps = source.generateMipmaps;
		texture.needsUpdate = true;
		return texture;
	}

	/*
	* Create the floor reflection
	* */
	private _createSpecularReflection() {
		const mirror = new Reflector(new PlaneGeometry(100, 100), {
			textureWidth: window.innerWidth * window.devicePixelRatio,
			textureHeight: window.innerHeight * window.devicePixelRatio,
			color: 0xffffff,
		});
		if (mirror.material instanceof Material) {
			mirror.material.transparent = true;
		}
		mirror.rotation.x = -0.5 * Math.PI;
		this.core.scene.add(mirror);
	}

	/*
	* Load the remaining scene without collision detection
	* */
	private _loadStaticScene(): Promise<void> {
		return new Promise(resolve => {
			this.loader.gltf_loader.load(STATIC_SCENE_URL, (gltf) => {
				this.core.scene.add(gltf.scene);
				this._localizeTodoBoard(gltf.scene);
				gltf.scene.traverse(item => {
					if (item.name === "computer") {
						item.userData = {
							name: item.name,
							title: "Máy lưu trữ · Ký ức thống nhất đất nước",
						};
						this.raycast_objects.push(item);
					}
				});
				resolve();
			}, (event) => {
				this.core.$emit(ON_LOAD_PROGRESS, {url: STATIC_SCENE_URL, loaded: event.loaded, total: event.total});
			});
		});
	}

	private async _replaceSofaWithBambooFurniture(): Promise<void> {
		if (!this.collision_scene) return;

		const sofa = this.collision_scene.getObjectByName("sofa");
		if (!sofa) return;

		try {
			const sofa_bounds = new Box3().setFromObject(sofa);
			const sofa_center = sofa_bounds.getCenter(new Vector3());
			const sofa_size = sofa_bounds.getSize(new Vector3());
			const {scene: furniture} = await this.loader.gltf_loader.loadAsync(BAMBOO_FURNITURE_URL);

			furniture.name = "vietnamese_bamboo_furniture";
			sofa.getWorldQuaternion(furniture.quaternion);
			furniture.rotateY(Math.PI / 2);
			furniture.updateMatrixWorld(true);

			const source_size = new Box3().setFromObject(furniture).getSize(new Vector3());
			const target_length = Math.max(sofa_size.x, sofa_size.z);
			const source_length = Math.max(source_size.x, source_size.z);
			const furniture_scale = target_length / source_length;
			furniture.scale.setScalar(furniture_scale);

			furniture.traverse(item => {
				if (!isMesh(item)) return;
				item.castShadow = true;
				item.receiveShadow = true;
			});

			this.collision_scene.add(furniture);
			furniture.updateMatrixWorld(true);

			const furniture_bounds = new Box3().setFromObject(furniture);
			const furniture_center = furniture_bounds.getCenter(new Vector3());
			furniture.position.x += sofa_center.x - furniture_center.x;
			furniture.position.y += sofa_bounds.min.y - furniture_bounds.min.y;
			furniture.position.z += sofa_center.z - furniture_center.z;
			furniture.userData.replaces = sofa.name;
			furniture.updateMatrixWorld(true);

			sofa.parent?.remove(sofa);
		} catch (error) {
			console.warn("Unable to replace the gallery sofa with bamboo furniture.", error);
		}
	}

	/*
	* Load the scene with collision detection
	* */
	private _loadSceneAndCollisionDetection(): Promise<void> {
		return new Promise(resolve => {
			this.loader.gltf_loader.load(COLLISION_SCENE_URL, async (gltf) => {
				this.collision_scene = gltf.scene;

				this.collision_scene.updateMatrixWorld(true);
				await this._replaceSofaWithBambooFurniture();

				this.collision_scene.traverse(item => {
					if (item.name === "home001" || item.name === "PointLight") {
						item.castShadow = true;
					}

					if (item.name.includes("PointLight") && isLight(item)) {
						item.intensity *= 2000;
					}

					if (item.name === "home002") {
						item.castShadow = true;
						item.receiveShadow = true;
					}

					// Extract artwork frame objects
					if (/gallery.*_board/.test(item.name) && isMesh(item)) {
						this.gallery_boards[item.name] = item;
					}

					this.raycast_objects.push(item);
				});

				const static_generator = new StaticGeometryGenerator(this.collision_scene);
				static_generator.attributes = ["position"];

				const merged_geometry = static_generator.generate();
				merged_geometry.boundsTree = new MeshBVH(merged_geometry, {lazyGeneration: false} as MeshBVHOptions);

				this.collider = new Mesh(merged_geometry);
				this.core.scene.add(this.collision_scene);

				resolve();
			}, (event) => {
				this.core.$emit(ON_LOAD_PROGRESS, {url: COLLISION_SCENE_URL, loaded: event.loaded, total: event.total});
			});
		});
	}
}

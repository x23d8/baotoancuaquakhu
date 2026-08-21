import {DoubleSide, Mesh, MeshStandardMaterial, NoBlending, PlaneGeometry, Scene, Vector3} from "three";
import {CSS3DObject, CSS3DRenderer} from "three/examples/jsm/renderers/CSS3DRenderer";
import Core from "../core";
import {IFRAME_SRC, ON_TOGGLE_AUDIO} from "../Constants";
import type Character from "../character";

export default class Css3DRenderer {
	private core: Core;
	private character: Character;
	private css_scene: Scene;
	private css_renderer: CSS3DRenderer;
	private iframe!: HTMLIFrameElement;
	private interaction_iframe!: HTMLIFrameElement;
	private css_root: HTMLElement;
	private screen_position = new Vector3(-15.55, 5.5, 36.33);
	private interaction_position = new Vector3(-12.7, 5, 36.33);
	private is_near_computer = false;
	isInteracting = false;

	constructor(character: Character) {
		this.core = new Core();
		this.character = character;
		this.css_scene = new Scene();
		this.css_renderer = new CSS3DRenderer();
		this.css_root = document.querySelector<HTMLElement>("#css")!;

		this._initRenderer();
		this._initResponsiveResize();
		this._createCssObj();
		this._createInteractionOverlay();
		document.addEventListener("keydown", this._handleKeyDown.bind(this));
		window.addEventListener("message", this._handleDesktopMessage.bind(this));
	}

	update() {
		this.css_renderer.render(this.css_scene, this.core.camera);
		if (this.isInteracting) return;
		const was_near = this.is_near_computer;
		this.is_near_computer = this.character.position.distanceToSquared(this.interaction_position) <= 42;
		if (was_near !== this.is_near_computer) {
			this.core.ui.updateComputerPrompt(this.is_near_computer, false);
		}
	}

	private _initRenderer() {
		this.css_renderer.setSize(window.innerWidth, window.innerHeight);
		this.css_renderer.domElement.style.position = "absolute";
		this.css_renderer.domElement.style.top = "0px";
		this.css_renderer.domElement.style.pointerEvents = "none";
		this.css_root.appendChild(this.css_renderer.domElement);
	}

	private _initResponsiveResize() {
		window.addEventListener("resize", () => {
			this.css_renderer.setSize(window.innerWidth, window.innerHeight);
		});
	}

	private _createCssObj() {
		const material = new MeshStandardMaterial({color: 0x000000});
		material.side = DoubleSide;
		material.transparent = true;
		material.opacity = 0;
		material.blending = NoBlending;
		const geometry = new PlaneGeometry(1.5, 1.3);
		const mesh = new Mesh(geometry, material);
		mesh.position.copy(this.screen_position);
		mesh.rotation.set(0, Math.PI / 2, 0);
		this.core.scene.add(mesh);

		this.iframe = document.createElement("iframe");
		this.iframe.src = IFRAME_SRC;
		this.iframe.title = "Máy tính lưu trữ tương tác của bảo tàng";
		this.iframe.style.width = "1024px";
		this.iframe.style.height = "768px";
		this.iframe.style.boxSizing = "border-box";
		this.iframe.style.border = "0";
		this.iframe.style.opacity = "1";
		this.iframe.style.pointerEvents = "none";

		const object = new CSS3DObject(this.iframe);
		object.position.copy(mesh.position);
		object.rotation.copy(mesh.rotation);
		// Keep the 4:3 XP desktop completely inside the CRT glass instead of
		// projecting a larger iframe across the monitor bezel.
		object.scale.set(0.00145, 0.00145, 0.00145);
		this.css_scene.add(object);
	}

	private _createInteractionOverlay() {
		this.interaction_iframe = document.createElement("iframe");
		this.interaction_iframe.src = IFRAME_SRC;
		this.interaction_iframe.title = "Desktop Windows XP của máy lưu trữ bảo tàng";
		this.interaction_iframe.style.position = "fixed";
		this.interaction_iframe.style.inset = "0";
		this.interaction_iframe.style.zIndex = "10000";
		this.interaction_iframe.style.display = "none";
		this.interaction_iframe.style.width = "100vw";
		this.interaction_iframe.style.height = "100vh";
		this.interaction_iframe.style.border = "0";
		this.interaction_iframe.style.background = "#2f83cf";
		document.body.appendChild(this.interaction_iframe);
	}

	private _handleKeyDown(event: KeyboardEvent) {
		if (event.repeat) return;
		if (event.code === "KeyE" && this.is_near_computer && !this.isInteracting) {
			event.preventDefault();
			this._enterComputer();
		}
		if (event.code === "Escape" && this.isInteracting) {
			event.preventDefault();
			this._exitComputer();
		}
	}

	private _enterComputer() {
		this.isInteracting = true;
		this.core.control_manage.disabled();
		this.core.orbit_controls.enabled = false;
		this.interaction_iframe.style.display = "block";
		this.core.ui.updateComputerPrompt(false, false);
		window.setTimeout(() => this.interaction_iframe.focus(), 0);
	}

	private _exitComputer() {
		if (!this.isInteracting) return;
		this.isInteracting = false;
		this.interaction_iframe.style.display = "none";
		this.core.orbit_controls.enabled = true;
		this.core.orbit_controls.update();
		this.core.control_manage.enabled();
		this.core.ui.updateComputerPrompt(this.is_near_computer, false);
	}

	private _handleDesktopMessage(event: MessageEvent) {
		if (event.source !== this.iframe.contentWindow && event.source !== this.interaction_iframe.contentWindow) return;
		if (event.data?.type === "museum-computer-exit") this._exitComputer();
		if (event.data?.type === "museum-toggle-audio") this.core.$emit(ON_TOGGLE_AUDIO);
	}
}

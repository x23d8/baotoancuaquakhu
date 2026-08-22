import {ACESFilmicToneMapping, Clock, Color, MOUSE, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer} from "three";
import World from "../world";
import Emitter from "../utils/Emitter";
import Loader from "../loader";
import ControlManage from "../controlManage";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import UI from "../ui";
import {ON_ENTER_APP} from "../Constants";

let instance: Core | null = null;

export default class Core extends Emitter {
	scene!: Scene;
	renderer!: WebGLRenderer;
	camera!: PerspectiveCamera;
	clock!: Clock;
	orbit_controls!: OrbitControls;

	ui!: UI;
	control_manage!: ControlManage;
	loader!: Loader;
	world!: World;
	private has_entered_app = false;

	constructor() {
		super();

		// Singleton
		if (instance) {
			return instance;
		}
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		instance = this;

		this.scene = new Scene();
		this.renderer = new WebGLRenderer({antialias: true});
		this.camera = new PerspectiveCamera();
		this.clock = new Clock();
		this.orbit_controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.orbit_controls.enablePan = false;
		this.orbit_controls.mouseButtons.LEFT = MOUSE.PAN;
		this.orbit_controls.mouseButtons.RIGHT = MOUSE.ROTATE;
		this.renderer.domElement.addEventListener("contextmenu", event => event.preventDefault());

		this._initScene();
		this._initCamera();
		this._initRenderer();
		this._initResponsiveResize();
		this.$on(ON_ENTER_APP, () => {
			this.has_entered_app = true;
		});

		this.ui = new UI();
		this.control_manage = new ControlManage();
		this.loader = new Loader();
		this.world = new World();
	}

	render() {
		this.renderer.setAnimationLoop(() => {
			// Let the browser dedicate its GPU budget to the opening video until
			// the visitor explicitly enters the 3D gallery.
			if (!this.has_entered_app) return;

			this.renderer.render(this.scene, this.camera);
			const delta_time = Math.min(0.05, this.clock.getDelta());
			this.world.update(delta_time);
			this.orbit_controls.update();
		});
	}

	private _initScene() {
		this.scene.background = new Color(0x170b09);
	}

	private _initCamera() {
		this.camera.fov = 55;
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.near = 0.1;
		this.camera.far = 1000;
		this.camera.position.set(0, 0, 3);
		this.camera.updateProjectionMatrix();
	}

	private _initRenderer() {
		this.renderer.shadowMap.enabled = true;
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.toneMapping = ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 0.88;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.domElement.style.position = "absolute";
		this.renderer.domElement.style.zIndex = "1";
		this.renderer.domElement.style.top = "0px";
		document.querySelector("#app")?.appendChild(this.renderer.domElement);
	}

	private _initResponsiveResize() {
		window.addEventListener("resize", () => {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		});
	}
}

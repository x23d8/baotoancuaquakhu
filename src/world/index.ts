import Core from "../core";
import Environment from "../environment";
import Character from "../character";
import Css3DRenderer from "../css3DRenderer";
import Audio from "../audio";
import RayCasterControls from "../rayCasterControls";
import Multiplayer from "../multiplayer";
import {ON_CLICK_RAY_CAST, ON_HIDE_TOOLTIP, ON_LOAD_MODEL_FINISH, ON_LOAD_PROGRESS, ON_ENTER_APP, ON_SHOW_TOOLTIP, ON_TOGGLE_AUDIO} from "../Constants";
import {Object3D} from "three";

export default class World {
	private core: Core;
	private environment: Environment;
	private character: Character;
	private css_3d_renderer: Css3DRenderer;
	private audio: Audio;
	private ray_caster_controls: RayCasterControls;
	private multiplayer: Multiplayer;

	constructor() {
		this.core = new Core();

		this.core.$on(ON_LOAD_PROGRESS, this._handleLoadProgress.bind(this));
		this.core.$on(ON_LOAD_MODEL_FINISH, this._onLoadModelFinish.bind(this));
		this.core.$on(ON_CLICK_RAY_CAST, this._onClickRayCast.bind(this));
		this.core.$on(ON_SHOW_TOOLTIP, this._onShowTooltip.bind(this));
		this.core.$on(ON_HIDE_TOOLTIP, this._onHideTooltip.bind(this));
		this.core.$on(ON_ENTER_APP, this._onEnterApp.bind(this));
		this.core.$on(ON_TOGGLE_AUDIO, this._onToggleAudio.bind(this));

		this.environment = new Environment();
		this.character = new Character({speed: 12});
		this.css_3d_renderer = new Css3DRenderer(this.character);
		this.audio = new Audio();
		this.ray_caster_controls = new RayCasterControls();
		this.multiplayer = new Multiplayer(this.character);
	}

	update(delta: number) {
		if (this.environment.collider && this.environment.is_load_finished) {
			this.css_3d_renderer.update();
			if (!this.css_3d_renderer.isInteracting) this.character.update(delta, this.environment.collider);
			this.multiplayer.update(delta);
			if (!this.css_3d_renderer.isInteracting) this.ray_caster_controls.updateTooltipRayCast(this.environment.raycast_objects);
		}
	}

	/*
	* Callback after entering the gallery
	* */
	private _onEnterApp() {
		this.audio.playAudio();
		// Enable keyboard controls only after entering
		this.core.control_manage.enabled();
		this.multiplayer.connect();
	}

	private async _onLoadModelFinish() {
		// Load the audio after the scene models finish loading
		await this.audio.createAudio();

		// Remove the loading UI and show the entry confirmation after the audio loads
		this.core.ui.removeLoading();
		this.core.ui.showLoadingConfirm();

		// Pass raycastable scene objects to RayCasterControls after the models finish loading
		this.ray_caster_controls.bindClickRayCastObj(this.environment.raycast_objects);
	}

	private _handleLoadProgress([{url, loaded, total}]: [{url: string, loaded: number, total: number}]) {
		const percentage = ((loaded / total) * 100).toFixed(2);
		if (/.*\.(blob|glb)$/i.test(url)) {
			this.core.ui.updateLoadingProgress(`${url.includes("collision") ? "Đang dựng không gian bảo tàng" : "Đang mở kho hiện vật"}: ${percentage}%`);
		}
		if (/.*\.(jpg|png|jpeg)$/i.test(url)) {
			this.core.ui.updateLoadingProgress("Đang phục chế ảnh tư liệu số…");
		}
		if (/.*\.(m4a|mp3|ogg)$/i.test(url)) {
			this.core.ui.updateLoadingProgress("Đang chuẩn bị bài Hello Vietnam…");
		}
	}

	private _onClickRayCast([object]: [object: Object3D]) {
		this.core.ui.showBoardsBox(object.userData.exhibit);
	}

	private _onToggleAudio() {
		const muted = this.audio.toggleAudio();
		this.core.ui.updateAudioButton(muted);
	}

	private _onShowTooltip([{msg, show_preview_tips}]: [{ msg: string, show_preview_tips: boolean }]) {
		this.core.ui.showPreviewTooltip(msg, show_preview_tips);
	}

	private _onHideTooltip() {
		this.core.ui.hidePreviewTooltip();
	}
}

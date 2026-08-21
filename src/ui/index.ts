import Core from "../core";
import {ExhibitInfo, ON_CHANGE_VISITOR_NAME, ON_ENTER_APP, ON_SEND_CHAT, ON_TOGGLE_AUDIO} from "../Constants";

const normalizeVietnamese = (value: string) => value.normalize("NFC");

export default class UI {
	private core: Core;
	private last_focused: HTMLElement | null = null;

	private doms: {
		loading_media: HTMLElement;
		loading: HTMLElement;
		loading_complete: HTMLElement;
		preview_tooltip: HTMLElement;
		preview_tips: HTMLElement;
		boards_dialog: HTMLElement;
		boards_container: HTMLElement;
		boards_content: HTMLElement;
		boards_stage: HTMLElement;
		boards_title: HTMLElement;
		boards_date: HTMLElement;
		boards_location: HTMLElement;
		boards_describe: HTMLElement;
		boards_img: HTMLImageElement;
		boards_caption: HTMLElement;
		boards_credit: HTMLElement;
		boards_textbook: HTMLElement;
		boards_claim: HTMLElement;
		boards_sources: HTMLElement;
		boards_related: HTMLElement;
		help_btn: HTMLElement;
		operating_intro: HTMLElement;
		sources_btn: HTMLElement;
		sources_panel: HTMLElement;
		audio_btn: HTMLElement;
		multiplayer_presence: HTMLElement;
		multiplayer_label: HTMLElement;
		chat_box: HTMLElement;
		chat_toggle: HTMLButtonElement;
		chat_panel: HTMLElement;
		chat_messages: HTMLElement;
		chat_form: HTMLFormElement;
		chat_input: HTMLInputElement;
		chat_unread: HTMLElement;
		computer_prompt: HTMLElement;
		visitor_name_form: HTMLFormElement;
		visitor_name_input: HTMLInputElement;
		visitor_name_status: HTMLElement;
	};

	constructor() {
		this.core = new Core();

		this.doms = {
			loading_media: document.querySelector(".loading-media")!,
			loading: document.querySelector(".loading")!,
			loading_complete: document.querySelector(".loading-complete")!,
			preview_tooltip: document.querySelector(".preview-tooltip")!,
			preview_tips: document.querySelector(".preview-tips")!,
			boards_dialog: document.querySelector(".boards-info")!,
			boards_container: document.querySelector(".boards-info .boards-container")!,
			boards_content: document.querySelector(".boards-info .boards-container .content")!,
			boards_stage: document.querySelector(".boards-container .stage")!,
			boards_title: document.querySelector(".boards-container .title")!,
			boards_date: document.querySelector(".boards-container .date")!,
			boards_location: document.querySelector(".boards-container .location")!,
			boards_describe: document.querySelector(".boards-container .describe")!,
			boards_img: document.querySelector(".boards-container .artifact-image")!,
			boards_caption: document.querySelector(".boards-container .caption")!,
			boards_credit: document.querySelector(".boards-container .credit")!,
			boards_textbook: document.querySelector(".boards-container .textbook-source")!,
			boards_claim: document.querySelector(".boards-container .claim-id")!,
			boards_sources: document.querySelector(".boards-container .external-sources")!,
			boards_related: document.querySelector(".boards-container .related-images")!,
			help_btn: document.querySelector(".help")!,
			operating_intro: document.querySelector(".operating-intro")!,
			sources_btn: document.querySelector(".sources-button")!,
			sources_panel: document.querySelector(".sources-panel")!,
			audio_btn: document.querySelector(".audio-toggle")!,
			multiplayer_presence: document.querySelector(".multiplayer-presence")!,
			multiplayer_label: document.querySelector(".presence-label")!,
			chat_box: document.querySelector(".chat-box")!,
			chat_toggle: document.querySelector(".chat-toggle")!,
			chat_panel: document.querySelector(".chat-panel")!,
			chat_messages: document.querySelector(".chat-messages")!,
			chat_form: document.querySelector(".chat-form")!,
			chat_input: document.querySelector(".chat-input")!,
			chat_unread: document.querySelector(".chat-unread")!,
			computer_prompt: document.querySelector(".computer-prompt")!,
			visitor_name_form: document.querySelector(".visitor-name-form")!,
			visitor_name_input: document.querySelector(".visitor-name-input")!,
			visitor_name_status: document.querySelector(".visitor-name-status")!
		};

		document.body.addEventListener("click", this.handleClick.bind(this));
		document.addEventListener("keydown", this.handleKeyDown.bind(this));
		this.doms.chat_form.addEventListener("submit", this.handleChatSubmit.bind(this));
		this.doms.visitor_name_form.addEventListener("submit", this.handleVisitorNameSubmit.bind(this));
		this.doms.chat_input.addEventListener("keydown", event => {
			if (event.key === "Escape") this.toggleChat(false);
			else event.stopPropagation();
		});
	}

	handleClick(event: MouseEvent) {
		if (!(event.target instanceof HTMLElement)) return;
		const target = event.target;

		if (target.closest(".start")) {
			this.onClickEnterApp();
			return;
		}
		if (target.closest(".boards-info-close") || target === this.doms.boards_dialog) {
			this.hideBoardsBox();
			return;
		}
		if (target.closest(".help")) {
			this.showHelp();
			return;
		}
		if (target.closest(".operating-intro-close") || target === this.doms.operating_intro) {
			this.hideHelp();
			return;
		}
		if (target.closest(".sources-button")) {
			this.showSources();
			return;
		}
		if (target.closest(".sources-panel-close") || target === this.doms.sources_panel) {
			this.hideSources();
			return;
		}
		if (target.closest(".audio-toggle")) {
			this.core.$emit(ON_TOGGLE_AUDIO);
			return;
		}
		if (target.closest(".chat-toggle")) {
			this.toggleChat(true);
			return;
		}
		if (target.closest(".chat-close")) {
			this.toggleChat(false);
			return;
		}
		const related_button = target.closest<HTMLButtonElement>(".related-image");
		if (related_button) {
			this.updateMainImage(
				related_button.dataset.src || "",
				related_button.dataset.alt || "",
				related_button.dataset.caption || "",
				related_button.dataset.credit || ""
			);
		}
	}

	private handleKeyDown(event: KeyboardEvent) {
		if (event.key !== "Escape") return;
		if (this.doms.boards_dialog.style.visibility === "visible") this.hideBoardsBox();
		if (!this.doms.operating_intro.classList.contains("display-none")) this.hideHelp();
		if (!this.doms.sources_panel.classList.contains("display-none")) this.hideSources();
		if (!this.doms.chat_panel.classList.contains("display-none")) this.toggleChat(false);
	}

	onClickEnterApp() {
		this.doms.loading_complete.remove();
		this.doms.loading_media.remove();
		this.core.$emit(ON_ENTER_APP);
		this.doms.chat_box.classList.remove("display-none");
		this.doms.visitor_name_input.value = sessionStorage.getItem("museum-visitor-name") || "";
	}

	showHelp() {
		this.doms.help_btn.classList.remove("has-notice");
		this.doms.help_btn.setAttribute("aria-label", "Hướng dẫn và tên hiển thị");
		this.doms.operating_intro.classList.remove("display-none");
		this.doms.operating_intro.setAttribute("aria-hidden", "false");
		this.core.control_manage.disabled();
	}

	private handleVisitorNameSubmit(event: SubmitEvent) {
		event.preventDefault();
		const name = this.doms.visitor_name_input.value.replace(/[<>]/g, "").trim().slice(0, 24);
		if (!name) {
			this.doms.visitor_name_status.textContent = "Nhập một tên từ 1 đến 24 ký tự.";
			this.doms.visitor_name_input.focus();
			return;
		}
		this.doms.visitor_name_input.value = name;
		this.core.$emit(ON_CHANGE_VISITOR_NAME, name);
		this.doms.visitor_name_status.textContent = `Đã đổi tên thành ${name}.`;
	}

	hideHelp() {
		this.doms.operating_intro.classList.add("display-none");
		this.doms.operating_intro.setAttribute("aria-hidden", "true");
		this.core.control_manage.enabled();
	}

	showSources() {
		this.doms.sources_panel.classList.remove("display-none");
		this.doms.sources_panel.setAttribute("aria-hidden", "false");
		this.core.control_manage.disabled();
	}

	hideSources() {
		this.doms.sources_panel.classList.add("display-none");
		this.doms.sources_panel.setAttribute("aria-hidden", "true");
		this.core.control_manage.enabled();
	}

	showBoardsBox(exhibit?: ExhibitInfo) {
		if (!exhibit || this.doms.boards_dialog.style.visibility === "visible") return;
		this.last_focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		this.doms.boards_dialog.style.visibility = "visible";
		this.doms.boards_dialog.setAttribute("aria-hidden", "false");
		this.doms.boards_container.classList.remove("hide");
		this.doms.boards_stage.textContent = normalizeVietnamese(`${exhibit.stage} · CHẶNG ${String(exhibit.order).padStart(2, "0")}`);
		this.doms.boards_title.textContent = normalizeVietnamese(exhibit.title);
		this.doms.boards_date.textContent = normalizeVietnamese(exhibit.date);
		this.doms.boards_location.textContent = normalizeVietnamese(exhibit.location);
		this.doms.boards_describe.innerHTML = normalizeVietnamese(exhibit.describe);
		this.doms.boards_textbook.textContent = normalizeVietnamese(exhibit.textbook);
		this.doms.boards_claim.textContent = normalizeVietnamese(`Mã kiểm chứng hồ sơ nhóm: ${exhibit.claimIds}`);
		this.updateMainImage(exhibit.image, exhibit.imageAlt, exhibit.imageCaption, exhibit.imageCredit);

		this.doms.boards_sources.replaceChildren();
		exhibit.sources.forEach(source => {
			const anchor = document.createElement("a");
			anchor.href = source.url;
			anchor.target = "_blank";
			anchor.rel = "noreferrer noopener";
			anchor.textContent = normalizeVietnamese(`${source.label} ↗`);
			this.doms.boards_sources.appendChild(anchor);
		});

		const image_options = [
			{src: exhibit.image, alt: exhibit.imageAlt, caption: exhibit.imageCaption, credit: exhibit.imageCredit},
			...(exhibit.relatedImages || [])
		];
		this.doms.boards_related.replaceChildren();
		if (image_options.length > 1) {
			image_options.forEach((item, index) => {
				const button = document.createElement("button");
				button.className = "related-image";
				button.type = "button";
				button.dataset.src = item.src;
				button.dataset.alt = item.alt;
				button.dataset.caption = item.caption;
				button.dataset.credit = item.credit;
				button.innerHTML = `<img src="${item.src}" alt=""><span>${index === 0 ? "WTO" : "APEC 14"}</span>`;
				this.doms.boards_related.appendChild(button);
			});
		}

		this.doms.boards_content.scrollTo({top: 0, left: 0, behavior: "auto"});
		this.core.control_manage.disabled();
		this.doms.boards_container.querySelector<HTMLElement>(".boards-info-close")?.focus();
	}

	hideBoardsBox() {
		this.doms.boards_dialog.style.visibility = "hidden";
		this.doms.boards_dialog.setAttribute("aria-hidden", "true");
		this.doms.boards_container.classList.add("hide");
		this.doms.boards_title.textContent = "";
		this.doms.boards_describe.textContent = "";
		this.doms.boards_img.src = "";
		this.core.control_manage.enabled();
		this.last_focused?.focus();
	}

	private updateMainImage(src: string, alt: string, caption: string, credit: string) {
		this.doms.boards_img.src = src;
		this.doms.boards_img.alt = normalizeVietnamese(alt);
		this.doms.boards_caption.textContent = normalizeVietnamese(caption);
		this.doms.boards_credit.textContent = normalizeVietnamese(credit);
	}

	showPreviewTooltip(msg: string, show_preview_tips = true) {
		this.doms.preview_tooltip.classList.remove("hide");
		if (show_preview_tips) this.doms.preview_tips.classList.remove("hide");
		const normalized_message = normalizeVietnamese(msg);
		if (this.doms.preview_tooltip.textContent !== normalized_message) this.doms.preview_tooltip.textContent = normalized_message;
	}

	hidePreviewTooltip() {
		this.doms.preview_tooltip.classList.add("hide");
		this.doms.preview_tips.classList.add("hide");
	}

	updateLoadingProgress(loading_text: string) {
		const progress = this.doms.loading.querySelector(".progress");
		progress && (progress.textContent = normalizeVietnamese(loading_text));
	}

	removeLoading() {
		this.doms.loading.remove();
	}

	showLoadingConfirm() {
		this.doms.loading_complete.classList.remove("display-none");
	}

	updateAudioButton(muted: boolean) {
		this.doms.audio_btn.textContent = muted ? "Bật nhạc" : "Tắt nhạc";
		this.doms.audio_btn.setAttribute("aria-pressed", String(muted));
	}

	updateMultiplayerStatus(state: "idle" | "connecting" | "online" | "fallback" | "reconnecting" | "offline", visitors = 1) {
		this.doms.multiplayer_presence.dataset.state = state;
		const labels = {
			idle: "Chưa kết nối",
			connecting: "Đang kết nối…",
			online: `${visitors} người đang xem`,
			fallback: `Dự phòng · ${visitors} người`,
			reconnecting: "Đang kết nối lại…",
			offline: "Ngoại tuyến"
		};
		this.doms.multiplayer_label.textContent = labels[state];
		this.doms.multiplayer_presence.title = state === "online"
			? `${visitors} người đang cùng tham quan phòng này`
			: labels[state];
	}

	updateComputerPrompt(visible: boolean, interacting: boolean) {
		this.doms.computer_prompt.classList.toggle("display-none", !visible);
		const key = this.doms.computer_prompt.querySelector("kbd");
		const label = this.doms.computer_prompt.querySelector("span");
		if (key) key.textContent = interacting ? "ESC" : "E";
		if (label) label.textContent = interacting ? "Thoát khỏi máy tính" : "Sử dụng máy tính";
	}

	appendChatMessage(name: string, text: string, isSelf = false, sentAt = Date.now()) {
		this.doms.chat_messages.querySelector(".chat-empty")?.remove();
		const message = document.createElement("article");
		message.className = `chat-message${isSelf ? " is-self" : ""}`;
		const meta = document.createElement("div");
		const author = document.createElement("b");
		const time = document.createElement("time");
		const body = document.createElement("p");
		author.textContent = isSelf ? "Bạn" : normalizeVietnamese(name);
		time.dateTime = new Date(sentAt).toISOString();
		time.textContent = new Intl.DateTimeFormat("vi-VN", {hour: "2-digit", minute: "2-digit"}).format(sentAt);
		body.textContent = normalizeVietnamese(text);
		meta.append(author, time);
		message.append(meta, body);
		this.doms.chat_messages.appendChild(message);

		while (this.doms.chat_messages.childElementCount > 80) {
			this.doms.chat_messages.firstElementChild?.remove();
		}
		this.doms.chat_messages.scrollTop = this.doms.chat_messages.scrollHeight;
		if (!isSelf && this.doms.chat_panel.classList.contains("display-none")) this.incrementUnread();
	}

	private handleChatSubmit(event: SubmitEvent) {
		event.preventDefault();
		const message = this.doms.chat_input.value.trim().slice(0, 280);
		if (!message) return;
		this.core.$emit(ON_SEND_CHAT, message);
		this.doms.chat_input.value = "";
		this.doms.chat_input.focus();
	}

	private toggleChat(open: boolean) {
		this.doms.chat_panel.classList.toggle("display-none", !open);
		this.doms.chat_panel.setAttribute("aria-hidden", String(!open));
		this.doms.chat_toggle.setAttribute("aria-expanded", String(open));
		if (open) {
			this.clearUnread();
			this.doms.chat_input.focus();
		}
	}

	private incrementUnread() {
		const count = Math.min(99, Number(this.doms.chat_unread.textContent || 0) + 1);
		this.doms.chat_unread.textContent = String(count);
		this.doms.chat_unread.classList.remove("display-none");
	}

	private clearUnread() {
		this.doms.chat_unread.textContent = "0";
		this.doms.chat_unread.classList.add("display-none");
	}
}

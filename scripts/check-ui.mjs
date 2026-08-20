import {writeFileSync} from "node:fs";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const galleryUrl = process.env.GALLERY_URL || "http://127.0.0.1:4173";
const pages = await fetch("http://127.0.0.1:9223/json").then(response => response.json());
const page = pages.find(item => item.type === "page" && item.url.startsWith(galleryUrl));
if (!page) throw new Error("Không tìm thấy trang bảo tàng trên cổng kiểm thử 9223.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const runtimeErrors = [];
let nextId = 1;

socket.addEventListener("message", event => {
	const message = JSON.parse(event.data);
	if (message.id && pending.has(message.id)) {
		const {resolve, reject} = pending.get(message.id);
		pending.delete(message.id);
		message.error ? reject(new Error(message.error.message)) : resolve(message.result);
	}
	if (message.method === "Runtime.exceptionThrown") {
		runtimeErrors.push(message.params.exceptionDetails.text);
	}
});

await new Promise((resolve, reject) => {
	socket.addEventListener("open", resolve, {once: true});
	socket.addEventListener("error", reject, {once: true});
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
	const id = nextId++;
	pending.set(id, {resolve, reject});
	socket.send(JSON.stringify({id, method, params}));
});

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {width: 1440, height: 820, deviceScaleFactor: 1, mobile: false});
await delay(2500);
const loadingShot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
writeFileSync("museum-loading.png", Buffer.from(loadingShot.data, "base64"));
await delay(32500);

const status = await send("Runtime.evaluate", {
	expression: `JSON.stringify({
		loading: document.querySelector('.loading')?.textContent?.trim() || null,
		entryVisible: !!document.querySelector('.loading-complete:not(.display-none)'),
		loadingVideo: document.querySelector('.loading-media video')?.currentSrc || null,
		loadingVideoLoop: document.querySelector('.loading-media video')?.loop || false,
		loadingVideoControls: document.querySelector('.loading-media video')?.controls || false,
		flagImages: [...document.querySelectorAll('img.national-flag')].map(image => ({src: image.currentSrc || image.src, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight})),
		resources: performance.getEntriesByType('resource').length,
		images: [...document.images].map(image => ({src: image.currentSrc || image.src, complete: image.complete, width: image.naturalWidth}))
	})`,
	returnByValue: true
});

const entryShot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
writeFileSync("museum-entry.png", Buffer.from(entryShot.data, "base64"));

await send("Runtime.evaluate", {expression: "document.querySelector('.start')?.click()"});
await delay(2500);
const postEntryStatus = await send("Runtime.evaluate", {
	expression: `(async()=>{
		const coreModule = await import('/src/core/index.ts');
		const core = new coreModule.default();
		const stageSigns = [];
		core.scene.traverse(object => { if (object.userData.fixedStageSign) stageSigns.push({type: object.type, rotationY: object.rotation.y, position: object.position.toArray()}); });
		return JSON.stringify({
			loadingVideoRemoved: !document.querySelector('.loading-media'),
			entryRemoved: !document.querySelector('.loading-complete'),
			museumFlagVisible: !!document.querySelector('.brand-flag')?.getClientRects().length,
			timelineRemoved: !document.querySelector('.timeline-hud'),
			stageSigns,
			mouseButtons: core.orbit_controls.mouseButtons,
			panDisabled: !core.orbit_controls.enablePan
		});
	})()`,
	awaitPromise: true,
	returnByValue: true
});
const museumShot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
writeFileSync("museum-view.png", Buffer.from(museumShot.data, "base64"));

await send("Runtime.evaluate", {
	expression: `(async()=>{
		const coreModule = await import('/src/core/index.ts');
		const core = new coreModule.default();
		core.world.environment.is_load_finished = false;
		core.orbit_controls.enabled = false;
		core.orbit_controls.update = () => false;
		core.camera.position.set(18, 8.2, 13.6);
		core.camera.lookAt(5.71, 8.0, 13.6);
	})()`,
	awaitPromise: true
});
await delay(500);
const stage2006Shot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
writeFileSync("museum-stage-2006.png", Buffer.from(stage2006Shot.data, "base64"));

await send("Runtime.evaluate", {
	expression: `(async()=>{
		const coreModule = await import('/src/core/index.ts');
		const core = new coreModule.default();
		const world = core.world;
		world.environment.is_load_finished = false;
		core.orbit_controls.enabled = false;
		core.orbit_controls.update = () => false;
		core.camera.position.set(-8.5, 6.2, 36.3);
		core.camera.lookAt(-15.55, 5.35, 36.33);
		world.css_3d_renderer.update();
	})()`,
	awaitPromise: true
});
await delay(700);
const deskShot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
writeFileSync("museum-desk.png", Buffer.from(deskShot.data, "base64"));

await send("Runtime.evaluate", {
	expression: `(async()=>{
		const coreModule = await import('/src/core/index.ts');
		const core = new coreModule.default();
  core.camera.position.set(-10.8, 6.8, 39.6);
  core.camera.lookAt(-13.98, 4.04, 39.59);
		core.world.css_3d_renderer.update();
	})()`,
	awaitPromise: true
});
await delay(500);
const todoShot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
writeFileSync("museum-todo.png", Buffer.from(todoShot.data, "base64"));

await send("Runtime.evaluate", {
	expression: `(async()=>{const constants=await import('/src/Constants.ts');const core=await import('/src/core/index.ts');new core.default().ui.showBoardsBox(constants.EXHIBITS[3]);})()`,
	awaitPromise: true
});
await delay(1200);
const exhibitShot = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false});
writeFileSync("museum-exhibit.png", Buffer.from(exhibitShot.data, "base64"));

console.log(status.result.value);
console.log(postEntryStatus.result.value);
console.log(JSON.stringify({runtimeErrors}));
await Promise.race([send("Browser.close").catch(() => undefined), delay(1000)]);
socket.close();

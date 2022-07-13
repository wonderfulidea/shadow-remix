import { beginVideoRecord, init, WEBM, recordFrame, stopRecord, beginGIFRecord } from 'canvas-capture';
import { state, Stroke } from './State';
import { renderer } from './ThreeView';

let isRecording = false;
let strokeIndex = 0;
let touchIndex = 0;
let history: Stroke[] = [];

let inited = false;

export function makeAnimation() {
	if (!inited) {
		// Init canvas capturer, do this once.
		init(renderer.domElement, {
			showAlerts: true,
			showDialogs: true,
			showRecDot: true,
		});
		inited = true;
	}

	state.endStroke(); // End current stroke if needed.
	history = state.history.slice(); // Make a copy of history.

	if (history.length === 0) {
		console.error(`Can't export animation: no drawing to save!`);
		return;
	}

	// Capture a static background image.
	state.clear();
	// @ts-ignore
	window.__video.pause();

	// Dispatch event to e.g. stop screensaver from taking over during export.
	window.dispatchEvent(new CustomEvent('record_animation_start'));

	// Begin recording loop.
	beginVideoRecord({
		format: WEBM,
		name: 'shadow-remix-animation',
		fps: 60,
    	quality: 1,
		onExportProgress: (progress) =>{
			console.log(`Export progress: ${(progress * 100).toFixed(2)}%`);
		},
		onExportFinish: () => {
			window.dispatchEvent(new CustomEvent('record_animation_stop'));
		}
	});
	strokeIndex = 0;
	touchIndex = 0;
	isRecording = true;
}

export function iterAnimation() {
	if (!isRecording) return;

	recordFrame();
	
	// Start stroke if needed.
	if (touchIndex === 0) {
		state.thicknessIndex = history[strokeIndex].thicknessIndex;
		state.colorIndex = history[strokeIndex].colorIndex;
		state.startStroke();
	}

	// Add touch point.
	const { touches } = history[strokeIndex];
	let isActive = false;
	// @ts-ignore
	const touchIds = Object.keys(touches) as number[];
	for (let i = 0; i < touchIds.length; i++) {
		const id = touchIds[i];
		const position = touches[id][touchIndex];
		if (position === undefined) continue;
		isActive = true;
		state._addTouchPoint(id, position);
	}
	// Increment touch index.
	touchIndex++;
	// Go to next stroke if needed.
	if (!isActive) {
		touchIndex = 0;
		strokeIndex++;
		state.endStroke();
		if (strokeIndex >= history.length) {
			finish();
		}
	}
}

function finish() {
	isRecording = false;
	// Save file.
	stopRecord();
	// Start up live feed again.
	// @ts-ignore
	window.__video.play();
}
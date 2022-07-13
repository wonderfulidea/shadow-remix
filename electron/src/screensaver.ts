import * as fs from 'fs';
import { SCREEN_SAVER_WAIT_TIME } from './constants';

let visible = false;
let disabled = false;

// Prevent screensaver from interrupting animation export.
window.addEventListener('record_animation_start', (e: CustomEvent) => {
	disabled = true;
});
window.addEventListener('record_animation_stop', (e: CustomEvent) => {
	disabled = false;
});

// Init timer to start screensaver after a period of inactivity.
let screensaverTimer: NodeJS.Timeout;
resetTimer();
window.addEventListener('pointermove', () => { // Interaction with touchscreen.
	resetTimer();
});
window.addEventListener('data_in', () => { // Interaction with physical UI.
	resetTimer();
});
function resetTimer() {
	if (screensaverTimer) clearTimeout(screensaverTimer);
	screensaverTimer = setTimeout(() => {
		showScreenSaver(true);
	}, SCREEN_SAVER_WAIT_TIME);
}

// Manually trigger screensaver with 'h' key.
window.addEventListener('keydown', (e: KeyboardEvent) => {
	switch (e.key) {
		case 'h':
			showScreenSaver(!visible);
			break;
	}
});

// Hide screensaver on pointerdown/pointermove.
window.addEventListener('pointerdown', () => { // Interaction with touchscreen.
	showScreenSaver(false);
});
window.addEventListener('pointermove', () => { // Interaction with touchscreen.
	showScreenSaver(false);
});
window.addEventListener('data_in', () => { // Interaction with physical UI.
	showScreenSaver(false);
});

const container = document.getElementById('screensaver');

function showScreenSaver(state: boolean) {
	if (disabled) return;
	if (visible === state) return;
	visible = state;

	if (visible) {
		playAnimation();
	} else {
		// Clear out image when leaving screensaver mode.
		const e = new KeyboardEvent('keydown', {
			key: 'Backspace',
		});
		window.dispatchEvent(e);
	}

	// Show/hide screensaver container.
	container.style.display = visible ? 'block' : 'none';
}

// Load up all animations.
const path = process.env.NODE_ENV === 'development' ? '.' : process.resourcesPath;
const ANIMATION_DIRECTORY = `${path}/animations`;
const files = fs.readdirSync(ANIMATION_DIRECTORY);
const NUM_ANIMATIONS = files.length;
files.forEach((filename, index) => {
	const div = document.createElement('div');
	div.className = 'videoContainer';
	div.innerHTML = `
		<video id="animation${index}" preload="true">
			<source src="${ANIMATION_DIRECTORY + '/' + filename}" type="video/mp4" />
			Your browser does not support the video tag.
		</video>`;
	container.append(div);
});

// Play animations sequentially.
function playAnimation(index = 0) {
	if (NUM_ANIMATIONS === 0) return;
	if (index >= NUM_ANIMATIONS) index = 0;
	if (visible) {
		const video = document.getElementById(`animation${index}`) as HTMLVideoElement;
		video.currentTime = 0; // Reset video.
		// Play next video after finished.
		video.onended = () => {
			video.parentElement.style.display = 'none';
			playAnimation(index + 1);
		}
		// Show video an play.
		video.parentElement.style.display = 'block';
		video.play();
	}
}
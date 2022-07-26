import { makeAnimation } from './animation';
import { saveImage } from './screenshot';
import { state } from './State';
import { showWebcamSelector } from './Webcam';

// If you make changes to the hotkeys, be sure to update the README.
window.addEventListener('keydown', (e: KeyboardEvent) => {
	switch (e.key) {
		case 'a':
			// A saves a picture.
			saveImage();
			break;
		case 's':
			if (e.metaKey || e.ctrlKey) {
				// Ctrl/Command + S saves a picture.
				e.preventDefault();
				saveImage();
			}
			break;
		case 'd':
			// D undoes the last action.
			state.undo();
			break;
		case 'z':
			if (e.metaKey || e.ctrlKey) {
				// Ctrl/Command + Z undoes the last action.
				state.undo();
			}
			break;
		case 'c':
			showWebcamSelector();
			break;
		case 'g':
		case 'Delete':
		case 'Backspace':
			// G/Delete/Backspace clears.
			state.clear();
			break;
		case 'v':
			makeAnimation();
			break;
	}
});
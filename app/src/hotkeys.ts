import { makeAnimation } from './animation';
import { saveImage } from './screenshot';
import { state } from './State';
import { showWebcamSelector } from './Webcam';

window.addEventListener('keydown', (e: KeyboardEvent) => {
	switch (e.key) {
		case 's':
			if (e.metaKey || e.ctrlKey) {
				// Ctrl/Command + S saves a picture.
				e.preventDefault();
				saveImage();
			}
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
		case 'Delete':
		case 'Backspace':
			// Delete/Backspace clears.
			state.clear();
			break;
		case 'v':
			makeAnimation();
			break;
	}
});
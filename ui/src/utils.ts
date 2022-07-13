import { Mesh } from 'three';
import { WEBCAM_FEED_HEIGHT, WEBCAM_FEED_WIDTH } from './constants';
// @ts-ignore
import notie from 'notie';

export function canvasDimensions() {
	const container = document.getElementById('canvasContainer')!;
	// Add one px bc sometimes there is a tiny gap.
	return [Math.ceil(container.clientWidth) + 1, Math.ceil(container.clientHeight) + 1];
}

export function setMeshScale(mesh: Mesh) {
	const [ width, height ] = canvasDimensions();
	// Scale video feed to fill screen.
	const aspectRatio = width / height;
	if (aspectRatio > WEBCAM_FEED_WIDTH / WEBCAM_FEED_HEIGHT) {
		// Fit to width.
		const factor = width / WEBCAM_FEED_WIDTH;
		mesh.scale.set(factor, factor, 1);
	} else {
		// Fit to height.
		const factor = height / WEBCAM_FEED_HEIGHT;
		mesh.scale.set(factor, factor, 1);
	}
}

export function initModal(modalID: string, title: string, content: string = '', confirmTitle?: string, cancelTitle?: string) {
	const footerString = (confirmTitle || cancelTitle) ? `
	<footer class="modal__footer">
		${cancelTitle ? `<button class="cancelButton modal__btn" data-micromodal-close >${cancelTitle}</button>` : '' }
		${confirmTitle ? `<button class="confirmButton modal__btn modal__btn-primary" data-micromodal-close >${confirmTitle}</button>` : '' }
	</footer>`: '';
	const modalString =
	`<div class="modal micromodal-slide" id="modal-${modalID}" aria-hidden="true">
		<div class="modal__overlay" tabindex="-1" data-micromodal-close>
		<div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-${modalID}-title">
			<header class="modal__header">
				<h2 class="modal__title" id="modal-${modalID}-title">
					${title}
				</h2>
				<button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
			</header>
			<main class="modal__content">
				<p id="modal-${modalID}-content">
					${content}
				</p>
			</main>
			${footerString}
		</div>
		</div>
	</div>`;
	// Create an element from string.
	const temp = document.createElement('div');
	temp.innerHTML = modalString;
	document.getElementsByTagName('body')[0].appendChild(temp.firstChild as Node);
};

export function showErrorAlert(message: string) {
	console.error(message);
	notie.alert({ type: 3, text: message, position: 'top' })
}

export function showSuccessAlert(message: string) {
	notie.alert({ type: 1, text: message, position: 'top' })
}

// When webcam has been selected, trigger event to show next startup modal.
let startupModalIndex = 0;
export function showNextStartupModal() {
	startupModalIndex++;
	window.dispatchEvent(new CustomEvent('show_next_startup_modal', {
		detail: {
			startupModalIndex,
		},
	}));
}

export function DEV_MODE() {
	return process.env.NODE_ENV === "development";
}

// Make these available in electron app.
// @ts-ignore
window.UI_utils = {
	initModal,
	showErrorAlert,
	showSuccessAlert,
	showNextStartupModal,
};
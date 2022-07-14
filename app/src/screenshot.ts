import { renderer, render } from './ThreeView';
import { canvastoFile, compressAccurately } from 'image-conversion';
import { saveAs } from 'file-saver';
import { MAX_IMAGE_SIZE } from './constants';
// @ts-ignore
import notie from 'notie';
import { state } from './State';
import { DEV_MODE } from './utils';

function onConfirm(imageCompressed: Blob) {
	// Trigger event to cause s3 up load in electron app.
	window.dispatchEvent(new CustomEvent('upload_to_s3', {
		detail: {
			imageBlob: imageCompressed,
			width: renderer.domElement.clientWidth,
			height: renderer.domElement.clientHeight,
		},
	}));
}

function saveModalIsOpen() {
	return document.getElementsByClassName('notie-background-success').length !== 0;
}

export async function saveImage() {
	render();
	// @ts-ignore
	const imageFullQuality = await canvastoFile(renderer.domElement, 1, 'image/jpeg');
	// Compress image size.
	const imageCompressed = await compressAccurately(imageFullQuality, MAX_IMAGE_SIZE);
	// @ts-ignore
	if (window.SHOULD_UPLOAD_TO_S3) {
		// Check that they've actually drawn something.
		if (state.history.length === 0) {
			if (DEV_MODE()) {
				console.log('Image is empty, you must draw something first.');
			}
			return;
		}

		// Check that edits have been made since last save.
		if (!state.editsMadeSinceLastSave) {
			if (DEV_MODE()) {
				console.log('Edits have not been made since last save.');
			}
			return;
		}

		// Throw up a confirmation modal first.
		if (!saveModalIsOpen()) {
			notie.confirm({
				text: 'Save To Gallery?',
				submitText: 'Save',
				cancelText: 'Cancel',
				position: 'top',
				submitCallback: () => {
					onConfirm(imageCompressed);
				},
			});
		}
	} else {
		saveAs(imageCompressed, `Shadow-Remix.jpg`);
	}
}
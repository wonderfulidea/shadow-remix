import MicroModal from 'micromodal';
import { Mesh, MeshBasicMaterial, VideoTexture } from 'three';
import { WEBCAM_FEED_HEIGHT, WEBCAM_FEED_WIDTH } from './constants';
import { geometry, scene, resize } from './ThreeView';
import { DEV_MODE, initModal, showErrorAlert, showNextStartupModal } from './utils';

const video = document.getElementById('video') as HTMLVideoElement;
// Make video globally available for animation exporter.
// @ts-ignore
window.__video = video;
const texture = new VideoTexture(video);

const WEBCAM_SELECTOR_MODAL_ID = 'webcamSelectorModal';
initModal(WEBCAM_SELECTOR_MODAL_ID, 'Select Camera [C]', 'Select a webcam from the list:');
const webcamModalContent = document.querySelector(`#modal-${WEBCAM_SELECTOR_MODAL_ID} .modal__content`);
const list = document.createElement('div');
list.className = 'webcamDevicesList';
webcamModalContent?.append(list);
const refreshButton = document.createElement('button');
refreshButton.innerHTML = 'Refresh Webcam List';
refreshButton.className = 'modal__btn';
refreshButton.id = 'refreshWebcamList';
refreshButton.onclick = refreshDeviceList;
webcamModalContent?.append(refreshButton);

let devices: MediaDeviceInfo[] = [];
let currentDevice: MediaDeviceInfo | undefined = undefined;

export async function showWebcamSelector(onClose?: () => void) {
	// Get currently connected video devices.
	await refreshDeviceList();
	if (devices.length === 0) {
		showErrorAlert(`No webcams available, please connect a device.`);
		return;
	}
	if (onClose && devices.length === 1) {
		// Only one webcam available.
		if (!currentDevice || currentDevice.deviceId !== devices[0].deviceId) {
			connectToDevice(devices[0]);
			// Don't show webcam list if only one camera is connected.
			onClose();
			return;
		}
	}
	
	MicroModal.show(
		`modal-${WEBCAM_SELECTOR_MODAL_ID}`,
		{
			disableFocus: true,
			onClose,
		});
}

async function refreshDeviceList() {
	if (DEV_MODE()) console.log('Refreshing webcam list.');

	// List all available webcams.
	const allMediaDevices = await navigator.mediaDevices.enumerateDevices();
	devices = allMediaDevices.filter(device => device.kind === 'videoinput');

	// Update UI.
	updateDeviceListUI();
}

function updateDeviceListUI() {
	// Clear list.
	list.innerHTML = '';
	// Add current devices to list.
	devices.forEach(device => {
		const item = document.createElement('a');
		item.innerHTML = device.label;
		item.id = `webcamID-${device.deviceId}`;
		item.href = '#';
		item.onclick = (e) => {
			e.preventDefault();
			connectToDevice(device);
		}
		list.append(item);
		list.append(document.createElement('br'));
	});
	if (!currentDevice) return;
	// Update UI with checkmark to show current connected port.
	const listItem = document.getElementById(`webcamID-${currentDevice.deviceId}`);
	if (!listItem) return;
	const checkmark = document.createElement('span');
	checkmark.innerHTML = '&#10004;';
	listItem.parentNode?.insertBefore(checkmark, listItem.nextSibling);
}

async function connectToDevice(deviceInfo: MediaDeviceInfo) {
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {
		const constraints = {
			video: {
				width: WEBCAM_FEED_WIDTH,
				height: WEBCAM_FEED_HEIGHT,
			},
		} as MediaStreamConstraints;
		if (deviceInfo) {
			(constraints.video as MediaTrackConstraints).deviceId = deviceInfo.deviceId;
		} else {
			(constraints.video as MediaTrackConstraints).facingMode = 'environment';
		}
		navigator.mediaDevices.getUserMedia(constraints).then( function ( stream ) {
			// Apply the stream to the video element used in the texture.
			video.srcObject = stream;
			video.play();
			currentDevice = deviceInfo;
			updateDeviceListUI();
			resize();
			// Show canvas.
			document.getElementById('canvasContainer')?.style.setProperty('opacity', '1');
		} ).catch( function ( error ) {
			showErrorAlert(`Unable to access the camera/webcam: ${error?.message || error}`);
		} );
	} else {
		showErrorAlert('MediaDevices interface not available, please try on Chrome or Firefox on desktop.');
	}
}
showWebcamSelector(showNextStartupModal);

// Init geometry to render video feed.
const webcamMaterial = new MeshBasicMaterial( { map: texture } );
export const webcamMesh = new Mesh(geometry, webcamMaterial);
scene.add(webcamMesh);

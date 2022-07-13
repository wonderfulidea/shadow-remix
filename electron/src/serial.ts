const MicroModal = require('micromodal');
import { SerialPort } from 'serialport'
import { PortInfo } from '@serialport/bindings-cpp';
import {
	BUTTON_COMMAND_CODE,
	CLEAR_BUTTON_INDEX,
	NUM_COMMAND_DATA_BITS,
	NUM_MOTOR_POSITION_BITS,
	SAVE_BUTTON_INDEX,
	UNDO_BUTTON_INDEX,
	BAUD_RATE,
	MOTOR_COMMAND_CODE_LOW,
	MOTOR_COMMAND_CODE_HIGH,
} from './constants';
import { DEV_MODE, HARDWARE_PARAMS } from './common';
// @ts-ignore
const { initModal, showErrorAlert, showNextStartupModal } = window.UI_utils;

let portsList: PortInfo[] = [];
let port: SerialPort | undefined = undefined;

// Create UI elements.
const SERIAL_SELECTOR_MODAL_ID = 'serialSelectorModal';
initModal(SERIAL_SELECTOR_MODAL_ID, 'Select Serial Port [P]', 'Select a serial port from the list:');
const serialModalContent = document.querySelector(`#modal-${SERIAL_SELECTOR_MODAL_ID} .modal__content`);
const list = document.createElement('div');
list.className = 'serialPortList';
serialModalContent?.append(list);
const refreshButton = document.createElement('button');
refreshButton.innerHTML = 'Refresh Port List';
refreshButton.className = 'modal__btn';
refreshButton.id = 'refreshSerialPortList';
refreshButton.onclick = refreshPortList;
serialModalContent?.append(refreshButton);
const stationIDLabel = document.createElement('span');
stationIDLabel.innerHTML = 'Set Station ID:';
stationIDLabel.id = 'stationIDLabel';
const stationIDInput = document.createElement('input');
stationIDInput.id = 'stationIDInput';
stationIDInput.value = `${HARDWARE_PARAMS.stationID}`;
stationIDInput.onkeyup = () => {
	setStationID(stationIDInput.value);
}
serialModalContent?.prepend(stationIDLabel, stationIDInput);


window.addEventListener('keydown', (e: KeyboardEvent) => {
	switch (e.key) {
		case 'p':
			showSerialPortSelector();
			break;
	}
});

window.addEventListener('show_next_startup_modal', (e: CustomEvent) => {
	const { startupModalIndex } = e.detail;
	if (startupModalIndex === 1) {
		showSerialPortSelector(showNextStartupModal);
	}
});

export async function showSerialPortSelector(onClose?: () => void) {
	// Get available serial ports.
	await refreshPortList();
	if (portsList.length === 0) {
		showErrorAlert(`No serial ports available`);
		return;
	}
	// Hardcode arduino serial name here.
	const validPorts = portsList.filter(port => port.path.includes('usb'));
	if (validPorts.length === 1) {
		// Don't show modal (for auto-loading program).
		// TODO: what about the station id?
		initConnection(validPorts[0]);
		return;
	}
	MicroModal.show(`modal-${SERIAL_SELECTOR_MODAL_ID}`, {
		disableFocus: true,
		onClose,
	});
}

async function refreshPortList() {
	if (DEV_MODE()) console.log('Refreshing serial port list.');
	portsList = await SerialPort.list();

	// Update UI.
	updatePortListUI();
}

function setStationID(value: string) {
	const stationID = parseInt(value);
	if (isNaN(stationID)) return;
	HARDWARE_PARAMS.stationID = stationID;
	if (DEV_MODE()) console.log(`Setting station ID ${stationID}.`);
}

function updatePortListUI() {
	// Clear list.
	list.innerHTML = '';
	// Add current devices to list.
	portsList.forEach(portInfo => {
		const item = document.createElement('a');
		item.id = `serialPort-${portInfo.path}`;
		item.innerHTML = portInfo.path;
		item.href = '#';
		item.onclick = (e) => {
			e.preventDefault();
			initConnection(portInfo);
		}
		list.append(item);
		list.append(document.createElement('br'));
	});
	if (!port) return;
	// Update UI with checkmark to show current connected port.
	const listItem = document.getElementById(`serialPort-${port.path}`);
	if (!listItem) return;
	const checkmark = document.createElement('span');
	checkmark.innerHTML = '&#10004;';
	listItem.parentNode?.insertBefore(checkmark, listItem.nextSibling);
}

function initConnection(info: PortInfo) {
	if (port) {
		port.close();
	}
	port = new SerialPort({ path: info.path, baudRate: BAUD_RATE });
	port.on('open', () => onPortOpen(info.path));
	port.on('error', onPortError);
	port.on('data', onPortData);
	port.on('close', () => onPortClose(info.path));
	port.open();
}

function onPortOpen(path: string) {
	if (DEV_MODE()) console.log(`Port ${path} open.`);
	port.flush();
	updatePortListUI();
}

function onPortError(error: Error) {
	if (DEV_MODE()) console.log(`Serial Error: ${error.message}`);
}

let currentMotorData: {
	index: number,
	angleHighBits: number,
} | undefined = undefined

function onPortData(buffer: any) {
	window.dispatchEvent(new CustomEvent('data_in')); // Turn off the screensaver.
	let currentIndex = 0;
	while (currentIndex < buffer.length) {
		let value = buffer[currentIndex];
		let code = value >> NUM_COMMAND_DATA_BITS;
		let data = value & ((1 << NUM_COMMAND_DATA_BITS) - 1);

		switch(code) {
			case BUTTON_COMMAND_CODE:
				const buttonIndex = data;
				handleButtonPress(buttonIndex);
				break;
			case MOTOR_COMMAND_CODE_HIGH:
				{
					// Motor data is split across two bytes.
					const motorIndex = data >> NUM_MOTOR_POSITION_BITS;
					const angleHighBits = data & ((1 << NUM_MOTOR_POSITION_BITS) - 1);
					currentMotorData = {
						index: motorIndex,
						angleHighBits,
					};

					if (currentIndex === buffer.length - 1) {
						// There is no more data to read.
						// Have to wait for next buffer to get second motor command.
						break;
					}

					// Load next byte.
					currentIndex++;
					value = buffer[currentIndex];
					code = value >> NUM_COMMAND_DATA_BITS;
					if (code !== MOTOR_COMMAND_CODE_LOW) {
						if (DEV_MODE()) console.error(`Invalid motor command data, got code: ${code}.`);
						break;
					}
					data = value & ((1 << NUM_COMMAND_DATA_BITS) - 1);
					// No break, go to next case.
				}
			case MOTOR_COMMAND_CODE_LOW:
				{
					if (!currentMotorData) {
						// There was a problem parsing the motor command, we should not end up here.
						if (DEV_MODE()) console.error(`Motor command parsing error.`);
					}
					const { index, angleHighBits } = currentMotorData;
					const motorAngle = angleHighBits << NUM_COMMAND_DATA_BITS | data;
					handleMotorMove(index, motorAngle);
					currentMotorData = undefined;
					break;
				}
			default:
				if (DEV_MODE()) console.error(`Unknown command code: ${code}.`);
				break;
		}
		currentIndex++
	}
}

function onPortClose(path: string) {
	if (DEV_MODE()) console.log(`Port ${path} closed.`);
	updatePortListUI();
}

function handleButtonPress(buttonIndex: number) {
	if (DEV_MODE()) console.log(`Button at index ${buttonIndex} pressed.`);
	let e: KeyboardEvent | undefined = undefined;
	switch (buttonIndex) {
		case SAVE_BUTTON_INDEX:
			e = new KeyboardEvent('keydown', {
				key: 's',
				metaKey: true,
				ctrlKey: true,
			});
			break;
		case UNDO_BUTTON_INDEX:
			e = new KeyboardEvent('keydown', {
				key: 'z',
				metaKey: true,
				ctrlKey: true,
			});
			break;
		case CLEAR_BUTTON_INDEX:
			e = new KeyboardEvent('keydown', {
				key: 'Backspace',
			});
			break;
	}
	if (e) window.dispatchEvent(e);
}

function handleMotorMove(motorIndex: number, angle: number) {
	if (DEV_MODE()) console.log(`Motor at index ${motorIndex} moved to angle ${angle}.`);
	switch(motorIndex + 1) {// We're 1 indexing the motors on AWS.
		case 1:
			HARDWARE_PARAMS.motorAngle1 = angle;
			break;
		case 2:
			HARDWARE_PARAMS.motorAngle2 = angle;
			break;
		default:
			if (DEV_MODE()) console.error(`Unknown motor index ${motorIndex}.`);
			break;
	}
}

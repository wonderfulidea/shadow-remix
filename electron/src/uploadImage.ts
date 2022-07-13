// @ts-ignore
import { ENV } from './env'; // During compilation this file will be accessible.
import { v4 as uuidv4 } from 'uuid';
import { DEV_MODE, HARDWARE_PARAMS } from './common';
const S3 = require("aws-sdk/clients/s3");
// @ts-ignore
const { showErrorAlert, showSuccessAlert } = window.UI_utils;

const bucketName = ENV.AWS_BUCKET_NAME as string;
const region = ENV.AWS_BUCKET_REGION as string;
const accessKeyId = ENV.AWS_ACCESS_KEY as string;
const secretAccessKey = ENV.AWS_SECRET_KEY as string;
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

function uploadToS3(data: Uint8Array, filename: string, width: number, height: number) {
	const uploadParams = {
		Bucket: bucketName,
		Body: data,
		Key: filename,
		Metadata: {
			'approved': 'false',
			'width': `${width}`,
			'height': `${height}`,
			'date': `${new Date()}`,
			'station-id': `${HARDWARE_PARAMS.stationID}`,
			'motor-angle-1': `${HARDWARE_PARAMS.motorAngle1}`,
			'motor-angle-2': `${HARDWARE_PARAMS.motorAngle2}`,
		},
	};
  	return s3.upload(uploadParams, async (error: any, data: any) => {
		if (data) {
			if (DEV_MODE()) console.log(`${filename} uploaded.`);
			showSuccessAlert('Shadow Remix saved!');
		}
		if (error) {
			console.error(error.message);
			showErrorAlert('Image failed to save, please try again.');
		}
	});
}

const fileReader = new FileReader();

window.addEventListener('upload_to_s3', (e: CustomEvent) => {
	const { imageBlob, width, height } = e.detail;
	fileReader.onload = function() {
		const buffer = this.result;
		const data = new Uint8Array(buffer as ArrayBuffer);
		// Currently AWS does not allow us to list items in a bucket based on their LastModified param.
		// Instead we'll add a numeric prefix to all filenames so that the newest files appear first alphabetically.
		// Do this by subtracting the current date by some far off future date.
		const futureDate = new Date('2050/01/01 12:00 UTC');
		const currentDate = new Date();
		// @ts-ignore
		const ms = futureDate - currentDate;
		// Pad number with zeros.
		const paddedString = String(ms).padStart(15, '0');
		const uuid = uuidv4(); // Add uuid just in case.
		const filename = `${paddedString}_${uuid}.jpg`;
		uploadToS3(data, filename, width, height);
	};
	fileReader.readAsArrayBuffer(imageBlob);
});
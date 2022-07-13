import { FrameGrid } from "@egjs/grid";
const S3 = require('aws-sdk/clients/s3');
import './css/main.css';

const CHECK_NEW_TIMER = 10 * 1000; // Time in ms to check for new images.
const IMAGE_DURATION = 30 * 1000; // Time in ms for each image to remain on screen.
const IMAGE_OVERLAY_DURATION = 12 * 1000; // Time in ms for brand new images to take over full screen.
const REFRESH_LIST_INTERVAL = 24 * 60 * 60 * 1000; // Refresh main AWS list once a day.

function DEV_MODE() {
	return process.env.NODE_ENV === "development";
}

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION; 
const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const s3 = new S3({
	region,
	accessKeyId,
});

if (DEV_MODE()) {
	document.getElementById('versionNumber')!.innerHTML = `Version ${require('../package.json').version}`;
}

type AWS_Content = {
	Key: string,
	Size: number,
	LastModified: Date,
}

type Metadata = {
	width: number,
	height: number,
	angle1?: number,
	angle2?: number,
	featured?: 'true' | 'false',
	approved: 'true' | 'false',
	author?: string,
}
const METADATA_HEADERS = [
	'width', 'height', 'angle', 'featured', 'approved', 'author',
];

// TODO: handle case where the first 1000 images on AWS are not approved.

let itemsAWS: AWS_Content[] = [];

// Refresh AWS list once a day.
setInterval(async () => {
	try {
		const newItems = await listItems();
		// Double check that we're getting a good list back.
		if (newItems.length >= itemsAWS.length) {
			itemsAWS = newItems;
		}
	} catch(error) {
		// We don't need to do anything.
	}
}, REFRESH_LIST_INTERVAL);

const wrapper = document.getElementById('wrapper')!;
const NUM_SLOTS = 10;
for (let i = 0; i < NUM_SLOTS; i++) {
	const slot = document.createElement('div');
	slot.className = 'item spinner';
	wrapper.append(slot);
}
const nextItems: AWS_Content[] = [];
const newItemsAlreadyShown: AWS_Content[] = [];
const nextItemsToOverlay: AWS_Content[] = [];
let currentIndex = 0;

// Create an overlay element for new images.
const imageOverlay = document.createElement('div');
imageOverlay.id = 'imageOverlay';
document.body.append(imageOverlay);

async function init() {
	// Start off by querying the available items on AWS.
	itemsAWS = await listItems();

	// Init gallery
	let gallery = new FrameGrid('#wrapper', {
		defaultDirection: "end",
		gap: 5,
		frame: [ // The numbers in this layout should correspond to NUM_SLOTS.
			[1, 1, 3, 3, 5, 5, 5, 5],
			[2, 2, 4, 4, 5, 5, 5, 5],
			[6, 6, 6, 6, 7, 7, 8, 8],
			[6, 6, 6, 6, 9, 9, 10, 10],
		],
		rectSize: 0,
		useFrameFill: true,
	});

	// Render gallery.
	gallery.renderItems();

	// Load up initial set of images.
	await fillNextItems(true);

	// Add all images to gallery immediately.
	for (let i = 0; i < NUM_SLOTS; i++) {
		loadNewImageAtIndex(i, false, true);
	}

	// Begin timers to refresh images.
	for (let i = 0; i < NUM_SLOTS; i++) {
		setTimeout(() => {
			loadNewImageAtIndex(i, true);
		}, IMAGE_DURATION * Math.random());
	}

	// Start a timer to check for new images
	setInterval(checkForNewImages, CHECK_NEW_TIMER);
}
init();

function incrementCurrentIndex() {
	currentIndex++;
	if (currentIndex >= itemsAWS.length) currentIndex = 0;
}

async function fillNextItems(forceFill = false, iternum = 0) {
	const promises: Promise<Metadata>[] = [];
	const items: AWS_Content[] = [];
	for (let i = nextItems.length; i < NUM_SLOTS; i++) {
		// Fill next items.
		const item = itemsAWS[currentIndex];
		incrementCurrentIndex();
		promises.push(getImageMetadata(item.Key));
		items.push(item);		
	}
	const allMetadata = await Promise.all(promises);
	for (let i = 0; i < allMetadata.length; i++) {
		const metadata = allMetadata[i];
		const item = items[i];
		if (!checkApproved(metadata.approved)) {
			continue;
		}
		nextItems.push(item);
	}
	if (forceFill && nextItems.length < NUM_SLOTS) {
		if (iternum > 100) return; // Avoid infinite loop.
		await fillNextItems(forceFill, iternum + 1);
	}
}

function preloadImage(key: string) {
	const url = awsKeyToURL(key);
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = url;
	});
}

async function loadNewImageAtIndex(index: number, startNewTimer = false, sync = false) {
	// Get next image.
	const item = nextItems.shift()!;

	try {
		// Preload image.
		let image: HTMLImageElement;
		if (sync) {
			const url = awsKeyToURL(item.Key);
			image = new Image();
			image.src = url;
		} else {
			image = await preloadImage(item.Key);
		}
		// Fade in image at index.
		const container = wrapper.children[index];
		container.classList.remove('spinner');
		while (container.children.length > 1) {
			// Remove extra children.
			container.removeChild(container.children[0]);
		}
		container.append(image);
		image.className = 'fade-in';
	} catch (err) {
		// Problem fetching image, just move on.
	}

	// Add a new image to nextItems.
	fillNextItems();

	// Start another timer.
	if (startNewTimer) {
		setTimeout(() => {
			loadNewImageAtIndex(index, true);
		}, IMAGE_DURATION + (Math.random() - 0.5) * 5000); // Add a little more randomness to fade in timing.
	}
}

async function loadOverlayImage() {
	const item = nextItemsToOverlay.shift();
	if (!item) return;

	let image: HTMLImageElement;
	try {
		// Preload image.
		image = await preloadImage(item.Key);

		// Fade in image.
		const container = imageOverlay;
		while (container.children.length > 1) {
			// Remove extra children.
			container.removeChild(container.children[0]);
		}
		container.append(image);
		image.className = 'fade-in';
	} catch (err) {
		// Problem fetching image, just move on.
		return;
	}

	// Fade out image after IMAGE_OVERLAY_DURATION.
	setTimeout(() => {
		if (nextItemsToOverlay.length) {
			// Load next image if available.
			loadOverlayImage();
		} else {
			image.className = 'fade-out';
		}
	}, IMAGE_OVERLAY_DURATION);
}

function checkApproved(approved: string) {
	// Don't add images that have not been approved.
	return approved === 'true';
}

async function checkForNewImages(NUM_TO_CHECK = 10) {
	const items = await listItems(NUM_TO_CHECK);
	const existingKeys: string[] = [];
	for (let i = 0; i < Math.min(100, itemsAWS.length); i++) {
		existingKeys.push(itemsAWS[i].Key);
	}
	for (let i = 0; i < Math.min(100, newItemsAlreadyShown.length); i++) {
		existingKeys.push(newItemsAlreadyShown[i].Key);
	}
	const newItems: AWS_Content[] = [];
	for (let i = 0; i < items.length; i++) {
		if (existingKeys.indexOf(items[i].Key) >= 0) {
			continue;
		}
		newItems.push(items[i]);
	}
	if (newItems.length === 0) {
		if (DEV_MODE()) {
			console.log('No new items found.');
		}
		return; // No new items found.
	}
	if (newItems.length === NUM_TO_CHECK) {
		if (NUM_TO_CHECK < 100) {
			// If items are coming in too fast, increase check size.
			if (DEV_MODE()) {
				console.log('New items coming in fast, increasing number of new items to check for.');
			}
			checkForNewImages(NUM_TO_CHECK * 10);
			return;
		} else {
			if (DEV_MODE()) {
				console.error('Problem checking for new images, too many new images found.');
			}
		}
	}
	if (DEV_MODE()) {
		console.log(`Adding ${newItems.length} item${newItems.length > 1 ? 's' : ''} to gallery.`);
	}
	
	if (newItems.length) {
		nextItemsToOverlay.push(...newItems);
		loadOverlayImage();
		newItemsAlreadyShown.unshift(...newItems);
	}
	// Don't let this array grow too big.
	newItemsAlreadyShown.length = Math.min(newItemsAlreadyShown.length, 100);
}

function awsKeyToURL(key: string) {
	return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function listItems(maxLength?: number) {
	return new Promise<AWS_Content[]>((resolve, reject) => {
		const params = { Bucket: bucketName } as { Bucket: string, MaxKeys?: number };
		if (maxLength) params.MaxKeys = maxLength;
		s3.makeUnauthenticatedRequest('listObjects', params, function (error: any, data: any) {
			if (error) {
				reject(error);
				return;
			}
			if (!data || !data.Contents) {
				reject('Unable to fetch server contents.');
				return;
			}
			resolve(data.Contents);
		});
	});
}

function getImageMetadata(key: string) {
	return new Promise<Metadata>((resolve, reject) => {
		const URL = awsKeyToURL(key);
		const headers: {[key: string]: string} = {
			"Cache-Control": "no-cache",
			"Pragma": "no-cache",
			// "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
			// "X-Amz-User-Agent": "aws-sdk-js/2.1104.0 callback",
		};
		const http = new XMLHttpRequest();
		http.open('HEAD', URL);
		Object.keys(headers).forEach(header => {
			http.setRequestHeader(header, headers[header]);
		});

		http.onreadystatechange = function() {
			if (http.readyState == this.DONE) {
				if (http.status === 200){
					const data: {[key: string]: string} = {};
					const availableHeaders = http.getAllResponseHeaders();
					METADATA_HEADERS.forEach(header => {
						const headerKey = `x-amz-meta-${header}`;
						if (availableHeaders.search(headerKey) === -1) {
							return;
						};
						data[header] = http.getResponseHeader(headerKey)!;
					});
					// @ts-ignore
					resolve(data as Metadata);
				} else {
					if (DEV_MODE()) {
						console.log(this.readyState);
					}
					reject('Unable to load object metadata, http error.');
					return;
				}
			}
		};
		http.onerror = () => {
			reject('Unable to load object metadata, http error.');
			return;
		}
		http.send();

		// Due to a caching bug in Chrome:
		// https://stackoverflow.com/questions/44800431/caching-effect-on-cors-no-access-control-allow-origin-header-is-present-on-th
		// This only works reliably with Cache-Control set to 'no-cache'
		// Unfortunately, this is not currently supported by the AWS-SDK api.
		// So the code above creates the request manually.
		// const params = { Bucket: bucketName, Key: key, CacheControl: 'no-cache' };
		// s3.headObject(params, function (error: any, data: any) {
		// 	if (error) {
		// 		reject(error);
		// 		return;
		// 	}
		// 	if (!data || !data.Metadata) {
		// 		reject('Unable to fetch server contents.');
		// 		return;
		// 	}
		// 	resolve(data.Metadata as Metadata);
		// });
	});
}


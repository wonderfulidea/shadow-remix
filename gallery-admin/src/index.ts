import { MasonryInfiniteGrid } from '@egjs/infinitegrid';
const lozad = require('lozad');
const S3 = require('aws-sdk/clients/s3');
import './css/main.css';

const IMAGE_WIDTH = 410; // Width of images in px.
const CHECK_NEW_TIMER = 10 * 1000;// Time in ms to check for new images.
const NUM_ITEMS_TO_APPEND = 30; // How many images each time bottom of list hit during infinite scroll.

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;
const s3 = new S3({
	region,
	accessKeyId,
	secretAccessKey,
});

function DEV_MODE() {
	return process.env.NODE_ENV === "development";
}

if (DEV_MODE()) document.getElementById('versionNumber')!.innerHTML = `Version ${require('../package.json').version}`;

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

let itemsAWS: AWS_Content[] = [];
let gallery!: MasonryInfiniteGrid;

async function init() {
	// Start off by querying the available items on AWS.
	itemsAWS = await listItems();

	// Preload metadata for next group so it is read on requestAppend callback.
	let nextGroupMetadataPromise = getNextGroupMetadata(0);

	// Init gallery
	gallery = new MasonryInfiniteGrid('.wrapper', {
		align: 'center',
		gap: 5,
	});

	gallery.on('requestAppend', async e => {
		const nextGroupKey = parseInt((e.groupKey || 0) as string) + 1;
		const numItems = gallery.getItems().length;

		// Wait for the metadata to come back.
		const groupMetadata = await nextGroupMetadataPromise;

		// Init image elements.
		const elements: string[] = [];
		for (let i = 0; i < NUM_ITEMS_TO_APPEND; i++) {
			const awsIndex = numItems + i;
			if (awsIndex >= itemsAWS.length) {
				// We've hit the end of the available items.
				break;
			}

			const { Key } = itemsAWS[awsIndex];

			// Load metadata as images are appended.
			const { width, height, approved } = groupMetadata[i];
			// Don't add images that have not been approved.
			if (!checkApproved(approved)) {
				continue;
			}

			elements.push(getElementHTML(Key, width, height, approved));
		}

		if (elements.length) {
			// Add elements to gallery.
			gallery.append(elements, nextGroupKey);
		}

		// Preload next metadata.
		nextGroupMetadataPromise = getNextGroupMetadata(numItems + elements.length);
	});

	gallery.on('renderComplete', e => {
		// Attach lazy loading to newly added elements.
		for (let i = 0; i < e.items.length; i++) {
			const { element } = e.items[i];
			// Attach lazy loading.
			const img = element?.firstElementChild as HTMLElement;
			const observer = lozad(img, {
				loaded: () => {
					// Add a little delay so that this looks better.
					setTimeout(() => {
						img.classList.toggle('fadeIn');
					}, 500);
				},
			});
			observer.observe();
			// Attach button approval callback.
			const buttons = element?.getElementsByClassName('approveImage');
			if (buttons) {
				for (let j = 0; j < buttons?.length; j++) {
					const button = (buttons[j] as HTMLAnchorElement);
					button.onclick = adminToggleApproveImage;
				}
			}
		}
	});

	// Start gallery rendering.
	gallery.renderItems();

	// Start a timer to check for new images
	setInterval(checkForNewImages, CHECK_NEW_TIMER);
}
init();

function getElementHTML(key: string, width: number, height: number, approved: string) {
	const url = awsKeyToURL(key);
	const style = `style="width: ${IMAGE_WIDTH}px; height: ${(IMAGE_WIDTH * height / width).toFixed(1)}px;"`;
	return `<div ${style} class='item'>
			<div class='lozad' ${style} data-background-image="${url}"></div>
			<a href="#" class="approveImage" data-approved="${approved === 'true' ? 'true' : 'false'}" data-key="${key}">${getApprovalInnerHTML(approved)}</a>
		</div>`;
}

function getApprovalInnerHTML(approved: string) {
	return approved === 'true' ? '&#10004;' : '&#10005;';
}

async function adminToggleApproveImage(e: Event) {
	e.preventDefault();
	const button = (e.target as HTMLAnchorElement);
	const { key } = button.dataset;
	if (!key) {
		console.error('No key found for image.');
		return;
	}
	const metadata = await getImageMetadata(key);
	metadata.approved = metadata.approved === 'true' ? 'false' : 'true';

	if (DEV_MODE()) console.log(`Requesting image ${key} approval: ${metadata.approved}.`);
	s3.copyObject({
		Bucket: bucketName,
		CopySource: `/${bucketName}/${key}`,
		Key: `${key}`,
		Metadata: metadata,
		MetadataDirective: 'REPLACE',
	}, async (error: any) => {
		if (error) {
			alert('Problem encountered, refresh page and try again.');
			if (DEV_MODE()) console.log(error);
			return;
		}
		// Update button.
		const newMetadata = await getImageMetadata(key);
		button.dataset.approved = newMetadata.approved === 'true' ? 'true' : 'false';
		if (DEV_MODE()) console.log(`Image ${key} set to approved: ${newMetadata.approved}.`);
		button.innerHTML = getApprovalInnerHTML(newMetadata.approved);
	});
	
}

function checkApproved(approved: string) {
	// We don't need to worry about this in admin mode.
	return true;
}

async function checkForNewImages(NUM_TO_CHECK = 10) {
	const items = await listItems(NUM_TO_CHECK);
	const existingKeys: string[] = [];
	for (let i = 0; i < Math.min(100, itemsAWS.length); i++) {
		existingKeys.push(itemsAWS[i].Key);
	}
	const newItems: AWS_Content[] = [];
	for (let i = 0; i < items.length; i++) {
		if (existingKeys.indexOf(items[i].Key) >= 0) {
			continue;
		}
		newItems.push(items[i]);
	}
	if (newItems.length === 0) {
		if (DEV_MODE()) console.log('No new items found.');
		return; // No new items found.
	}
	if (newItems.length === NUM_TO_CHECK) {
		if (NUM_TO_CHECK < 100) {
			// If items are coming in too fast, increase check size.
			if (DEV_MODE()) console.log('New items coming in fast, increasing number of new items to check for.');
			checkForNewImages(NUM_TO_CHECK * 10);
			return;
		} else {
			console.error('Problem checking for new images, too many new images found.');
		}
	}
	if (DEV_MODE()) console.log(`Adding ${newItems.length} to top of gallery.`);
	// Preload metadata for new elements.
	const metadataPromises: Promise<Metadata>[] = [];
	for (let i = 0; i < newItems.length; i++) {
		const { Key } = newItems[i];
		metadataPromises.push(getImageMetadata(Key));
	}
	// Wait for the metadata to come back.
	const groupMetadata = await Promise.all(metadataPromises);

	// Add new items to top of list.
	const elements: string[] = [];
	for (let i = 0; i < newItems.length; i++) {
		const { Key } = newItems[i];
		// Load metadata as images are appended.
		const { width, height, approved } = groupMetadata[i];
		// Don't add images that have not been approved.
		if (!checkApproved(approved)) {
			continue;
		}
		elements.push(getElementHTML(Key, width, height, approved));
	}

	if (elements.length) {
		// Add elements to gallery.
		gallery.prepend(elements);
		itemsAWS.unshift(...newItems);
		// Don't let the array grow without bounds.
		if (itemsAWS.length > 1000) {
			itemsAWS.length = 1000;
		}
	}
}

function getNextGroupMetadata(offset: number) {
	// Send out async requests for metadata.
	const metadataPromises: Promise<Metadata>[] = [];
	for (let i = 0; i < NUM_ITEMS_TO_APPEND; i++) {
		const awsIndex = offset + i;
		if (awsIndex >= itemsAWS.length) {
			// We've hit the end of the available items.
			break;
		}

		const { Key } = itemsAWS[awsIndex];
		metadataPromises.push(getImageMetadata(Key));
	}

	// Wait for the metadata to come back.
	return Promise.all(metadataPromises);
}

function awsKeyToURL(key: string) {
	return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function listItems(maxLength?: number) {
	return new Promise<AWS_Content[]>((resolve, reject) => {
		const params = { Bucket: bucketName } as { Bucket: string, MaxKeys?: number };
		if (maxLength) params.MaxKeys = maxLength;
		s3.listObjects(params, function (error: any, data: any) {
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
					if (DEV_MODE()) console.log(this.readyState);
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


// window.addEventListener('resize', () => {
// 	if (!gallery) return;
// 	// Set the entire collection
// 	gallery.setItems(items);
// });


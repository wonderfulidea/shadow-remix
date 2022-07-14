// Resolution of webcam feed.
export const WEBCAM_FEED_WIDTH = 1280;
export const WEBCAM_FEED_HEIGHT = 720;
export const WEBCAM_ASPECT_RATIO = WEBCAM_FEED_HEIGHT / WEBCAM_FEED_WIDTH;

// Render the sketch layer at 2x resolution of the webcam feed.
export const SKETCH_RES_FACTOR = 2;
export const SKETCH_WIDTH = WEBCAM_FEED_WIDTH * SKETCH_RES_FACTOR;
export const SKETCH_HEIGHT = WEBCAM_FEED_HEIGHT * SKETCH_RES_FACTOR;

// Available colors.
export const COLORS = [
	'#00aacd',
	'#6600cd',
	'#e71b1c',
	'#fe80fe',
	'#ffaa01',
	'#fee600',
	'#a3e61c',
	'#008155',
	'#bb9167',
	'#ffffff',
	'#000000',
];
// Available thicknesses.
export const THICKNESSES = [
	10,
	30,
	50,
];

// Maximum image size in KB (controls amount of image compression).
export const MAX_IMAGE_SIZE = 150;

// Events.
export const COLOR_CHANGED_EVENT = 'colorChanged';
export const THICKNESS_CHANGED_EVENT = 'thicknessChanged';

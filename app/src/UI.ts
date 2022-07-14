import fitty from 'fitty';
import { COLORS, COLOR_CHANGED_EVENT, THICKNESS_CHANGED_EVENT } from './constants';
import { state } from './State';
import { DEV_MODE } from './utils';
// @ts-ignore
import pencilLarge from './pencils-01.png';
// @ts-ignore
import pencilMedium from './pencils-02.png';
// @ts-ignore
import pencilSmall from './pencils-03.png';
// @ts-ignore
import pencilLargeSelected from './pencils-selected-01.png';
// @ts-ignore
import pencilMediumSelected from './pencils-selected-02.png';
// @ts-ignore
import pencilSmallSelected from './pencils-selected-03.png';

const titles = fitty('#titlesFitText', { maxSize: 110, minSize: 40 });
window.addEventListener('load', () => {
	titles.forEach(el => el.fit());
	document.getElementById('titlesFitText')!.style.opacity = '1';
});

const colorPicker = document.getElementById('currentColor')!;
const colorPalette = document.getElementById('colorPalette')!;
const colorPaletteWrapper = document.getElementById('colorPaletteWrapper')!;
const thicknessPicker = document.getElementById('currentThickness')!;

document.getElementById('titles')!.addEventListener('pointerdown', () => {
	hidePalette();
});

// Populate color palette;
COLORS.forEach((color, i) => {
	const container = document.createElement('div');
	container.onclick = () => {
		state.colorIndex = i;
		hidePalette();
	}
	const spot = document.createElement('div');
	container.append(spot);
	spot.style.background = color;
	colorPalette.append(container);
});

function showPalette() {
	colorPaletteWrapper.className = 'visible';
}
function hidePalette() {
	colorPaletteWrapper.className = '';
}

// Color change UI.
colorPicker.addEventListener('click', (e: Event) => {
	e.preventDefault();
});
colorPicker.addEventListener('pointerdown', (e: Event) => {
	e.preventDefault();
	e.stopPropagation();
	// state.nextColor();
	if (colorPaletteWrapper.className === '') showPalette();
	else hidePalette();
	return false;
});
function updateColorUI() {
	(colorPicker.children[0] as HTMLDivElement).style.background = state.color;
	const paletteChildren = document.getElementById('colorPalette')?.children!;
	for (let i = 0; i < paletteChildren.length; i++) {
		if (i === state.colorIndex) {
			paletteChildren[i]!.classList.add('selected');
		} else {
			paletteChildren[i]!.classList.remove('selected');
		}
	}
}
state.addEventListener(COLOR_CHANGED_EVENT, updateColorUI);
updateColorUI();

function bounceUI(el: HTMLElement) {
	if(! el.classList.contains("animation-bounce")){
        el.classList.add("animation-bounce");
        setTimeout(() => {
            el.classList.remove("animation-bounce");
        }, 10000);
    }
}

// Thickness change UI.
[
	[pencilSmall, pencilSmallSelected],
	[pencilMedium, pencilMediumSelected],
	[pencilLarge, pencilLargeSelected],
].forEach((srcs, i) => {
	const a = document.createElement('a');
	a.href = '#';
	a.onclick = (e: Event) => {
		e.preventDefault();
		hidePalette();
		state.thicknessIndex = i;
		bounceUI(a);
	}
	const img = new Image();
	img.src = srcs[0];
	img.className = 'unselected';
	const imgSelected = new Image();
	imgSelected.src = srcs[1];
	imgSelected.className = 'selected';
	// Disable dragging.
	[img, imgSelected].forEach(image => {
		image.ondragstart = function() { return false; };
	});
	a.append(img, imgSelected);
	thicknessPicker.append(a);
});
function updateThicknessUI() {
	const thicknessPickerChildren = thicknessPicker.children!;
	for (let i = 0; i < thicknessPickerChildren.length; i++) {
		if (i === state.thicknessIndex) {
			thicknessPickerChildren[i]!.className = 'selected';
		} else {
			thicknessPickerChildren[i]!.className = '';
		}
	}
}
state.addEventListener(THICKNESS_CHANGED_EVENT, updateThicknessUI);
updateThicknessUI();

// Mouse/touch events.
const touchContainer = document.getElementById('canvasContainer')!;
const activeTouches: number[] = [];
function touchStart(e: PointerEvent) {
	hidePalette();
	const { pointerId, x, y, button } = e;
	if (button !== 0) return; // Only count left clicks.
	if (activeTouches.indexOf(pointerId) < 0) {
		// Start current stroke if necessary.
		if (activeTouches.length === 0) {
			state.startStroke();
		}
		activeTouches.push(pointerId);
		// Add a new point to touch.
		state.addTouchPoint(pointerId, x, y);
	} else {
		if (DEV_MODE()) console.error(`Touch with id ${pointerId} already inited.`);
		return;
	}
}
function touchMove(e: PointerEvent) {
	const { pointerId, x, y } = e;
	const index = activeTouches.indexOf(pointerId);
	// If touch has started, add a new point.
	if (index >= 0) state.addTouchPoint(pointerId, x, y);
}
function touchEnd(e: PointerEvent) {
	const { pointerId, x, y, button } = e;
	const index = activeTouches.indexOf(pointerId);
	if (index >= 0) {
		activeTouches.splice(index, 1);
		// End current stroke if necessary.
		if (activeTouches.length === 0) {
			state.endStroke();
		}
	}
}
touchContainer.addEventListener('pointerdown', touchStart);
touchContainer.addEventListener('pointermove', touchMove);
touchContainer.addEventListener('pointerup', touchEnd);
touchContainer.addEventListener('pointercancel', touchEnd);
touchContainer.addEventListener('pointerout', touchEnd);
touchContainer.addEventListener('pointerleave', touchEnd);

// Disable other gestures.
document.addEventListener('gesturestart', disableZoom);
document.addEventListener('gesturechange', disableZoom); 
document.addEventListener('gestureend', disableZoom);
function disableZoom(e: Event) {
	e.preventDefault();
	const scale = 'scale(1)';
	// @ts-ignore
	document.body.style.webkitTransform =  scale;    // Chrome, Opera, Safari
	// @ts-ignore
	document.body.style.msTransform =   scale;       // IE 9
	document.body.style.transform = scale;
}
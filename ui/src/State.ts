import { EventDispatcher, Raycaster, Vector2 } from 'three';
import { COLORS, COLOR_CHANGED_EVENT, THICKNESSES, THICKNESS_CHANGED_EVENT } from './constants';
import { renderStroke, saveCurrentDrawingState, setSketchState } from './Sketch';
import { camera } from './ThreeView';
import { canvasDimensions, DEV_MODE } from './utils';
import { webcamMesh } from './Webcam';

export type Stroke = {
	colorIndex: number,
	thicknessIndex: number,
	touches: { [key: number]: [number, number][] },
	initialState?: Uint8Array,
}

class State extends EventDispatcher {
	private _colorIndex!: number; // Index of current color.
	private _thicknessIndex!: number; // Index of current thickness.
	readonly history: Stroke[] = []; // Stroke history (for undo and saving animations).
	private currentStroke?: Stroke; // Current active stroke in progress.
	private currentSketchState?: Uint8Array; // Current rasterized sketch state as array.
	// Raycasting mouse interactions.
	private readonly raycaster = new Raycaster();
	private readonly pointer = new Vector2();
	// Keep track of if edits have been made sine last save to server.
	editsMadeSinceLastSave = false;

	constructor() {
		super();
		this.colorIndex = 0;
		this.thicknessIndex = 1;
	}

	set colorIndex(index: number) {
		if (this.currentStroke) return; // Don't change color mid stroke.
		this._colorIndex = index;
		this.dispatchEvent({ type: COLOR_CHANGED_EVENT });
	}
	get colorIndex() {
		return this._colorIndex;
	}
	get color() {
		return COLORS[this._colorIndex];
	}

	set thicknessIndex(index: number) {
		if (this.currentStroke) return; // Don't change thickness mid stroke.
		this._thicknessIndex = index;
		this.dispatchEvent({ type: THICKNESS_CHANGED_EVENT });
	}
	get thicknessIndex() {
		return this._thicknessIndex;
	}
	get thickness() {
		return THICKNESSES[this._thicknessIndex];
	}

	undo() {
		const lastStroke = this.history.pop();
		this.currentSketchState = lastStroke?.initialState;
		setSketchState(this.currentSketchState);
	}

	clear() {
		this.history.length = 0;
		this.editsMadeSinceLastSave = false;
		this.currentSketchState = undefined;
		setSketchState();
	}

	startStroke() {
		this.currentStroke = {
			colorIndex: this._colorIndex,
			thicknessIndex: this._thicknessIndex,
			touches: {},
			initialState: this.currentSketchState,
		};
		this.currentSketchState = undefined;
	}

	addTouchPoint(pointerId: number, x: number, y: number) {
		if (!this.currentStroke) {
			if (DEV_MODE()) console.error('currentStroke not inited.');
			return;
		}
		// Raycast with geometry.
		const [ width, height ] = canvasDimensions();
		// Update the raycaster with the camera and pointer position.
		this.pointer.set(x / width * 2 - 1, y / height * 2 - 1);
		this.raycaster.setFromCamera(this.pointer, camera);
		// Calculate intersection point.
		const intersects = this.raycaster.intersectObject(webcamMesh);
		if (intersects.length === 0) {
			return;
		}
		const { point } = intersects[0];
		// Scale x, y position to be [WEBCAM_FEED_WIDTH/2, -WEBCAM_FEED_WIDTH/2] and [WEBCAM_FEED_HEIGHT/2, -WEBCAM_FEED_HEIGHT/2].
		point.divideScalar(webcamMesh.scale.x);
		const pointArray = [point.x, -point.y] as [number, number]; // Flip y axis.

		this._addTouchPoint(pointerId, pointArray);
	}

	_addTouchPoint(pointerId: number, point: [number, number]) {
		if (!this.currentStroke) {
			if (DEV_MODE()) console.error('currentStroke not inited.');
			return;
		}
		// Add new point;
		let points = this.currentStroke.touches[pointerId];
		if (!points) points = [];
		points.push(point);
		this.currentStroke.touches[pointerId] = points;

		// Draw to screen.
		const lastPoint = points.length > 1 ? points[points.length - 2] : point;
		renderStroke(this.color, this.thickness, point[0], point[1], lastPoint[0], lastPoint[1]);
	}

	endStroke() {
		if (this.currentStroke) {
			this.history.push(this.currentStroke);
			this.editsMadeSinceLastSave = true;
			this.currentStroke = undefined;
			this.currentSketchState = saveCurrentDrawingState();
		}
	}
}

export const state = new State();
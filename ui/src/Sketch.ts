import {
	CircleGeometry,
	ClampToEdgeWrapping,
	DataTexture,
	Mesh,
	MeshBasicMaterial,
	NearestFilter,
	OrthographicCamera,
	PlaneGeometry,
	RGBAFormat,
	Scene,
	UnsignedByteType,
	WebGLRenderTarget,
} from 'three';
import { SKETCH_HEIGHT, SKETCH_RES_FACTOR, SKETCH_WIDTH } from './constants';
import { geometry, renderer, resize, scene } from './ThreeView';

// Texture to hold sketch layer.
const sketchTexture = new WebGLRenderTarget(SKETCH_WIDTH, SKETCH_HEIGHT, {
	wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
    magFilter: NearestFilter,
    minFilter: NearestFilter,
    format: RGBAFormat,
    type: UnsignedByteType,
    depthBuffer: false,
    stencilBuffer: false,
});
const sketchMaterial = new MeshBasicMaterial({ map: sketchTexture.texture, transparent: true, opacity: 1 });
// Init geometry to render sketch.
const sketchMesh = new Mesh(geometry, sketchMaterial);
sketchMesh.position.z = 0.1;
scene.add(sketchMesh);
resize();

// Camera for rendering to sketch texture.
const renderTargetCamera = new OrthographicCamera(
	-SKETCH_WIDTH / 2,
	SKETCH_WIDTH / 2,
	SKETCH_HEIGHT / 2,
	-SKETCH_HEIGHT / 2,
	0.1, 10,
);
renderTargetCamera.position.z = 1;

// Geometry for sketch strokes.
const strokeScene = new Scene();
const segmentMaterial = new MeshBasicMaterial();
const cap1Mesh = new Mesh(new CircleGeometry(0.5, 40), segmentMaterial);
const cap2Mesh = new Mesh(new CircleGeometry(0.5, 40), segmentMaterial);
const middleMesh = new Mesh(new PlaneGeometry(1, 1), segmentMaterial);
strokeScene.add(cap1Mesh, cap2Mesh, middleMesh);

export function renderStroke(
	color: string, thickness: number,
	x1: number, y1: number,
	x2: number, y2: number,
) {
	// Calculate center point.
	const x = (x1 + x2) / 2 * SKETCH_RES_FACTOR;
	const y = (y1 + y2) / 2 * SKETCH_RES_FACTOR;
	cap1Mesh.position.set(x1 * SKETCH_RES_FACTOR, y1 * SKETCH_RES_FACTOR, cap1Mesh.position.z);
	cap2Mesh.position.set(x2 * SKETCH_RES_FACTOR, y2 * SKETCH_RES_FACTOR, cap2Mesh.position.z);
	middleMesh.position.set(x, y, middleMesh.position.z);
	// Calculate rotation angle.
	const angle = Math.atan2(y2 - y1, x2 - x1);
	middleMesh.rotation.set(0, 0, angle);
	const scaledThickness = thickness * SKETCH_RES_FACTOR / sketchMesh.scale.x;
	cap1Mesh.scale.set(scaledThickness, scaledThickness, 1);
	cap2Mesh.scale.set(scaledThickness, scaledThickness, 1);
	// Calculate length.
	const diffX = x1 - x2;
	const diffY = y1 - y2;
	const length = Math.sqrt(diffX * diffX + diffY * diffY) * SKETCH_RES_FACTOR;
	middleMesh.scale.set(length, scaledThickness, 1);
	segmentMaterial.color.set(color);
	// Render strokes onto off-screen texture.
	renderer.setRenderTarget(sketchTexture);
    renderer.render(strokeScene, renderTargetCamera);
}

export function saveCurrentDrawingState() {
	const pixels = new Uint8Array(4 * SKETCH_WIDTH * SKETCH_HEIGHT);
	renderer.readRenderTargetPixels(sketchTexture, 0, 0, SKETCH_WIDTH, SKETCH_HEIGHT, pixels);
	return pixels;
}

// Geometry for copying saved texture to sketch texture.
const copyScene = new Scene();
const copyMaterial = new MeshBasicMaterial({ transparent: true, opacity: 1 });
const copyMesh = new Mesh(geometry, copyMaterial);
copyMesh.scale.set(SKETCH_RES_FACTOR, SKETCH_RES_FACTOR, 1);
copyScene.add(copyMesh);

export function setSketchState(pixels?: Uint8Array) {
	// Clear sketch texture.
	renderer.setRenderTarget(sketchTexture);
	renderer.clear();
	if (pixels) {
		// Init a texture and draw to scene.
		const texture = new DataTexture(pixels, SKETCH_WIDTH, SKETCH_HEIGHT, RGBAFormat, UnsignedByteType);
		texture.needsUpdate = true;
		copyMaterial.map = texture;
		copyMaterial.needsUpdate = true;
		renderer.render(copyScene, renderTargetCamera);
		copyMaterial.map = null;
		texture.dispose();
	}
}

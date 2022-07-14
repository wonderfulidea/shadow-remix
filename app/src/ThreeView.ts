import {
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	WebGLRenderer,
} from 'three';
import { iterAnimation } from './animation';
import { WEBCAM_FEED_HEIGHT, WEBCAM_FEED_WIDTH } from './constants';
import { canvasDimensions, setMeshScale } from './utils';

// Init camera with orthographic projection.
export const camera = new OrthographicCamera();
camera.near = 0.1;
camera.far = 10;
camera.position.z = 1;

// Init threejs scene.
export const scene = new Scene();

// Init WebGL renderer.
export const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;
// Add canvas to DOM.
document.getElementById('canvasContainer')!.appendChild(renderer.domElement);

export const geometry = new PlaneGeometry(WEBCAM_FEED_WIDTH, WEBCAM_FEED_HEIGHT);

// Update aspect ratio on resize.
window.addEventListener('resize', resize);
resize();
export function resize() {
	const [ width, height ] = canvasDimensions();
	camera.left = -width / 2;
	camera.right = width / 2;
	camera.top = height / 2;
	camera.bottom = -height / 2;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
	// Handle aspect ratio changes.
	scene.children.forEach(mesh => {
		if (mesh.constructor !== Mesh) return;
		setMeshScale(mesh as Mesh);
	});
}
window.addEventListener('load', resize);

// Start animation loop.
loop();
function loop() {
	requestAnimationFrame(loop);
	render();
	iterAnimation();
}

export function render() {
	// Render to screen.
	renderer.setRenderTarget(null);
	renderer.render(scene, camera);
}

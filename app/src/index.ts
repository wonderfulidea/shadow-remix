import './UI';
import './hotkeys';
import './micromodal.css';
import 'notie/dist/notie.min.css';
import './main.css';

console.log(`Running in ${process.env.NODE_ENV === 'development' ? 'development' : 'production' } mode.`);
if (process.env.NODE_ENV === 'development') {
	// Display version number.
	document.getElementById('versionNumber')!.innerHTML = `Version ${require('../package.json').version}`;
}

// Show UI after all css has loaded.
document.getElementById('uiwrapper')!.style.display = 'flex';

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

// Don't change the order of these lines!

// Add a flag so UI lib knows not to save file to disk.
// @ts-ignore
window.SHOULD_UPLOAD_TO_S3 = true;

import './dist/ui';
import './dist/uploadImage';
import './dist/serial';
import './dist/screensaver';

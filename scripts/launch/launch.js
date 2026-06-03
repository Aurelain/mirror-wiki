import {spawn} from 'node:child_process';
import {join} from 'node:path';

const LAUNCH_DOWNLOAD = join(import.meta.dirname, '../../../homm-oe/scripts/download/download.js');
const LAUNCH_UPLOAD = join(import.meta.dirname, '../../../homm-oe/scripts/upload/upload.js');

function launch() {
    const path = process.argv[2] === 'download' ? LAUNCH_DOWNLOAD : LAUNCH_UPLOAD;
    const child = spawn('node', [path], {stdio: 'inherit'});
    child.on('close', (code) => process.exit(code));
}

launch();

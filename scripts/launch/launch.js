import {spawn} from 'node:child_process';
import {join} from 'node:path';

const REMOTE_SCRIPT = join(import.meta.dirname, '../../../homm-oe/scripts/sync/sync.js');

function launch() {
    const uploadParameter = process.argv[2] === 'upload' ? 'upload' : null;
    const child = spawn('node', [REMOTE_SCRIPT, uploadParameter], {stdio: 'inherit'});
    child.on('close', (code) => process.exit(code));
}

launch();

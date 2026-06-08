import fs from 'node:fs';
import convertTitleToPath from '../helpers/convertTitleToPath.js';
import assume from '../utils/assume.js';

function fixLuaModules() {
    const jsonContent = fs.readFileSync('/a/aims/oe-wiki/wiki/.wiki-meta.json', 'utf8');
    const json = JSON.parse(jsonContent);
    for (const title in json.pages) {
        const fixed = convertTitleToPath(title);
        const expectedPath = '/a/aims/oe-wiki/wiki/' + fixed;
        if (!fs.existsSync(expectedPath)) {
            const existingPath = expectedPath.replace('.lua', '.wiki');
            console.log('------------');
            console.log('title:', title);
            console.log('expectedPath:', expectedPath);
            console.log('existingPath:', existingPath);
            assume(fs.existsSync(existingPath), 'Does not exist!');
            fs.renameSync(existingPath, expectedPath);
        }
    }
}

fixLuaModules();

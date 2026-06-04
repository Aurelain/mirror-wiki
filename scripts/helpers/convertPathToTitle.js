import assume from '../utils/assume.js';

const ILLEGAL_CHARACTERS = new RegExp('[ :]');

/**
 * -------------------------------------------------------------
 * |   Path                       ->  Title                     |
 * -------------------------------------------------------------
 * |   Main/Foo~Bar_Hello.wiki    ->  Foo/Bar Hello             |
 * -------------------------------------------------------------
 * |   Template/Foo~Bar.wiki      ->  Template:Foo/Bar          |
 * -------------------------------------------------------------
 * |   Module/Foo~styles.css      ->  Modules:Foo/styles.css    |
 * -------------------------------------------------------------
 */
function convertPathToTitle(filePath) {
    assume(!filePath.match(ILLEGAL_CHARACTERS), filePath, 'Path contains an illegal character!');
    assume((filePath.match(/\//g) || []).length <= 1, filePath, 'Path contains too many slashes!');
    let title = filePath;
    title = title.replace(/^Main\//, '');
    title = title.replace(/\.wiki$/, '');
    title = title.replace('/', ':');
    title = title.replaceAll('~', '/');
    title = title.replaceAll('_', ' ');
    return title;
}

export default convertPathToTitle;

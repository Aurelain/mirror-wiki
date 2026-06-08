import assume from '../utils/assume.js';

const ILLEGAL_CHARACTERS = new RegExp('[ :]');

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *    Main/Foo~Bar_Hello.wiki    ->  Foo/Bar Hello
 *    Template/Foo~Bar.wiki      ->  Template:Foo/Bar
 *    Module/Foo~styles.css      ->  Modules:Foo/styles.css
 *    Main/Foo#Bar.wiki          ->  Foo:Bar
 *    File/Foo.png.wiki          ->  File:Foo.png
 *    File/Foo.png               ->  File:Foo.png.url
 */
function convertPathToTitle(filePath) {
    assume(!filePath.match(ILLEGAL_CHARACTERS), filePath, 'Path contains an illegal character!');
    assume(filePath.split('/').length <= 2, filePath, 'Path contains too many slashes!');
    let title = filePath;
    title = title.replace(/^Main\//, '');
    title = title.replace('/', ':');
    title = title.replaceAll('~', '/');
    title = title.replaceAll('_', ' ');
    title = title.replaceAll('#', ':');
    title = title.replace(/\.lua$/, '');
    title = title.startsWith('File:') && !title.endsWith('.wiki') ? title + '.url' : title;
    title = title.replace(/\.wiki$/, '');
    return title;
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default convertPathToTitle;

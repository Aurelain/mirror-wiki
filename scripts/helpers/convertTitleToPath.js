import assume from '../utils/assume.js';

// https://wiki.hoodedhorse.com/Heroes_of_Might_and_Magic_Olden_Era/api.php?action=query&meta=siteinfo&siprop=namespaces&format=json
const KNOWN_NAMESPACES = new Set([
    'Main',
    'Data',
    'Media',
    'Special',
    'Talk',
    'User',
    'User talk',
    'Project',
    'Project talk',
    'File',
    'File talk',
    'MediaWiki',
    'MediaWiki talk',
    'Template',
    'Template talk',
    'Help',
    'Help talk',
    'Category',
    'Category talk',
    'Module',
    'Module talk',
]);
const ILLEGAL_CHARACTERS = new RegExp('~');

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 * -------------------------------------------------------------
 * |  Title                      -> Path                        |
 * -------------------------------------------------------------
 * |  Foo/Bar Hello              -> Main/Foo~Bar_Hello.wiki     |
 * -------------------------------------------------------------
 * |  Template:Foo/Bar           -> Template/Foo~Bar.wiki       |
 * -------------------------------------------------------------
 * |  Modules:Foo/styles.css     -> Module/Foo~styles.css       |
 * -------------------------------------------------------------
 */
function convertTitleToPath(title) {
    assume(!title.match(ILLEGAL_CHARACTERS), title, 'Path contains an illegal character!');
    const {namespace, titleWithoutNamespace} = extractNamespace(title);
    let filePath = titleWithoutNamespace;
    filePath = filePath.match(/\.\w+$/) ? filePath : filePath + '.wiki';
    filePath = filePath.replaceAll('/', '~');
    filePath = filePath.replaceAll(' ', '_');
    return namespace + '/' + filePath;
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function extractNamespace(title) {
    let [, namespace, titleWithoutNamespace] = title.match(/(.*?):(.*)/) || [null, '', title];
    assume(!titleWithoutNamespace.includes(':'), title, 'Unexpected colon!');
    namespace = namespace || 'Main';
    assume(KNOWN_NAMESPACES.has(namespace), title, 'Unrecognized namespace!');
    return {namespace, titleWithoutNamespace};
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default convertTitleToPath;

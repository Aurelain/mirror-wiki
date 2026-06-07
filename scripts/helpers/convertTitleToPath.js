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
const ALLOWED_EXTENSIONS = new Set(['css']);
const ILLEGAL_CHARACTERS = new RegExp('~');

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *   Foo/Bar Hello              -> Main/Foo~Bar_Hello.wiki
 *   Template:Foo/Bar           -> Template/Foo~Bar.wiki
 *   Modules:Foo/styles.css     -> Module/Foo~styles.css
 *   Foo:Bar                    -> Main/Foo#Bar.wiki
 *   File:Foo.png               -> File/Foo.png.wiki
 *   File:Foo.png.url           -> File/Foo.png
 */
function convertTitleToPath(title) {
    assume(!title.match(ILLEGAL_CHARACTERS), title, 'Path contains an illegal character!');
    const {namespace, titleWithoutNamespace} = extractNamespace(title);
    let filePath = titleWithoutNamespace;
    filePath = filePath.replaceAll('/', '~');
    filePath = filePath.replaceAll(' ', '_');
    filePath = filePath.replaceAll(':', '#');
    filePath = adaptExtension(filePath);
    return namespace.replace(' ', '_') + '/' + filePath;
}

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
function extractNamespace(title) {
    let [, namespace, titleWithoutNamespace] = title.match(/(.*?):(.*)/) || [null, '', title];
    if (!KNOWN_NAMESPACES.has(namespace)) {
        namespace = '';
        titleWithoutNamespace = title;
    }
    namespace = namespace || 'Main';
    return {namespace, titleWithoutNamespace};
}

/**
 *
 */
function adaptExtension(title) {
    const extension = (title.match(/\.([a-zA-Z]+)$/) || [null, ''])[1].toLowerCase();
    if (extension === 'url') {
        return title.replace(/\.url$/, '');
    }
    return ALLOWED_EXTENSIONS.has(extension) ? title : title + '.wiki';
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default convertTitleToPath;

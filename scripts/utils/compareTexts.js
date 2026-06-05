import {diffMain, DIFF_DELETE, DIFF_INSERT} from '../../node_modules/diff-match-patch-es/dist/index.mjs';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 * Compares two texts and, if they differ, produces new versions with decorations (<ins> and <del>).
 * Note: To avoid risks when displaying the new texts, some html symbols are converted to entities.
 * @return {{
 *     text1: string,
 *     text2: string,
 * }}
 * @see /src/tests/diffTexts.test.js
 */
const compareTexts = (text1, text2) => {
    const safeText1 = convertSymbols(text1);
    const safeText2 = convertSymbols(text2);
    const results = diffMain(safeText1, safeText2);
    // console.log('results: ' + JSON.stringify(results, null, 4));

    const t1 = [];
    const t2 = [];
    for (const [op, text] of results) {
        switch (op) {
            case DIFF_DELETE:
                t1.push('<del>' + text + '</del>');
                t2.push('<del></del>');
                break;
            case DIFF_INSERT:
                t1.push('<ins></ins>');
                t2.push('<ins>' + text + '</ins>');
                break;
            default:
                // DiffMatchPatch.DIFF_EQUAL
                t1.push(text);
                t2.push(text);
        }
    }

    const fresh1 = t1.join('').replaceAll('</del><ins></ins>', '</del>');
    const fresh2 = t2.join('').replaceAll('<del></del><ins>', '<ins>');

    const ltOccurrences = fresh2.split('<').length - 1;
    return {
        text1: fresh1,
        text2: fresh2,
        differences: ltOccurrences / 2,
    };
};

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
const convertSymbols = (text) => {
    return text.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
};

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default compareTexts;

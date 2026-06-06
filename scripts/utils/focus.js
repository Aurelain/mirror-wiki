import compareDeep from './compareDeep.js';
import mutateDeep from './mutateDeep.js';
import sortJson from './sortJson.js';
import compareTexts from './compareTexts.js';
import cloneDeep from './cloneDeep.js';

let isStylePrepared = false;

const suiteStats = {
    okCount: 0,
    totalCount: 0,
    markups: [],
};

/**
 *
 */
const focus = async (actuator, tests, config = {}) => {
    if (config.ignore) {
        tests = [];
    }
    if (!isStylePrepared) {
        prepareStyle(config);
        isStylePrepared = true;
    }

    let markup = '';
    let fileName = '';

    const {testFilePath, mute, hideHeader} = config;
    if (testFilePath) {
        fileName = testFilePath.match(/([^/]*)\.test\.js$/)[1];
    }

    markup += `<table>`;
    if (!hideHeader) {
        markup += `
            <tr>
                <th>Input</th>
                <th>Expected output</th>
                <th>Actual output</th>
                ${config.customColumn ? '<th>Custom</th>' : ''}
            </tr>
        `;
    }

    const usedTests = electTests(tests);
    let okCount = 0;
    for (let i = 0; i < usedTests.length; i++) {
        const test = usedTests[i];
        const {name: originalName, input, output, error} = test;
        const name = ['Test', fileName, originalName || i].join(' ').replace(/\s+/, ' ');

        const inputArguments = prepareInput(input, config);
        let expectedOutput;
        if (test.hasOwnProperty('output')) {
            expectedOutput = config.expectedOutputReducer ? config.expectedOutputReducer(output) : output;
        }

        let actualOutput;
        let errorObject;
        try {
            console.log(`-------- %c${name}%c...`, 'font-weight:bold', 'font-weight:normal');
            actualOutput = await actuator.apply(null, inputArguments);
            actualOutput = config.actualOutputReducer ? config.actualOutputReducer(actualOutput) : actualOutput;
            if (Object.prototype.toString.call(actualOutput).includes('Array')) {
                actualOutput = Array.from(actualOutput);
            }
        } catch (e) {
            errorObject = e;
            actualOutput = `Error: ${e.message}`;
        }
        if (actualOutput === undefined) {
            actualOutput = 'undefined';
        }
        if (error) {
            // We were expecting an error
            if (errorObject) {
                expectedOutput = actualOutput; // We were expecting an error and it happened
            } else {
                expectedOutput = 'Some error';
            }
        } else {
            // We were NOT expecting an error
            if (errorObject) {
                console.warn(errorObject.stack);
            } else {
                if (expectedOutput === undefined) {
                    expectedOutput = 'undefined';
                } else {
                    // Nothing, everything is fine.
                }
            }
        }

        const isOk = compareDeep(expectedOutput, actualOutput);
        okCount += Number(isOk);
        if (isOk && window.localStorage.skipSuccesses) {
            continue;
        }
        const resultStyle = config.neutral ? '' : ' style="background:' + (isOk ? 'lime' : '') + '"';

        const sortedInput = sortJson(input);
        const sortedExpected = sortJson(expectedOutput);
        const sortedActual = sortJson(actualOutput);
        let diff1, diff2;
        if (!isOk) {
            diff1 = JSON.stringify(sortedExpected, null, 4);
            diff2 = JSON.stringify(sortedActual, null, 4);
            if (diff1 === diff2) {
                mutateDeep(sortedActual, inspectNinjaValues);
                console.warn(
                    'The two outputs **appear** identical, ' +
                        "but only because JSON doesn't handle all JS data types (e.g. undefined, NaN, functions)!",
                );
            } else {
                // We need to protect ourselves from undefined because JSON.stringify fails to stringify functions
                if (diff1 !== undefined && diff2 !== undefined) {
                    const result = compareTexts(diff1, diff2);
                    diff1 = result.text1;
                    diff2 = result.text2;
                }
            }
        }

        markup += `
            <tr>
                <td>
                    <b>${name}</b><br/>
                    ${config.inputPrefix ? config.inputPrefix() : ''}
                    ${config.hideInput ? 'hidden' : dump(sortedInput, config.noStringify)}
                </td>
                <td>
                    ${config.expectedOutputPrefix ? config.expectedOutputPrefix(expectedOutput, input) : ''}
                    ${diff1 ? `<pre>${diff1}</pre>` : dump(sortedExpected, config.noStringify)}
                </td>
                <td${resultStyle}>
                    ${config.actualOutputPrefix ? config.actualOutputPrefix(actualOutput, input) : ''}
                    ${diff2 ? `<pre>${diff2}</pre>` : dump(sortedActual, config.noStringify)}
                </td>
            </tr>`;
        if (config.fixN) {
            markup = markup.replace(/\\n/g, '\n');
        }
    }
    markup += '</table>';

    suiteStats.okCount += okCount;
    suiteStats.totalCount += usedTests.length;
    suiteStats.markups.push(markup);
    if (!mute) {
        dumpSuite();
    }
};

// =====================================================================================================================
//  P R I V A T E
// =====================================================================================================================
/**
 *
 */
const electTests = (tests) => {
    const normalTests = [];
    const importantTests = [];
    for (const item of tests) {
        const {name = ''} = item;
        switch (name.charAt(0)) {
            case '-':
                // skip the test
                break;
            case '+':
                importantTests.push(item);
                break;
            default:
                normalTests.push(item);
        }
    }
    return importantTests.length ? importantTests : normalTests;
};

/**
 *
 */
const prepareInput = (input, config) => {
    const {sendInputAsArguments} = config;
    const preparedInput = config.inputReducer ? config.inputReducer(input) : input;
    return sendInputAsArguments ? Object.values(preparedInput) : [preparedInput];
};

/**
 *
 */
const prepareStyle = (config) => {
    const {maxRowHeight} = config;
    const styles = document.querySelectorAll('style');
    for (const style of styles) {
        style.parentNode.removeChild(style);
    }
    const maxRowHeightValue = maxRowHeight ? `${maxRowHeight}px` : 'auto';
    document.head.insertAdjacentHTML(
        'beforeend',
        `
        <style> 
            html, body {
                margin:0;
                padding:0;
            }
            * {
                font-family: "JetBrains Mono", Consolas, monospace;
                font-size:13px;
                box-sizing: border-box;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                table-layout: fixed;
                border-top: solid 4px gray;
            }
            td, th {
                border-bottom: solid 1px gray;
                border-right: solid 1px gray;
                vertical-align: top;
                text-align: left;
                padding: 0;
            }
            th {
                padding: 4px;
            }
            td:last-child, th:last-child {
                border-right: none;
            }
            textarea {
                width: 100%;
                overflow: auto;
                margin: 0;
                padding: 2px;
                min-height: 400px;
                max-height: ${maxRowHeightValue};
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                background: transparent;
                border:0;
                display: block;
            }
            pre {
                width: 100%;
                overflow: hidden;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }
            textarea, pre {
                font-family: "JetBrains Mono", monospace;
            }
            del {
                background: #f5a7a7;
                text-decoration: none;
                outline: solid 1px #f5a7a7;
            }
            ins {
                background: #BEE6BE;
                text-decoration: none;
                outline: solid 1px #BEE6BE;
            }
            h1 {text-align:right; cursor:pointer;}
        </style>`,
    );
};

/**
 *
 * Note: An alternative would be to use <xml> (https://stackoverflow.com/a/39900317).
 */
const dump = (target, noStringify) => {
    if (target && typeof target === 'object') {
        target = cloneDeep(target);
        const map = new Map();
        countChildren(target, map);
        for (const key in target) {
            if (map.get(target[key]) > 100) {
                target[key] = '...large...';
            }
        }
    }
    let text = target && !noStringify ? JSON.stringify(target, null, 4) : String(target);
    return '<textarea spellcheck="false">' + text + '</textarea>';
};

/**
 *
 */
const dumpSuite = () => {
    const {okCount, totalCount, markups} = suiteStats;
    const count = window.localStorage.skipSuccesses ? totalCount - okCount : okCount;
    const results = `
        <h1>${Math.floor((100 * count) / totalCount)}% (${count}/${totalCount})</h1>
        ${markups.join('')}
    `;
    document.body.insertAdjacentHTML('afterbegin', results);
    document.querySelector('h1').addEventListener('click', () => {
        if (window.localStorage.skipSuccesses) {
            delete window.localStorage.skipSuccesses;
        } else {
            window.localStorage.skipSuccesses = true;
        }
        window.location.reload();
    });
};

/**
 *
 */
const countChildren = (target, map) => {
    let count = 0;
    for (const key in target) {
        const value = target[key];
        if (value !== null && typeof value === 'object') {
            count += countChildren(value, map);
        } else {
            count++;
        }
    }
    map.set(target, count);
    return count;
};

/**
 *
 */
const inspectNinjaValues = ({key, value}) => {
    if (value === null) {
        return;
    }
    if (value === undefined) {
        return console.warn(`Key "${key}" is undefined!`);
    }
    const type = typeof value;
    if (type === 'number') {
        if (isNaN(value)) {
            return console.warn(`Key "${key}" is NaN!`);
        }
        if (!isFinite(value)) {
            return console.warn(`Key "${key}" is infinite!`);
        }
    } else if (type !== 'boolean' && type !== 'string') {
        console.warn(`Key "${key}" is of type ${type}!`);
    }
};

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default focus;

import readline from 'node:readline/promises';
import {stdin as input, stdout as output} from 'node:process';

// =====================================================================================================================
//  P U B L I C
// =====================================================================================================================
/**
 *
 */
async function confirm(message) {
    if (!message) {
        return true;
    }
    message = message.trim() + '\nDo you want to continue? [message or "n"]';
    const rl = readline.createInterface({input, output});
    const answer = await rl.question(message);
    const trimmedAnswer = answer.trim();
    rl.close();
    if (trimmedAnswer.toLowerCase() === 'n') {
        return null;
    }
    return trimmedAnswer;
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default confirm;

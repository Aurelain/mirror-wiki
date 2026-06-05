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
    message = message.trim() + '\nDo you want to continue? [Y/n]: ';
    const rl = readline.createInterface({input, output});
    const answer = await rl.question(message);
    const trimmedAnswer = answer.trim().toLowerCase();
    rl.close();
    return trimmedAnswer === '' || trimmedAnswer.startsWith('y');
}

// =====================================================================================================================
//  E X P O R T
// =====================================================================================================================
export default confirm;

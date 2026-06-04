import crypto from 'node:crypto';

/**
 *
 */
const computeSha1 = (content) => {
    const generator = crypto.createHash('sha1');
    generator.update(content);
    return generator.digest('hex');
};

export default computeSha1;

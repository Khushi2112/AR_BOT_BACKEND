import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const debugSignatureAssets = () => {
    console.log('--- Signature Debug ---');
    console.log('Current __dirname:', __dirname);

    // Attempt to resolve target directory
    const imageDir = path.resolve(__dirname, '..', '..', 'frontend', 'image');
    console.log('Resolved imageDir:', imageDir);

    if (!fs.existsSync(imageDir)) {
        console.error('ERROR: imageDir does not exist!');
    } else {
        console.log('SUCCESS: imageDir exists.');
        const files = fs.readdirSync(imageDir);
        console.log('Files in directory:', files);

        const pic1Path = path.join(imageDir, 'Picture1.png');
        const pic2Path = path.join(imageDir, 'Picture2.png');

        if (fs.existsSync(pic1Path)) {
            const stats = fs.statSync(pic1Path);
            console.log(`Picture1.png found (${stats.size} bytes)`);
        } else {
            console.error('ERROR: Picture1.png not found at', pic1Path);
        }

        if (fs.existsSync(pic2Path)) {
            const stats = fs.statSync(pic2Path);
            console.log(`Picture2.png found (${stats.size} bytes)`);
        } else {
            console.error('ERROR: Picture2.png not found at', pic2Path);
        }
    }
    console.log('-----------------------');
};

debugSignatureAssets();

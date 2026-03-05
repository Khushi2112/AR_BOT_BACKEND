import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testAssets = () => {
    console.log('--- FINAL ASSET DEBUG ---');
    console.log('Utils __dirname:', __dirname);

    const arSystemDir = path.resolve(__dirname, '..', '..');
    console.log('Resolved ar-system root:', arSystemDir);

    const imageDir = path.join(arSystemDir, 'frontend', 'image');
    console.log('Target imageDir:', imageDir);

    if (fs.existsSync(imageDir)) {
        console.log('SUCCESS: imageDir found.');
        const files = fs.readdirSync(imageDir);
        console.log('Files present:', files);

        ['Picture1.png', 'Picture2.png'].forEach(file => {
            const fullPath = path.join(imageDir, file);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                console.log(`- ${file}: FOUND (${stats.size} bytes)`);
            } else {
                console.error(`- ${file}: NOT FOUND at ${fullPath}`);
            }
        });
    } else {
        console.error('ERROR: imageDir NOT FOUND at', imageDir);
    }
}

testAssets();

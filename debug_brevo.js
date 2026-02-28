import * as Brevo from '@getbrevo/brevo';

console.log('--- Brevo Exports Check ---');
console.log('Keys:', Object.keys(Brevo));
if (Brevo.default) {
    console.log('Default Keys:', Object.keys(Brevo.default));
}
console.log('---------------------------');

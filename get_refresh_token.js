import { google } from 'googleapis';
import readline from 'readline';

/**
 * This script helps you generate a REFRESH_TOKEN for Gmail API.
 * You will need your CLIENT_ID and CLIENT_SECRET from Google Cloud Console.
 */

const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
});

console.log('1. Open this URL in your browser:');
console.log(authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('\n2. After authorizing, you will be redirected to a page (OAuth Playground). \nLook for "code=..." in the URL. Paste that code here: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
        if (err) {
            console.error('Error retrieving access token', err);
            return;
        }
        console.log('\nSUCCESS! Here are your tokens:');
        console.log(JSON.stringify(token, null, 2));
        console.log('\nCopy the "refresh_token" value and add it to your .env file.');
    });
});

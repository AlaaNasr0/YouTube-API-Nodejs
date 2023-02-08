const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');

// Download your OAuth2 configuration from the Google
const credentials = require('../client_secret');
var clientSecret = credentials.installed.client_secret;
var clientId = credentials.installed.client_id;
var redirectUrl = credentials.installed.redirect_uris[0];

/**
* Start by acquiring a pre-authenticated oAuth2 client.
*/
async function main(req, res1) {
    const oAuth2Client = await getAuthenticatedClient();
    var { google } = require("googleapis");
    var service = google.youtube("v3");
    const newTitle = req.body.title;
    const newDesc = req.body.desc;
    const videoId = req.body.VID;
    const updateOptions = {
        auth: oAuth2Client,
        part: "snippet,status,localizations",
        mine: 1,
        requestBody: {
            id: videoId,
            snippet: {
                title: newTitle,
                description: newDesc,
                categoryId: 1,
            },
        },
    };
    service.videos.update(updateOptions, (err, res) => {
        if (err) return console.log(`The API returned an error: ${err}`);
        console.log(res.data);
    });
    res1.render('edit', { dataItem: videoId });
}
/**
* Create a new OAuth2Client, and go through the OAuth2 content
* workflow.  Return the full client to the callback.
*/
function getAuthenticatedClient() {
    return new Promise((resolve, reject) => {
        // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
        // which should be downloaded from the Google Developers Console.
        var SCOPES = [
            "https://www.googleapis.com/auth/youtubepartner",
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.force-ssl"
        ];
        const oAuth2Client = new OAuth2Client(
            clientId,
            clientSecret,
            redirectUrl
        );

        // Generate the url that will be used for the consent dialog.
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        const server = http
            .createServer(async (req, res) => {
                try {

                    if (req.url.indexOf('/postEdit') > -1) {
                        // acquire the code from the querystring, and close the web server.
                        const qs = new url.URL(req.url, 'http://localhost:3001')
                            .searchParams;
                        const code = qs.get('code');
                        console.log(`Code is ${code}`);
                        res.end('Your video was updated');

                        server.destroy();
                        // Now that we have the code, use that to acquire tokens.
                        const r = await oAuth2Client.getToken(code);
                        // Make sure to set the credentials on the OAuth2 client.
                        oAuth2Client.setCredentials(r.tokens);
                        console.info('Tokens acquired.');
                        resolve(oAuth2Client);
                    }
                } catch (e) {
                    reject(e);
                }
            })
            .listen(3001, () => {
                open(authorizeUrl, { wait: false }).then(cp => cp.unref());
            });
        destroyer(server);
    });
}
const submitForm = (req, res) => {
    main(req, res).catch(console.error);
}
module.exports = { submitForm }
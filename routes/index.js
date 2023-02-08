var express = require('express');
var router = express.Router();
const { google } = require('googleapis');
const youtube = google.youtube({
  version: 'v3',
  auth: 'AIzaSyBBjlT67zA8x4eJXsRBAGCjgL9ALzhOR58'
});
async function getSearchResults() {
  let searchResults;
  try {
    const data = await youtube.search.list({
      part: 'snippet',
      channelId: 'UCPsI52S_x6IHlS1O-c3AwIw',
      type: 'video'
    });
    searchResults = data;
  } catch (err) {
    console.error(err);
  }
  return searchResults;
}

getSearchResults().then(data => {
  router.get('/', function (req, res, next) {
    res.render('index', { info: data });
  });
});
module.exports = router;

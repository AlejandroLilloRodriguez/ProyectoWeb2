const https = require('https');

function fetchJSON(url,headers = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Failed to parse JSON response'));
                }
            });
        }).on('error', (err) => {            reject(err);
        });
    });}



function fetchXML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getexternalData() {
    return await fetchJSON('https://api.balldontlie.io/v1/teams');
}
async function getexternalXML() {
    return await fetchXML('https://sports.yahoo.com/nba/rss.xml');
}

module.exports = {
    getexternalData,
    getexternalXML
};

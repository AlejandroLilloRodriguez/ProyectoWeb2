const xml2js = require('xml2js');
const { serializeDoc } = require('../utils/serialize');

module.exports = function xmlResponse(req, res, next) {
  const accept = req.headers.accept || '';
  if (!accept.includes('application/xml')) return next();

  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode >= 400) return originalJson(data);

    const builder = new xml2js.Builder({
      rootName: 'Team',
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    });

    res.type('application/xml');
    return res.send(builder.buildObject(serializeDoc(data)));
  };

  next();
};

const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'nba-api', timestamp: new Date() });
});

module.exports = router;

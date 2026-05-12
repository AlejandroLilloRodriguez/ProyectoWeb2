const router = require('express').Router();
const ctrl = require('../controllers/gamesController');

router.get('/',                    ctrl.listGames);
router.post('/',                   ctrl.createGame);
router.get('/:gameId',             ctrl.getGameById);
router.put('/:gameId',             ctrl.replaceGame);
router.patch('/:gameId',           ctrl.patchGame);
router.delete('/:gameId',          ctrl.deleteGame);

module.exports = router;

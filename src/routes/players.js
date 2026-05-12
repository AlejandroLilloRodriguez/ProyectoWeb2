const router = require('express').Router();
const ctrl = require('../controllers/playersController');

router.get('/',                    ctrl.listPlayers);
router.post('/',                   ctrl.createPlayer);
router.get('/:playerId',           ctrl.getPlayerById);
router.put('/:playerId',           ctrl.replacePlayer);
router.patch('/:playerId',         ctrl.patchPlayer);
router.delete('/:playerId',        ctrl.deletePlayer);
router.get('/:playerId/team',      ctrl.getTeamByPlayer);

module.exports = router;

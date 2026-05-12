const router = require('express').Router();
const ctrl = require('../controllers/teamsController');
const xmlResponse = require('../middleware/xmlResponse');

router.get('/',                    ctrl.listTeams);
router.post('/',                   ctrl.createTeam);
router.get('/:teamId',  xmlResponse, ctrl.getTeamById);
router.put('/:teamId',             ctrl.replaceTeam);
router.patch('/:teamId',           ctrl.patchTeam);
router.delete('/:teamId',          ctrl.deleteTeam);
router.get('/:teamId/players',     ctrl.listPlayersByTeam);
router.get('/:teamId/games',       ctrl.listGamesByTeam);

module.exports = router;

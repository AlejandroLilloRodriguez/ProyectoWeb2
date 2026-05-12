const Player = require('../models/Player');
const Team = require('../models/Team');

exports.listPlayers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const { teamId, position, active, search } = req.query;
    const filter = {};
    if (teamId) filter.teamId = teamId;
    if (position) filter.position = position;
    if (active !== undefined) filter.active = active === 'true';
    if (search) filter.fullName = new RegExp(search, 'i');

    const [data, totalItems] = await Promise.all([
      Player.find(filter).skip(skip).limit(limit),
      Player.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data,
      pagination: {
        page, limit, totalItems, totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });
  } catch (err) { next(err); }
};

exports.createPlayer = async (req, res, next) => {
  try {
    const team = await Team.findById(req.body.teamId);
    if (!team) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'teamId no válido' } });

    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (err) { next(err); }
};

exports.getPlayerById = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Player no encontrado' } });
    res.json(player);
  } catch (err) { next(err); }
};

exports.replacePlayer = async (req, res, next) => {
  try {
    if (req.body.teamId) {
        const team = await Team.findById(req.body.teamId);
        if (!team) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'teamId no válido' } });
    }
    const player = await Player.findOneAndReplace({ _id: req.params.playerId }, req.body, { new: true, runValidators: true });
    if (!player) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Player no encontrado' } });
    res.json(player);
  } catch (err) { next(err); }
};

exports.patchPlayer = async (req, res, next) => {
  try {
    if (req.body.teamId) {
        const team = await Team.findById(req.body.teamId);
        if (!team) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'teamId no válido' } });
    }
    const player = await Player.findByIdAndUpdate(req.params.playerId, req.body, { new: true, runValidators: true });
    if (!player) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Player no encontrado' } });
    res.json(player);
  } catch (err) { next(err); }
};

exports.deletePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.playerId);
    if (!player) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Player no encontrado' } });
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.getTeamByPlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.playerId).populate('teamId');
    if (!player) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Player no encontrado' } });
    if (!player.teamId) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Equipo no encontrado para este jugador' } });
    res.json(player.teamId);
  } catch (err) { next(err); }
};

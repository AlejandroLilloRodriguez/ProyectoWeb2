const Game = require('../models/Game');
const Team = require('../models/Team');

exports.listGames = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const { season, teamId, status, phase, dateFrom, dateTo, winnerTeamId } = req.query;
    const filter = {};
    if (season) filter.season = season;
    if (teamId) filter.$or = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    if (status) filter.status = status;
    if (phase) filter.phase = phase;
    if (winnerTeamId) filter.winnerTeamId = winnerTeamId;
    
    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const [data, totalItems] = await Promise.all([
      Game.find(filter).skip(skip).limit(limit),
      Game.countDocuments(filter),
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

exports.createGame = async (req, res, next) => {
  try {
    const homeTeam = await Team.findById(req.body.homeTeamId);
    const awayTeam = await Team.findById(req.body.awayTeamId);
    if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'homeTeamId o awayTeamId no válidos' } });
    }

    const game = await Game.create(req.body);
    res.status(201).json(game);
  } catch (err) { next(err); }
};

exports.getGameById = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Game no encontrado' } });
    res.json(game);
  } catch (err) { next(err); }
};

exports.replaceGame = async (req, res, next) => {
  try {
    if (req.body.homeTeamId && req.body.awayTeamId) {
        const homeTeam = await Team.findById(req.body.homeTeamId);
        const awayTeam = await Team.findById(req.body.awayTeamId);
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'homeTeamId o awayTeamId no válidos' } });
        }
    }
    const game = await Game.findOneAndReplace({ _id: req.params.gameId }, req.body, { new: true, runValidators: true });
    if (!game) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Game no encontrado' } });
    res.json(game);
  } catch (err) { next(err); }
};

exports.patchGame = async (req, res, next) => {
  try {
    if (req.body.homeTeamId || req.body.awayTeamId) {
        if (req.body.homeTeamId) {
            const home = await Team.findById(req.body.homeTeamId);
            if (!home) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'homeTeamId no válido' } });
        }
        if (req.body.awayTeamId) {
            const away = await Team.findById(req.body.awayTeamId);
            if (!away) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'awayTeamId no válido' } });
        }
    }
    const game = await Game.findByIdAndUpdate(req.params.gameId, req.body, { new: true, runValidators: true });
    if (!game) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Game no encontrado' } });
    res.json(game);
  } catch (err) { next(err); }
};

exports.deleteGame = async (req, res, next) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.gameId);
    if (!game) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Game no encontrado' } });
    res.status(204).send();
  } catch (err) { next(err); }
};

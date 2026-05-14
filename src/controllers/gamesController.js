const Game = require('../models/Game');
const Team = require('../models/Team');
const { serializeDoc, serializeMany } = require('../utils/serialize');
const { parsePagination, buildPagination } = require('../utils/pagination');

function notFound(message) {
  return { error: { code: 'NOT_FOUND', message } };
}

function validationError(message) {
  return { error: { code: 'VALIDATION_ERROR', message } };
}

async function ensureTeamExists(teamId, fieldName) {
  const team = await Team.findById(teamId);
  if (!team) {
    const err = new Error(`${fieldName} no existe`);
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return team;
}

async function validateGameTeams(body, existingGame = null) {
  const homeTeamId = body.homeTeamId || existingGame?.homeTeamId;
  const awayTeamId = body.awayTeamId || existingGame?.awayTeamId;

  if (!homeTeamId) {
    return validationError('homeTeamId es obligatorio');
  }
  if (!awayTeamId) {
    return validationError('awayTeamId es obligatorio');
  }
  if (String(homeTeamId) === String(awayTeamId)) {
    return validationError('homeTeamId y awayTeamId deben ser distintos');
  }

  await ensureTeamExists(homeTeamId, 'homeTeamId');
  await ensureTeamExists(awayTeamId, 'awayTeamId');

  if (body.winnerTeamId) {
    await ensureTeamExists(body.winnerTeamId, 'winnerTeamId');
  }

  return null;
}

exports.listGames = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { season, teamId, status, phase, dateFrom, dateTo, winnerTeamId } = req.query;
    const filter = {};

    if (season) filter.season = Number(season);
    if (teamId) filter.$or = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    if (status) filter.status = status;
    if (phase) filter.phase = phase;
    if (winnerTeamId) filter.winnerTeamId = winnerTeamId;

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const [games, totalItems] = await Promise.all([
      Game.find(filter).skip(skip).limit(limit),
      Game.countDocuments(filter),
    ]);

    res.json({
      data: serializeMany(games),
      pagination: buildPagination(page, limit, totalItems),
    });
  } catch (err) {
    next(err);
  }
};

exports.createGame = async (req, res, next) => {
  try {
    const teamValidation = await validateGameTeams(req.body);
    if (teamValidation) {
      return res.status(422).json(teamValidation);
    }

    const game = await Game.create(req.body);
    res.status(201).json(serializeDoc(game));
  } catch (err) {
    next(err);
  }
};

exports.getGameById = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json(notFound('Game no encontrado'));
    }

    res.json(serializeDoc(game));
  } catch (err) {
    next(err);
  }
};

exports.replaceGame = async (req, res, next) => {
  try {
    const gameExists = await Game.exists({ _id: req.params.gameId });
    if (!gameExists) {
      return res.status(404).json(notFound('Game no encontrado'));
    }

    const teamValidation = await validateGameTeams(req.body);
    if (teamValidation) {
      return res.status(422).json(teamValidation);
    }

    const game = await Game.findOneAndReplace(
      { _id: req.params.gameId },
      req.body,
      { new: true, runValidators: true }
    );

    res.json(serializeDoc(game));
  } catch (err) {
    next(err);
  }
};

exports.patchGame = async (req, res, next) => {
  try {
    const existingGame = await Game.findById(req.params.gameId);
    if (!existingGame) {
      return res.status(404).json(notFound('Game no encontrado'));
    }

    if (req.body.homeTeamId || req.body.awayTeamId || req.body.winnerTeamId) {
      const teamValidation = await validateGameTeams(req.body, existingGame);
      if (teamValidation) {
        return res.status(422).json(teamValidation);
      }
    }

    const game = await Game.findByIdAndUpdate(
      req.params.gameId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(serializeDoc(game));
  } catch (err) {
    next(err);
  }
};

exports.deleteGame = async (req, res, next) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.gameId);
    if (!game) {
      return res.status(404).json(notFound('Game no encontrado'));
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

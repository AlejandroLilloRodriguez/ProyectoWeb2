const Player = require('../models/Player');
const Team = require('../models/Team');
const { serializeDoc, serializeMany } = require('../utils/serialize');
const { parsePagination, buildPagination } = require('../utils/pagination');

function notFound(message) {
  return { error: { code: 'NOT_FOUND', message } };
}

function validationError(message) {
  return { error: { code: 'VALIDATION_ERROR', message } };
}

async function ensureTeamExists(teamId) {
  const team = await Team.findById(teamId);
  if (!team) {
    const err = new Error('teamId no existe');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return team;
}

exports.listPlayers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { teamId, position, active, search } = req.query;
    const filter = {};

    if (teamId) filter.teamId = teamId;
    if (position) filter.position = position;
    if (active !== undefined) filter.active = active === 'true';
    if (search) filter.fullName = new RegExp(search, 'i');

    const [players, totalItems] = await Promise.all([
      Player.find(filter).skip(skip).limit(limit),
      Player.countDocuments(filter),
    ]);

    res.json({
      data: serializeMany(players),
      pagination: buildPagination(page, limit, totalItems),
    });
  } catch (err) {
    next(err);
  }
};

exports.createPlayer = async (req, res, next) => {
  try {
    if (!req.body.teamId) {
      return res.status(422).json(validationError('teamId es obligatorio'));
    }

    await ensureTeamExists(req.body.teamId);
    const player = await Player.create(req.body);
    res.status(201).json(serializeDoc(player));
  } catch (err) {
    next(err);
  }
};

exports.getPlayerById = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json(notFound('Player no encontrado'));
    }

    res.json(serializeDoc(player));
  } catch (err) {
    next(err);
  }
};

exports.replacePlayer = async (req, res, next) => {
  try {
    const playerExists = await Player.exists({ _id: req.params.playerId });
    if (!playerExists) {
      return res.status(404).json(notFound('Player no encontrado'));
    }

    if (!req.body.teamId) {
      return res.status(422).json(validationError('teamId es obligatorio'));
    }

    await ensureTeamExists(req.body.teamId);
    const player = await Player.findOneAndReplace(
      { _id: req.params.playerId },
      req.body,
      { new: true, runValidators: true }
    );

    res.json(serializeDoc(player));
  } catch (err) {
    next(err);
  }
};

exports.patchPlayer = async (req, res, next) => {
  try {
    const playerExists = await Player.exists({ _id: req.params.playerId });
    if (!playerExists) {
      return res.status(404).json(notFound('Player no encontrado'));
    }

    if (req.body.teamId) {
      await ensureTeamExists(req.body.teamId);
    }

    const player = await Player.findByIdAndUpdate(
      req.params.playerId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(serializeDoc(player));
  } catch (err) {
    next(err);
  }
};

exports.deletePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.playerId);
    if (!player) {
      return res.status(404).json(notFound('Player no encontrado'));
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.getTeamByPlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.playerId).populate('teamId');
    if (!player) {
      return res.status(404).json(notFound('Player no encontrado'));
    }
    if (!player.teamId) {
      return res.status(404).json(notFound('Equipo no encontrado para este jugador'));
    }

    res.json(serializeDoc(player.teamId));
  } catch (err) {
    next(err);
  }
};

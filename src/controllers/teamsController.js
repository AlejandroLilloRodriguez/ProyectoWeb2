const Team = require('../models/Team');
const Player = require('../models/Player');
const Game = require('../models/Game');
const { serializeDoc, serializeMany } = require('../utils/serialize');
const { parsePagination, buildPagination } = require('../utils/pagination');

function notFound(message) {
  return { error: { code: 'NOT_FOUND', message } };
}

exports.listTeams = async (req, res, next) => {
  try {
    const { conference, division, city, name } = req.query;
    const filter = {};
    if (conference) filter.conference = conference;
    if (division) filter.division = division;
    if (city) filter.city = new RegExp(city, 'i');
    if (name) filter.name = new RegExp(name, 'i');

    const teams = await Team.find(filter);
    res.json({ data: serializeMany(teams) });
  } catch (err) {
    next(err);
  }
};

exports.createTeam = async (req, res, next) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json(serializeDoc(team));
  } catch (err) {
    next(err);
  }
};

exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json(notFound('Team no encontrado'));
    }

    res.json(serializeDoc(team));
  } catch (err) {
    next(err);
  }
};

exports.replaceTeam = async (req, res, next) => {
  try {
    const team = await Team.findOneAndReplace(
      { _id: req.params.teamId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!team) {
      return res.status(404).json(notFound('Team no encontrado'));
    }

    res.json(serializeDoc(team));
  } catch (err) {
    next(err);
  }
};

exports.patchTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!team) {
      return res.status(404).json(notFound('Team no encontrado'));
    }

    res.json(serializeDoc(team));
  } catch (err) {
    next(err);
  }
};

exports.deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.teamId);
    if (!team) {
      return res.status(404).json(notFound('Team no encontrado'));
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.listPlayersByTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json(notFound('Team no encontrado'));
    }

    const { page, limit, skip } = parsePagination(req.query);
    const filter = { teamId: req.params.teamId };

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

exports.listGamesByTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json(notFound('Team no encontrado'));
    }

    const { page, limit, skip } = parsePagination(req.query);
    const filter = {
      $or: [{ homeTeamId: req.params.teamId }, { awayTeamId: req.params.teamId }],
    };

    if (req.query.season) filter.season = Number(req.query.season);

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

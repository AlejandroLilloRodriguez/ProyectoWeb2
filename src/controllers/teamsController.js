const Team = require('../models/Team');
const Player = require('../models/Player');
const Game = require('../models/Game');

exports.listTeams = async (req, res, next) => {
  try {
    const { conference, division, city, name } = req.query;
    const filter = {};
    if (conference) filter.conference = conference;
    if (division) filter.division = division;
    if (city) filter.city = new RegExp(city, 'i');
    if (name) filter.name = new RegExp(name, 'i');

    const teams = await Team.find(filter);
    res.json(teams);
  } catch (err) { next(err); }
};

exports.createTeam = async (req, res, next) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json(team);
  } catch (err) { next(err); }
};

exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Team no encontrado' } });
    }
    res.json(team);
  } catch (err) { next(err); }
};

exports.replaceTeam = async (req, res, next) => {
  try {
    // findOneAndReplace sobreescribe todo el documento
    const team = await Team.findOneAndReplace({ _id: req.params.teamId }, req.body, { new: true, runValidators: true });
    if (!team) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Team no encontrado' } });
    }
    res.json(team);
  } catch (err) { next(err); }
};

exports.patchTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.teamId, req.body, { new: true, runValidators: true });
    if (!team) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Team no encontrado' } });
    }
    res.json(team);
  } catch (err) { next(err); }
};

exports.deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.teamId);
    if (!team) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Team no encontrado' } });
    }
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.listPlayersByTeam = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { teamId: req.params.teamId };

    const [data, totalItems] = await Promise.all([
      Player.find(filter).skip(skip).limit(limit),
      Player.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage:     page < totalPages,
        hasPreviousPage: page > 1,
      }
    });
  } catch (err) { next(err); }
};

exports.listGamesByTeam = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { $or: [{ homeTeamId: req.params.teamId }, { awayTeamId: req.params.teamId }] };

    const [data, totalItems] = await Promise.all([
      Game.find(filter).skip(skip).limit(limit),
      Game.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage:     page < totalPages,
        hasPreviousPage: page > 1,
      }
    });
  } catch (err) { next(err); }
};

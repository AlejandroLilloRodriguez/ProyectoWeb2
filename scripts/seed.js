require('dotenv').config();
const mongoose = require('mongoose');
const Team   = require('../src/models/Team');
const Player = require('../src/models/Player');
const Game   = require('../src/models/Game');
const teamsData   = require('../data/teams.json');
const playersData = require('../data/players.json');
const gamesData   = require('../data/games.json');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nba-api';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  await Team.deleteMany({});
  await Player.deleteMany({});
  await Game.deleteMany({});
  console.log('Colecciones limpiadas');

  const insertedTeams = await Team.insertMany(teamsData);
  const teamMap = {};
  const teamDocMap = {};
  insertedTeams.forEach((t, i) => {
    const kaggleId = teamsData[i]._kaggleId;
    if (kaggleId) {
      teamMap[String(kaggleId)] = t._id;
      teamDocMap[String(kaggleId)] = t;
    }
  });
  console.log(`Teams insertados: ${insertedTeams.length}`);

  const defaultTeamId = insertedTeams[0]._id;
  const playersToInsert = playersData.map(p => ({
    firstName:  p.firstName,
    lastName:   p.lastName,
    fullName:   p.fullName,
    position:   p.position,
    active:     p.active,
    debutYear:  p.debutYear,
    teamId:     teamMap[String(p._kaggleTeamId)] || defaultTeamId,
  }));
  const insertedPlayers = await Player.insertMany(playersToInsert, { ordered: false });
  console.log(`Players insertados: ${insertedPlayers.length}`);

  const gamesToInsert = gamesData
    .filter(g => teamMap[String(g._kaggleHomeTeamId)] && teamMap[String(g._kaggleAwayTeamId)])
    .map(g => {
      const homeId  = teamMap[String(g._kaggleHomeTeamId)];
      const awayId  = teamMap[String(g._kaggleAwayTeamId)];
      const homeTeam = teamDocMap[String(g._kaggleHomeTeamId)];
      const winnerId = g._kaggleWinnerHome ? homeId : awayId;
      return {
        season:       g.season || 2000,
        date:         new Date(g.date || '2000-01-01'),
        status:       'finished',
        phase:        g.phase || 'regular',
        homeTeamId:   homeId,
        awayTeamId:   awayId,
        homeScore:    g.homeScore,
        awayScore:    g.awayScore,
        winnerTeamId: winnerId,
        arena:        g.arena,
        city:         homeTeam?.city,
      };
    });
  const insertedGames = await Game.insertMany(gamesToInsert, { ordered: false });
  console.log(`Games insertados: ${insertedGames.length}`);

  await mongoose.disconnect();
  console.log('Seed completado.');
}

seed().catch(err => { console.error(err); process.exit(1); });

const { Schema, model, Types } = require('mongoose');

const gameSchema = new Schema({
  season:       { type: Number, required: true },
  date:         { type: Date, required: true },
  status:       { type: String, required: true, enum: ['scheduled', 'live', 'finished'], default: 'scheduled' },
  phase:        { type: String, required: true, enum: ['preseason', 'regular', 'playoff'], default: 'regular' },
  homeTeamId:   { type: Types.ObjectId, ref: 'Team', required: true },
  awayTeamId:   { type: Types.ObjectId, ref: 'Team', required: true },
  homeScore:    { type: Number },
  awayScore:    { type: Number },
  winnerTeamId: { type: Types.ObjectId, ref: 'Team' },
  arena:        { type: String },
  city:         { type: String },
  attendance:   { type: Number },
  externalSource: {
    provider:   String,
    externalId: String,
    syncedAt:   Date,
  },
});

module.exports = model('Game', gameSchema);

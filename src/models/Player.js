const { Schema, model, Types } = require('mongoose');

const playerSchema = new Schema({
  firstName:   { type: String, required: true },
  lastName:    { type: String, required: true },
  fullName:    { type: String, required: true },
  position:    { type: String },
  teamId:      { type: Types.ObjectId, ref: 'Team', required: true },
  heightCm:    { type: Number },
  weightKg:    { type: Number },
  jerseyNumber:{ type: Number },
  active:      { type: Boolean, required: true, default: true },
  debutYear:   { type: Number },
});

module.exports = model('Player', playerSchema);

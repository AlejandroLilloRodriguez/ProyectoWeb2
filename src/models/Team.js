const { Schema, model } = require('mongoose');

const teamSchema = new Schema({
  name:         { type: String, required: true },
  city:         { type: String, required: true },
  abbreviation: { type: String, required: true, unique: true, uppercase: true },
  conference:   { type: String, required: true, enum: ['East', 'West'] },
  division:     { type: String, required: true },
  foundedYear:  { type: Number },
  venue:        { type: String },
});

module.exports = model('Team', teamSchema);

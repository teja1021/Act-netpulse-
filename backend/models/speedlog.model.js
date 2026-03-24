'use strict';
const { Schema, model } = require('mongoose');

const speedLogSchema = new Schema({
  userId:         { type: String, required: true, uppercase: true },
  download:       { type: Number, required: true },
  upload:         { type: Number, required: true },
  latency:        { type: Number, required: true },
  category:       { type: String, enum: ['Best','Good','Average','Poor'], required: true },
  planPercentage: { type: Number, required: true },
  planDownload:   { type: Number, required: true },
  planUpload:     { type: Number, required: true }
}, { timestamps: true });

speedLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = model('SpeedLog', speedLogSchema);

'use strict';
const { Schema, model } = require('mongoose');

const planSchema = new Schema({
  name:     { type: String, required: true },
  download: { type: Number, required: true },
  upload:   { type: Number, required: true },
  isp:      { type: String, required: true },
  city:     { type: String, default: 'Bengaluru' }
}, { _id: false });

const userSchema = new Schema({
  userId:   { type: String, required: true, unique: true, uppercase: true, trim: true },
  password: { type: String, required: true },
  name:     { type: String, required: true, trim: true },
  email:    { type: String, default: '' },
  plan:     { type: planSchema, required: true }
}, { timestamps: true });

module.exports = model('User', userSchema);

'use strict';
const r = require('express').Router();
const c = require('../controllers/speed.controller');
r.get('/ping',     c.ping);
r.get('/download', c.download);
r.post('/upload',  c.upload);
module.exports = r;

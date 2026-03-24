'use strict';
const r    = require('express').Router();
const auth = require('../middleware/auth.middleware');
const c    = require('../controllers/log.controller');
r.post('/',              auth, c.saveLog);
r.get('/:userId',        auth, c.getLogs);
r.delete('/:id',         auth, c.deleteLog);
module.exports = r;

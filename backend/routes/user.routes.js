'use strict';
const r    = require('express').Router();
const auth = require('../middleware/auth.middleware');
const c    = require('../controllers/user.controller');
r.get('/:id', auth, c.getUser);
r.put('/:id', auth, c.updateUser);
module.exports = r;

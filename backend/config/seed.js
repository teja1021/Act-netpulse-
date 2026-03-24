'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./database');
const User = require('../models/user.model');

const USERS = [
  {
    userId: 'ACT123',
    password: '1234',
    name: 'Teja',
    email: 'teja@actcorp.in',
    plan: {
      name: 'ACT Basic Bonanza',
      download: 50,
      upload: 50,
      isp: 'ACT Fibernet',
      city: 'Bengaluru'
    }
  },
  {
    userId: 'ACT456',
    password: '1234',
    name: 'Priya',
    email: 'priya@actcorp.in',
    plan: {
      name: 'ACT Sprint Bonanza',
      download: 200,
      upload: 200,
      isp: 'ACT Fibernet',
      city: 'Hyderabad'
    }
  },
  {
    userId: 'ACT789',
    password: '1234',
    name: 'Kiran',
    email: 'kiran@actcorp.in',
    plan: {
      name: 'ACT Ultra',
      download: 500,
      upload: 500,
      isp: 'ACT Fibernet',
      city: 'Chennai'
    }
  }
];

(async () => {
  await connectDB();
  await User.deleteMany({});
  console.log('🗑️  Cleared existing users\n');
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await new User({ ...u, password: hash }).save();
    console.log(`  ✅  ${u.userId}  |  ${u.plan.name}  |  ${u.plan.download} Mbps`);
  }
  console.log('\n🌱 Seed done.');
  console.log('   ACT123 / 1234  →  ACT Basic Bonanza   (50 Mbps)');
  console.log('   ACT456 / 1234  →  ACT Sprint Bonanza  (200 Mbps)');
  console.log('   ACT789 / 1234  →  ACT Ultra           (500 Mbps)');
  await mongoose.disconnect();
})();
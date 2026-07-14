/**
 * One-time admin seed for Render / local.
 * Usage:
 *   node seed-admin.js
 * Optional env overrides:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROLE
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  const name = process.env.ADMIN_NAME || 'Super Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@internportal.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const role = process.env.ADMIN_ROLE || 'superadmin';

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email });
  if (user) {
    user.role = role;
    user.isApproved = true;
    user.isBlocked = false;
    user.password = password;
    await user.save();
    console.log('Updated existing user to', role);
  } else {
    user = await User.create({
      name,
      email,
      password,
      role,
      isApproved: true
    });
    console.log('Created', role);
  }

  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Role:', role);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Intern Portal - Access Code CLI Manager
 * Usage: node admin-cli.js [command] [options]
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');
const AccessCode = require('./models/AccessCode');
require('dotenv').config();

const commands = {
  'generate': 'Generate access code for user',
  'list': 'List all access codes',
  'status': 'Check code status',
  'revoke': 'Revoke/block a code',
  'check-user': 'Find user by email',
  'help': 'Show this help message'
};

// Connect to MongoDB
async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Generate access code
async function generateCode(email, days = 30) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`✗ User not found: ${email}`);
      return;
    }

    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const accessCode = await AccessCode.create({
      code: formattedCode,
      userId: user._id,
      expiresAt: expiryDate,
      maxUses: 1,
      purpose: 'Intern Portal'
    });

    console.log('\n✓ Access Code Generated Successfully\n');
    console.log('───────────────────────────────────────');
    console.log(`User: ${user.name} (${email})`);
    console.log(`Code: ${formattedCode}`);
    console.log(`Expires: ${expiryDate.toDateString()}`);
    console.log(`Days: ${days}`);
    console.log('───────────────────────────────────────');
    console.log('\n⚠ Send this code privately to the user (secure channel)');
    console.log('   Do NOT share via email without encryption\n');

    return accessCode;
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// List all codes
async function listCodes(active = true) {
  try {
    const filter = active ? { isActive: true } : {};
    const codes = await AccessCode.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    if (codes.length === 0) {
      console.log(`\n✓ No ${active ? 'active' : 'codes'} found\n`);
      return;
    }

    console.log(`\n╔${'═'.repeat(80)}╗`);
    console.log(`║ ${active ? 'ACTIVE ACCESS CODES' : 'ALL ACCESS CODES'}`.padEnd(81) + '║');
    console.log(`╚${'═'.repeat(80)}╝\n`);

    codes.forEach((code, idx) => {
      const expired = new Date() > code.expiresAt;
      const status = code.isActive ? '✓' : '✗';
      
      console.log(`${idx + 1}. ${status} ${code.code}`);
      console.log(`   User: ${code.userId.name} (${code.userId.email})`);
      console.log(`   Uses: ${code.uses}/${code.maxUses}`);
      console.log(`   Expires: ${code.expiresAt.toDateString()} ${expired ? '(EXPIRED)' : ''}`);
      console.log(`   Created: ${code.createdAt.toDateString()}`);
      if (code.unauthorizedAttempts.length > 0) {
        console.log(`   ⚠ Unauthorized attempts: ${code.unauthorizedAttempts.length}`);
      }
      console.log();
    });

  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// Check code status
async function checkStatus(codeToFind) {
  try {
    const accessCode = await AccessCode.findOne({ 
      code: codeToFind.toUpperCase() 
    }).populate('userId', 'name email');

    if (!accessCode) {
      console.error(`✗ Code not found: ${codeToFind}`);
      return;
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('ACCESS CODE STATUS');
    console.log('═'.repeat(60));
    
    console.log(`\nCode: ${accessCode.code}`);
    console.log(`User: ${accessCode.userId.name} (${accessCode.userId.email})`);
    console.log(`Status: ${accessCode.isActive ? '✓ ACTIVE' : '✗ REVOKED'}`);
    console.log(`Created: ${accessCode.createdAt.toDateString()}`);
    console.log(`Expires: ${accessCode.expiresAt.toDateString()}`);
    
    const expired = new Date() > accessCode.expiresAt;
    console.log(`Expiration: ${expired ? '✗ EXPIRED' : '✓ Valid'}`);
    
    console.log(`\nUsage Statistics:`);
    console.log(`  Total Uses: ${accessCode.uses}/${accessCode.maxUses}`);
    console.log(`  Last Used: ${accessCode.lastUsedAt ? accessCode.lastUsedAt.toLocaleString() : 'Never'}`);
    console.log(`  Device Fingerprint: ${accessCode.deviceFingerprint ? '✓ Locked' : '✗ Not used yet'}`);
    
    if (accessCode.unauthorizedAttempts.length > 0) {
      console.log(`\n⚠ Unauthorized Attempts: ${accessCode.unauthorizedAttempts.length}`);
      accessCode.unauthorizedAttempts.slice(-5).forEach((attempt, idx) => {
        console.log(`  ${idx + 1}. IP: ${attempt.ip} - ${attempt.timestamp.toLocaleString()}`);
      });
    }

    if (accessCode.accessHistory.length > 0) {
      console.log(`\nRecent Access (last 5):`);
      accessCode.accessHistory.slice(-5).reverse().forEach((access, idx) => {
        console.log(`  ${idx + 1}. IP: ${access.ip}`);
        console.log(`     ${access.timestamp.toLocaleString()}`);
      });
    }
    
    console.log(`\n${'═'.repeat(60)}\n`);

  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// Revoke code
async function revokeCode(codeToRevoke) {
  try {
    const accessCode = await AccessCode.findOneAndUpdate(
      { code: codeToRevoke.toUpperCase() },
      { isActive: false, revokedAt: new Date() },
      { new: true }
    ).populate('userId', 'name email');

    if (!accessCode) {
      console.error(`✗ Code not found: ${codeToRevoke}`);
      return;
    }

    console.log('\n✓ Code Revoked Successfully\n');
    console.log('───────────────────────────────────────');
    console.log(`Code: ${accessCode.code}`);
    console.log(`User: ${accessCode.userId.name}`);
    console.log(`Revoked: ${new Date().toLocaleString()}`);
    console.log('───────────────────────────────────────\n');
    console.log('This code will no longer work.\n');

  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// Check user
async function checkUser(email) {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`✗ User not found: ${email}`);
      return;
    }

    const codes = await AccessCode.find({ userId: user._id }).sort({ createdAt: -1 });

    console.log(`\n${'═'.repeat(60)}`);
    console.log('USER INFORMATION');
    console.log('═'.repeat(60));
    
    console.log(`\nName: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Joined: ${user.createdAt.toDateString()}`);
    
    console.log(`\nAssigned Codes: ${codes.length}`);
    codes.forEach((code, idx) => {
      const expired = new Date() > code.expiresAt;
      console.log(`  ${idx + 1}. ${code.code} - ${code.isActive && !expired ? '✓ Active' : '✗ Inactive'}`);
    });
    
    console.log(`\n${'═'.repeat(60)}\n`);

  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

// Help
function showHelp() {
  console.log(`\n╔${'═'.repeat(60)}╗`);
  console.log(`║ Intern Portal - Access Code Manager`.padEnd(61) + '║');
  console.log(`╚${'═'.repeat(60)}╝\n`);

  console.log('Commands:\n');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(15)} - ${desc}`);
  });

  console.log('\nExamples:\n');
  console.log('  node admin-cli.js generate intern@example.com');
  console.log('  node admin-cli.js generate intern@example.com 60  (60 days)');
  console.log('  node admin-cli.js list');
  console.log('  node admin-cli.js status A3F2-B8K1-L9M4');
  console.log('  node admin-cli.js revoke A3F2-B8K1-L9M4');
  console.log('  node admin-cli.js check-user intern@example.com');
  console.log('\n');
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    showHelp();
    process.exit(0);
  }

  await connect();

  switch (command) {
    case 'generate':
      if (!args[1]) {
        console.error('✗ Usage: node admin-cli.js generate <email> [days]');
        process.exit(1);
      }
      await generateCode(args[1], parseInt(args[2]) || 30);
      break;

    case 'list':
      await listCodes(true);
      break;

    case 'status':
      if (!args[1]) {
        console.error('✗ Usage: node admin-cli.js status <code>');
        process.exit(1);
      }
      await checkStatus(args[1]);
      break;

    case 'revoke':
      if (!args[1]) {
        console.error('✗ Usage: node admin-cli.js revoke <code>');
        process.exit(1);
      }
      await revokeCode(args[1]);
      break;

    case 'check-user':
      if (!args[1]) {
        console.error('✗ Usage: node admin-cli.js check-user <email>');
        process.exit(1);
      }
      await checkUser(args[1]);
      break;

    default:
      console.error(`✗ Unknown command: ${command}`);
      console.log('Run "node admin-cli.js help" for available commands');
      process.exit(1);
  }

  mongoose.connection.close();
}

main().catch(error => {
  console.error('✗ Fatal error:', error);
  process.exit(1);
});

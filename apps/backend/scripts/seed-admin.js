/**
 * Admin User Seed Script
 * 
 * Creates and manages test admin users for development and testing.
 * 
 * Usage:
 *   node scripts/seed-admin.js --create    # Create test admin
 *   node scripts/seed-admin.js --delete    # Delete test admin
 *   node scripts/seed-admin.js --promote   # Promote existing user to admin
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import User model (adjust path as needed)
import User from '../src/modules/user/user.model.js';

// ============ CONFIGURATION ============
const TEST_ADMIN = {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@barbie.test',
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
    name: 'Test Admin',
    role: 'admin',
    defaultCurrency: 'USD',
};

// ============ DATABASE CONNECTION ============
async function connectDB() {
    try {
        const dbUri = process.env.DB_URI || 'mongodb://localhost:27017/barbie_test';
        await mongoose.connect(dbUri);
        console.log('✅ Connected to database');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

async function disconnectDB() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
}

// ============ SEED FUNCTIONS ============

/**
 * Create a test admin user
 */
async function createTestAdmin() {
    console.log('\n=== CREATING TEST ADMIN ===');

    // Check if admin already exists
    const existing = await User.findOne({ email: TEST_ADMIN.email });
    if (existing) {
        console.log(`⚠️  Admin user already exists: ${TEST_ADMIN.email}`);
        console.log(`   ID: ${existing._id}`);
        console.log(`   Role: ${existing.role}`);
        return existing;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_ADMIN.password, 10);

    // Create admin user
    const admin = await User.create({
        name: TEST_ADMIN.name,
        email: TEST_ADMIN.email,
        password: hashedPassword,
        role: TEST_ADMIN.role,
        defaultCurrency: TEST_ADMIN.defaultCurrency,
    });

    console.log('✅ Test admin created successfully!');
    console.log(`   ID: ${admin._id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${TEST_ADMIN.password}`);
    console.log('\n   🔑 Use these credentials to log in at /admin/login');

    // === DATABASE VERIFICATION ===
    const verification = await User.findById(admin._id);
    if (verification && verification.role === 'admin') {
        console.log('\n✅ DATABASE VERIFICATION: Admin user confirmed in database');
    } else {
        console.log('\n❌ DATABASE VERIFICATION: Failed to verify admin user');
    }

    return admin;
}

/**
 * Delete the test admin user and verify cleanup
 */
async function deleteTestAdmin() {
    console.log('\n=== DELETING TEST ADMIN ===');

    const admin = await User.findOne({ email: TEST_ADMIN.email });
    if (!admin) {
        console.log(`⚠️  No admin user found with email: ${TEST_ADMIN.email}`);
        return;
    }

    const adminId = admin._id;

    // Delete the admin user
    await User.findByIdAndDelete(adminId);
    console.log(`✅ Deleted admin user: ${TEST_ADMIN.email}`);

    // === DATABASE VERIFICATION ===
    const verification = await User.findById(adminId);
    if (!verification) {
        console.log('✅ DATABASE VERIFICATION: Admin user successfully removed from database');
    } else {
        console.log('❌ DATABASE VERIFICATION: Admin user still exists in database!');
    }
}

/**
 * Promote an existing user to admin role
 */
async function promoteToAdmin(email) {
    console.log(`\n=== PROMOTING USER TO ADMIN: ${email} ===`);

    const user = await User.findOne({ email });
    if (!user) {
        console.log(`❌ User not found: ${email}`);
        return;
    }

    if (user.role === 'admin') {
        console.log(`⚠️  User is already an admin: ${email}`);
        return user;
    }

    // Store previous role for logging
    const previousRole = user.role;

    // Update role
    const updated = await User.findByIdAndUpdate(
        user._id,
        { role: 'admin' },
        { new: true }
    );

    console.log(`✅ User promoted to admin!`);
    console.log(`   Email: ${email}`);
    console.log(`   Previous role: ${previousRole}`);
    console.log(`   New role: ${updated.role}`);

    // === DATABASE VERIFICATION ===
    const verification = await User.findById(user._id);
    if (verification && verification.role === 'admin') {
        console.log('\n✅ DATABASE VERIFICATION: Role change confirmed in database');
    } else {
        console.log('\n❌ DATABASE VERIFICATION: Role change not reflected in database');
    }

    return updated;
}

/**
 * Demote an admin back to regular user
 */
async function demoteFromAdmin(email) {
    console.log(`\n=== DEMOTING ADMIN TO USER: ${email} ===`);

    const user = await User.findOne({ email });
    if (!user) {
        console.log(`❌ User not found: ${email}`);
        return;
    }

    if (user.role !== 'admin') {
        console.log(`⚠️  User is not an admin: ${email}`);
        return user;
    }

    const updated = await User.findByIdAndUpdate(
        user._id,
        { role: 'user' },
        { new: true }
    );

    console.log(`✅ Admin demoted to user!`);
    console.log(`   Email: ${email}`);
    console.log(`   New role: ${updated.role}`);

    // === DATABASE VERIFICATION ===
    const verification = await User.findById(user._id);
    if (verification && verification.role === 'user') {
        console.log('\n✅ DATABASE VERIFICATION: Demotion confirmed in database');
    } else {
        console.log('\n❌ DATABASE VERIFICATION: Demotion not reflected in database');
    }

    return updated;
}

/**
 * List all admin users
 */
async function listAdmins() {
    console.log('\n=== LISTING ALL ADMIN USERS ===');

    const admins = await User.find({ role: 'admin' }).select('name email createdAt');

    if (admins.length === 0) {
        console.log('No admin users found');
        return;
    }

    console.log(`Found ${admins.length} admin user(s):\n`);
    admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   ID: ${admin._id}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('');
    });
}

// ============ MAIN ============
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const extraArg = args[1];

    await connectDB();

    try {
        switch (command) {
            case '--create':
                await createTestAdmin();
                break;

            case '--delete':
                await deleteTestAdmin();
                break;

            case '--promote':
                if (!extraArg) {
                    console.log('Usage: node seed-admin.js --promote <email>');
                    break;
                }
                await promoteToAdmin(extraArg);
                break;

            case '--demote':
                if (!extraArg) {
                    console.log('Usage: node seed-admin.js --demote <email>');
                    break;
                }
                await demoteFromAdmin(extraArg);
                break;

            case '--list':
                await listAdmins();
                break;

            default:
                console.log(`
Admin User Seed Script
======================

Usage:
  node scripts/seed-admin.js --create              Create test admin user
  node scripts/seed-admin.js --delete              Delete test admin user
  node scripts/seed-admin.js --promote <email>     Promote user to admin
  node scripts/seed-admin.js --demote <email>      Demote admin to user
  node scripts/seed-admin.js --list                List all admin users

Environment Variables:
  TEST_ADMIN_EMAIL     Email for test admin (default: admin@barbie.test)
  TEST_ADMIN_PASSWORD  Password for test admin (default: AdminPassword123!)
  DB_URI               MongoDB connection string
                `);
        }
    } finally {
        await disconnectDB();
    }
}

main().catch(console.error);

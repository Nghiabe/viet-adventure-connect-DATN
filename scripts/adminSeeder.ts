/* eslint-disable no-console */
import { fileURLToPath } from 'url';
import path from 'path';

// Ensure TS path aliases resolve when running via ts-node
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import mongoose from 'mongoose';
import dbConnect from '../src/lib/dbConnect.js';
import User from '../src/models/User.js';

async function createSuperAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await dbConnect();
    
    console.log('🔍 Checking if Super Admin already exists...');
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Super Admin already exists with email: admin@gmail.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
      return;
    }
    
    console.log('👤 Creating Super Admin...');
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin',
    });
    
    await superAdmin.save();
    
    console.log('✅ Super Admin created successfully!');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
createSuperAdmin();

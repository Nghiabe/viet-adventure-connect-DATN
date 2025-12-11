/* eslint-disable no-console */
import dbConnect from '../src/lib/dbConnect.js';
import User from '../src/models/User.js';

async function run() {
  try {
    await dbConnect();
    const upsert = await User.findOneAndUpdate(
      { email: 'admin@gmail.com' },
      { name: 'Super Admin', email: 'admin@gmail.com', password: 'admin123', role: 'admin', status: 'active' },
      { upsert: true, new: true }
    );
    console.log('Super Admin ensured:', upsert.email);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

run();































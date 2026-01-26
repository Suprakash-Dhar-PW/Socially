import { db } from '../config/db.js';

const migrate = async () => {
  try {
    console.log('Checking for missing columns...');

    // check if avatar_url exists
    const [columns] = await db.query(`SHOW COLUMNS FROM users LIKE 'avatar_url'`);
    if (columns.length === 0) {
      console.log('Adding avatar_url column...');
      await db.query(`ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512)`);
    } else {
      console.log('avatar_url exists.');
    }

    // check if bio exists
    const [bioCols] = await db.query(`SHOW COLUMNS FROM users LIKE 'bio'`);
    if (bioCols.length === 0) {
      console.log('Adding bio column...');
      await db.query(`ALTER TABLE users ADD COLUMN bio VARCHAR(500)`);
    } else {
      console.log('bio exists.');
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();

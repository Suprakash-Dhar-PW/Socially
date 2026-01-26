import { db } from '../config/db.js';

const migrate = async () => {
  try {
    console.log('Running Profile Fields Migration...');

    // Define the columns we want to add
    const newColumns = [
      { name: 'username', def: 'VARCHAR(100) UNIQUE' },
      { name: 'batch_year', def: 'INT' },
      { name: 'campus', def: "ENUM('Bengaluru', 'Lucknow', 'Pune', 'Noida', 'Indore', 'Patna')" },
      { name: 'department', def: "ENUM('SOT', 'SOM', 'SOH')" }
    ];

    for (const col of newColumns) {
      const [exists] = await db.query(`SHOW COLUMNS FROM users LIKE ?`, [col.name]);
      if (exists.length === 0) {
        console.log(`Adding ${col.name}...`);
        await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      } else {
        console.log(`${col.name} already exists.`);
      }
    }

    console.log('Profile Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();

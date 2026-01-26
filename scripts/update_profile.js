import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

import { db } from '../backend/src/config/db.js';

const updateUser = async () => {
  try {
    // Just update user ID 1 for now (assuming you are user 1)
    const userId = 1;

    await db.query(`
            UPDATE users 
            SET batch = '2024', campus = 'Bengaluru', branch = 'School of Technology' 
            WHERE id = ?
        `, [userId]);

    console.log("Updated user 1 with batch 2024, Bengaluru, SOT");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateUser();

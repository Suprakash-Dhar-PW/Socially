import { db } from '../config/db.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const [users] = await db.query(
      'SELECT id, name, username, email, role, avatar_url, bio, batch_year, campus, department, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    next(err);
  }
};

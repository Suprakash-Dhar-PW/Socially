import { db } from '../config/db.js';

export const createReport = async (req, res, next) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const reporterId = req.user.id;

  if (!reason) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO reports (reporter_id, post_id, reason, status) VALUES (?, ?, ?, ?)',
      [reporterId, postId, reason, 'pending']
    );

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: result.insertId,
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ error: 'Post or user not found' });
    }
    next(err);
  }
};

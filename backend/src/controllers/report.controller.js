import { db } from '../config/db.js';

export const createReport = async (req, res, next) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const reporterId = req.user.id;

  if (!reason) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    const { data, error } = await db
      .from('reports')
      .insert([{
        reporter_id: reporterId,
        post_id: postId,
        reason,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23503') { // Foreign key violation
        return res.status(404).json({ error: 'Post or user not found' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: data.id,
    });
  } catch (err) {
    next(err);
  }
};

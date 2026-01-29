import { db } from '../config/db.js';

export const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const { data: existing, error: fetchError } = await db
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      // Unlike
      const { error } = await db
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
      return res.status(200).json({ liked: false });
    } else {
      // Like
      const { error } = await db
        .from('likes')
        .insert([{ post_id: postId, user_id: userId }]);

      if (error) throw error;
      return res.status(201).json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
};

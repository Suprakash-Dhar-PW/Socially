import { db } from '../config/db.js';

export const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const { data, error } = await db
      .from('comments')
      .insert([{
        post_id: postId,
        user_id: userId,
        text,
        parent_id: parentId || null
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Comment added',
      commentId: data.id
    });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const { data: comments, error } = await db
      .from('comments')
      .select(`
        id, text, parent_id, created_at, user_id,
        user:user_id (name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedComments = comments.map(c => ({
      ...c,
      name: c.user.name,
      avatar_url: c.user.avatar_url
    }));

    res.json(formattedComments);
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    // Check ownership
    const { data: existing, error: fetchError } = await db
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Comment not found' });

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await db
      .from('comments')
      .update({ text })
      .eq('id', commentId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Comment updated' });

  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const { data: existing, error: fetchError } = await db
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Comment not found' });

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await db
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Comment deleted' });

  } catch (err) {
    next(err);
  }
};

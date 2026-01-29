import { db } from '../config/db.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const { data: user, error } = await db
      .from('users')
      .select(`
        id, name, username, email, role, avatar_url, bio, batch, campus, branch, created_at,
        posts:posts(count)
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format to match old output
    const formattedUser = {
      ...user,
      post_count: user.posts[0]?.count || 0
    };
    delete formattedUser.posts;

    res.json(formattedUser);
  } catch (err) {
    next(err);
  }
};

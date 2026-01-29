import { db } from '../config/db.js';

/**
 * CREATE POST
 * POST /api/posts
 */
// CREATE POST
// CREATE POST
export const createPost = async (req, res, next) => {
  try {
    let {
      content,
      visibility,
      category,
      target_batches,
      target_campuses,
      target_branches
    } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: 'Post content is too short' });
    }

    let image_url = null;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      image_url = `${protocol}://${host}/uploads/posts/${req.file.filename}`;
    }

    const { data, error } = await db
      .from('posts')
      .insert([{
        user_id: userId,
        content,
        image_url,
        visibility: visibility || 'campus',
        category: category || 'general',
        target_batches: Array.isArray(target_batches) ? target_batches : JSON.parse(target_batches || '[]'),
        target_campuses: Array.isArray(target_campuses) ? target_campuses : JSON.parse(target_campuses || '[]'),
        target_branches: Array.isArray(target_branches) ? target_branches : JSON.parse(target_branches || '[]')
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Post created',
      postId: data.id,
      image_url
    });
  } catch (err) {
    next(err);
  }
};

// GET FEED
export const getFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || new Date().toISOString();

    const { data: currentUser, error: userError } = await db
      .from('users')
      .select('batch, campus, branch')
      .eq('id', currentUserId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    const { batch, campus, branch } = currentUser || { batch: null, campus: null, branch: null };

    let query = db
      .from('posts')
      .select(`
        id, content, image_url, visibility, category, created_at,
        target_batches, target_campuses, target_branches,
        user_id,
        user:user_id (name, avatar_url),
        likes:likes (count),
        is_liked:likes!is_liked (count),
        comments:comments (count)
      `)
      .lt('created_at', cursor)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply visibility/target filters
    // This is a simplified version; complex OR filters in PostgREST can be tricky
    // but we can use the .or() filter.
    query = query.or(`user_id.eq.${currentUserId},visibility.eq.public,and(visibility.eq.campus)`);

    const { data: posts, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedPosts = posts.map(p => ({
      id: p.id,
      content: p.content,
      image_url: p.image_url,
      visibility: p.visibility,
      category: p.category,
      created_at: p.created_at,
      user_id: p.user_id,
      user_name: p.user?.name,
      avatar_url: p.user?.avatar_url,
      like_count: p.likes[0]?.count || 0,
      is_liked: (p.is_liked[0]?.count || 0) > 0,
      comment_count: p.comments[0]?.count || 0
    }));

    res.json({
      data: formattedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].created_at : null
    });
  } catch (err) {
    next(err);
  }
};

// GET USER POSTS
export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { data: posts, error } = await db
      .from('posts')
      .select(`
        id, content, image_url, visibility, category, created_at,
        user:user_id (name, avatar_url),
        likes:likes (count),
        is_liked:likes!is_liked (count),
        comments:comments (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedPosts = posts.map(p => ({
      ...p,
      user_name: p.user?.name,
      avatar_url: p.user?.avatar_url,
      like_count: p.likes[0]?.count || 0,
      is_liked: (p.is_liked[0]?.count || 0) > 0,
      comment_count: p.comments[0]?.count || 0
    }));

    res.json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

// DELETE POST
export const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data: post, error: fetchError } = await db
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await db.from('posts').delete().eq('id', postId);
    if (error) throw error;

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

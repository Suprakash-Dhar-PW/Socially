import { db } from '../config/db.js';

/**
 * CREATE POST
 * POST /api/posts
 */
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

    // Handle Image Upload
    let image_url = null;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      image_url = `${protocol}://${host}/uploads/posts/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const parseField = (field) => {
      if (!field || field === 'null' || field === 'undefined') return null;
      try {
        return typeof field === 'string' ? JSON.parse(field) : field;
      } catch (e) {
        return field;
      }
    };

    const { data, error } = await db
      .from('posts')
      .insert([{
        user_id: userId,
        content,
        image_url,
        visibility: visibility || 'campus',
        category: category || 'general',
        target_batches: parseField(target_batches),
        target_campuses: parseField(target_campuses),
        target_branches: parseField(target_branches)
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

/**
 * GET FEED
 * Supports Cursor-based Pagination
 */
export const getFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor ? new Date(req.query.cursor).toISOString() : new Date(Date.now() + 10000).toISOString();

    // Fetch user details for filtering
    const { data: currentUser, error: userError } = await db
      .from('users')
      .select('batch, campus, branch')
      .eq('id', currentUserId)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw userError;
    }

    const { batch, campus, branch } = currentUser || {};

    // Supabase PostgREST doesn't support OR across joined tables easily for complex logic.
    // However, we can use the .or() filter with or without raw filters.
    // PostgreSQL equivalent for JSON_CONTAINS(col, val) is col @> val.
    // PostgREST syntax for @> is .contains('col', val).

    let query = db
      .from('posts')
      .select(`
        id, content, image_url, visibility, category, created_at,
        target_batches, target_campuses, target_branches,
        user:user_id (id, name, avatar_url),
        likes:likes(count),
        comments:comments(count),
        is_liked:likes!user_id(count)
      `)
      .lt('created_at', cursor)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtering logic:
    // own posts OR public OR (campus AND (batches is null OR batch matches) AND ...)
    // PostgREST complex ORs are best done with raw filter strings or multiple queries if too complex.
    // For now, let's use a simpler approach or raw filter if supported.

    // Constructing the OR filter
    const visibilityFilter = `user_id.eq.${currentUserId},visibility.eq.public,and(visibility.eq.campus)`;
    // This is getting complicated. Let's use a RPC (Remote Procedure Call) if it were available, 
    // but we'll try to stick to PostgREST.

    // We'll use the .or filter with string syntax for the complex visibility logic.
    const campusLogic = `and(visibility.eq.campus)`; // simplified for now

    query = query.or(`user_id.eq.${currentUserId},visibility.eq.public,visibility.eq.campus`);

    const { data: posts, error } = await query.eq('likes.user_id', currentUserId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Format for frontend
    const formattedPosts = posts.map(p => ({
      ...p,
      user_id: p.user.id,
      user_name: p.user.name,
      avatar_url: p.user.avatar_url,
      like_count: p.likes[0]?.count || 0,
      comment_count: p.comments[0]?.count || 0,
      is_liked: (p.is_liked[0]?.count || 0) > 0
    }));

    res.json({
      data: formattedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].created_at : null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET USER POSTS
 */
export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const { data: posts, error } = await db
      .from('posts')
      .select(`
        id, content, image_url, visibility, category, created_at,
        user:user_id (id, name, avatar_url),
        likes:likes(count),
        comments:comments(count),
        is_liked:likes!user_id(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const formattedPosts = posts.map(p => ({
      ...p,
      user_id: p.user.id,
      user_name: p.user.name,
      avatar_url: p.user.avatar_url,
      like_count: p.likes[0]?.count || 0,
      comment_count: p.comments[0]?.count || 0,
      is_liked: (p.is_liked[0]?.count || 0) > 0
    }));

    res.json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE POST
 */
export const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check post ownership
    const { data: post, error: fetchError } = await db
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Allow deletion if owner or admin
    if (post.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    const { error } = await db
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

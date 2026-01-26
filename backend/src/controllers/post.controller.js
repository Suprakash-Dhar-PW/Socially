import { db } from '../config/db.js';

/**
 * CREATE POST
 * POST /api/posts
 */
// CREATE POST
export const createPost = async (req, res, next) => {
  try {
    const {
      content,
      visibility,
      category,
      image_url,
      target_batches,
      target_campuses,
      target_branches
    } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: 'Post content is too short' });
    }

    const [result] = await db.query(
      `INSERT INTO posts (user_id, content, image_url, visibility, category, target_batches, target_campuses, target_branches)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        content,
        image_url || null,
        visibility || 'campus',
        category || 'general',
        target_batches ? JSON.stringify(target_batches) : null,
        target_campuses ? JSON.stringify(target_campuses) : null,
        target_branches ? JSON.stringify(target_branches) : null
      ]
    );

    res.status(201).json({
      message: 'Post created',
      postId: result.insertId
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET FEED
 * Supports Cursor-based Pagination
 * QUERY: ?cursor=TIMESTAMP_ISO&limit=20
 */
export const getFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    // Add 10 seconds buffer to cursor to handle potential db timestamp vs server time drift or truncation
    const cursor = req.query.cursor ? new Date(req.query.cursor) : new Date(Date.now() + 10000);

    const [userResult] = await db.query('SELECT batch, campus, branch FROM users WHERE id = ?', [currentUserId]);
    const currentUser = userResult[0] || {};

    // Safety fallback
    // We need to pass a JSON-formatted string to JSON_CONTAINS.
    // e.g. if batch is '2024', we need to pass '"2024"'
    const userBatch = currentUser.batch ? JSON.stringify(currentUser.batch) : null;
    const userCampus = currentUser.campus ? JSON.stringify(currentUser.campus) : null;
    const userBranch = currentUser.branch ? JSON.stringify(currentUser.branch) : null;

    const [posts] = await db.query(`
      SELECT 
        posts.id,
        posts.content,
        posts.image_url,
        posts.visibility,
        posts.category,
        posts.created_at,
        posts.target_batches,
        posts.target_campuses,
        posts.target_branches,
        users.id AS user_id,
        users.name AS user_name,
        users.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS like_count,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) AS is_liked,
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.created_at < ?
      AND (
        posts.user_id = ?
        OR posts.visibility = 'public'
        OR (
          posts.visibility = 'campus' 
          AND (
             posts.target_batches IS NULL 
             OR JSON_CONTAINS(posts.target_batches, ?)
          )
          AND (
             posts.target_campuses IS NULL 
             OR JSON_CONTAINS(posts.target_campuses, ?)
          )
          AND (
             posts.target_branches IS NULL 
             OR JSON_CONTAINS(posts.target_branches, ?)
          )
        )
      )
      ORDER BY posts.created_at DESC
      LIMIT ?
    `, [
      currentUserId,
      cursor,
      currentUserId, // for own posts check
      userBatch,
      userCampus,
      userBranch,
      limit
    ]);

    // Format for frontend
    const formattedPosts = posts.map(p => ({
      ...p,
      is_liked: !!p.is_liked // Convert 1/0 to boolean
    }));

    res.json({
      data: formattedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].created_at : null
    });
  } catch (err) {
    next(err);
  }
};

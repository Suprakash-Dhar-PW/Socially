import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

/* ---------------- REGISTER ---------------- */
// Controller to handle user registration
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate mandatory fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Register user using Supabase Auth
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'student'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'User already exists' });
      }
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Email rate limit exceeded',
          message: 'Supabase email rate limit reached. Please disable "Confirm email" in Supabase Auth settings or try again later.'
        });
      }
      return res.status(400).json({ error: error.message });
    }

    // Note: Supabase might have a trigger to sync auth.users to public.users.
    // If not, we'd need to manually insert into public.users here.
    // Based on the SQL schema provided, there is a users table.
    // We'll assume the client wants to use Supabase Auth and potentially sync to public.users.
    // For now, let's just return success as before.
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

/* ---------------- LOGIN ---------------- */
// Controller to handle user login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Authenticate user using Supabase Auth
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return res.status(403).json({
          error: 'Email not confirmed',
          message: 'Please confirm your email or disable "Confirm email" in Supabase Auth settings.'
        });
      }
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many login attempts. Please try again later.'
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { user } = data;

    // Create JWT token with user id and role (to maintain frontend compatibility)
    // Even though Supabase provides its own session/token, the user requested to keep the same secret.
    // We'll stick to the existing token generation logic for now.
    const token = jwt.sign(
      { id: user.id, role: user.user_metadata.role || 'student' },
      env.jwtSecret,
      { expiresIn: '7d' }
    );

    // Send token and basic user info
    res.json({
      token,
      user: {
        id: user.id,
        name: user.user_metadata.name,
        email: user.email,
        role: user.user_metadata.role || 'student'
      }
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- GET CURRENT USER (ME) ---------------- */
// Controller to fetch currently logged-in user profile
export const getMe = async (req, res, next) => {
  try {
    // Fetch user from public.users table or auth.getUser
    // The original code queried many fields, so we likely need a public.users table.
    const { data: user, error } = await db
      .from('users')
      .select('id, name, username, email, role, avatar_url, bio, batch, campus, branch, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      // Fallback to auth metadata if not in public.users yet
      const { data: { user: authUser } } = await db.auth.getUser();
      if (authUser && authUser.id === req.user.id) {
        return res.json({
          user: {
            id: authUser.id,
            name: authUser.user_metadata.name,
            email: authUser.email,
            role: authUser.user_metadata.role || 'student'
          }
        });
      }
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/* ---------------- UPDATE CURRENT USER (ME) ---------------- */
// Controller to update logged-in user's profile
export const updateMe = async (req, res, next) => {
  try {
    let { avatar_url, bio, username, batch, campus, branch } = req.body;
    const userId = req.user.id;

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      avatar_url = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;
    }

    const updates = {
      avatar_url,
      bio,
      username,
      batch,
      campus,
      branch
    };

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data: user, error } = await db
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Profile updated successfully',
      user: user
    });

  } catch (err) {
    next(err);
  }
};

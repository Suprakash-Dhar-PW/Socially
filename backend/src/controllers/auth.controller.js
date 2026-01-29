import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

/* ---------------- REGISTER ---------------- */
/* ---------------- REGISTER ---------------- */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

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

    // MANUAL SYNC: Insert into public.users profile table
    if (data.user) {
      await db.from('users').insert([{
        id: data.user.id,
        name,
        email,
        role: role || 'student'
      }]);
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

/* ---------------- LOGIN ---------------- */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create our app JWT to maintain compatibility with existing middleware
    // We include name and email so the frontend can reconstruct user state even if db fetch fails
    const token = jwt.sign(
      {
        id: data.user.id,
        role: data.user.user_metadata.role || 'student',
        email: data.user.email,
        name: data.user.user_metadata.name
      },
      env.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: data.user.id,
        name: data.user.user_metadata.name,
        email: data.user.email,
        role: data.user.user_metadata.role || 'student'
      }
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- GET CURRENT USER (ME) ---------------- */
export const getMe = async (req, res, next) => {
  try {
    // 1. Try to fetch user from public.users table
    const { data: user, error } = await db
      .from('users')
      .select('id, name, username, email, role, avatar_url, bio, batch, campus, branch, created_at')
      .eq('id', req.user.id)
      .single();

    if (user && !error) {
      return res.json({ user });
    }

    // 2. If record missing or DB error, fallback to JWT data
    console.warn(`Profile for user ${req.user.id} not found in database. Using JWT fallback.`);

    const fallbackUser = {
      id: req.user.id,
      name: req.user.name || 'User',
      email: req.user.email || '',
      role: req.user.role || 'student'
    };

    // 3. Attempt to auto-sync profile in background if it's missing
    if (!user) {
      db.from('users').insert([fallbackUser])
        .then(({ error: syncError }) => {
          if (syncError) console.error('Background sync failed:', syncError.message);
          else console.log('Successfully synced user profile in background');
        })
        .catch(err => console.error('Background sync error:', err));
    }

    res.json({ user: fallbackUser });
  } catch (err) {
    next(err);
  }
};

/* ---------------- UPDATE CURRENT USER (ME) ---------------- */
export const updateMe = async (req, res, next) => {
  try {
    let { avatar_url, bio, username, batch, campus, branch } = req.body;
    const userId = req.user.id;

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      avatar_url = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;
    }

    const { error } = await db
      .from('users')
      .update({ avatar_url, bio, username, batch, campus, branch })
      .eq('id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Profile updated successfully',
      user: { ...req.user, avatar_url, bio, username, batch, campus, branch }
    });
  } catch (err) {
    next(err);
  }
};


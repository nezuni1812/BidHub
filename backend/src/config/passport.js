const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const db = require('./database');

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google Profile:', profile);

        // Extract user data from Google profile
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const fullName = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        // Check if user already exists
        let user = await User.findByEmail(email);

        if (user) {
          // User exists - update Google ID if not set
          if (!user.google_id) {
            const updateQuery = `
              UPDATE users 
              SET google_id = $1, auth_provider = 'google', updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
              RETURNING id, email, full_name, role, is_active
            `;
            const result = await db.query(updateQuery, [googleId, user.id]);
            user = result.rows[0];
          }

          // Check if account is active
          if (!user.is_active) {
            return done(null, false, { message: 'Account is not active' });
          }

          return done(null, user);
        } else {
          // Create new user with Google account
          const createQuery = `
            INSERT INTO users (
              full_name, 
              email, 
              password_hash, 
              google_id, 
              auth_provider,
              is_active,
              role
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, full_name, role, is_active
          `;

          // Use random password hash for Google users (they won't use password login)
          const randomPassword = Math.random().toString(36).slice(-8);
          const bcrypt = require('bcrypt');
          const passwordHash = await bcrypt.hash(randomPassword, 10);

          const result = await db.query(createQuery, [
            fullName,
            email,
            passwordHash,
            googleId,
            'google',
            true, // Auto-activate Google users
            'bidder' // Default role
          ]);

          const newUser = result.rows[0];
          console.log('New Google user created:', newUser.email);

          return done(null, newUser);
        }
      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session (optional - we use JWT)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (optional - we use JWT)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

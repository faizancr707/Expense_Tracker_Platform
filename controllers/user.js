const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const db = require('../util/database');

dotenv.config();

const SibApiV3Sdk = require('sib-api-v3-sdk');

const secretKey = process.env.SECRET_KEY;
if (!secretKey) throw new Error("SECRET_KEY missing in env");

// Brevo setup
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.SIB_KEY;

const emailRegex = /^\S+@\S+\.\S+$/;


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await db.execute(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (existing.length) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO users (first_name, last_name, email, password)
       VALUES (?, ?, ?, ?)`,
      [firstname, lastname, email.toLowerCase(), hashedPassword]
    );

    return res.status(201).json({ message: 'User registered' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.execute(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secretKey,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      token,
      email: user.email,
      isPremiumUser: !!user.is_premium_user
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.execute(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    const resetId = uuidv4();

    // deactivate old tokens
    await db.execute(
      'UPDATE reset_passwords SET is_active = 0 WHERE user_id = ?',
      [user.id]
    );

    // expiry = 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.execute(
      `INSERT INTO reset_passwords (uuid, is_active, user_id, expires_at)
       VALUES (?, 1, ?, ?)`,
      [resetId, user.id, expiresAt]
    );

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: 'Expense App'
      },
      to: [{ email }],
      subject: 'Reset Password',
      htmlContent: `
        <h3>Password Reset</h3>
        <a href="${process.env.BASE_URL}/password/resetPassword/${resetId}">
          Reset Password
        </a>
      `
    });

    return res.status(200).json({ message: 'Reset email sent' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { uniqueId, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password too short' });
    }

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT * FROM reset_passwords 
       WHERE uuid = ? AND is_active = 1 AND expires_at > NOW()`,
      [uniqueId]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid or expired link' });
    }

    const resetEntry = rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, resetEntry.user_id]
    );

    await connection.execute(
      'UPDATE reset_passwords SET is_active = 0 WHERE id = ?',
      [resetEntry.id]
    );

    await connection.commit();

    return res.status(200).json({ message: 'Password reset successful' });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};
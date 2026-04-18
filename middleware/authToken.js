const jwt = require('jsonwebtoken');

exports.authToken = (req, res, next) => {
  try {
    const token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // ✅ FIX HERE
    req.user = decoded;   // NOT req.user.userId

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
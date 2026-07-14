const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const User = require('../models/User');
    const user = await User.findById(decoded.id).select('role tokenVersion');
    if (!user) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }
    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // superadmin passes all role checks
    if (req.user.role === 'superadmin') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to perform this action' });
    }
    next();
  };
};

module.exports = { protect, authorize };

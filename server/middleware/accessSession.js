const requireAccessSession = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Access session required' });
  }

  req.user = { id: req.session.userId };
  next();
};

module.exports = { requireAccessSession };

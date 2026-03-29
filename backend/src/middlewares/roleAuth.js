const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado. Nível de permissão insuficiente.' });
  }
  next();
};

const requireAdmin = checkRole(['admin']);

module.exports = {
  checkRole,
  requireAdmin
};

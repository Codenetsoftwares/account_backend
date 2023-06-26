import jwt from 'jsonwebtoken';

const authenticateToken = (roles) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null)
      return res
        .status(401)
        .json({ status: false, message: 'No token provided' });

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ status: false, message: err.message });
      }
      if (user.role !== roles) {
        return res
          .status(404)
          .json({ status: false, message: 'Permission Denied' });
      }
      req.user = user;
      next();
    });
  };
};

export default authenticateToken;

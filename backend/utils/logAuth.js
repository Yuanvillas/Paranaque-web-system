const crypto = require('crypto');
const User = require('../models/User');

const secret = process.env.JWT_SECRET || process.env.MONGO_URI;
if (!secret) {
  throw new Error('JWT_SECRET must be configured to protect activity log access.');
}

const encode = value => Buffer.from(value).toString('base64url');

const createAccessToken = user => {
  const payload = encode(JSON.stringify({
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60)
  }));
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const authenticateLogRequest = async (req, res, next) => {
  const [payload, signature] = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '').split('.');
  if (!payload || !signature) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims.email || !Number.isFinite(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: 'Authentication token expired' });
    }

    const user = await User.findOne({ email: claims.email }).select('email role').lean();
    if (!user) return res.status(401).json({ message: 'Account not found' });
    req.logUser = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

const requireStaff = (req, res, next) => {
  if (!['admin', 'librarian'].includes(req.logUser?.role)) {
    return res.status(403).json({ message: 'Administrator access required' });
  }
  return next();
};

const requireLogOwnerOrStaff = (req, res, next) => {
  if (req.logUser?.email !== req.params.email && !['admin', 'librarian'].includes(req.logUser?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  return next();
};

module.exports = { createAccessToken, authenticateLogRequest, requireStaff, requireLogOwnerOrStaff };

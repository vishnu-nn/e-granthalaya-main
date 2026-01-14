// Authentication Middleware

// Check if user is authenticated
exports.requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    next();
};

// Check if user is admin
exports.requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.type !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Check if user is student
exports.requireStudent = (req, res, next) => {
    if (!req.session.user || req.session.user.type !== 'student') {
        return res.status(403).json({ success: false, message: 'Student access required' });
    }
    next();
};

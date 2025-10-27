const verifySecurityRole = (req, res, next) => {
  try {
    // Token is already verified by verifyToken middleware
    // Check if user has security/guard role
    if (req.user.role !== 'security') {
      return res.status(403).json({ 
        message: "Access denied. Security personnel only." 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      message: "Error verifying security role", 
      error: error.message 
    });
  }
};

module.exports = verifySecurityRole;

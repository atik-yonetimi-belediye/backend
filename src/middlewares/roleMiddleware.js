const AppError = require("../utils/AppError");

function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Kimlik doğrulama gerekli.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Bu işlem için yetkiniz yok.", 403));
    }

    return next();
  };
}

module.exports = roleMiddleware;

const { verifyToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new AppError("Token bulunamadı.", 401));
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return next(new AppError("Geçersiz token formatı.", 401));
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    return next();
  } catch (error) {
    return next(new AppError("Token geçersiz veya süresi dolmuş.", 401));
  }
}

module.exports = authMiddleware;

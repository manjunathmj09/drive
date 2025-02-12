const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/user/register");
  }

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/user/login");
  }
}

module.exports = auth;

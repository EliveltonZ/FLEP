// controller/authController.js
class AuthController {
  static check(req, res) {
    const h = req.headers.authorization || "";
    const [, bearer] = h.split(" ");
    const token =
      bearer ||
      (req.signedCookies && req.signedCookies.sb_access_token) ||
      (req.cookies && req.cookies.sb_access_token);

    if (!token)
      return res.status(401).json({ ok: false, reason: "MISSING_JWT" });
    return res.json({ ok: true });
  }

  static logout(req, res) {
    res.clearCookie("sb_access_token");
    res.clearCookie("sb_refresh_token");
    return res.json({ ok: true });
  }
}

module.exports = AuthController;

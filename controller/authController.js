// controller/authController.js
const supabase = require("../client/clientSupabase");

function getTokenFromReq(req) {
  const h = req.headers.authorization || "";
  const [, bearer] = h.split(" ");
  return (
    bearer ||
    (req.signedCookies && req.signedCookies.sb_access_token) ||
    (req.cookies && req.cookies.sb_access_token) ||
    null
  );
}

function isJwtValid(token) {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof json.exp === "number" && json.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

class AuthController {
  static async loginDataBase(req, res) {
    const { p_email, p_senha } = req.query || {};
    if (!p_email || !p_senha) {
      return res.status(400).json({ message: "Informe p_email e p_senha" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: p_email,
      password: p_senha,
    });
    if (error) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas", error: error.message });
    }

    const { session, user } = data;
    const isProd = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: isProd,
    };

    // access ~1h; refresh ~14d
    res.cookie("sb_access_token", session.access_token, {
      ...cookieOpts,
      maxAge: 1000 * 60 * 60,
    });
    res.cookie("sb_refresh_token", session.refresh_token, {
      ...cookieOpts,
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    return res.json({ ok: true, user: { id: user.id, email: user.email } });
  }

  /** Verifica presença e validade (exp) do access token */
  static check(req, res) {
    const token = getTokenFromReq(req);
    if (!token || !isJwtValid(token)) {
      return res
        .status(401)
        .json({ ok: false, reason: "INVALID_OR_EXPIRED_JWT" });
    }
    return res.json({ ok: true });
  }

  /** Usa o refresh_token (cookie) para renovar a sessão */
  static async refresh(req, res) {
    const refresh =
      (req.signedCookies && req.signedCookies.sb_refresh_token) ||
      (req.cookies && req.cookies.sb_refresh_token);
    if (!refresh) {
      return res.status(401).json({ ok: false, reason: "MISSING_REFRESH" });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh,
    });
    if (error || !data?.session) {
      return res.status(401).json({ ok: false, reason: "REFRESH_FAILED" });
    }

    const { session } = data;
    const isProd = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: isProd,
    };

    // reemite access curto (1h) e renova o refresh (14d)
    res.cookie("sb_access_token", session.access_token, {
      ...cookieOpts,
      maxAge: 1000 * 60 * 60,
    });
    res.cookie("sb_refresh_token", session.refresh_token, {
      ...cookieOpts,
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    return res.json({ ok: true });
  }

  static logout(req, res) {
    res.clearCookie("sb_access_token");
    res.clearCookie("sb_refresh_token");
    return res.json({ ok: true });
  }
}

module.exports = AuthController;

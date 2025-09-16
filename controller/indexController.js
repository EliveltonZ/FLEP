// controller/indexController.js
const supabase = require("../client/clientSupabase");

async function loginDataBase(req, res) {
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

  // Cookies httpOnly ASSINADOS (cookie-parser já está configurado no server.js)
  const isProd = process.env.NODE_ENV === "production";
  const cookieOpts = {
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    secure: isProd, // em dev (http) fica false
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

  // Resposta simples (mantém compat no front — você já trata sucesso/erro)
  return res.json({
    ok: true,
    user: { id: user.id, email: user.email },
  });
}

/** Opcional: logout limpa cookies */
async function logout(req, res) {
  try {
    res.clearCookie("sb_access_token");
    res.clearCookie("sb_refresh_token");
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: "Erro ao sair" });
  }
}

module.exports = { loginDataBase, logout };

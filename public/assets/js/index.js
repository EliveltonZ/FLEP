// index.js (refatorado, login com tratamento 401/403 e cookies httpOnly)
import { EventUtils, DomUtils } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

/* =========================
 * Seletores
 * ========================= */
const SEL = {
  IN_EMAIL: "txt_email",
  IN_SENHA: "txt_senha",
  BT_LOGIN: "#bt_login",
  FORM: "form",
  REDIRECT_OK: "/orcamentos.html",
};

/* =========================
 * fetchJson (robusto, com cookies)
 * ========================= */
async function fetchJson(url, options) {
  try {
    const res = await fetch(url, {
      credentials: "include", // <- essencial para cookies httpOnly na sessão
      ...options,
    });

    const ct = res.headers.get("content-type") || "";
    let body;
    if (ct.includes("application/json")) {
      body = await res.json();
    } else {
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    }

    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error("login fetchJson:", err);
    // converte falha de rede em um objeto consistente
    return { ok: false, status: 0, body: { message: "Falha de rede" } };
  }
}

/* =========================
 * API
 * ========================= */
const api = {
  login: (email, senha) =>
    fetchJson(
      `loginDataBase?p_email=${encodeURIComponent(
        email
      )}&p_senha=${encodeURIComponent(senha)}`
    ),
};

/* =========================
 * Helpers
 * ========================= */
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));
function getCreds() {
  const email = (DomUtils.getText(SEL.IN_EMAIL) || "").trim();
  const senha = DomUtils.getText(SEL.IN_SENHA) || "";
  return { email, senha };
}

/* =========================
 * Controlador (login)
 * ========================= */
async function onLogin() {
  const btn = document.querySelector(SEL.BT_LOGIN);
  const { email, senha } = getCreds();

  if (!email || !senha) {
    await Swal.fire({ icon: "info", text: "Informe e-mail e senha." });
    return;
  }
  if (!isEmail(email)) {
    await Swal.fire({ icon: "info", text: "Informe um e-mail válido." });
    return;
  }

  btn && (btn.disabled = true);

  const { ok, status, body } = await api.login(email, senha);

  if (!ok || !body?.ok) {
    // status 0 = falha de rede
    if (status === 403) {
      await Swal.fire({
        icon: "warning",
        title: "Conta inativa",
        text: body?.message || "Procure o administrador.",
      });
    } else if (status === 401) {
      await Swal.fire({ icon: "error", text: "Usuário ou senha inválidos." });
    } else if (status >= 500 || status === 0) {
      await Swal.fire({
        icon: "error",
        text: body?.message || "Servidor indisponível. Tente novamente.",
      });
    } else {
      await Swal.fire({
        icon: "error",
        text: body?.message || "Não foi possível conectar.",
      });
    }

    btn && (btn.disabled = false);
    return;
  }

  // sucesso
  window.location.href = SEL.REDIRECT_OK;
}

/* =========================
 * Init
 * ========================= */
document.addEventListener("DOMContentLoaded", () => {
  EventUtils.enableEnterAsTab?.();

  // clique no botão
  EventUtils.addEventToElement(SEL.BT_LOGIN, "click", onLogin);

  // submit do form (enter)
  const form = document.querySelector(SEL.FORM);
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      onLogin();
    });
  }

  // qualidade de vida: Enter no campo senha dispara login se não houver <form>
  const senhaEl = document.getElementById(SEL.IN_SENHA);
  if (!form && senhaEl) {
    senhaEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onLogin();
      }
    });
  }
});

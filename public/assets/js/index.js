import { enableEnterAsTab, getText, setCookie } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

window.loginDataBase = async function () {
  const email = getText("txt_email");
  const senha = getText("txt_senha");

  try {
    const response = await fetch(
      `loginDataBase?p_email=${encodeURIComponent(
        email
      )}&p_senha=${encodeURIComponent(senha)}`
      // se sua API estiver em OUTRO domínio/subdomínio, use:
      // , { credentials: 'include' }
    );

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      return Swal.fire({ icon: "error", text: "Usuário ou senha inválidos." });
    }

    // compatibilidade com o restante do app
    const userId = data.user?.id;
    if (userId) {
      localStorage.setItem("id", userId);
      await setIdEnterprise(userId); // mantém seu fluxo atual
    }

    window.location.href = "/orcamentos.html";
  } catch (e) {
    Swal.fire({ icon: "error", text: "Não foi possível conectar." });
  }
};

async function setIdEnterprise(value) {
  const data = { id: value };
  await setCookie(data);
}

document.addEventListener("DOMContentLoaded", (event) => {
  enableEnterAsTab();
});

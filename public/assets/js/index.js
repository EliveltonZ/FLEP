import { EventUtils, DomUtils } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function loginDataBase() {
  const email = DomUtils.getText("txt_email");
  const senha = DomUtils.getText("txt_senha");

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

    window.location.href = "/orcamentos.html";
  } catch (e) {
    Swal.fire({ icon: "error", text: "Não foi possível conectar." });
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  EventUtils.enableEnterAsTab();
});

EventUtils.addEventToElement("#bt_login", "click", loginDataBase);

import { enableEnterAsTab, getText, setCookie } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

window.loginDataBase = async function () {
  const email = getText("txt_email");
  const senha = getText("txt_senha");

  const response = await fetch(
    `loginDataBase?p_email=${email}&p_senha=${senha}`
  );

  const data = await response.json();

  if (!response.ok) {
    Swal.fire({
      icon: "error",
      text: "nao foi possivel conectar",
    });
  } else {
    try {
      if (data && data.length > 0) {
        if (data[0].p_ativo) {
          localStorage.setItem("id", data[0].p_id);
          await setIdEnterprise(data[0].p_id);
          window.location.href = "/orcamentos.html";
        } else {
          Swal.fire({
            icon: "warning",
            title: "Atenção",
            text: "Conta inativa.",
          });
        }
      } else {
        Swal.fire({
          icon: "warning",
          text: "Usuário ou senha inválidos.",
        });
      }
    } catch (e) {
      Swal.fire({
        icon: "error",
        text: "Erro ao processar os dados retornados.",
      });
    }
  }
};

async function setIdEnterprise(value) {
  const data = { id: value };
  await setCookie(data);
}

document.addEventListener("DOMContentLoaded", (event) => {
  enableEnterAsTab();
});

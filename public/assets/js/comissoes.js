import {
  getText,
  setText,
  getCookie,
  addEventToElement,
  formatPercent,
} from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function getComissoes() {
  const response = await fetch(
    `/getComissoes?p_id_marcenaria=${await getCookie("id")}`
  );

  const data = await response.json();
  return data;
}

async function fillTableComissoes() {
  const config = `style="text-align: center"`;
  const data = await getComissoes();
  const tbody = document.querySelector("#table tbody");
  tbody.innerHTML = "";
  data.forEach((element) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td ${config} >${element.p_id_comissao}</td>
    <td>${element.p_descricao}</td>
    <td ${config} >${formatPercent(element.p_valor)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function setComissoes() {
  const data = {
    p_id_marcenaria: await getCookie("id"),
    p_descricao: getText("txt_descricao"),
    p_valor: getText("txt_porcentagem"),
  };

  const result = await Swal.fire({
    icon: "question",
    title: "Deseja inserir Custos ?",
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    showDenyButton: true,
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch("/setComissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      Swal.fire({
        icon: "success",
        title: "SUCESSO",
        text: "Dados inseridos com sucesso !!!",
      });
    } catch (erro) {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: erro.message,
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillTableComissoes();
  addEventToElement("#bt_inserir", "click", setComissoes);
});

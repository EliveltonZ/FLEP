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
  const descricao = getText("txt_descricao");
  const valor = getText("txt_porcentagem");
  if (!descricao || !valor) {
    Swal.fire({
      icon: "warning",
      title: "ATENÇÃO",
      text: "Preencha os campos vazios",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    title: "Novo",
    text: "Deseja inserir Comissão ?",
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    showDenyButton: true,
  });

  if (result.isConfirmed) {
    try {
      const data = {
        p_id_marcenaria: await getCookie("id"),
        p_descricao: descricao,
        p_valor: valor,
      };

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

      fillTableComissoes();
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

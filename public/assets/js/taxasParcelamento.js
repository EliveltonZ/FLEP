import Swal from "./sweetalert2.esm.all.min.js";
import {
  getText,
  convertDecimal,
  onmouseover,
  insertButtonCellTable,
  getCookie,
} from "./utils.js";

async function fillTableCredito() {
  const id = await getCookie("id");
  const response = await fetch(
    `getTaxasParcelamentos?p_id_marcenaria=${id}&p_tipo=C`
  );

  const data = await response.json();

  const tbody = document.querySelectorAll("table tbody")[0];
  tbody.innerHTML = "";

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align : center" >${item.p_qtd_parcela}</td>
      <td style="text-align : center">${convertDecimal(item.p_taxa)}</td>
      ${insertButtonCellTable("deleteRowC")}
    `;
    tbody.appendChild(tr);
  });
}

async function fillTableFinanciamento() {
  const id = await getCookie("id");
  const response = await fetch(
    `getTaxasParcelamentos?p_id_marcenaria=${id}&p_tipo=F`
  );

  const data = await response.json();

  const tbody = document.querySelectorAll("table tbody")[1];
  tbody.innerHTML = "";

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align : center" >${item.p_qtd_parcela}</td>
      <td style="text-align : center">${convertDecimal(item.p_taxa)}</td>
      ${insertButtonCellTable("deleteRowF")}
    `;
    tbody.appendChild(tr);
  });
}

window.setTaxa = async function () {
  const result = Swal.fire({
    icon: "question",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    text: "Inserir taxa ?",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const data = {
          p_id_marcenaria: await getCookie("id"),
          p_qtd_parcela: getText("txt_parcela"),
          p_taxa: getText("txt_taxa"),
          p_tipo: getText("txt_tipo"),
        };

        const response = await fetch(`setTaxasParcelamentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: "Taxa inserida com sucesso",
        });
        fillTableCredito();
        fillTableFinanciamento();
      } catch {
        Swal.fire({
          icon: "error",
          title: "ERRO",
          text: "Erro ao carregar dados",
        });
      }
    }
  });
};

window.deleteRowC = async function (button) {
  deleteRow(button, "C");
};

window.deleteRowF = async function (button) {
  deleteRow(button, "F");
};

async function deleteRow(button, tipo) {
  const result = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deletar taxa de parcelamento ?",
    denyButtonText: "Cancelar",
    showDenyButton: true,
    confirmButtonText: "Confirmar",
  });

  if (result.isConfirmed) {
    try {
      const row = button.closest("tr");
      const firstCell = row.querySelectorAll("td")[0].textContent;
      const secondCell = row.querySelectorAll("td")[1].textContent;
      const id = await getCookie("id");

      const data = {
        p_id_marcenaria: id,
        p_qtd_parcela: firstCell,
        p_taxa: getValueFloat(secondCell),
        p_tipo: tipo,
      };

      const response = await fetch("setDelTaxasParcelamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      fillTableCredito();
      fillTableFinanciamento();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Erro ao remover taxa",
      });
    }
  }
}

function getValueFloat(value) {
  value = value.replace("%", "").replace(",", ".");
  return value;
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillTableCredito();
  onmouseover("ctable");
  onmouseover("ftable");
  fillTableFinanciamento();
});

import Swal from "./sweetalert2.esm.all.min.js";
import {
  getText,
  convertDecimal,
  onmouseover,
  insertButtonCellTable,
  getCookie,
  addEventToElement,
} from "./utils.js";

function el(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

async function fillTableCredito() {
  const id = await getCookie("id");
  const response = await fetch(
    `getTaxasParcelamentos?p_id_marcenaria=${id}&p_tipo=C`
  );

  const data = await response.json();

  const tbody = document.querySelector("#ctable tbody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.append(
      el("td", item.p_qtd_parcela),
      el("td", convertDecimal(item.p_taxa))
    );

    const td = document.createElement("td");
    td.innerHTML = insertButtonCellTable("deleteRowC");
    tr.append(td);
    tr.children[0].style.textAlign = "center";
    tr.children[1].style.textAlign = "center";
    tr.children[2].style.textAlign = "center";
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
    tr.append(
      el("td", item.p_qtd_parcela),
      el("td", convertDecimal(item.p_taxa))
    );
    const bt = document.createElement("td");
    bt.innerHTML = insertButtonCellTable("deleteRowF");
    tr.append(bt);
    tr.children[0].style.textAlign = "center";
    tr.children[1].style.textAlign = "center";
    tr.children[2].style.textAlign = "center";
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

async function delRowF(e) {
  const bt = e.target.closest(".deleteRowF");
  if (!bt) return;
  const tr = bt.closest("tr");

  const result = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deletar taxa de parcelamento ?",
    denyButtonText: "Cancelar",
    showDenyButton: true,
    confirmButtonText: "Confirmar",
  });

  if (result.isConfirmed) {
    if (tr) tr.remove();
    deleteRow(bt, "F");
  }
}

async function delRowC(e) {
  const bt = e.target.closest(".deleteRowC");
  if (!bt) return;
  const tr = bt.closest("tr");

  const result = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deletar taxa de parcelamento ?",
    denyButtonText: "Cancelar",
    showDenyButton: true,
    confirmButtonText: "Confirmar",
  });

  if (result.isConfirmed) {
    if (tr) tr.remove();
    deleteRow(bt, "C");
  }
}

async function deleteRow(button, tipo) {
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

function getValueFloat(value) {
  value = value.replace("%", "").replace(",", ".");
  return value;
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillTableCredito();
  fillTableFinanciamento();
  onmouseover("ctable");
  onmouseover("ftable");
});

addEventToElement("#ftable tbody", "click", delRowF);
addEventToElement("#ctable tbody", "click", delRowC);

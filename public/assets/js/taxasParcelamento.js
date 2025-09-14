import Swal from "./sweetalert2.esm.all.min.js";
import { DomUtils, FormatUtils, TableUtils, EventUtils, API } from "./utils.js";

function el(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

async function fillTableCredito() {
  const response = await API.apiFetch(`/getTaxasParcelamentos?p_tipo=C`);

  const data = await response.json();

  const tbody = document.querySelector("#ctable tbody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.append(
      el("td", item.p_qtd_parcela),
      el("td", FormatUtils.convertDecimalToPercent(item.p_taxa))
    );

    const td = document.createElement("td");
    td.innerHTML = TableUtils.insertDeleteButtonCell("deleteRowC");
    tr.append(td);
    tr.children[0].style.textAlign = "center";
    tr.children[1].style.textAlign = "center";
    tr.children[2].style.textAlign = "center";
    tbody.appendChild(tr);
  });
}

async function fillTableFinanciamento() {
  const response = await API.apiFetch(`/getTaxasParcelamentos?p_tipo=F`);

  const data = await response.json();

  const tbody = document.querySelectorAll("table tbody")[1];
  tbody.innerHTML = "";

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.append(
      el("td", item.p_qtd_parcela),
      el("td", FormatUtils.convertDecimalToPercent(item.p_taxa))
    );
    const bt = document.createElement("td");
    bt.innerHTML = TableUtils.insertDeleteButtonCell("deleteRowF");
    tr.append(bt);
    tr.children[0].style.textAlign = "center";
    tr.children[1].style.textAlign = "center";
    tr.children[2].style.textAlign = "center";
    tbody.appendChild(tr);
  });
}

async function setTaxa() {
  if (!DomUtils.getText("txt_tipo")) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Selecione o tipo da taxa",
    });
    return;
  }

  const result = Swal.fire({
    icon: "question",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    text: "Deseja inserir taxa ?",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const data = {
          p_qtd_parcela: DomUtils.getText("txt_parcela"),
          p_taxa: DomUtils.getText("txt_taxa"),
          p_tipo: DomUtils.getText("txt_tipo"),
        };
        const response = await API.apiFetch(`/setTaxasParcelamentos`, {
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
}

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

    const data = {
      p_qtd_parcela: firstCell,
      p_taxa: getValueFloat(secondCell),
      p_tipo: tipo,
    };

    const response = await API.apiFetch("setDelTaxasParcelamentos", {
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
      text: `Erro ao remover taxa ${err.message}`,
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
  EventUtils.tableHover("ctable");
  EventUtils.tableHover("ftable");
});

EventUtils.addEventToElement("#ftable tbody", "click", delRowF);
EventUtils.addEventToElement("#ctable tbody", "click", delRowC);
EventUtils.addEventToElement("#bt_new_taxa", "click", setTaxa);

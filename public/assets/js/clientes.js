import {
  getText,
  setText,
  formatCEP,
  setInnerHtml,
  insertButtonCellTable,
  getInnerHtml,
  addEventToElement,
  getCookie,
  setChecked,
  getChecked,
  onmouseover,
} from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function fillTableClients() {
  const id = await getCookie("id");
  const response = await fetch(`/getClients?p_id_marcenaria=${id}`);
  const data = await response.json();
  const tableBody = document.querySelector("#ctable tbody");
  tableBody.innerHTML = "";
  const style = 'style="text-align: center"';
  data.forEach((element) => {
    const tr = document.createElement("tr");
    tr.classList.add("row-end");
    tr.innerHTML = `
      <td ${style} >${element.p_id_cliente}</td>
      <td>${element.p_cpf}</td>
      <td>${element.p_nome}</td>
    `;
    tableBody.appendChild(tr);
  });
  addEventToElement(".row-end", "click", handleRowAdress);
}

async function handleRowAdress(event) {
  const row = event.target.closest("tr");
  const firstColum = row.cells[0].textContent;
  await fillTableAdress(firstColum);

  document
    .querySelectorAll("#ctable tbody tr")
    .forEach((tr) => tr.classList.remove("table-click-row"));
  row.classList.add("table-click-row");
}

async function fillTableAdress(id_client) {
  const id = await getCookie("id");
  const response = await fetch(
    `/getEnderecos?p_id_marcenaria=${id}&p_id_cliente=${id_client}`
  );

  const data = await response.json();
  const tableBody = document.querySelector("#etable tbody");
  tableBody.innerHTML = "";
  data.forEach((element) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${element.p_endereco}</td>
      <td>${element.p_numero}</td>
      <td>${element.p_cidade}</td>
      <td>${element.p_estado}</td>
      <td>${element.p_cep}</td>
    `;
    tableBody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillTableClients();
  onmouseover("ctable");
  onmouseover("etable");
});

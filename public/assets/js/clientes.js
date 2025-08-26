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
    tr.innerHTML = `
      <td ${style} >${element.p_id_cliente}</td>
      <td>${element.p_cpf}</td>
      <td>${element.p_nome}</td>
    `;
    tableBody.appendChild(tr);
  });
}

fillTableClients();

document.addEventListener("DOMContentLoaded", (event) => {
  onmouseover("ctable");
  onmouseover("etable");
});

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

async function findCep() {
  const cep = getText("cepEndereco");
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const endereco = await response.json();
  setText("logradouroEndereco", endereco.logradouro);
  setText("bairroEndereco", endereco.bairro);
  setText("cidadeEndereco", endereco.localidade);
  setText("ufEndereco", endereco.uf);
}

function fillStates() {
  const estados = [
    "AC", // Acre
    "AL", // Alagoas
    "AP", // Amapá
    "AM", // Amazonas
    "BA", // Bahia
    "CE", // Ceará
    "DF", // Distrito Federal
    "ES", // Espírito Santo
    "GO", // Goiás
    "MA", // Maranhão
    "MT", // Mato Grosso
    "MS", // Mato Grosso do Sul
    "MG", // Minas Gerais
    "PA", // Pará
    "PB", // Paraíba
    "PR", // Paraná
    "PE", // Pernambuco
    "PI", // Piauí
    "RJ", // Rio de Janeiro
    "RN", // Rio Grande do Norte
    "RS", // Rio Grande do Sul
    "RO", // Rondônia
    "RR", // Roraima
    "SC", // Santa Catarina
    "SP", // São Paulo
    "SE", // Sergipe
    "TO", // Tocantins
  ];
  const select = document.getElementById("ufEndereco");
  select.innerHTML = `<option value="-">-</option>`;
  estados.forEach((item) => {
    const option = document.createElement("option");
    option.text = item;
    option.value = item;
    select.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillTableClients();
  onmouseover("ctable");
  onmouseover("etable");
  fillStates();
});

addEventToElement("#cepEndereco", "blur", findCep);

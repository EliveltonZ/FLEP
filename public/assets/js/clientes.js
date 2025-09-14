// clients-addresses.js
import {
  DomUtils,
  EventUtils,
  TableUtils,
  API,
  ValidationUtils,
} from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";
import { enableTableFilterSort } from "./filtertable.js";

/* ================================
   Constantes & helpers
================================ */

const SELECTORS = {
  clientsTBody: "#ctable tbody",
  addressesTBody: "#etable tbody",
  addressesFormTableBody: "#tabelaEnderecos tbody",
  clientsTable: "#ctable",
  addressesTable: "#etable",
  cpfInput: "#cpf",
  cepInput: "#cepEndereco",
  addAddressBtn: "#adicionarEndereco",
  ufSelect: "#ufEndereco",
  delRowCep: ".delrowcep",
  newClient: "#bt_newClient",
};

const UF_LIST = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

// Normaliza CEP (remove não dígitos) e, se tiver util formatCEP, aplica.
function normalizeCep(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length === 8
    ? formatCEP
      ? formatCEP(digits)
      : digits
    : digits;
}

// cria elementos com texto de forma segura
function el(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

// trata respostas fetch
async function toJSONorThrow(res) {
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText || "Erro");
    throw new Error(`${res.status} ${res.statusText} - ${msg}`);
  }
  return res.json();
}

/* ================================
   Camada de API (responsabilidade única: buscar dados)
================================ */

async function fetchClients() {
  const res = await API.apiFetch(`/getClients`);
  return toJSONorThrow(res);
}

async function fetchNewClient(payload) {
  const res = await API.apiFetch("/setClient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

var idCliente = "";

async function fetchAddresses(clientId) {
  idCliente = clientId;
  const res = await API.apiFetch(`/getEnderecos?p_id_cliente=${clientId}`);
  return toJSONorThrow(res);
}

async function fetchDelAddress(params) {
  const res = await API.apiFetch("/delEndereco", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

async function fetchAddress(params) {
  const res = await API.apiFetch("/setEndereco", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

async function fetchClientByCpf(cpfOrCnpj) {
  const res = await API.apiFetch(`/getClient?p_cpf_cnpj=${cpfOrCnpj}`);
  return toJSONorThrow(res);
}

async function fetchCep(cep) {
  const res = await API.apiFetch(`https://viacep.com.br/ws/${cep}/json/`);
  return toJSONorThrow(res);
}

/* ================================
   Renderização (responsabilidade: só mexer no DOM)
================================ */

function renderClientsTable(clients = []) {
  const tbody = document.querySelector(SELECTORS.clientsTBody);
  tbody.innerHTML = "";

  if (!clients.length) {
    const tr = document.createElement("tr");
    const td = el("td", "Nenhum cliente encontrado");
    td.setAttribute("colspan", "3");
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();
  clients.forEach((c) => {
    const tr = document.createElement("tr");
    tr.classList.add("row-end");
    tr.dataset.clientId = c.p_id_cliente;

    const tdId = el("td", c.p_id_cliente);
    tdId.style.textAlign = "center";
    const tdCpf = el("td", c.p_cpf);
    const tdName = el("td", c.p_nome);

    tr.append(tdId, tdCpf, tdName);
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

function renderAddressesTable(addresses = []) {
  const tbody = document.querySelector(SELECTORS.addressesTBody);
  tbody.innerHTML = "";

  if (!addresses.length) {
    const tr = document.createElement("tr");
    const td = el("td", "Nenhum endereço para este cliente");
    td.setAttribute("colspan", "8");
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();
  addresses.forEach((a) => {
    const tr = document.createElement("tr");
    tr.append(
      el("td", a.p_id),
      el("td", a.p_tipo),
      el("td", a.p_cep),
      el("td", a.p_endereco),
      el("td", a.p_numero),
      el("td", a.p_bairro),
      el("td", a.p_cidade),
      el("td", a.p_estado)
    );

    tr.children[0].style.display = "none";
    tr.children[1].style.textAlign = "center";
    tr.children[7].style.textAlign = "center";

    const tdBtn = document.createElement("td");
    tdBtn.innerHTML = TableUtils.insertDeleteButtonCell(
      SELECTORS.delRowCep.slice(1)
    );
    tr.appendChild(tdBtn);
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

function renderUfOptions() {
  const select = document.querySelector(SELECTORS.ufSelect);
  select.innerHTML = "";
  const optDash = document.createElement("option");
  optDash.value = "-";
  optDash.textContent = "-";
  select.appendChild(optDash);

  const frag = document.createDocumentFragment();
  UF_LIST.forEach((uf) => {
    const option = document.createElement("option");
    option.value = uf;
    option.textContent = uf;
    frag.appendChild(option);
  });
  select.appendChild(frag);
}

/* ================================
   Ações de formulário / UI
================================ */

async function populateClients() {
  try {
    // opcional: mostrar loading
    renderClientsTable([]);
    const clients = await fetchClients();
    renderClientsTable(clients);
  } catch (err) {
    console.error(err);
    Swal.fire("Erro", "Não foi possível carregar os clientes.", "error");
  }
}

async function onClientRowClick(event) {
  const row = event.target.closest("tr");
  if (!row || !row.classList.contains("row-end")) return;

  const idClient = row.dataset.clientId || row.cells[0]?.textContent?.trim();
  if (!idClient) return;

  // highlight de seleção
  document
    .querySelectorAll(`${SELECTORS.clientsTBody} tr`)
    .forEach((tr) => tr.classList.remove("table-click-row"));
  row.classList.add("table-click-row");

  try {
    const addresses = await fetchAddresses(idClient);
    renderAddressesTable(addresses);
  } catch (err) {
    console.error(err);
    Swal.fire(
      "Erro",
      "Não foi possível carregar endereços do cliente.",
      "error"
    );
  }
}

function getTextSafe(id) {
  return (DomUtils.getText(id) || "").trim();
}

function getClientValues() {
  const rawCpf = getTextSafe("cpf");
  const cpf = rawCpf.replace(/\D/g, "");
  const nome = getTextSafe("nome").toLocaleUpperCase("pt-BR");
  const telefone = getTextSafe("telefone").replace(/\D/g, "");
  const email = getTextSafe("email");
  const indicacao = getTextSafe("indicacao");
  return { cpf, nome, telefone, email, indicacao };
}

function validateRequired({ cpf, nome, telefone, email }) {
  const faltando = [];
  if (!cpf) faltando.push("CPF");
  if (!nome) faltando.push("Nome");
  if (!telefone) faltando.push("Telefone");
  if (!email) faltando.push("Email");
  return faltando;
}

function isEmailOk(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function validateClientForm(e) {
  // se vier de um <form>
  e?.preventDefault?.();

  const v = getClientValues();

  const faltando = validateRequired(v);
  if (faltando.length) {
    await Swal.fire("Atenção", `Preencha: ${faltando.join(", ")}.`, "info");
    return false;
  }

  if (!ValidationUtils.validarCpfCnpj(v.cpf)) {
    await Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "CPF/CNPJ inválido!",
    });
    return false;
  }

  if (!isEmailOk(v.email)) {
    await Swal.fire({ icon: "error", title: "ERRO", text: "Email inválido!" });
    return false;
  }

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Inserir",
    text: "Deseja inserir novo cliente?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!isConfirmed) return false;

  // opcional: desabilitar botão de submit se veio de um form
  const btn = e?.submitter;
  if (btn) btn.disabled = true;

  try {
    const data = {
      p_cpf_cnpj: v.cpf,
      p_nome: v.nome,
      p_telefone: v.telefone,
      p_email: v.email,
      p_indicacao: v.indicacao,
    };

    await API.apiFetchNewClient(data);

    await Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Novo Cliente cadastrado com sucesso!",
    });

    return true;
  } catch (erro) {
    await Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Não foi possível salvar cliente: ${erro.message}`,
    });
    return false;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function lookupCepAndFill() {
  try {
    const raw = DomUtils.getText("cepEndereco");
    const cep = normalizeCep(raw);

    const endereco = await API.getCep(DomUtils.getText("cepEndereco"));
    if (endereco.erro) {
      Swal.fire("CEP não encontrado", "Verifique o CEP informado.", "warning");
      return;
    }

    DomUtils.setText("logradouroEndereco", endereco.logradouro || "");
    DomUtils.setText("bairroEndereco", endereco.bairro || "");
    DomUtils.setText("cidadeEndereco", endereco.localidade || "");
    DomUtils.setText("ufEndereco", endereco.uf || "");
  } catch (err) {
    console.error(err);
    Swal.fire("Erro", "Falha ao consultar o CEP.", "error");
  }
}

async function addAddressFromForm() {
  const tipoEndereco = DomUtils.getText("tipoEndereco");
  const cepEndereco = DomUtils.getText("cepEndereco");
  const cidadeEndereco = DomUtils.getText("cidadeEndereco");
  const numeroEndereco = DomUtils.getText("numeroEndereco");
  const ufEndereco = DomUtils.getText("ufEndereco");
  const complementoEndereco = DomUtils.getText("complementoEndereco");
  const logradouroEndereco = DomUtils.getText("logradouroEndereco");
  const bairroEndereco = DomUtils.getText("bairroEndereco");

  // Validações simples
  if (!tipoEndereco || !cepEndereco || !logradouroEndereco || !numeroEndereco) {
    Swal.fire(
      "Atenção",
      "Preencha os campos obrigatórios (tipo, CEP, logradouro, número).",
      "info"
    );
    return;
  }
  const result = await Swal.fire({
    icon: "question",
    title: "Inserir",
    text: "Deseja inserir novo endereco",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });

  if (!result.isConfirmed) return;

  const data = {
    p_id_cliente: parseInt(idCliente),
    p_endereco: logradouroEndereco,
    p_cep: cepEndereco,
    p_cidade: cidadeEndereco,
    p_estado: ufEndereco,
    p_numero: numeroEndereco,
    p_tipo: tipoEndereco,
    p_bairro: bairroEndereco,
  };

  const tbody = document.querySelector(SELECTORS.addressesTBody);
  const addresses = await API.apiFetchAddresses(data.p_id_cliente);
  if (!addresses.length) {
    tbody.innerHTML = "";
  }
  fetchAddress(data);

  const tr = document.createElement("tr");

  tr.append(
    el("td", tipoEndereco),
    el("td", cepEndereco),
    el("td", logradouroEndereco),
    el("td", numeroEndereco),
    el("td", bairroEndereco),
    el("td", cidadeEndereco),
    el("td", ufEndereco)
  );

  tr.children[0].style.textAlign = "center";

  const tdBtn = document.createElement("td");
  tdBtn.innerHTML = TableUtils.insertDeleteButtonCell(
    SELECTORS.delRowCep.slice(1)
  );
  tr.appendChild(tdBtn);
  tbody.appendChild(tr);

  Swal.fire({
    icon: "success",
    title: "SUCESSO",
    text: "Endereço inserido com Sucesso !!",
  });
}

async function populateClientFormByCpf() {
  try {
    const cpf = DomUtils.getText("cpf");

    if (!cpf || !ValidationUtils.validarCpfCnpj(cpf)) {
      Swal.fire("Erro", "CPF invalido.", "error");
      return;
    }

    const data = await API.apiFetchClientByCpf(cpf);
    if (!data || !data.length) return;

    const cli = data[0];
    DomUtils.setText("nome", cli.p_nome || "");
    DomUtils.setText("telefone", cli.p_telefone || "");
    DomUtils.setText("email", cli.p_email || "");
    DomUtils.setText("indicacao", cli.p_indicacao || "");
  } catch (err) {
    console.error(err);
    Swal.fire(
      "Erro",
      "Não foi possível buscar o cliente pelo CPF/CNPJ.",
      "error"
    );
  }
}

/* ================================
   Remoção de linhas (endereços)
================================ */
async function deleteRow(e) {
  // encontra o botão que foi realmente clicado (ou um pai dele)
  const btn = e.target.closest(SELECTORS.delRowCep);
  if (!btn) return; // clique não foi no botão de deletar

  const tr = btn.closest("tr");
  const firstCellValue = tr.cells[0].innerText.trim();

  const result = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deseja deletar endereço ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });

  if (!result.isConfirmed) return;

  try {
    const data = {
      p_id: firstCellValue,
    };
    fetchDelAddress(data);
    tr.remove();

    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Endereço removido com Sucesso !!!",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `FALHA: ${err.message}`,
    });
  }
}

/* ================================
   Bootstrap da página (event wiring)
================================ */

function wireEvents() {
  // Delegação: um ouvinte para as linhas da tabela de clientes
  document
    .querySelector(SELECTORS.clientsTBody)
    .addEventListener("click", onClientRowClick);

  // Buscar cliente ao alterar CPF
  EventUtils.addEventToElement(
    SELECTORS.cpfInput,
    "change",
    populateClientFormByCpf
  );

  // Consultar CEP ao sair do campo
  EventUtils.addEventToElement(SELECTORS.cepInput, "blur", lookupCepAndFill);

  // Adicionar endereço à tabela do formulário
  EventUtils.addEventToElement(
    SELECTORS.addAddressBtn,
    "click",
    addAddressFromForm
  );

  // Deleta a linha ta tabela
  EventUtils.addEventToElement(SELECTORS.addressesTBody, "click", deleteRow);

  // adiciona novo cliente
  EventUtils.addEventToElement(
    SELECTORS.newClient,
    "click",
    validateClientForm
  );

  // Melhorar UX de hover das tabelas existentes
  EventUtils.tableHover("ctable");
  EventUtils.tableHover("etable");
}

document.addEventListener("DOMContentLoaded", () => {
  renderUfOptions();
  populateClients();
  wireEvents();
  enableTableFilterSort("ctable");
});

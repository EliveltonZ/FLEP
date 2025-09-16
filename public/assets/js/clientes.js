// clients-addresses.js (refatorado)
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
const SEL = {
  // tabelas
  TBODY_CLIENTS: "#ctable tbody",
  TBODY_ADDRS: "#etable tbody",
  TABLE_CLIENTS: "#ctable",
  TABLE_ADDRS: "#etable",

  // form endereço (inputs)
  IN_TIPO: "tipoEndereco",
  IN_CEP: "cepEndereco",
  IN_LOG: "logradouroEndereco",
  IN_NUM: "numeroEndereco",
  IN_BAIRRO: "bairroEndereco",
  IN_CIDADE: "cidadeEndereco",
  IN_UF: "ufEndereco",
  IN_COMPL: "complementoEndereco",

  // form cliente (inputs)
  IN_CPF: "cpf",
  IN_NOME: "nome",
  IN_TEL: "telefone",
  IN_EMAIL: "email",
  IN_INDIC: "indicacao",

  // botões
  BT_ADD_ADDR: "#adicionarEndereco",
  BT_NEW_CLIENT: "#bt_newClient",

  // ações
  BTN_DEL_ADDR: ".delrowcep",
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

// estado simples (id do cliente atualmente selecionado)
let CURRENT_CLIENT_ID = null;

/* ================================
   Helpers DOM seguros
================================ */
const q = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  const { dataset, style, className, ...rest } = props || {};
  Object.assign(node, rest);
  if (className) node.className = className;
  if (style) {
    if (typeof style === "string") node.setAttribute("style", style);
    else Object.assign(node.style, style);
  }
  if (dataset && typeof dataset === "object") {
    Object.entries(dataset).forEach(([k, v]) => (node.dataset[k] = String(v)));
  }
  (children || []).forEach((c) =>
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return node;
};

const td = (text, center = false) =>
  el("td", { ...(center ? { style: { textAlign: "center" } } : {}) }, [
    String(text),
  ]);

/* ================================
   Normalizadores
================================ */
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const normalizeCpfCnpj = (s) => onlyDigits(s);
const normalizeCep = (raw) => {
  const digits = onlyDigits(raw);
  // se você tiver FormatUtils.formatCEP, use:
  return digits;
};

/* ================================
   fetchJson (robusto)
================================ */
async function fetchJson(url, options) {
  try {
    const res = await API.apiFetch(url, options);
    const ct = res.headers.get("content-type") || "";
    let body;
    if (ct.includes("application/json")) {
      body = await res.json();
    } else {
      const txt = await res.text();
      try {
        body = JSON.parse(txt);
      } catch {
        body = { raw: txt };
      }
    }
    if (!res.ok) {
      const msg =
        body?.message ||
        body?.error ||
        body?.raw ||
        res.statusText ||
        "Erro na requisição";
      throw new Error(msg);
    }
    return body;
  } catch (err) {
    console.error("fetchJson:", url, err);
    throw err;
  }
}

/* ================================
   API (responsabilidade única)
================================ */
const api = {
  getClients: () => fetchJson(`/getClients`),
  getClientByCpf: (cpfOrCnpj) =>
    fetchJson(`/getClient?p_cpf_cnpj=${encodeURIComponent(cpfOrCnpj)}`),

  setClient: (payload) =>
    fetchJson(`/setClient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getAddresses: (clientId) =>
    fetchJson(`/getEnderecos?p_id_cliente=${encodeURIComponent(clientId)}`),

  setAddress: (payload) =>
    fetchJson(`/setEndereco`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteAddress: (payload) =>
    fetchJson(`/delEndereco`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // via CEP direto (viacep) — se preferir proxy pelo backend, troque aqui
  getCep: (cep) =>
    fetchJson(`https://viacep.com.br/ws/${encodeURIComponent(cep)}/json/`),
};

/* ================================
   Render (somente DOM)
================================ */
function renderClientsTable(clients = []) {
  const tbody = q(SEL.TBODY_CLIENTS);
  tbody.innerHTML = "";

  if (!clients.length) {
    const tr = el("tr", {}, [
      el("td", { colSpan: 3, style: { textAlign: "center" } }, [
        "Nenhum cliente encontrado",
      ]),
    ]);
    tbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();
  clients.forEach((c) => {
    const tr = el(
      "tr",
      { className: "row-end", dataset: { clientId: c.p_id_cliente } },
      [td(c.p_id_cliente, true), td(c.p_cpf), td(c.p_nome)]
    );
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

function renderAddressesTable(addresses = []) {
  const tbody = q(SEL.TBODY_ADDRS);
  tbody.innerHTML = "";

  if (!addresses.length) {
    const tr = el("tr", {}, [
      el("td", { colSpan: 9, style: { textAlign: "center" } }, [
        "Nenhum endereço para este cliente",
      ]),
    ]);
    tbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();
  addresses.forEach((a) => {
    const tr = el("tr", {}, [
      // 0: ID (usado para deleção) — pode ficar oculto via CSS se preferir
      el("td", { style: { display: "none" } }, [String(a.p_id)]),
      td(a.p_tipo, true),
      td(a.p_cep),
      td(a.p_endereco),
      td(a.p_numero),
      td(a.p_bairro),
      td(a.p_cidade),
      td(a.p_estado, true),
    ]);

    const tdBtn = el("td");
    tdBtn.innerHTML = TableUtils.insertDeleteButtonCell(
      SEL.BTN_DEL_ADDR.slice(1)
    );
    tr.appendChild(tdBtn);

    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

function renderUfOptions() {
  const select = document.getElementById(SEL.IN_UF);
  if (!select) return;
  select.innerHTML = "";
  select.appendChild(el("option", { value: "-" }, ["-"]));
  const frag = document.createDocumentFragment();
  UF_LIST.forEach((uf) => {
    frag.appendChild(el("option", { value: uf }, [uf]));
  });
  select.appendChild(frag);
}

/* ================================
   Serviços (loaders)
================================ */
async function populateClients() {
  try {
    const clients = await api.getClients();
    renderClientsTable(clients);
  } catch (err) {
    Swal.fire(
      "Erro",
      err.message || "Não foi possível carregar os clientes.",
      "error"
    );
  }
}

async function populateAddresses(clientId) {
  try {
    const addresses = await api.getAddresses(clientId);
    renderAddressesTable(addresses);
  } catch (err) {
    Swal.fire(
      "Erro",
      err.message || "Não foi possível carregar os endereços.",
      "error"
    );
  }
}

/* ================================
   Controladores (UI / Ações)
================================ */
async function onClientRowClick(e) {
  const row = e.target.closest("tr");
  if (!row || !row.classList.contains("row-end")) return;

  const idClient = row.dataset.clientId || row.cells[0]?.textContent?.trim();
  if (!idClient) return;

  // highlight de seleção
  qa(`${SEL.TBODY_CLIENTS} tr`).forEach((tr) =>
    tr.classList.remove("table-click-row")
  );
  row.classList.add("table-click-row");

  CURRENT_CLIENT_ID = idClient;
  await populateAddresses(idClient);
}

function getClientFormValues() {
  const cpf = normalizeCpfCnpj(DomUtils.getText(SEL.IN_CPF));
  const nome = (DomUtils.getText(SEL.IN_NOME) || "")
    .toLocaleUpperCase("pt-BR")
    .trim();
  const telefone = onlyDigits(DomUtils.getText(SEL.IN_TEL));
  const email = (DomUtils.getText(SEL.IN_EMAIL) || "").trim();
  const indicacao = (DomUtils.getText(SEL.IN_INDIC) || "").trim();
  return { cpf, nome, telefone, email, indicacao };
}

function validateRequired({ cpf, nome, telefone, email }) {
  const miss = [];
  if (!cpf) miss.push("CPF/CNPJ");
  if (!nome) miss.push("Nome");
  if (!telefone) miss.push("Telefone");
  if (!email) miss.push("Email");
  return miss;
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));

export async function validateClientForm(e) {
  e?.preventDefault?.();

  const v = getClientFormValues();
  const miss = validateRequired(v);
  if (miss.length) {
    await Swal.fire("Atenção", `Preencha: ${miss.join(", ")}.`, "info");
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
  if (!isEmail(v.email)) {
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

  const btn = e?.submitter;
  if (btn) btn.disabled = true;

  try {
    await api.setClient({
      p_cpf_cnpj: v.cpf,
      p_nome: v.nome,
      p_telefone: v.telefone,
      p_email: v.email,
      p_indicacao: v.indicacao,
    });

    await populateClients();
    await Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Novo cliente cadastrado com sucesso!",
    });
    return true;
  } catch (err) {
    await Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Não foi possível salvar cliente: ${err.message}`,
    });
    return false;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function lookupCepAndFill() {
  try {
    const cep = normalizeCep(DomUtils.getText(SEL.IN_CEP));
    if (!cep || cep.length < 8) {
      Swal.fire("Atenção", "Informe um CEP válido (8 dígitos).", "info");
      return;
    }
    const endereco = await api.getCep(cep);
    if (endereco?.erro) {
      Swal.fire("CEP não encontrado", "Verifique o CEP informado.", "warning");
      return;
    }
    DomUtils.setText(SEL.IN_LOG, endereco.logradouro || "");
    DomUtils.setText(SEL.IN_BAIRRO, endereco.bairro || "");
    DomUtils.setText(SEL.IN_CIDADE, endereco.localidade || "");
    DomUtils.setText(SEL.IN_UF, endereco.uf || "");
  } catch (err) {
    console.error(err);
    Swal.fire("Erro", "Falha ao consultar o CEP.", "error");
  }
}

async function addAddressFromForm() {
  if (!CURRENT_CLIENT_ID) {
    Swal.fire("Atenção", "Selecione primeiro um cliente na tabela.", "info");
    return;
  }

  const tipo = DomUtils.getText(SEL.IN_TIPO);
  const cep = normalizeCep(DomUtils.getText(SEL.IN_CEP));
  const log = DomUtils.getText(SEL.IN_LOG);
  const num = DomUtils.getText(SEL.IN_NUM);
  const bairro = DomUtils.getText(SEL.IN_BAIRRO);
  const cidade = DomUtils.getText(SEL.IN_CIDADE);
  const uf = DomUtils.getText(SEL.IN_UF);
  const compl = DomUtils.getText(SEL.IN_COMPL);

  // validação mínima
  if (!tipo || !cep || !log || !num) {
    Swal.fire(
      "Atenção",
      "Preencha os campos obrigatórios (tipo, CEP, logradouro, número).",
      "info"
    );
    return;
  }

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Inserir",
    text: "Deseja inserir novo endereço?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!isConfirmed) return;

  try {
    await api.setAddress({
      p_id_cliente: Number(CURRENT_CLIENT_ID),
      p_endereco: log,
      p_cep: cep,
      p_cidade: cidade,
      p_estado: uf,
      p_numero: num,
      p_tipo: tipo,
      p_bairro: bairro,
      p_complemento: compl,
    });

    // Recarrega a lista — garante que a 1ª coluna tenha o ID para deleção
    await populateAddresses(CURRENT_CLIENT_ID);

    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Endereço inserido com sucesso!",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Falha ao inserir endereço.",
    });
  }
}

async function populateClientFormByCpf() {
  try {
    const raw = DomUtils.getText(SEL.IN_CPF);
    const cpf = normalizeCpfCnpj(raw);
    if (!cpf || !ValidationUtils.validarCpfCnpj(cpf)) {
      Swal.fire("Erro", "CPF/CNPJ inválido.", "error");
      return;
    }

    const data = await api.getClientByCpf(cpf);
    if (!Array.isArray(data) || !data.length) return;

    const cli = data[0];
    DomUtils.setText(SEL.IN_NOME, cli.p_nome || "");
    DomUtils.setText(SEL.IN_TEL, cli.p_telefone || "");
    DomUtils.setText(SEL.IN_EMAIL, cli.p_email || "");
    DomUtils.setText(SEL.IN_INDIC, cli.p_indicacao || "");
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
async function onDeleteAddressClick(e) {
  const btn = e.target.closest(SEL.BTN_DEL_ADDR);
  if (!btn) return;

  const tr = btn.closest("tr");
  const id = tr?.cells?.[0]?.innerText?.trim(); // 1ª coluna é o ID (oculta)
  if (!id) return;

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deseja deletar endereço?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!isConfirmed) return;

  try {
    await api.deleteAddress({ p_id: id });
    tr.remove();
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Endereço removido com sucesso!",
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "ERRO", text: `Falha: ${err.message}` });
  }
}

/* ================================
   Bootstrap / wiring
================================ */
function wireEvents() {
  // clique em linha de clientes (delegação)
  q(SEL.TBODY_CLIENTS).addEventListener("click", onClientRowClick);

  // buscar cliente por CPF
  EventUtils.addEventToElement(
    `#${SEL.IN_CPF}`,
    "change",
    populateClientFormByCpf
  );

  // CEP → auto-preenche
  EventUtils.addEventToElement(`#${SEL.IN_CEP}`, "blur", lookupCepAndFill);

  // adicionar endereço
  EventUtils.addEventToElement(SEL.BT_ADD_ADDR, "click", addAddressFromForm);

  // deletar endereço (delegação)
  EventUtils.addEventToElement(SEL.TBODY_ADDRS, "click", onDeleteAddressClick);

  // novo cliente
  EventUtils.addEventToElement(SEL.BT_NEW_CLIENT, "click", validateClientForm);

  // UX das tabelas + filtros
  EventUtils.tableHover("ctable");
  EventUtils.tableHover("etable");
  enableTableFilterSort("ctable");
  enableTableFilterSort("etable");
}

document.addEventListener("DOMContentLoaded", async () => {
  renderUfOptions();
  await populateClients();
  wireEvents();
});

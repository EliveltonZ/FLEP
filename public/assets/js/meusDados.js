// meusDados.js (refatorado e padronizado)
import { DomUtils, CepUtils, TableUtils, EventUtils, API } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

/* =========================
 * Seletores
 * ========================= */
const SEL = {
  // perfil
  IN_TIPO_PF: "#radio-pf",
  IN_TIPO_PJ: "#radio-pj",
  LBL_NOME: "#lb_nome",
  LBL_DOC: "#lb_documento",
  IN_RAZAO: "#txt_razaosocial",
  IN_DOC: "#txt_cnpj_cpf",
  IN_CEP: "#txt_cep",
  IN_END: "#txt_endereco",
  IN_BAIRRO: "#txt_bairro",
  IN_CIDADE: "#txt_cidade",
  IN_UF: "#txt_estado",
  IN_NUM: "#txt_numero",
  IN_LUCRO: "#txt_lucro",

  // bancos
  TBODY_BANCOS: "#tbody-bank",
  IN_BANCO: "#txt_banco",
  IN_TIPO_CONTA: "#txt_tipoconta",
  IN_AGENCIA: "#txt_agencia",
  IN_NUM_CONTA: "#txt_numconta",
  IN_PIX: "#txt_pix",
  BTN_DEL_BANK: ".delBank",

  // botões
  BT_ATUALIZAR: "#bt_update",
  BT_ADD_BANK: "#bt_add_bank",
};

/* =========================
 * Helpers DOM
 * ========================= */
const q = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  const { style, className, dataset, ...rest } = props || {};
  Object.assign(node, rest);
  if (className) node.className = className;
  if (style) {
    if (typeof style === "string") node.setAttribute("style", style);
    else Object.assign(node.style, style);
  }
  if (dataset)
    Object.entries(dataset).forEach(([k, v]) => (node.dataset[k] = String(v)));
  (children || []).forEach((c) =>
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return node;
};
const td = (text, center = false) =>
  el("td", { ...(center ? { style: { textAlign: "center" } } : {}) }, [
    String(text ?? ""),
  ]);

/* =========================
 * fetchJson (robusto)
 * ========================= */
async function fetchJson(url, options) {
  try {
    const res = await API.apiFetch(url, options);
    const ct = res.headers.get("content-type") || "";
    let body;
    if (ct.includes("application/json")) {
      body = await res.json();
    } else {
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }
    if (!res.ok) {
      const msg =
        body?.error ||
        body?.message ||
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

/* =========================
 * API
 * ========================= */
const api = {
  getMeusDados: () => fetchJson(`/getMeusDados`),
  setMeusDados: (payload) =>
    fetchJson(`/setMeusDados`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getBancos: () => fetchJson(`/getBancos`),
  setBanco: (payload) =>
    fetchJson(`/setBancos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  delBanco: (payload) =>
    fetchJson(`/setDelBanco`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // CEP externo (ViaCEP). Se preferir, use um proxy backend.
  getCep: async (cep) => {
    const url = `https://viacep.com.br/ws/${encodeURIComponent(cep)}/json/`;
    const res = await fetch(url, { credentials: "omit", mode: "cors" }); // <- sem cookies
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  },
};

/* =========================
 * CEP
 * ========================= */
async function onFindCep() {
  try {
    const cep = DomUtils.getText(SEL.IN_CEP).replace("-", "");
    const endereco = await api.getCep(cep);
    if (endereco?.erro) throw new Error("CEP não encontrado.");

    DomUtils.setText(SEL.IN_END, endereco.logradouro || "");
    DomUtils.setText(SEL.IN_BAIRRO, endereco.bairro || "");
    DomUtils.setText(SEL.IN_CIDADE, endereco.localidade || "");
    DomUtils.setText(SEL.IN_UF, endereco.uf || "");
  } catch (e) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: e.message || "CEP inválido.",
    });
  }
}

/* =========================
 * UI
 * ========================= */
function fillStates() {
  const estados = [
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
  const select = q(SEL.IN_UF);
  select.innerHTML = `<option value="-">-</option>`;
  estados.forEach((uf) =>
    select.appendChild(el("option", { value: uf }, [uf]))
  );
}

// --- NOVO: função global que atualiza os labels conforme o tipo selecionado
function updateTipoClienteLabels() {
  const isPJ = DomUtils.getChecked(SEL.IN_TIPO_PJ);
  DomUtils.setInnerHtml(SEL.LBL_NOME, isPJ ? "Razão Social: *" : "Nome: *");
  DomUtils.setInnerHtml(SEL.LBL_DOC, isPJ ? "CNPJ: *" : "CPF: *");
}

function bindTipoClienteRadios() {
  const radios = qa('input[name="tipo"]');
  radios.forEach((radio) =>
    radio.addEventListener("change", updateTipoClienteLabels)
  );
}

function setRadio(value) {
  const isPF = String(value).toUpperCase() === "PF";
  DomUtils.setChecked(SEL.IN_TIPO_PF, isPF);
  DomUtils.setChecked(SEL.IN_TIPO_PJ, !isPF);
  // garante que os labels reflitam o estado atual imediatamente
  updateTipoClienteLabels();
}

function getRadio() {
  return DomUtils.getChecked(SEL.IN_TIPO_PF) ? "PF" : "PJ";
}

/* =========================
 * Dados (perfil + bancos)
 * ========================= */
async function loadMeusDados() {
  try {
    const data = await api.getMeusDados();
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;

    setRadio(row.p_tipocliente || "PJ");
    DomUtils.setText(SEL.IN_RAZAO, row.p_nomerazao || "");
    DomUtils.setText(SEL.IN_DOC, row.p_cnpjcpf || "");
    DomUtils.setText(SEL.IN_CEP, row.p_cep || "");
    DomUtils.setText(SEL.IN_END, row.p_endereco || "");
    DomUtils.setText(SEL.IN_BAIRRO, row.p_bairro || "");
    DomUtils.setText(SEL.IN_CIDADE, row.p_cidade || "");
    DomUtils.setText(SEL.IN_UF, row.p_estado || "-");
    DomUtils.setText(SEL.IN_NUM, row.p_numero || "");
    DomUtils.setText(SEL.IN_LUCRO, row.p_lucro ?? 0);
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar seus dados.",
    });
  }
}

async function onSalvarMeusDados() {
  const nomerazao = DomUtils.getText(SEL.IN_RAZAO);
  const cpfcnpj = DomUtils.getText(SEL.IN_DOC);
  const cep = DomUtils.getText(SEL.IN_CEP);
  const endereco = DomUtils.getText(SEL.IN_END);
  const bairro = DomUtils.getText(SEL.IN_BAIRRO);
  const cidade = DomUtils.getText(SEL.IN_CIDADE);
  const estado = DomUtils.getText(SEL.IN_UF);
  const numero = DomUtils.getText(SEL.IN_NUM);
  const lucro = DomUtils.getText(SEL.IN_LUCRO);

  if (
    !nomerazao ||
    !cpfcnpj ||
    !cep ||
    !endereco ||
    !bairro ||
    !cidade ||
    !estado ||
    !numero ||
    !lucro
  ) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Preencha os campos obrigatórios.",
    });
    return;
  }

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Salvar",
    text: "Deseja salvar alterações?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!isConfirmed) return;

  try {
    await api.setMeusDados({
      p_tipocliente: getRadio(),
      p_nomerazao: nomerazao,
      p_cnpjcpf: cpfcnpj,
      p_cep: cep,
      p_endereco: endereco,
      p_bairro: bairro,
      p_cidade: cidade,
      p_estado: estado,
      p_numero: numero,
      p_lucro: lucro,
    });
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Alterações salvas com sucesso!",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Erro ao salvar: ${err.message}`,
    });
  }
}

/* =========================
 * Bancos
 * ========================= */
function clearBanksTbody() {
  const tbody = q(SEL.TBODY_BANCOS);
  if (tbody) tbody.innerHTML = "";
}

async function loadBancos() {
  try {
    const data = await api.getBancos();
    const list = Array.isArray(data) ? data : [];
    const tbody = q(SEL.TBODY_BANCOS);
    clearBanksTbody();

    const frag = document.createDocumentFragment();
    list.forEach((item) => {
      const tr = el("tr", {}, [
        td(item.p_banco),
        td(item.p_agencia),
        td(item.p_numero),
        td(item.p_tipo_conta),
        td(item.p_pix),
      ]);

      const tdBtn = el("td", { style: { textAlign: "center" } });
      tdBtn.innerHTML = TableUtils.insertDeleteButtonCell(
        SEL.BTN_DEL_BANK.slice(1)
      );
      tr.appendChild(tdBtn);

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar bancos.",
    });
  }
}

async function onSalvarBanco() {
  const { value: banco } = q(SEL.IN_BANCO) ?? {};
  const { value: tipo_conta } = q(SEL.IN_TIPO_CONTA) ?? {};
  const { value: agencia } = q(SEL.IN_AGENCIA) ?? {};
  const { value: numconta } = q(SEL.IN_NUM_CONTA) ?? {};
  const { value: pix } = q(SEL.IN_PIX) ?? {};

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Inserir",
    text: "Deseja salvar banco?",
    showDenyButton: true,
    confirmButtonText: "Confirmar",
    denyButtonText: "Cancelar",
  });
  if (!isConfirmed) return;

  try {
    await api.setBanco({
      p_banco: banco || "",
      p_tipo_conta: tipo_conta || "",
      // Atenção: se seu backend esperava o inverso, inverta as próximas 2 linhas
      p_agencia: agencia || "",
      p_numero: numconta || "",
      p_pix: pix || "",
    });

    await loadBancos();
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Banco inserido com sucesso!",
    });
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: e.message || "Não foi possível salvar banco.",
    });
  }
}

async function onDeleteBanco(e) {
  const btn = e.target.closest(SEL.BTN_DEL_BANK);
  if (!btn) return;

  const tr = btn.closest("tr");
  const nomeBanco = tr?.cells?.[0]?.textContent?.trim();
  if (!nomeBanco) return;

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    text: "Deseja excluir banco?",
    confirmButtonText: "Sim",
    denyButtonText: "Não",
    showDenyButton: true,
  });
  if (!isConfirmed) return;

  try {
    await api.delBanco({ p_banco: nomeBanco });
    tr.remove();
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Banco removido com sucesso!",
    });
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Não foi possível excluir: ${e.message}`,
    });
  }
}

/* =========================
 * Init
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  fillStates();
  CepUtils.attachMask(SEL.IN_CEP);
  bindTipoClienteRadios();

  await Promise.all([loadMeusDados(), loadBancos()]);

  // Garante labels corretos mesmo sem dados prévios
  updateTipoClienteLabels();

  EventUtils.addEventToElement(SEL.BT_ATUALIZAR, "click", onSalvarMeusDados);
  EventUtils.addEventToElement(SEL.BT_ADD_BANK, "click", onSalvarBanco);
  EventUtils.addEventToElement(SEL.TBODY_BANCOS, "click", onDeleteBanco);
  EventUtils.addEventToElement(SEL.IN_CEP, "blur", onFindCep);
});

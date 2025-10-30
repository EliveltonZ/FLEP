// app-orcamentos.js (refatorado e ajustado)

// =========================
// Imports
// =========================
import {
  EventUtils,
  DomUtils,
  DateUtils,
  FormatUtils,
  TableUtils,
  API,
} from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";
import { enableTableFilterSort } from "./filtertable.js";

// =========================
// Constantes / Selectors
// =========================
const SEL = {
  T_ORCAMENTOS: "#table",
  T_ORCAMENTOS_TBODY: "#table tbody",
  T_AMBIENTES: "#table-ambientes",
  T_AMBIENTES_TBODY: "#body-table-ambientes",
  T_MATERIAIS: "#table_materiais",
  T_MATERIAIS_TBODY: "#table_materiais tbody",
  T_MATERIAIS_AMBIENTE: "#table-2",
  T_MATERIAIS_AMBIENTE_TBODY: "#table-2 tbody",
  T_CLIENTES: "#table-clientes",
  T_CLIENTES_TBODY: "#body-table-clientes",
  T_CUSTOS: "#table-3",
  T_CUSTOS_TBODY: "#table-3 tbody",
  T_VALORES: "#table-4",
  T_VALORES_TBODY: "#table-4 tbody",
  OP_TIPO_AMBIENTE: "#txt_tipoambiente",
  OP_AMBIENTE: "#txt_ambiente",
  OP_TIPO: "#txt_tipo",
  IN_CODIGO: "#txt_codigo",
  IN_DESC: "#txt_descricao",
  IN_PRECO: "#txt_preco",
  IN_QTD: "#txt_qtd",
  IN_CUSTO_DESC: "#txt_descricao_c",
  IN_CUSTO_QTD: "#txt_qtd_c",
  IN_CUSTO_PRECO: "#txt_preco_c",
  IN_ENTRADA: "#txt_entrada",

  LB_ID: "#lb_id",
  LB_CPF: "#lb_cpf",
  LB_NOME: "#lb_nome",

  TAB_AMBIENTES: 'a[href="#tab-2"]',
  TAB_MATERIAIS: 'a[href="#tab-3"]',
  TAB_VALORES: 'a[href="#tab-5"]',

  DIV_CUSTOS: "#div-custos",

  BT_NEW_ORC: "#bt_new_orcamento",
  BT_NEW_AMB: "#bt_new_ambiente",
  BT_NEW_ITEM: "#bt_new_material",
  BT_NEW_CUSTO: "#bt_new_custo",
  BT_LAST_ORC: "#bt_last_orcament",

  RADIO_TIPO: 'input[name="tipo"]',

  // Radios
  R_CARTAO_CRED: "#radio-cartao-credito",
  R_FINANCIAMENTO: "#radio-financiamento",
  R_CARTAO_DEB: "#radio-cartao-debito",

  // Labels totais
  LB_MATERIAL: "#lb_material",
  LB_MATERIAL_P: "#lb_material_p",
  LB_INSTALACAO: "#lb_instalacao",
  LB_INSTALACAO_P: "#lb_instalacao_p",
  LB_RT: "#lb_comissaort",
  LB_RT_P: "#lb_comissaort_p",
  LB_TOTAL: "#lb_total",
  LB_LUCRO: "#lb_lucro",
  LB_LUCRO_P: "#lb_lucro_p",
  LB_IMPOSTOS: "#lb_impostos",
  LB_IMPOSTOS_P: "#lb_impostos_p",
  LB_TOTAL_JUROS: "#lb_totaljuros",
  LB_TOTAL_PROP: "#lb_totalproposta",
  LB_JUROS: "#lb_juros",
  LB_JUROS_P: "#lb_juros_p",
  LB_VALOR_PARC: "#lb_valorparcela",

  LB_ULT_ORC: "#lb_ultimo_orcamento",
  LB_PARC_ORC: "#lb_parcela_orcada",
  LB_TAXA_ORC: "#lb_taxa_orcada",
  LB_TIPO: "#lb_tipo",

  TXT_TAXA: "#txt_taxa",
};

var order = 0;

// =========================
// Helpers DOM (mínimos, reusáveis)
// =========================
const q = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  const { dataset, style, className, ...rest } = props || {};
  Object.assign(node, rest);
  if (className) node.className = className;
  if (style) {
    if (typeof style === "string") node.setAttribute("style", style);
    else if (typeof style === "object") Object.assign(node.style, style);
  }
  if (dataset && typeof dataset === "object") {
    Object.entries(dataset).forEach(([k, v]) => (node.dataset[k] = String(v)));
  }
  (children || []).forEach((c) =>
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return node;
};
const tdCenter = (text) =>
  el("td", { textContent: text, style: "text-align:center" });
const tdCurrency = (val) =>
  el("td", {
    textContent: FormatUtils.formatCurrencyBR(val),
    style: "text-align:center",
  });
const fragment = () => document.createDocumentFragment();
// ids seguros para comissões dinâmicas
const slug = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// =========================
/** Estado da aplicação */
// =========================
const AppState = {
  idMarcenaria: null,
  orcamentoAtual: null,
  idAmbiente: null,
  cache: {
    orcamentos: null,
    ambientes: new Map(),
    materiaisAmbiente: new Map(),
    totais: null, // /totalOcamentos (ver comentário no api)
    comissoes: null,
  },
};

// =========================
// Fetch wrapper & API
// =========================
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
        body?.message || body?.error || body?.raw || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return body;
  } catch (err) {
    console.error("fetchJson error:", url, err);
    throw err;
  }
}

const api = {
  getOrcamentos: () => fetchJson(`/getOrcamentos`),

  setOrcamento: (payload) =>
    fetchJson(`/setOrcamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getComissoes: () => fetchJson(`/getComissoes`),

  getAmbientes: (idOrcamento) =>
    fetchJson(`/getAmbientes?p_orcamento=${encodeURIComponent(idOrcamento)}`),

  setAmbiente: (payload) =>
    fetchJson(`/setAmbientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getMateriaisAmbiente: ({ idAmbiente }) =>
    fetchJson(`/getMateriaisambientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_id_orcamento: AppState.orcamentoAtual,
        p_id_ambiente: idAmbiente,
      }),
    }),

  getMateriais: () => fetchJson(`/fillTableMateriais`),

  getClientes: () => fetchJson(`/fillTableClients`),

  getCategoriasAmbientes: () => fetchJson(`/getCategoriasAmbientes`),

  setMateriaisAmbientes: (payload) =>
    fetchJson(`/setMateriaisAmbientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getCustos: () =>
    fetchJson(
      `/fillTableCustos?p_id_orcamento=${encodeURIComponent(
        AppState.orcamentoAtual
      )}`
    ),

  setCusto: (payload) =>
    fetchJson(`/setCustos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // IMPORTANTE: se o endpoint correto for /totalOrcamentos (com "r"), ajuste aqui.
  getValoresOrcamento: (idOrc) =>
    fetchJson(`/totalOcamentos?p_id_orcamento=${encodeURIComponent(idOrc)}`),

  getTaxasParcelamentos: (tipo) =>
    fetchJson(`/getTaxasParcelamentos?p_tipo=${encodeURIComponent(tipo)}`),

  delMaterialAmbiente: (payload) =>
    fetchJson(`/delMaterialAmbiente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  getUltimoOrcamento: (id_orcamento) =>
    fetchJson(
      `/getUltimoOrcamento?p_id_orcamento=${encodeURIComponent(id_orcamento)}`
    ),

  setUltimoOrcamento: (payload) => {
    return fetchJson(`/setUltimoOrcamento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};

// =========================
// Renderizadores (puros)
// =========================
function renderOrcamentosTable(items) {
  const tbody = q(SEL.T_ORCAMENTOS_TBODY);
  tbody.innerHTML = "";
  const frag = fragment();

  for (const it of items) {
    const tr = el(
      "tr",
      { dataset: { orcamento: it.p_orcamento }, className: "" },
      [
        tdCenter(it.p_orcamento),
        el("td", { textContent: it.p_nome }),
        tdCenter(it.p_ambientes),
        tdCenter(it.p_status),
        tdCenter(DateUtils.toBR(it.p_data)),
      ]
    );

    const tdBtn = el("td", { style: "text-align:center" }, [
      el("button", {
        className: "btn bt-color order",
        type: "button",
        style: "padding:0;height:17px;font-size:10px;width:30px;",
        title: "Ver valores",
        innerHTML: '<i class="icon ion-social-usd"></i>',
      }),
    ]);
    tr.appendChild(tdBtn);

    frag.appendChild(tr);
  }
  tbody.appendChild(frag);
}

function renderAmbientesTable(items) {
  const tbody = q(SEL.T_AMBIENTES_TBODY);
  tbody.innerHTML = "";
  const frag = fragment();

  for (const it of items) {
    const tr = el("tr", { dataset: { ambiente: it.id_ambiente } }, [
      tdCenter(it.id_ambiente),
      el("td", { textContent: it.categoria }),
      el("td", { textContent: it.p_descricao }),
    ]);
    frag.appendChild(tr);
  }
  tbody.appendChild(frag);
}

function renderMateriaisAmbienteTable(items) {
  const tbody = q(SEL.T_MATERIAIS_AMBIENTE_TBODY);
  tbody.innerHTML = "";
  const frag = fragment();

  for (const it of items) {
    const tr = el("tr", {}, [
      tdCenter(it.p_material),
      el("td", { textContent: it.p_descricao }),
      tdCenter(it.p_quantidade),
      tdCenter(Number(it.p_preco).toFixed(2)),
      tdCenter(Number(it.p_total).toFixed(2)),
    ]);
    const td = el("td", { style: "text-align:center" });
    td.innerHTML = TableUtils.insertDeleteButtonCell("delRow");
    tr.appendChild(td);
    frag.appendChild(tr);
  }
  tbody.appendChild(frag);
}

function renderMateriaisTable(items) {
  const tbody = q(SEL.T_MATERIAIS_TBODY);
  tbody.innerHTML = "";
  const frag = fragment();

  for (const it of items) {
    const tr = el("tr", {}, [
      tdCenter(it.p_id_material),
      el("td", { textContent: it.p_descricao }),
      tdCenter(it.p_unidade),
      tdCenter(FormatUtils.formatCurrencyBR(it.p_preco)),
    ]);
    frag.appendChild(tr);
  }

  tbody.appendChild(frag);
}

function renderClientesTable(items) {
  const tbody = q(SEL.T_CLIENTES_TBODY);
  tbody.innerHTML = "";
  const frag = fragment();

  for (const it of items) {
    const tr = el("tr", {}, [
      tdCenter(it.p_id_cliente),
      el("td", { textContent: formatCPF(it.p_cpf) }),
      el("td", { textContent: it.p_nome }),
    ]);
    frag.appendChild(tr);
  }

  tbody.appendChild(frag);
}

function renderCustosTable(items) {
  const tbody = q(SEL.T_CUSTOS_TBODY);
  tbody.innerHTML = "";
  const frag = fragment();

  for (const it of items) {
    const tr = el("tr", {}, [
      el("td", { textContent: it.p_descricao }),
      tdCenter(it.p_quantidade), // (fix) antes p_quatidade
      tdCurrency(it.p_preco),
      tdCurrency(it.p_total),
    ]);
    frag.appendChild(tr);
  }

  tbody.appendChild(frag);
}

function renderAmbientesValoresTable(items) {
  const list = Array.isArray(items) ? items : [];
  const tbody = q(SEL.T_VALORES_TBODY);
  tbody.innerHTML = "";
  const frag = fragment();

  list.forEach((it, index) => {
    const tr = el("tr", { dataset: { index } }, []);

    const tdChk = el("td");
    const chk = el("input", { type: "checkbox", className: "chk-selecao" });
    chk.dataset.index = String(index);
    tdChk.appendChild(chk);

    const tdId = el("td", { textContent: it.p_id_ambiente });
    const tdDes = el("td", { textContent: it.p_descricao });
    const tdTot = el("td", {
      textContent: FormatUtils.formatCurrencyBR(it.p_total),
    });

    tr.append(tdChk, tdId, tdDes, tdTot);
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

// =========================
// Cálculos & utils
// =========================
export function formatCPF(cpf = "") {
  const A = cpf.slice(0, 3);
  const B = cpf.slice(3, 6);
  const C = cpf.slice(6, 9);
  const D = cpf.slice(-2);
  return `${A}.${B}.${C}-${D}`;
}

const toNumber = (value) => {
  if (value == null) return 0;
  return parseFloat(String(value).replace(",", ".")) || 0;
};
const round2 = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? Number(num.toFixed(2)) : 0;
};

function computeTotals({ selecionados, entradaReais, taxaPercent }) {
  const totals = {
    material: 0,
    instalacao: 0,
    rt: 0,
    aVista: 0,
    imposto: 0,
    lucro: 0,
    percentRt: 0,
  };

  const comissoes = AppState.cache.comissoes || [];
  comissoes.forEach((c) => {
    const key = (c.p_descricao || "").toLowerCase();
    if (key === "comissão/rt") totals.percentRt = c.p_valor;
    else totals[key] = 0;
  });

  for (const item of selecionados) {
    const ambiente = item.p_ambiente;

    totals.material += item.p_material;
    totals.instalacao += item.p_instalacao;
    totals.rt += item.p_valor_rt;

    totals.imposto = item.p_imp;
    totals.lucro = item.p_luc;

    totals.aVista += item.p_total;

    for (const c of comissoes) {
      const key = (c.p_descricao || "").toLowerCase();
      if (key === "comissão/rt") continue;
      totals[key] = (totals[key] || 0) + ambiente * (c.p_valor / 100);
    }
  }

  const taxa = (taxaPercent || 0) / 100;
  const entrada = totals.aVista - (entradaReais || 0);

  const comEntrada =
    (entrada * (1 - totals.imposto - totals.lucro)) /
    (1 - totals.imposto - totals.lucro - taxa);

  const total = comEntrada + (entradaReais || 0);

  const comTaxa =
    (totals.aVista * (1 - totals.imposto - totals.lucro)) /
    (1 - totals.imposto - totals.lucro - taxa);

  return { totals, total, taxa, comEntrada, comTaxa };
}

async function loadComissoes() {
  AppState.cache.comissoes = await api.getComissoes();
}

// =========================
// UI de comissões e totais
// =========================
function comissaoRowTemplate(name, id_label, percent, value) {
  return `
    <div class="justify-content-between" style="display:flex;gap:20px;margin-bottom:10px;">
      <label class="form-label" style="width:40%;">${name}:</label>
      <label id="lb_${id_label}_p" class="form-label">${percent}%</label>
      <label id="lb_${id_label}" class="form-label">${FormatUtils.formatCurrencyBR(
    value
  )}</label>
    </div>
  `;
}

function renderComissoes() {
  const div = q(SEL.DIV_CUSTOS);
  (AppState.cache.comissoes || []).forEach((item) => {
    if ((item.p_descricao || "").toLowerCase() === "comissão/rt") return;
    const id = slug(item.p_descricao);
    div.innerHTML += comissaoRowTemplate(item.p_descricao, id, 0, 0);
  });
}

function applyTotalsToUI(calc) {
  const { totals, total, taxa, comEntrada, comTaxa } = calc;
  const pctOfComTaxa = (v) =>
    FormatUtils.formatPercentBR(round2((v / comTaxa) * 100));

  // materiais
  DomUtils.setInnerHtml(
    SEL.LB_MATERIAL,
    FormatUtils.formatCurrencyBR(totals.material)
  );
  DomUtils.setInnerHtml(
    SEL.LB_MATERIAL_P,
    FormatUtils.formatPercentBR(toNumber((totals.material / total) * 100))
  );

  // instalação
  DomUtils.setInnerHtml(
    SEL.LB_INSTALACAO,
    FormatUtils.formatCurrencyBR(totals.instalacao)
  );
  DomUtils.setInnerHtml(SEL.LB_INSTALACAO_P, pctOfComTaxa(totals.instalacao));

  // comissões dinâmicas
  (AppState.cache.comissoes || []).forEach((item) => {
    const key = (item.p_descricao || "").toLowerCase();
    const id = slug(item.p_descricao);
    DomUtils.setInnerHtml(
      `#lb_${id}`,
      FormatUtils.formatCurrencyBR(totals[key] || 0)
    );
    DomUtils.setInnerHtml(
      `#lb_${id}_p`,
      FormatUtils.formatPercentBR(item.p_valor)
    );
  });

  // comissão RT
  DomUtils.setInnerHtml(SEL.LB_RT, FormatUtils.formatCurrencyBR(totals.rt));
  DomUtils.setInnerHtml(
    SEL.LB_RT_P,
    FormatUtils.formatPercentBR(totals.percentRt)
  );

  // totais
  DomUtils.setInnerHtml(
    SEL.LB_TOTAL,
    FormatUtils.formatCurrencyBR(totals.aVista)
  );
  DomUtils.setInnerHtml(
    SEL.LB_LUCRO,
    FormatUtils.formatCurrencyBR(total * totals.lucro)
  );
  DomUtils.setInnerHtml(
    SEL.LB_LUCRO_P,
    FormatUtils.formatPercentBR(totals.lucro * 100)
  );
  DomUtils.setInnerHtml(
    SEL.LB_IMPOSTOS,
    FormatUtils.formatCurrencyBR(total * totals.imposto)
  );
  DomUtils.setInnerHtml(
    SEL.LB_TOTAL_JUROS,
    FormatUtils.formatCurrencyBR(comEntrada)
  );
  DomUtils.setInnerHtml(SEL.LB_TOTAL_PROP, FormatUtils.formatCurrencyBR(total));
  DomUtils.setInnerHtml(
    SEL.LB_IMPOSTOS_P,
    FormatUtils.formatPercentBR(round2(totals.imposto * 100))
  );
  DomUtils.setInnerHtml(
    SEL.LB_JUROS,
    FormatUtils.formatCurrencyBR(comEntrada * taxa)
  );
  DomUtils.setInnerHtml(
    SEL.LB_JUROS_P,
    FormatUtils.formatPercentBR(taxa * 100)
  );

  const parcelas = toNumber(DomUtils.getSelectedOptionText(SEL.OP_TIPO));
  DomUtils.setInnerHtml(
    SEL.LB_VALOR_PARC,
    FormatUtils.formatCurrencyBR(parcelas ? comEntrada / parcelas : 0)
  );
}

// =========================
// Handlers (controladores)
// =========================
async function onRowDblClickOrcamentos(e) {
  const row = e.target.closest("tr");
  if (!row?.cells?.length) return;

  qa(`${SEL.T_ORCAMENTOS_TBODY} tr`).forEach((tr) =>
    tr.classList.remove("table-click-row")
  );
  row.classList.add("table-click-row");

  const idOrc = row.cells[0].textContent.trim();
  AppState.orcamentoAtual = idOrc;
  localStorage.setItem("orcamento", idOrc);

  try {
    await loadAmbientes(idOrc);
    await loadCustos();
    const trigger = q(SEL.TAB_AMBIENTES);
    if (trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();
  } catch (err) {
    console.error("onRowDblClickOrcamentos:", err);
  }
}

function handlePaymentTipe() {
  const radios = document.querySelector('input[name="tipo"]:checked');
  return radios.value;
}

async function onRowDblClickAmbientes(e) {
  const row = e.target.closest("tr");
  if (!row?.cells?.length) return;

  qa(`${SEL.T_AMBIENTES} tbody tr`).forEach((tr) =>
    tr.classList.remove("table-click-row")
  );
  row.classList.add("table-click-row");

  const idAmbiente = row.cells[0].textContent.trim();
  AppState.idAmbiente = idAmbiente;
  localStorage.setItem("ambiente", idAmbiente);

  await loadMateriaisAmbiente(idAmbiente);

  const trigger = q(SEL.TAB_MATERIAIS);
  if (trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();
}

function onClickCliente(e) {
  const row = e.target.closest("tr");
  if (!row) return;

  DomUtils.setInnerHtml(SEL.LB_ID, row.cells[0]?.textContent.trim() ?? "");
  DomUtils.setInnerHtml(SEL.LB_CPF, row.cells[1]?.textContent.trim() ?? "");
  DomUtils.setInnerHtml(SEL.LB_NOME, row.cells[2]?.textContent.trim() ?? "");
}

async function onConfirmGerarOrcamento() {
  const nome = DomUtils.getInnerHtml(SEL.LB_NOME) || "o cliente selecionado";
  const result = await Swal.fire({
    icon: "question",
    title: "Orçamentos",
    text: `Deseja gerar orçamento para ${nome}?`,
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!result.isConfirmed) return;

  try {
    await api.setOrcamento({ p_id_cliente: DomUtils.getInnerHtml(SEL.LB_ID) });
    await loadOrcamentos();
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Orçamento gerado com sucesso!",
    });
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível gerar o orçamento.",
    });
  }
}

async function onConfirmSetAmbiente() {
  const categoria = q(SEL.OP_TIPO_AMBIENTE)?.value || "";
  const descricao = DomUtils.getText(SEL.OP_AMBIENTE);

  if (!categoria || !descricao) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Preencha os campos obrigatórios",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir novo ambiente?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });
  if (!result.isConfirmed) return;

  try {
    await api.setAmbiente({
      p_id_orcamento: AppState.orcamentoAtual,
      p_id_categoria: categoria,
      p_descricao: descricao.toUpperCase(),
    });
    await loadAmbientes(AppState.orcamentoAtual);
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Ambiente inserido com sucesso!",
    });
  } catch {
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: "Não foi possível inserir ambiente.",
    });
  }
}

// Handler
async function onConfirmLastOrcamento() {
  const result = await Swal.fire({
    icon: "question",
    title: "Salvar",
    text: "Deseja salvar ultimo Orçamento ?",
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    showDenyButton: true,
  });
  if (!result.isConfirmed) return;

  try {
    const select = document.querySelector('select[name="tipo"] option:checked');
    const data = {
      p_id_orcamento: Number(localStorage.getItem("idOrc")),
      p_num_parcelas: Number(select?.innerText ?? 0), // ver nota abaixo
      p_taxa_orcada: Number(select?.value ?? 0),
      p_tipo_taxa: handlePaymentTipe(),
      p_ultimo_valor_orcado: Number(
        FormatUtils.toDecimalStringFromBR(DomUtils.getInnerHtml(SEL.LB_ULT_ORC))
      ),
    };

    await fetch("/setUltimoOrcamento", {
      method: "PUT",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify(data),
    });

    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Orçamento lançado com Sucesso !!!",
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Falha ao salvar orçamento.",
    });
  }
}

function onClickMaterialLinha(e) {
  const row = e.target.closest("tr");
  if (!row?.cells?.length) return;

  DomUtils.setText(SEL.IN_CODIGO, row.cells[0].textContent.trim());
  DomUtils.setText(SEL.IN_DESC, row.cells[1].textContent.trim());
  DomUtils.setText(SEL.IN_PRECO, row.cells[3].textContent.trim());
}

async function onConfirmInserirMaterialAmbiente() {
  const result = await Swal.fire({
    icon: "question",
    title: "Confirmar",
    text: "Deseja inserir item?",
    confirmButtonText: "Confirmar",
    denyButtonText: "Cancelar",
    showDenyButton: true,
  });
  if (!result.isConfirmed) return;

  try {
    await api.setMateriaisAmbientes({
      p_id_orcamento: AppState.orcamentoAtual,
      p_id_ambiente: AppState.idAmbiente,
      p_id_material: DomUtils.getText(SEL.IN_CODIGO),
      p_quantidade: DomUtils.getText(SEL.IN_QTD),
      p_preco: FormatUtils.toDecimalStringFromBR(
        DomUtils.getText(SEL.IN_PRECO)
      ),
    });
    await loadMateriaisAmbiente(AppState.idAmbiente);
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Item lançado com sucesso!",
    });
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível inserir item.",
    });
  }
}

async function onConfirmInserirCusto() {
  const result = await Swal.fire({
    icon: "question",
    title: "Deseja inserir custos?",
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    showDenyButton: true,
  });
  if (!result.isConfirmed) return;

  try {
    await api.setCusto({
      p_id_orcamento: AppState.orcamentoAtual,
      p_descricao: DomUtils.getText(SEL.IN_CUSTO_DESC),
      p_quantidade: DomUtils.getText(SEL.IN_CUSTO_QTD),
      p_preco: DomUtils.getText(SEL.IN_CUSTO_PRECO),
    });
    await loadCustos();
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Custo lançado com sucesso!",
    });
  } catch {
    Swal.fire({ icon: "error", title: "ERRO", text: "Erro ao inserir custo." });
  }
}

async function onDelMaterialAmbiente(buttonEvt) {
  const bt = buttonEvt.target.closest(".delRow");
  if (!bt) return;

  const idItem = bt.closest("tr").cells[0].textContent.trim();
  const payload = {
    p_id_orcamento: AppState.orcamentoAtual,
    p_id_ambiente: AppState.idAmbiente,
    p_id_material: idItem,
  };

  const result = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deletar item do Pedido?",
    denyButtonText: "Cancelar",
    showDenyButton: true,
    confirmButtonText: "Confirmar",
  });
  if (!result.isConfirmed) return;

  try {
    await api.delMaterialAmbiente(payload);
    await loadMateriaisAmbiente(AppState.idAmbiente);
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Item excluído com sucesso!",
    });
  } catch (erro) {
    Swal.fire({ icon: "error", title: "ERRO", text: `ERRO: ${erro.message}` });
  }
}

async function onChangeTipoParcelamento() {
  const taxa = q(SEL.OP_TIPO)?.value || "0"; // (fix) ler value do select
  DomUtils.setInnerHtml(SEL.TXT_TAXA, FormatUtils.formatPercentBR(taxa));
  await atualizarTotaisUI();
}
const onChangeEntrada = () => atualizarTotaisUI();

async function onOrderValuesClick(e) {
  const tr = e.target.closest("tr");
  if (!tr) return;
  const idOrc = tr.cells[0].textContent.trim();
  localStorage.setItem("idOrc", idOrc);

  await loadAmbientesValores(idOrc);

  const trigger = q(SEL.TAB_VALORES);
  if (trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();

  await atualizarTotaisUI();

  const lastValues = await api.getUltimoOrcamento(idOrc);
  if (Array.isArray(lastValues) && lastValues[0])
    await handleLastOrc(lastValues[0]);
}

async function handleLastOrc(data) {
  DomUtils.setInnerHtml(
    SEL.LB_ULT_ORC,
    FormatUtils.formatCurrencyBR(data.p_ultimo_orcamento)
  );
  DomUtils.setInnerHtml(SEL.LB_PARC_ORC, data.p_num_parcelas);
  DomUtils.setInnerHtml(
    SEL.LB_TAXA_ORC,
    FormatUtils.formatPercentBR(data.p_taxa_orcada)
  );
  setRadioTax(data.p_tipo_taxa);
  DomUtils.setInnerHtml(SEL.LB_TIPO, typeTax(data.p_tipo_taxa));

  await loadTaxasParcelamento(
    String(data.p_tipo_taxa || "").toUpperCase() || "D"
  );
  const sel = q(SEL.OP_TIPO);
  if (sel) {
    sel.value = String(data.p_taxa_orcada ?? "");
    // força atualização dos rótulos/totais
    await onChangeTipoParcelamento();
  }

  // rebind se necessário
  bindParcelamentoRadios();
}

// =========================
// Totais (UI)
// =========================
async function atualizarTotaisUI() {
  const data = AppState.cache.totais || [];
  const selecionados = qa(`${SEL.T_VALORES_TBODY} input[type="checkbox"]`)
    .filter((chk) => chk.checked)
    .map((chk) => data[Number(chk.dataset.index)]);

  const entradaReais = toNumber(DomUtils.getText(SEL.IN_ENTRADA));
  const taxaPercent = toNumber(q(SEL.OP_TIPO)?.value || "0"); // (fix)

  const calc = computeTotals({ selecionados, entradaReais, taxaPercent });
  applyTotalsToUI(calc);
}

// =========================
// Radios (parcelamento) + setRadioTax
// =========================
function bindParcelamentoRadios() {
  qa(SEL.RADIO_TIPO).forEach((radio) => {
    radio.addEventListener("change", () => loadTaxasParcelamento(radio.value));
    if (radio.checked) loadTaxasParcelamento(radio.value);
  });
}

function typeTax(value) {
  if (value === "C") return "Crédito";
  if (value === "F") return "Financiamento";
  return "Débito";
}

function setRadioTax(value) {
  const v = String(value || "")
    .trim()
    .toUpperCase();
  const map = {
    C: SEL.R_CARTAO_CRED,
    F: SEL.R_FINANCIAMENTO,
    D: SEL.R_CARTAO_DEB,
  };
  const sel = map[v] || map.D;
  [SEL.R_CARTAO_CRED, SEL.R_FINANCIAMENTO, SEL.R_CARTAO_DEB].forEach((s) =>
    DomUtils.setChecked(s, false)
  );
  DomUtils.setChecked(sel, true); // (fix) não remover o '#'
}

// =========================
// Loaders com cache leve
// =========================
async function loadOrcamentos() {
  try {
    const data = await api.getOrcamentos();
    AppState.cache.orcamentos = data;
    renderOrcamentosTable(data);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Não foi possível carregar orçamentos. ${err.message}`,
    });
  }
}

async function loadAmbientes(idOrcamento) {
  try {
    const data = await api.getAmbientes(idOrcamento);
    AppState.cache.ambientes.set(idOrcamento, data);
    renderAmbientesTable(data);
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar ambientes.",
    });
  }
}

async function loadMateriaisAmbiente(idAmbiente) {
  try {
    const data = await api.getMateriaisAmbiente({ idAmbiente });
    AppState.cache.materiaisAmbiente.set(idAmbiente, data);
    renderMateriaisAmbienteTable(data);
  } catch (erro) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Não foi possível carregar materiais do ambiente. ${erro.message}`,
    });
  }
}

async function loadMateriais() {
  try {
    const data = await api.getMateriais();
    renderMateriaisTable(data);
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar materiais.",
    });
  }
}

async function loadClientes() {
  try {
    const data = await api.getClientes();
    renderClientesTable(data);
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar clientes.",
    });
  }
}

async function loadCategoriasAmbientes() {
  try {
    const data = await api.getCategoriasAmbientes();
    const select = q(SEL.OP_TIPO_AMBIENTE);
    select.innerHTML = `<option value="">Selecione o Tipo</option>`;
    data.forEach((item) => {
      select.appendChild(
        el("option", {
          value: item.p_id_categoria,
          textContent: item.p_categoria,
        })
      );
    });
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar categorias de ambiente.",
    });
  }
}

async function loadCustos() {
  try {
    const data = await api.getCustos();
    renderCustosTable(data);
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar custos.",
    });
  }
}

async function loadTaxasParcelamento(tipo) {
  try {
    let data = [];
    if (tipo === "D") data = [{ p_qtd_parcela: 1, p_taxa: 0 }];
    else data = await api.getTaxasParcelamentos(tipo);

    const select = q(SEL.OP_TIPO);
    select.innerHTML = "";
    data.forEach((item) => {
      select.appendChild(
        el("option", {
          value: item.p_taxa, // value = taxa (percentual)
          textContent: item.p_qtd_parcela, // texto = nº parcelas
        })
      );
    });
    await onChangeTipoParcelamento();
  } catch (err) {
    console.warn("loadTaxasParcelamento:", err);
  }
}

async function loadAmbientesValores(idOrc) {
  try {
    if (!idOrc) {
      console.warn("Guards: orcamentoAtual ausente", AppState);
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Selecione um orçamento válido.",
      });
      return;
    }

    const data = await api.getValoresOrcamento(idOrc);
    if (!Array.isArray(data)) {
      console.warn("Esperava array em getValoresOrcamento, recebi:", data);
      AppState.cache.totais = [];
      renderAmbientesValoresTable([]);
      return;
    }

    AppState.cache.totais = data;
    renderAmbientesValoresTable(data);

    qa(".chk-selecao").forEach((chk) =>
      chk.addEventListener("change", atualizarTotaisUI)
    );
  } catch (err) {
    console.error("loadAmbientesValores:", err);
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: `Não foi possível carregar valores do orçamento. ${
        err.message || ""
      }`.trim(),
    });
  }
}

// =========================
// Inicialização
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  // reset de seleção
  localStorage.removeItem("orcamento");
  localStorage.removeItem("ambiente");

  // carregamento inicial (em paralelo)
  await Promise.all([
    loadComissoes(),
    loadOrcamentos(),
    loadCategoriasAmbientes(),
    loadClientes(),
    loadMateriais(),
  ]);

  // efeitos e filtros
  EventUtils.tableHover(SEL.T_ORCAMENTOS.slice(1));
  EventUtils.tableHover(SEL.T_CLIENTES.slice(1));
  EventUtils.tableHover(SEL.T_AMBIENTES.slice(1));
  EventUtils.tableHover(SEL.T_MATERIAIS_AMBIENTE.slice(1));
  EventUtils.tableHover(SEL.T_CUSTOS.slice(1));
  EventUtils.tableHover(SEL.T_VALORES.slice(1));
  enableTableFilterSort(SEL.T_ORCAMENTOS.slice(1));
  enableTableFilterSort(SEL.T_MATERIAIS.slice(1));
  EventUtils.enableEnterAsTab?.();

  // Delegação de eventos (mais robusto para linhas dinâmicas)
  EventUtils.addEventToElement(
    SEL.T_ORCAMENTOS_TBODY,
    "dblclick",
    onRowDblClickOrcamentos
  );
  EventUtils.addEventToElement(
    SEL.T_AMBIENTES,
    "dblclick",
    onRowDblClickAmbientes
  );
  EventUtils.addEventToElement(
    SEL.T_MATERIAIS_TBODY,
    "click",
    onClickMaterialLinha
  );
  EventUtils.addEventToElement(SEL.T_CLIENTES, "click", onClickCliente);
  EventUtils.addEventToElement(SEL.T_ORCAMENTOS_TBODY, "click", (e) => {
    if (e.target.closest(".order")) onOrderValuesClick(e);
  });

  EventUtils.addEventToElement(
    SEL.BT_NEW_ORC,
    "click",
    onConfirmGerarOrcamento
  );
  EventUtils.addEventToElement(SEL.BT_NEW_AMB, "click", onConfirmSetAmbiente);
  EventUtils.addEventToElement(
    SEL.BT_NEW_ITEM,
    "click",
    onConfirmInserirMaterialAmbiente
  );
  // (fix) listener de delete na tabela correta
  EventUtils.addEventToElement(
    SEL.T_MATERIAIS_AMBIENTE_TBODY,
    "click",
    onDelMaterialAmbiente
  );
  EventUtils.addEventToElement(
    SEL.BT_NEW_CUSTO,
    "click",
    onConfirmInserirCusto
  );
  EventUtils.addEventToElement(SEL.OP_TIPO, "change", onChangeTipoParcelamento);
  EventUtils.addEventToElement(SEL.IN_ENTRADA, "input", onChangeEntrada);
  EventUtils.addEventToElement(
    SEL.BT_LAST_ORC,
    "click",
    async () => await onConfirmLastOrcamento()
  );

  // radios de parcelamento
  bindParcelamentoRadios();

  // comissões
  renderComissoes();
});

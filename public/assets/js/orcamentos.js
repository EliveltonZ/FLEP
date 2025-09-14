// app-orcamentos.js
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

/* =========================
 * Helpers de DOM
 * ========================= */
const q = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  Object.assign(node, props);
  children.forEach((c) =>
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return node;
};
const currencyCell = (value) =>
  el("td", {
    style: "text-align:center",
    textContent: FormatUtils.formatCurrencyBR(value),
  });
const centerCell = (value) =>
  el("td", { style: "text-align:center", textContent: value });
const html = (s) => {
  const t = document.createElement("template");
  t.innerHTML = String(s).trim();
  return t.content.firstElementChild; // ex.: a <td> gerada
};
/* =========================
 * Estado da aplicação
 * ========================= */
const AppState = {
  idMarcenaria: null,
  orcamentoAtual: null,
  idAmbiente: null,
  cache: {
    orcamentos: null,
    ambientes: new Map(), // idOrcamento -> array
    materiaisAmbiente: new Map(), // idAmbiente -> array
    totais: null, // resultado de /totalOcamentos
    comissoes: null,
  },
};

/* =========================
 * Fetch wrapper & camada de API
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
  getOrcamentos: (id) => fetchJson(`/getOrcamentos`),

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

  // IMPORTANTE: se o endpoint correto for /totalOrcamentos (com "r"), troque aqui.
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
};

function createButton(_class) {
  return `
    <td style="text-align: center" >
      <button class="btn bt-color ${_class}" type="button" style="padding: 0;height: 17px;font-size: 10px;width: 30px;">
        <i class="icon ion-social-usd"></i>
      </button>
    </td>
  `;
}

/* =========================
 * Renderizadores puros
 * ========================= */
function renderOrcamentosTable(items) {
  const tbody = q("#table tbody");
  tbody.innerHTML = "";
  for (const it of items) {
    const tr = el("tr", {}, [
      centerCell(it.p_orcamento),
      el("td", { textContent: it.p_nome }),
      centerCell(it.p_ambientes),
      centerCell(it.p_status),
      centerCell(DateUtils.toBR(it.p_data)),
    ]);
    tr.innerHTML += createButton("order");
    tbody.appendChild(tr);
  }
}

function renderAmbientesTable(items) {
  const tbody = q("#body-table-ambientes");
  tbody.innerHTML = "";
  for (const it of items) {
    const tr = el("tr", {}, [
      centerCell(it.id_ambiente),
      el("td", { textContent: it.categoria }),
      el("td", { textContent: it.p_descricao }),
    ]);
    tbody.appendChild(tr);
  }
}

function renderMateriaisAmbienteTable(items) {
  const tbody = q("#body-table-materiais");
  tbody.innerHTML = "";
  for (const it of items) {
    const tr = el("tr", {}, [
      centerCell(it.p_material),
      el("td", { textContent: it.p_descricao }),
      centerCell(it.p_quantidade),
      centerCell(Number(it.p_preco).toFixed(2)),
      centerCell(Number(it.p_total).toFixed(2)),
    ]);
    const td = document.createElement("td");
    td.style.textAlign = "center";
    td.innerHTML = TableUtils.insertDeleteButtonCell("delRow");
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

function renderMateriaisTable(items) {
  const tbody = q("#table_materiais tbody");
  tbody.innerHTML = "";
  for (const it of items) {
    const tr = el("tr", {}, [
      centerCell(it.p_id_material),
      el("td", { textContent: it.p_descricao }),
      centerCell(it.p_unidade),
      centerCell(FormatUtils.formatCurrencyBR(it.p_preco)),
    ]);
    tbody.appendChild(tr);
  }
}

function renderClientesTable(items) {
  const tbody = q("#body-table-clientes");
  tbody.innerHTML = "";
  for (const it of items) {
    const tr = el("tr", {}, [
      centerCell(it.p_id_cliente),
      el("td", { textContent: formatCPF(it.p_cpf) }),
      el("td", { textContent: it.p_nome }),
    ]);
    tbody.appendChild(tr);
  }
}

function renderCustosTable(items) {
  const tbody = q("#table-3 tbody");
  tbody.innerHTML = "";
  for (const it of items) {
    const tr = el("tr", {}, [
      el("td", { textContent: it.p_descricao }),
      centerCell(it.p_quatidade),
      currencyCell(it.p_preco),
      currencyCell(it.p_total),
    ]);
    tbody.appendChild(tr);
  }
}

function renderAmbientesValoresTable(items) {
  const list = Array.isArray(items) ? items : [];
  const tbody = document.querySelector("#table-4 tbody");
  tbody.innerHTML = "";

  list.forEach((it, index) => {
    const tr = document.createElement("tr");

    const tdChk = document.createElement("td");
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "chk-selecao";
    chk.dataset.index = String(index);
    tdChk.appendChild(chk);

    const tdId = document.createElement("td");
    tdId.textContent = it.p_id_ambiente;
    const tdDes = document.createElement("td");
    tdDes.textContent = it.p_descricao;
    const tdTot = document.createElement("td");
    tdTot.textContent = FormatUtils.formatCurrencyBR(it.p_total);

    tr.append(tdChk, tdId, tdDes, tdTot);
    tbody.appendChild(tr);
  });
}

/* =========================
 * Cálculos e utilitários
 * ========================= */
export function formatCPF(cpf = "") {
  const A = cpf.slice(0, 3);
  const B = cpf.slice(3, 6);
  const C = cpf.slice(6, 9);
  const D = cpf.slice(-2);
  return `${A}.${B}.${C}-${D}`;
}

function toNumber(value) {
  if (value == null) return 0;
  return parseFloat(String(value).replace(",", ".")) || 0;
}
function floatValue(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return parseFloat(num.toFixed(2));
}

function computeTotals({ selecionados, entradaReais, taxaPercent }) {
  var totals = {
    material: 0,
    instalacao: 0,
    rt: 0,
    aVista: 0,
    imposto: 0,
    lucro: 0,
  };

  AppState.cache.comissoes.forEach((item) => {
    if (item.p_descricao.toLowerCase() == "comissão/rt") {
      totals.percentRt = item.p_valor;
    }
    const key = (item.p_descricao || "").toLowerCase();
    totals[key] = 0;
  });

  for (var item of selecionados) {
    var ambiente = item.p_ambiente;
    totals.material += item.p_material;
    totals.instalacao += item.p_instalacao;
    totals.rt += item.p_valor_rt;
    totals.imposto = item.p_imp;
    totals.lucro = item.p_luc;
    totals.aVista += item.p_total;
    AppState.cache.comissoes.forEach((item) => {
      if (item.p_descricao.toLowerCase() == "comissão/rt") return;
      const key = (item.p_descricao || "").toLowerCase();
      totals[key] += ambiente * (item.p_valor / 100);
    });
  }

  const taxa = taxaPercent / 100;
  const entrada = totals.aVista - entradaReais;

  const comEntrada =
    (entrada * (1 - totals.imposto - totals.lucro)) /
    (1 - totals.imposto - totals.lucro - taxa);

  const total = comEntrada + entradaReais;

  const comTaxa =
    (totals.aVista * (1 - totals.imposto - totals.lucro)) /
    (1 - totals.imposto - totals.lucro - taxa);

  return { totals, total, taxa, comEntrada, comTaxa };
}

async function loadComissoes() {
  AppState.cache.comissoes = await api.getComissoes();
}

function createElementComissao(name, id_label, percent, value) {
  return `
  <div class="justify-content-between" style="display: flex;gap: 20px;margin-bottom: 10px;">
    <label class="form-label" style="width: 40%;">${name}:</label>
    <label id="lb_${id_label}_p" class="form-label">${percent}%</label>
    <label id="lb_${id_label}" class="form-label">${FormatUtils.formatCurrencyBR(
    value
  )}</label>
  </div>
  `;
}

function renderComissoes() {
  const div = document.querySelector("#div-custos");
  AppState.cache.comissoes.forEach((item) => {
    if (item.p_descricao.toLowerCase() == "comissão/rt") return;
    div.innerHTML += createElementComissao(
      item.p_descricao,
      item.p_descricao.toLowerCase(),
      0,
      0
    );
  });
}

function applyTotalsToUI(calc) {
  const { totals, total, taxa, comEntrada, comTaxa } = calc;
  const percentOfComTaxa = (value) =>
    FormatUtils.formatPercentBR(floatValue((value / comTaxa) * 100));

  DomUtils.setInnerHtml(
    "lb_material",
    FormatUtils.formatCurrencyBR(totals.material)
  );
  DomUtils.setInnerHtml(
    "lb_material_p",
    FormatUtils.formatPercentBR(toNumber((totals.material / total) * 100))
  );

  DomUtils.setInnerHtml(
    "lb_instalacao",
    FormatUtils.formatCurrencyBR(totals.instalacao)
  );
  DomUtils.setInnerHtml("lb_instalacao_p", percentOfComTaxa(totals.instalacao));

  AppState.cache.comissoes.forEach((item) => {
    DomUtils.setInnerHtml(
      `lb_${item.p_descricao.toLowerCase()}`,
      FormatUtils.formatCurrencyBR(totals[item.p_descricao.toLowerCase()])
    );

    DomUtils.setInnerHtml(
      `lb_${item.p_descricao.toLowerCase()}_p`,
      FormatUtils.formatPercentBR(item.p_valor)
    );
  });

  DomUtils.setInnerHtml(
    "lb_comissaort",
    FormatUtils.formatCurrencyBR(totals.rt)
  );
  DomUtils.setInnerHtml(
    "lb_comissaort_p",
    FormatUtils.formatPercentBR(totals.percentRt)
  );

  DomUtils.setInnerHtml(
    "lb_total",
    FormatUtils.formatCurrencyBR(totals.aVista)
  );

  DomUtils.setInnerHtml(
    "lb_lucro",
    FormatUtils.formatCurrencyBR(total * totals.lucro)
  );
  DomUtils.setInnerHtml(
    "lb_lucro_p",
    FormatUtils.formatPercentBR(totals.lucro * 100)
  );
  DomUtils.setInnerHtml(
    "lb_impostos",
    FormatUtils.formatCurrencyBR(total * totals.imposto)
  );
  DomUtils.setInnerHtml(
    "lb_totaljuros",
    FormatUtils.formatCurrencyBR(comEntrada)
  );
  DomUtils.setInnerHtml(
    "lb_totalproposta",
    FormatUtils.formatCurrencyBR(total)
  );
  DomUtils.setInnerHtml(
    "lb_impostos_p",
    FormatUtils.formatPercentBR(floatValue(totals.imposto * 100))
  );
  DomUtils.setInnerHtml(
    "lb_juros",
    FormatUtils.formatCurrencyBR(comEntrada * taxa)
  );
  DomUtils.setInnerHtml("lb_juros_p", FormatUtils.formatPercentBR(taxa * 100));

  const parcelas = toNumber(DomUtils.getSelectedOptionText("#txt_tipo"));
  DomUtils.setInnerHtml(
    "lb_valorparcela",
    FormatUtils.formatCurrencyBR(parcelas ? comEntrada / parcelas : 0)
  );
}

/* =========================
 * Handlers
 * ========================= */
async function onRowDblClickOrcamentos(e) {
  const row = e.target.closest("tr");
  if (!row || !row.cells?.length) return;

  document
    .querySelectorAll("#table tbody tr")
    .forEach((tr) => tr.classList.remove("table-click-row"));
  row.classList.add("table-click-row");

  const idOrc = row.cells[0].textContent.trim();
  AppState.orcamentoAtual = idOrc;
  localStorage.setItem("orcamento", idOrc);

  try {
    await loadAmbientes(idOrc);
    await loadCustos();

    const trigger = document.querySelector('a[href="#tab-2"]');
    if (trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();
  } catch (err) {
    console.error("onRowDblClickOrcamentos erro:", err);
  }
}

async function onRowDblClickAmbientes(e) {
  const row = e.target.closest("tr");
  if (!row || !row.cells?.length) return;

  document
    .querySelectorAll("#table-ambientes tbody tr")
    .forEach((tr) => tr.classList.remove("table-click-row"));
  row.classList.add("table-click-row");

  const idAmbiente = row.cells[0].textContent.trim();
  AppState.idAmbiente = idAmbiente;
  localStorage.setItem("ambiente", idAmbiente);

  await loadMateriaisAmbiente(idAmbiente);

  const trigger = document.querySelector('a[href="#tab-3"]');
  if (trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();
}

function onClickCliente(e) {
  const row = e.target.closest("tr");
  if (!row) return;

  const id = row.cells[0]?.textContent.trim() ?? "";
  const cpf = row.cells[1]?.textContent.trim() ?? "";
  const nome = row.cells[2]?.textContent.trim() ?? "";

  DomUtils.setInnerHtml("lb_id", id);
  DomUtils.setInnerHtml("lb_cpf", cpf);
  DomUtils.setInnerHtml("lb_nome", nome);
}

async function onConfirmGerarOrcamento() {
  const nome = DomUtils.getInnerHtml("lb_nome") || "o cliente selecionado";
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
    await api.setOrcamento({
      p_id_cliente: DomUtils.getInnerHtml("lb_id"),
    });
    await loadOrcamentos();
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Orçamento gerado com sucesso!",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível gerar o orçamento.",
    });
  }
}

async function onConfirmSetAmbiente() {
  const categoria = DomUtils.getText("txt_tipoambiente");
  const descricao = DomUtils.getText("txt_ambiente");

  if (!categoria || !descricao) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Preencha os campos obrigatorios",
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
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: `Não foi possível inserir ambiente.`,
    });
  }
}

function onClickMaterialLinha(e) {
  const row = e.target.closest("tr");
  if (!row || !row.cells?.length) return;
  DomUtils.setText("txt_codigo", row.cells[0].textContent.trim());
  DomUtils.setText("txt_descricao", row.cells[1].textContent.trim());
  DomUtils.setText("txt_preco", row.cells[3].textContent.trim());
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
      p_id_material: DomUtils.getText("txt_codigo"),
      p_quantidade: DomUtils.getText("txt_qtd"),
      p_preco: FormatUtils.toDecimalStringFromBR(DomUtils.getText("txt_preco")),
    });
    await loadMateriaisAmbiente(AppState.idAmbiente);
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Item lançado com sucesso!",
    });
  } catch (err) {
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
      p_descricao: DomUtils.getText("txt_descricao_c"),
      p_quantidade: DomUtils.getText("txt_qtd_c"),
      p_preco: DomUtils.getText("txt_preco_c"),
    });
    await loadCustos();
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Custo lançado com sucesso!",
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "ERRO", text: "Erro ao inserir custo." });
  }
}

async function delRow(button) {
  const bt = button.target.closest(".delRow");
  const idItem = bt.closest("tr").cells[0].textContent.trim();
  if (!bt) return;

  const payload = {
    p_id_orcamento: AppState.orcamentoAtual,
    p_id_ambiente: AppState.idAmbiente,
    p_id_material: idItem,
  };

  const result = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deletar item do Pedido ?",
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
      text: `Item excluido com Sucesso !!!`,
    });
  } catch (erro) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `ERRO: ${erro.message}`,
    });
  }
}

async function onChangeTipoParcelamento() {
  const taxa = DomUtils.getText("txt_tipo");
  DomUtils.setInnerHtml("txt_taxa", FormatUtils.formatPercentBR(taxa));
  await atualizarTotaisUI();
}

async function onChangeEntrada() {
  await atualizarTotaisUI();
}

/* =========================
 * Loaders com cache leve
 * ========================= */
async function loadOrcamentos() {
  try {
    const data = await api.getOrcamentos();
    AppState.cache.orcamentos = data;
    renderOrcamentosTable(data);
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar orçamentos.",
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
    const select = q("#txt_tipoambiente");
    select.innerHTML = `<option value="">Selecione o Tipo</option>`;
    data.forEach((item) => {
      const option = el("option", {
        value: item.p_id_categoria,
        textContent: item.p_categoria,
      });
      select.appendChild(option);
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
    var data = [];
    if (tipo == "D") {
      data = [{ p_qtd_parcela: 1, p_taxa: 0 }];
    } else {
      data = await api.getTaxasParcelamentos(tipo);
    }

    const select = q("#txt_tipo");
    select.innerHTML = "";
    data.forEach((item) => {
      const opt = el("option", {
        value: item.p_taxa,
        textContent: item.p_qtd_parcela,
      });
      select.appendChild(opt);
    });
    await onChangeTipoParcelamento();
  } catch (err) {}
}

async function loadAmbientesValores(idOrc) {
  try {
    if (!idOrc) {
      console.warn("Guards: idMarcenaria/orcamentoAtual ausentes", AppState);
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
    document
      .querySelectorAll(".chk-selecao")
      .forEach((chk) => chk.addEventListener("change", atualizarTotaisUI));
  } catch (err) {
    console.error("loadAmbientesValores erro:", err);
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: `Não foi possível carregar valores do orçamento. ${
        err.message || ""
      }`.trim(),
    });
  }
}

/* =========================
 * Totais (UI)
 * ========================= */

async function atualizarTotaisUI() {
  const data = AppState.cache.totais || [];
  const selecionados = qa('#table-4 tbody input[type="checkbox"]')
    .filter((chk) => chk.checked)
    .map((chk) => data[Number(chk.dataset.index)]);

  const entradaReais = toNumber(DomUtils.getText("txt_entrada"));
  const taxaPercent = toNumber(DomUtils.getText("txt_tipo"));

  const calc = computeTotals({ selecionados, entradaReais, taxaPercent });
  applyTotalsToUI(calc);
}

/* =========================
 * Radios (parcelamento)
 * ========================= */
function bindParcelamentoRadios() {
  const radios = qa('input[name="tipo"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", () => loadTaxasParcelamento(radio.value));
    if (radio.checked) loadTaxasParcelamento(radio.value);
  });
}

async function getValuesOrder(e) {
  const tr = e.target.closest("tr");
  const idOrc = tr.cells[0].textContent.trim();
  await loadAmbientesValores(idOrc);
  const trigger = document.querySelector('a[href="#tab-5"]');
  if (trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();
  atualizarTotaisUI();
}

/* =========================
 * Inicialização
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  // reset de seleção
  localStorage.removeItem("orcamento");
  localStorage.removeItem("ambiente");

  // carregamento inicial
  await Promise.all([
    loadComissoes(),
    loadOrcamentos(),
    loadCategoriasAmbientes(),
    loadClientes(),
    loadMateriais(),
    bindParcelamentoRadios(),
  ]);

  // efeitos e filtros
  EventUtils.tableHover("table");
  EventUtils.tableHover("table-clientes");
  EventUtils.tableHover("table-ambientes");
  EventUtils.tableHover("table_materiais");
  enableTableFilterSort("table");
  enableTableFilterSort("table_materiais");
  EventUtils.enableEnterAsTab?.();

  // eventos (delegação e botões)
  EventUtils.addEventToElement("#table", "dblclick", onRowDblClickOrcamentos);
  EventUtils.addEventToElement(
    "#table-ambientes",
    "dblclick",
    onRowDblClickAmbientes
  );
  EventUtils.addEventToElement(
    "#table_materiais tbody",
    "click",
    onClickMaterialLinha
  );
  EventUtils.addEventToElement("#table-clientes", "click", onClickCliente);
  EventUtils.addEventToElement(".order", "click", getValuesOrder);

  EventUtils.addEventToElement(
    "#bt_new_orcamento",
    "click",
    onConfirmGerarOrcamento
  );
  EventUtils.addEventToElement(
    "#bt_new_ambiente",
    "click",
    onConfirmSetAmbiente
  );
  EventUtils.addEventToElement(
    "#bt_new_material",
    "click",
    onConfirmInserirMaterialAmbiente
  );
  EventUtils.addEventToElement("#table-2 tbody", "click", delRow);
  EventUtils.addEventToElement("#bt_new_custo", "click", onConfirmInserirCusto);
  EventUtils.addEventToElement("#txt_tipo", "change", onChangeTipoParcelamento);
  EventUtils.addEventToElement("#txt_entrada", "input", onChangeEntrada);

  // radios
  renderComissoes();
});

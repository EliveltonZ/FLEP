// taxas-parcelamentos.js (refatorado)
import Swal from "./sweetalert2.esm.all.min.js";
import { DomUtils, FormatUtils, TableUtils, EventUtils, API } from "./utils.js";

/* =========================
 * Seletores
 * ========================= */
const SEL = {
  // tabelas
  TBL_CREDITO: "#ctable",
  TBL_FINAN: "#ftable",
  TBODY_CREDITO: "#ctable tbody",
  TBODY_FINAN: "#ftable tbody",

  // inputs
  IN_TIPO: "#txt_tipo", // "C" ou "F"
  IN_PARC: "#txt_parcela",
  IN_TAXA: "#txt_taxa",

  // botões
  BT_NOVA_TAXA: "#bt_new_taxa",

  // classes de delete (mantendo compatibilidade com TableUtils)
  BTN_DEL_C: ".deleteRowC",
  BTN_DEL_F: ".deleteRowF",
};

/* =========================
 * Helpers DOM + parsing
 * ========================= */
const q = (sel, root = document) => root.querySelector(sel);
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
const tdCenter = (text) =>
  el("td", { style: { textAlign: "center" } }, [String(text)]);

// "10", "10,5", "10%" -> 10.5 (número)
function parsePercentInputToNumber(str) {
  const s = String(str || "")
    .replace(/\s|%/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
// número em % (10.5) -> decimal (0.105)
const percentNumberToDecimal = (n) => (Number.isFinite(n) ? n : NaN);
// texto exibido "%BR" -> decimal
function parseDisplayedPercentToDecimal(text) {
  const n = parsePercentInputToNumber(text); // 10.5
  return percentNumberToDecimal(n); // 0.105
}

/* =========================
 * fetchJson robusto
 * ========================= */
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

/* =========================
 * API
 * ========================= */
const api = {
  getTaxas: (tipo) =>
    fetchJson(`/getTaxasParcelamentos?p_tipo=${encodeURIComponent(tipo)}`),

  setTaxa: (payload) =>
    fetchJson(`/setTaxasParcelamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // mantém endpoint original (corrigido com "/")
  deleteTaxa: (payload) =>
    fetchJson(`/setDelTaxasParcelamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

/* =========================
 * Render
 * ========================= */
function renderTaxasTable(tbodySel, items, delClass) {
  const tbody = q(tbodySel);
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();

  (items || []).forEach((it) => {
    const tr = el("tr", {}, [
      tdCenter(it.p_qtd_parcela),
      tdCenter(FormatUtils.convertDecimalToPercent(it.p_taxa)), // decimal -> "%BR"
    ]);

    const tdBtn = el("td", { style: { textAlign: "center" } });
    tdBtn.innerHTML = TableUtils.insertDeleteButtonCell(
      delClass.replace(/^\./, "")
    );
    tr.appendChild(tdBtn);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

/* =========================
 * Serviços
 * ========================= */
async function loadCredito() {
  try {
    const data = await api.getTaxas("C");
    renderTaxasTable(SEL.TBODY_CREDITO, data, SEL.BTN_DEL_C);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Não foi possível carregar taxas de crédito.",
    });
  }
}

async function loadFinanciamento() {
  try {
    const data = await api.getTaxas("F");
    renderTaxasTable(SEL.TBODY_FINAN, data, SEL.BTN_DEL_F);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Não foi possível carregar taxas de financiamento.",
    });
  }
}

async function reloadAll() {
  await Promise.all([loadCredito(), loadFinanciamento()]);
}

/* =========================
 * Controladores
 * ========================= */
async function onNovaTaxa() {
  const tipo = DomUtils.getText(SEL.IN_TIPO); // "C" ou "F"
  const parcelas = DomUtils.getText(SEL.IN_PARC);
  const taxaStr = DomUtils.getText(SEL.IN_TAXA);

  if (!tipo) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Selecione o tipo da taxa.",
    });
    return;
  }
  if (!parcelas || isNaN(Number(parcelas)) || Number(parcelas) <= 0) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Informe a quantidade de parcelas (número > 0).",
    });
    return;
  }
  if (!taxaStr) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Informe a taxa (ex.: 10 ou 10,5%).",
    });
    return;
  }

  const pctNumber = parsePercentInputToNumber(taxaStr); // 10.5
  if (!Number.isFinite(pctNumber)) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Percentual inválido.",
    });
    return;
  }
  const taxaDecimal = percentNumberToDecimal(pctNumber); // 0.105

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    text: "Deseja inserir taxa?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!isConfirmed) return;

  try {
    await api.setTaxa({
      p_qtd_parcela: Number(parcelas),
      p_taxa: taxaDecimal, // envia decimal!
      p_tipo: tipo,
    });

    await reloadAll();
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Taxa inserida com sucesso!",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Erro ao inserir taxa.",
    });
  }
}

async function onDeleteClick(e) {
  const btnC = e.target.closest(SEL.BTN_DEL_C);
  const btnF = e.target.closest(SEL.BTN_DEL_F);
  if (!btnC && !btnF) return;

  const tr = (btnC || btnF).closest("tr");
  if (!tr) return;

  const tipo = btnC ? "C" : "F";
  const qtdParcelas = Number(tr.cells[0].textContent.trim());
  const taxaDecimal = parseDisplayedPercentToDecimal(
    tr.cells[1].textContent.trim()
  );

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Excluir",
    text: "Deletar taxa de parcelamento?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!isConfirmed) return;

  try {
    await api.deleteTaxa({
      p_qtd_parcela: qtdParcelas,
      p_taxa: taxaDecimal, // envia decimal coerente com backend
      p_tipo: tipo,
    });

    // remover da UI rapidamente, depois recarregar oficial
    tr.remove();
    await reloadAll();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: `Erro ao remover taxa: ${err.message}`,
    });
  }
}

/* =========================
 * Init
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  await reloadAll();

  EventUtils.tableHover("ctable");
  EventUtils.tableHover("ftable");

  // delegação de delete em ambos os tbodys
  EventUtils.addEventToElement(SEL.TBODY_CREDITO, "click", onDeleteClick);
  EventUtils.addEventToElement(SEL.TBODY_FINAN, "click", onDeleteClick);

  // inserir nova taxa
  EventUtils.addEventToElement(SEL.BT_NOVA_TAXA, "click", onNovaTaxa);
});

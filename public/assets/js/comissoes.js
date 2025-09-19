// comissoes.js (refatorado)
import { DomUtils, EventUtils, FormatUtils, API } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

/* =========================
 * Seletores
 * ========================= */
const SEL = {
  TBODY: "#table tbody",
  IN_DESC: "#txt_descricao",
  IN_PERCENT: "#txt_porcentagem",
  BT_INSERIR: "#bt_inserir",
};

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
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
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
  getComissoes: () => fetchJson(`/getComissoes`),
  setComissoes: (payload) =>
    fetchJson(`/setComissoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

/* =========================
 * Helpers
 * ========================= */
// Aceita "10", "10,5", "10%", "10,5 %" e retorna número 10 ou 10.5
function parsePercentInput(str) {
  const s = String(str || "")
    .replace(/\s|%/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

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

/* =========================
 * Render
 * ========================= */
function renderComissoesTable(items = []) {
  const tbody = q(SEL.TBODY);
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();

  (items || []).forEach((it) => {
    const tr = el("tr", {}, [
      tdCenter(it.p_id_comissao),
      el("td", {}, [it.p_descricao]),
      tdCenter(FormatUtils.formatPercentBR(it.p_valor)),
    ]);
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

/* =========================
 * Serviços
 * ========================= */
async function loadComissoes() {
  try {
    const data = await api.getComissoes();
    renderComissoesTable(data);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: err.message || "Não foi possível carregar comissões.",
    });
  }
}

/* =========================
 * Controladores
 * ========================= */
async function onInserirComissao() {
  const descricao = DomUtils.getText(SEL.IN_DESC);
  const valorRaw = DomUtils.getText(SEL.IN_PERCENT);

  if (!descricao || !valorRaw) {
    Swal.fire({
      icon: "warning",
      title: "ATENÇÃO",
      text: "Preencha os campos vazios.",
    });
    return;
  }

  const valor = parsePercentInput(valorRaw);
  if (!Number.isFinite(valor)) {
    Swal.fire({
      icon: "warning",
      title: "ATENÇÃO",
      text: "Informe um percentual válido (ex.: 10 ou 10,5%).",
    });
    return;
  }

  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: "Novo",
    text: "Deseja inserir Comissão?",
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    showDenyButton: true,
  });
  if (!isConfirmed) return;

  try {
    await api.setComissoes({
      p_descricao: descricao,
      // Backend armazena como número de percent (10 para 10%)
      p_valor: valor,
    });

    await loadComissoes();
    Swal.fire({
      icon: "success",
      title: "SUCESSO",
      text: "Dados inseridos com sucesso!",
    });
  } catch (erro) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: erro.message || "Falha ao salvar comissão.",
    });
  }
}

/* =========================
 * Init
 * ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadComissoes();
  EventUtils.addEventToElement(SEL.BT_INSERIR, "click", onInserirComissao);
});

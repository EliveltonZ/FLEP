// app-meusdados.js (padronizado com API.apiFetch + fetchJson)
import {
  DomUtils,
  CepUtils,
  TableUtils,
  EventUtils,
  API, // << usar API.apiFetch (401 -> SweetAlert + redirect)
} from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";
import { clearTableBody } from "./dom.js";

/* =========================
 * Helpers
 * ========================= */
const q = (sel, root = document) => root.querySelector(sel);
const el = (tag, text) => {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  return node;
};

// Wrapper padrão: usa API.apiFetch e já trata JSON / erro
async function fetchJson(url, options) {
  const res = await API.apiFetch(url, options);
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json")
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    const msg =
      (body && (body.error || body.message)) ||
      res.statusText ||
      "Erro na requisição";
    throw new Error(msg);
  }
  return body;
}

/* =========================
 * CEP (externo – não precisa JWT)
 * ========================= */
async function findCep() {
  try {
    const cep = DomUtils.getText("txt_cep");
    const endereco = await API.getCep(cep);
    if (endereco?.erro) throw new Error("CEP não encontrado.");
    DomUtils.setText("txt_endereco", endereco.logradouro || "");
    DomUtils.setText("txt_bairro", endereco.bairro || "");
    DomUtils.setText("txt_cidade", endereco.localidade || "");
    DomUtils.setText("txt_estado", endereco.uf || "");
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
  const select = q("#txt_estado");
  select.innerHTML = `<option value="-">-</option>`;
  estados.forEach((uf) => {
    const option = document.createElement("option");
    option.value = uf;
    option.text = uf;
    select.appendChild(option);
  });
}

function checkRadios() {
  const radios = document.querySelectorAll('input[name="tipo"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      if (radio.id === "radio-pj") {
        DomUtils.setInnerHtml("lb_nome", "Razão Social: *");
        DomUtils.setInnerHtml("lb_documento", "CNPJ: *");
      } else {
        DomUtils.setInnerHtml("lb_nome", "Nome: *");
        DomUtils.setInnerHtml("lb_documento", "CPF: *");
      }
    });
  });
}

function setRadio(value) {
  value === "PF"
    ? DomUtils.setChecked("radio-pf", true)
    : DomUtils.setChecked("radio-pj", true);
}

function getRadio() {
  return DomUtils.getChecked("radio-pf") ? "PF" : "PJ";
}

/* =========================
 * Dados (perfil + bancos)
 * ========================= */
async function getDados() {
  try {
    const data = await fetchJson(`/getMeusDados`);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;

    setRadio(row.p_tipocliente || "PJ");
    DomUtils.setText("txt_razaosocial", row.p_nomerazao || "");
    DomUtils.setText("txt_cnpj_cpf", row.p_cnpjcpf || "");
    DomUtils.setText("txt_cep", row.p_cep || "");
    DomUtils.setText("txt_endereco", row.p_endereco || "");
    DomUtils.setText("txt_bairro", row.p_bairro || "");
    DomUtils.setText("txt_cidade", row.p_cidade || "");
    DomUtils.setText("txt_estado", row.p_estado || "-");
    DomUtils.setText("txt_numero", row.p_numero || "");
    DomUtils.setText("txt_lucro", row.p_lucro ?? 0);
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar seus dados.",
    });
  }
}

async function setMeusDados() {
  const nomerazao = DomUtils.getText("txt_razaosocial");
  const cpfcnpj = DomUtils.getText("txt_cnpj_cpf");
  const cep = DomUtils.getText("txt_cep");
  const endereco = DomUtils.getText("txt_endereco");
  const bairro = DomUtils.getText("txt_bairro");
  const cidade = DomUtils.getText("txt_cidade");
  const estado = DomUtils.getText("txt_estado");
  const numero = DomUtils.getText("txt_numero");
  const lucro = DomUtils.getText("txt_lucro");

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

  const result = await Swal.fire({
    icon: "question",
    title: "Salvar",
    text: "Deseja salvar alterações?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });
  if (!result.isConfirmed) return;

  try {
    await fetchJson(`/setMeusDados`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
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

async function fillBanks() {
  try {
    const data = await fetchJson(`/getBancos`);
    const tbody = q("#tbody-bank");
    clearTableBody("#tbody-bank");
    (Array.isArray(data) ? data : []).forEach((item) => {
      const tr = document.createElement("tr");
      tr.append(
        el("td", item.p_banco),
        el("td", item.p_agencia),
        el("td", item.p_numero),
        el("td", item.p_tipo_conta),
        el("td", item.p_pix)
      );
      const td = document.createElement("td");
      td.innerHTML = TableUtils.insertDeleteButtonCell("delBank");
      td.style.textAlign = "center";
      tr.append(td);
      tbody.appendChild(tr);
    });
  } catch {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: "Não foi possível carregar bancos.",
    });
  }
}

async function setBanco() {
  const result = await Swal.fire({
    icon: "question",
    title: "Inserir",
    text: "Deseja salvar banco?",
    showDenyButton: true,
    confirmButtonText: "Confirmar",
    denyButtonText: "Cancelar",
  });
  if (!result.isConfirmed) return;

  try {
    await fetchJson(`/setBancos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_banco: q("#txt_banco")?.value || "",
        p_tipo_conta: q("#txt_tipoconta")?.value || "",
        p_numero: q("#txt_agencia")?.value || "",
        p_agencia: q("#txt_numconta")?.value || "",
        p_pix: q("#txt_pix")?.value || "",
      }),
    });
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Banco inserido com sucesso!",
    });
    fillBanks();
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "ERRO",
      text: e.message || "Não foi possível salvar banco.",
    });
  }
}

async function delBanco(evt) {
  const bt = evt.target.closest(".delBank");
  if (!bt) return;

  const linha = bt.closest("tr");
  const nomeBanco = linha?.cells?.[0]?.textContent?.trim();
  if (!nomeBanco) return;

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja excluir banco?",
    confirmButtonText: "Sim",
    denyButtonText: "Não",
    showDenyButton: true,
  });
  if (!result.isConfirmed) return;

  try {
    await fetchJson(`/setDelBanco`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_banco: nomeBanco }),
    });
    Swal.fire({
      icon: "success",
      title: "Sucesso",
      text: "Banco removido com sucesso!",
    });
    linha.remove();
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
document.addEventListener("DOMContentLoaded", () => {
  fillStates();
  CepUtils.attachMask("txt_cep");
  checkRadios();
  getDados();
  fillBanks();

  EventUtils.addEventToElement("#bt_update", "click", setMeusDados);
  EventUtils.addEventToElement("#bt_add_bank", "click", setBanco);
  EventUtils.addEventToElement("#tbody-bank", "click", delBanco);
  EventUtils.addEventToElement("#txt_cep", "blur", findCep);
});

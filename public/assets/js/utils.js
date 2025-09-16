// utils.classed.js (ESM)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import Swal from "./sweetalert2.esm.all.min.js";

/* ============================
   Date utils
============================ */
export class DateUtils {
  static setISODateToInput(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    el.value = `${yyyy}-${mm}-${dd}`;
  }

  static toBR(dateISOorDash) {
    if (dateISOorDash === "-") return "-";
    const [y, m, d] = String(dateISOorDash).split("-");
    return `${d}/${m}/${y}`;
  }

  static toISO(dateBRorDash) {
    if (dateBRorDash === "-") return "-";
    const [d, m, y] = String(dateBRorDash).split("/");
    return `${y}-${m}-${d}`;
  }
}
/* ============================
   DOM utils (leitura/escrita)
============================ */
export class DomUtils {
  static getText(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const v = el.value;
    return v === "" ? null : v;
  }

  static setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  static getInnerHtml(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const v = el.innerHTML;
    return v === "" ? null : v;
  }

  static setInnerHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  static getChecked(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return el.checked;
  }

  static setChecked(id, bool) {
    const el = document.getElementById(id);
    if (el) el.checked = !!bool;
  }

  static setFocus(id) {
    const el = document.getElementById(id);
    if (el) el.focus();
  }

  static getUpperValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value).toUpperCase() : null;
  }

  static getSelectedOptionText(selector) {
    const select = document.querySelector(selector);
    if (!select || !select.options || select.selectedIndex === -1) return null;
    return select.options[select.selectedIndex].textContent;
  }

  static clearInputs() {
    document
      .querySelectorAll('input[type="text"]')
      .forEach((i) => (i.value = ""));
    document
      .querySelectorAll('input[type="checkbox"]')
      .forEach((c) => (c.checked = false));
  }
}

/* ============================
   Events / Navegação por teclado
============================ */
export class EventUtils {
  static addEventToElement(selector, evt, handler) {
    document
      .querySelectorAll(selector)
      .forEach((el) => el.addEventListener(evt, handler));
  }

  static enableEnterAsTab() {
    const inputs = document.querySelectorAll("input, select, textarea, button");
    inputs.forEach((input) => {
      input.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();

        if (input.tagName === "BUTTON") {
          input.click();
          return;
        }

        let index = Array.from(inputs).indexOf(input);
        let next = inputs[index + 1];

        while (next && next.disabled) {
          index++;
          next = inputs[index + 1];
        }
        if (next) next.focus();
      });
    });
  }

  static tableHover(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
      console.warn(`Tabela com ID "${tableId}" não encontrada.`);
      return;
    }
    table.addEventListener("mouseover", (e) => {
      if (e.target.tagName === "TD")
        e.target.parentElement.classList.add("table-hover-row");
    });
    table.addEventListener("mouseout", (e) => {
      if (e.target.tagName === "TD")
        e.target.parentElement.classList.remove("table-hover-row");
    });
  }
}

/* ============================
   Table helpers (linhas/colunas)
============================ */
export class TableUtils {
  static getIndexColumnValue(td, index) {
    const row = td.parentNode;
    return row.cells[index].innerText;
  }

  static getColumnValue(td, columnIndex) {
    const row = td.parentNode;
    const value = row.cells[columnIndex].innerText;
    return value === "-" ? "" : value;
  }

  static logNumerosMarcados(tableSelector, _function) {
    const table = document.querySelector(tableSelector);
    if (!table) return;

    // Pega todas as linhas do tbody (ignora o header)
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row) => {
      const firstCell = row.cells[0]; // 1ª coluna (checkbox)
      const secondCell = row.cells[1]; // 2ª coluna (número)

      if (!firstCell || !secondCell) return;

      const checkbox = firstCell.querySelector('input[type="checkbox"]');
      if (checkbox && checkbox.checked) {
        // Se a 2ª coluna for texto
        const raw = secondCell.textContent.trim();
        _function(raw);
      }
    });
  }

  static insertDeleteButtonCell(_class) {
    return `
        <button class="btn btn-danger ${_class}" type="button" style="padding:0;margin-left:10px;">
          <svg class="function d-flex d-xxl-flex justify-content-center justify-content-xxl-center" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 20 20" fill="none" style="color:#fff;">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237 8.31658 7.29289 8.70711L8.58579 10L7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071C7.68342 13.0976 8.31658 13.0976 8.70711 12.7071L10 11.4142L11.2929 12.7071C11.6834 13.0976 12.3166 13.0976 12.7071 12.7071C13.0976 12.3166 13.0976 11.6834 12.7071 11.2929L11.4142 10L12.7071 8.70711C13.0976 8.31658 13.0976 7.68342 12.7071 7.29289C12.3166 6.90237 11.6834 6.90237 11.2929 7.29289L10 8.58579L8.70711 7.29289Z" fill="currentColor"></path>
          </svg>
        </button>
    `;
  }
}

/* ============================
   Formatação de valores
============================ */
export class FormatUtils {
  static toDecimalStringFromBR(valueInput) {
    const only = String(valueInput).replace(/[^0-9,]/g, "");
    return only.replace(",", ".");
  }

  static handleCurrencyInputEvent(event) {
    const input = event.target;
    let r = input.value.replace(/\D/g, "");
    r = (r / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
    input.value = r;
  }

  static formatCurrencyBR(value) {
    const n = Number(value || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  static formatPercentBR(value) {
    const fixed = parseFloat(value).toFixed(2);
    return fixed.replace(".", ",") + "%";
  }

  static convertDecimalToPercent(num) {
    const n = Number(num || 0);
    const with2 = n.toFixed(2);
    return `${with2.replace(".", ",")}%`;
  }
}

/* ============================
   Validação de documentos
============================ */
export class ValidationUtils {
  static validarCpfCnpj(valor) {
    const numero = String(valor).replace(/\D/g, "");
    if (numero.length === 11) return ValidationUtils.#validarCPF(numero);
    if (numero.length === 14) return ValidationUtils.#validarCNPJ(numero);
    return false;
  }

  static #validarCPF(cpf) {
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    const d1 = resto >= 10 ? 0 : resto;
    if (d1 !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    const d2 = resto >= 10 ? 0 : resto;

    return d2 === parseInt(cpf.charAt(10));
  }

  static #validarCNPJ(cnpj) {
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, ...pesos1];

    const calcular = (base, pesos) => {
      let soma = 0;
      for (let i = 0; i < pesos.length; i++)
        soma += parseInt(base.charAt(i)) * pesos[i];
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const base = cnpj.substring(0, 12);
    const d1 = calcular(base, pesos1);
    const d2 = calcular(base + d1, pesos2);
    return cnpj === base + d1.toString() + d2.toString();
  }
}

/* ============================
   CEP / máscara
============================ */
export class CepUtils {
  static attachMask(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener("input", () => {
      let v = el.value.replace(/\D/g, "");
      if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
      el.value = v;
    });
  }
}

/* ============================
   Cookies (camada de serviço)
============================ */
export class API {
  static __refreshPromise = null; // evita vários refresh concorrentes
  static __redirecting = false; // evita múltiplos alerts/redirects

  static async getCep(cep) {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    return res.json();
  }

  static async apiFetch(
    url,
    { method = "GET", body, headers = {}, ...rest } = {}
  ) {
    const isForm = body instanceof FormData;
    const isString = typeof body === "string";
    const isJsonBody = body !== undefined && !isForm && !isString;

    const opts = {
      method,
      credentials: "include",
      headers: isForm
        ? headers
        : isJsonBody
        ? { "Content-Type": "application/json", ...headers }
        : { ...headers },
      body: isForm
        ? body
        : isString
        ? body
        : isJsonBody
        ? JSON.stringify(body)
        : undefined,
      ...rest,
    };

    let res = await fetch(url, opts);
    if (res.status === 401) {
      // tenta refresh uma vez
      try {
        if (!API.__refreshPromise) {
          API.__refreshPromise = fetch("/auth/refresh", {
            method: "POST",
            credentials: "include",
          }).finally(() => (API.__refreshPromise = null));
        }
        const r = await API.__refreshPromise;
        if (r && r.ok) {
          // refaz a chamada original
          res = await fetch(url, opts);
        }
      } catch {
        /* silencioso */
      }

      // Se ainda estiver 401 => alerta + redirect
      if (res.status === 401) {
        if (!API.__redirecting) {
          API.__redirecting = true;
          try {
            await Swal.fire({
              icon: "error",
              title: "Sessão expirada",
              text: "Faça login novamente.",
              confirmButtonText: "OK",
              allowOutsideClick: false,
              allowEscapeKey: false,
            });
          } finally {
            window.location.replace("/index.html");
          }
        }
        return new Promise(() => {}); // trava o fluxo
      }
    }

    // 🔴 NOVO: para qualquer erro != 2xx, lançar exceção
    if (!res.ok) {
      let msg;
      try {
        const j = await res.clone().json();
        msg = j?.error || j?.message || JSON.stringify(j);
      } catch {
        msg = await res.text();
      }
      throw new Error(msg || `HTTP ${res.status} ${res.statusText}`);
    }

    return res;
  }
}

export function validarCpfCnpj(valor) {
  valor = valor.replace(/[^\d]+/g, ""); // remove tudo que não for número

  if (valor.length === 11) {
    return validarCPF(valor);
  } else if (valor.length === 14) {
    return validarCNPJ(valor);
  }
  return false;
}

function validarCPF(cpf) {
  if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf.charAt(10));
}

function validarCNPJ(cnpj) {
  if (!cnpj || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

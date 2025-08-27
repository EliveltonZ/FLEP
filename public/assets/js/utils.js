import sweetalert2 from "./sweetalert2.esm.all.min.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export function setData(elememt) {
  var campoDataHora = document.getElementById(elememt);
  var dataAtual = new Date();
  var ano = dataAtual.getFullYear();
  var mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
  var dia = String(dataAtual.getDate()).padStart(2, "0");
  var dataHoraFormatada = `${ano}-${mes}-${dia}`;
  campoDataHora.value = dataHoraFormatada;
}

export function getText(element) {
  let value = document.getElementById(element).value;
  return value === "" ? null : value;
}

export function getInnerHtml(element) {
  let value = document.getElementById(element).innerHTML;
  return value === "" ? null : value;
}

export function getSelectedOptionText(selector) {
  const select = document.querySelector(selector);
  if (!select || !select.options || select.selectedIndex === -1) return null;

  return select.options[select.selectedIndex].textContent;
}

export function setText(element, value) {
  document.getElementById(element).value = value;
}

export function setInnerHtml(element, value) {
  document.getElementById(element).innerHTML = value;
}

export function getChecked(element) {
  let value = document.getElementById(element).checked;
  return value === "" ? null : value;
}

export function setChecked(element, boolean) {
  document.getElementById(element).checked = boolean;
}

export function formatValueDecimal(valorInput) {
  const valorFormatado = valorInput.replace(/[^0-9,]/g, "");
  const resultado = valorFormatado.replace(",", ".");
  return resultado;
}

export function changeFormatCurrency(event) {
  const input = event.target;
  let r = input.value.replace(/\D/g, "");
  r = (r / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
  input.value = r;
}

export function formatCurrency(valor) {
  if (valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  } else {
    valor = 0;
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
}

export function setFocus(elememt) {
  document.getElementById(elememt).focus();
}

export function getValue(element) {
  const value = document.getElementById(element).value.toUpperCase();
  return value;
}

export function convertDataBr(date) {
  if (date == "-") {
    return "-";
  } else {
    const parse_date = date.split("-");
    const format_date = `${parse_date[2]}/${parse_date[1]}/${parse_date[0]}`;
    return format_date;
  }
}

export function convertDataISO(date) {
  if (date == "-") {
    return "-";
  } else {
    const parse_date = date.split("/");
    const format_date = `${parse_date[2]}-${parse_date[1]}-${parse_date[0]}`;
    return format_date;
  }
}

export function getIndexColumnValue(td, index) {
  const row = td.parentNode;
  return row.cells[index].innerText;
}

export function getColumnValue(td, columIndex) {
  const row = td.parentNode;
  const value = row.cells[columIndex].innerText;
  if (value === "-") {
    return "";
  } else {
    return value;
  }
}

export function clearInputFields() {
  document.querySelectorAll('input[type="text"]').forEach((input) => {
    input.value = "";
  });

  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
}

export function onmouseover(tableId) {
  const table = document.getElementById(tableId);
  if (!table) {
    console.warn(`Tabela com ID "${tableId}" não encontrada.`);
    return;
  }

  table.addEventListener("mouseover", (event) => {
    if (event.target.tagName === "TD") {
      event.target.parentElement.classList.add("table-hover-row");
    }
  });

  table.addEventListener("mouseout", (event) => {
    if (event.target.tagName === "TD") {
      event.target.parentElement.classList.remove("table-hover-row");
    }
  });
}

export function enableEnterAsTab() {
  const inputs = document.querySelectorAll("input, select, textarea, button");
  inputs.forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();

        if (input.tagName === "BUTTON") {
          input.click();
          return;
        }

        let index = Array.from(inputs).indexOf(input);
        let nextElement = inputs[index + 1];

        // Verifica se o próximo elemento é desabilitado e pula para o próximo
        while (nextElement && nextElement.disabled) {
          index++; // Avança para o próximo índice
          nextElement = inputs[index + 1]; // Atualiza o próximo elemento
        }

        if (nextElement) {
          nextElement.focus();
        }
      }
    });
  });
}
export function convertDecimal(num) {
  if (num) {
    num = num.toFixed(2);
    return `${num.replace(".", ",")}%`;
  } else {
    num = 0;
    return `${num.toFixed(2)}%`;
  }
}

export function validarCpfCnpj(valor) {
  // Remove caracteres não numéricos
  const numero = valor.replace(/\D/g, "");

  if (numero.length === 11) {
    return validarCPF(numero);
  } else if (numero.length === 14) {
    return validarCNPJ(numero);
  } else {
    return false;
  }
}

function validarCPF(cpf) {
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;

  if (digito1 !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }

  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;

  return digito2 === parseInt(cpf.charAt(10));
}

function validarCNPJ(cnpj) {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6].concat(pesos1);

  const calcularDigito = (base, pesos) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) {
      soma += parseInt(base.charAt(i)) * pesos[i];
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const base = cnpj.substring(0, 12);
  const digito1 = calcularDigito(base, pesos1);
  const digito2 = calcularDigito(base + digito1, pesos2);

  return cnpj === base + digito1.toString() + digito2.toString();
}

export function formatCEP(input) {
  const cepInput = document.getElementById(input);
  cepInput.addEventListener("input", () => {
    let value = cepInput.value.replace(/\D/g, ""); // Remove tudo que não é número
    if (value.length > 5) {
      value = value.slice(0, 5) + "-" + value.slice(5, 8);
    }
    cepInput.value = value;
  });
}

export function insertButtonCellTable(param) {
  return `
        <td style="text-align: center;">
            <button class="btn btn-danger" type="button" style="padding: 0px;margin-left: 10px;" onclick="${param}(this)">
                <svg class="function d-flex d-xxl-flex justify-content-center justify-content-xxl-center" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 20 20" fill="none" style="color:rgb(255, 255, 255);text-align: center;height: 100%;width: 100%;">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237 8.31658 7.29289 8.70711L8.58579 10L7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071C7.68342 13.0976 8.31658 13.0976 8.70711 12.7071L10 11.4142L11.2929 12.7071C11.6834 13.0976 12.3166 13.0976 12.7071 12.7071C13.0976 12.3166 13.0976 11.6834 12.7071 11.2929L11.4142 10L12.7071 8.70711C13.0976 8.31658 13.0976 7.68342 12.7071 7.29289C12.3166 6.90237 11.6834 6.90237 11.2929 7.29289L10 8.58579L8.70711 7.29289Z" fill="currentColor"></path>
                </svg>
            </button>
        </td>
    `;
}

export async function getCookie(params) {
  try {
    const response = await fetch(`/getCookie`, {
      credentials: "include", // necessário para enviar cookies assinados
    });

    if (!response.ok)
      throw new Error(`Erro ao buscar cookie: ${response.status}`);

    const data = await response.json();

    if (!(params in data)) {
      console.warn(`Parâmetro "${params}" não encontrado no cookie.`);
      return null;
    }

    return data[params];
  } catch (error) {
    console.error("Erro em getCookie:", error);
    return null;
  }
}

export async function setCookie(value) {
  try {
    const response = await fetch(`/setCookie`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.mensagem || "Erro ao definir cookie.");
    }

    return true; // ou return await response.json();
  } catch (error) {
    console.error("Erro em setCookie:", error);
    return false;
  }
}

export function addEventToElement(element_id, _event, _function) {
  const elements = document.querySelectorAll(element_id);
  elements.forEach((element) => {
    element.addEventListener(_event, _function);
  });
}

export function formatPercent(value) {
  const fixed = parseFloat(value).toFixed(2); // Garante duas casas
  const result = fixed.replace(".", ",");
  return result + "%";
}

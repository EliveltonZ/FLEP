import { formatCurrency, onmouseover, getText, getCookie } from "./utils.js";
import { enableTableFilterSort } from "./filtertable.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function fillTableMateriais() {
  const response = await fetch(`/fillTableMateriais`);

  if (!response.ok) {
    Swal.fire({
      icon: "error",
      message: "nao foi possivel carregar dados",
    });
  } else {
    const data = await response.json();
    const tbody = document.querySelectorAll("table tbody")[1];
    tbody.innerHTML = "";
    data.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td style="text-align: center" >${item.p_id_material}</td>
      <td >${item.p_descricao}</td>
      <td style="text-align: center">${item.p_unidade}</td>
      <td style="text-align: center">${formatCurrency(item.p_preco)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function fillTableCategorias() {
  const response = await fetch(`/fillTableCategorias`);
  if (!response.ok) {
    Swal.fire({
      icon: "error",
      text: "nao foi possivel carregar dados",
    });
  } else {
    const data = await response.json();
    const tbody = document.querySelectorAll("table tbody")[0];
    tbody.innerHTML = "";
    data.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td style="text-align: center" >${item.p_cod_categoria}</td>
      <td >${item.p_descricao}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

window.setCategoria = async function () {
  const idCategoria = getText("cod_categoria");
  const categoria = getText("desc_categoria");

  if (!idCategoria || !categoria) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Preencha os campos em branco",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir nova Categoria ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });

  if (result.isConfirmed) {
    const data = {
      p_id_categoria: idCategoria,
      p_categoria: categoria.toUpperCase(),
    };

    const response = await fetch("/setCategoria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Houve um problema ao salvar os dados",
      });
      return;
    } else {
      fillTableCategorias();
      optionCategorias();
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Categoria inserida com Sucesso !!!",
      });
    }
  }
};

window.setMaterais = async function () {
  const descricao = getText("desc_material");
  const unidade = getText("unid_material");
  const preco = getText("preco_material");
  const categoria = getText("cat_material");
  const codigo = getText("cod_material");

  if (!descricao || !unidade || !preco || !categoria || !codigo) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Todos os campos devem ser preenchidos antes de inserir!",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    text: "Deseja inserir o novo material ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Inserir",
  });

  if (result.isConfirmed) {
    const data = {
      p_descricao: descricao,
      p_unidade: unidade,
      p_preco: preco,
      p_id_categoria: categoria,
      p_id_material: codigo,
    };

    const response = await fetch("/setMateriais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errText = await response.text();
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Não foi possível inserir Material: " + errText,
      });
    } else {
      fillTableMateriais();
      Swal.fire({
        icon: "success",
        title: "Sucesso",
        text: "Material inserido com sucesso !!!",
      });
    }
  }
};

async function optionCategorias() {
  const response = await fetch(`/fillTableCategorias`);

  const data = await response.json();
  const select = document.getElementById("cat_material");
  select.innerHTML = `<option value="">Selecione a categoria</option>`;

  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.p_cod_categoria;
    option.textContent = item.p_descricao;
    select.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  fillTableMateriais();
  fillTableCategorias();
  onmouseover("ctable");
  onmouseover("mtable");
  enableTableFilterSort("ctable");
  enableTableFilterSort("mtable");
  optionCategorias();
});

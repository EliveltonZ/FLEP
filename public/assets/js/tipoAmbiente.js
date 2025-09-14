import { DomUtils, EventUtils, API } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function getCategoriasAmbiente() {
  const response = await API.apiFetch(`/getCategoriasAmbientes`);

  const data = await response.json();

  const tbody = document.getElementById("tbody-ambiente");
  tbody.innerHTML = "";
  data.forEach((element) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${element.p_id_categoria}</td>
      <td>${element.p_categoria}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function setCategoriaAmbiente() {
  const category = DomUtils.getText("txt_categoria");
  if (!category) {
    Swal.fire({
      icon: "warning",
      title: "ATENÇÃO",
      text: "Digite a categoria desejada !!",
    });
    return;
  }

  const result = await Swal.fire({
    icon: "question",
    title: "Nova Categoria",
    text: "Deseja salvar nova categoria de ambiente ?",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
  });

  if (result.isConfirmed) {
    try {
      const data = {
        p_categoria: category.toUpperCase(),
      };

      const response = await API.apiFetch(`/setCategoriasAmbientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      Swal.fire({
        icon: "success",
        title: "SUCESSO",
        text: "Categoria inserida com Sucesso !!!",
      });
      getCategoriasAmbiente();
    } catch {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Não foi possivel inserir Categoria",
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  getCategoriasAmbiente();
});

EventUtils.addEventToElement("#bt_new_category", "click", setCategoriaAmbiente);

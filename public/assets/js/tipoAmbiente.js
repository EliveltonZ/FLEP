import { enableEnterAsTab, getText, getCookie } from "./utils.js";
import Swal from "./sweetalert2.esm.all.min.js";

async function getCategoriasAmbiente() {
  const response = await fetch(
    `/getCategoriasAmbientes?p_id_marcenaria=${await getCookie("id")}`
  );

  const data = await response.json();

  console.log(data);

  const tbody = document.getElementById("tbody-ambiente");
  data.forEach((element) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${element.p_id_categoria}</td>
      <td>${element.p_categoria}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.setCategoriaAmbiente = async function () {
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
        p_id_marcenaria: await getCookie("id"),
        p_categoria: getText("txt_categoria"),
      };

      const response = await fetch(`./setCategoriasAmbientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      Swal.fire({
        icon: "success",
        title: "SUCESSO",
        text: "Categoria inserida com Sucesso !!!",
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "ERRO",
        text: "Não foi possivel inserir Categoria",
      });
    }
  }
};

document.addEventListener("DOMContentLoaded", (event) => {
  getCategoriasAmbiente();
});

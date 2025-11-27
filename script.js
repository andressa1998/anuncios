// LOGIN
function login() {
    let u = document.getElementById("user").value;
    let p = document.getElementById("pass").value;

    if (u === "RONALD" && p === "2101") {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app").style.display = "block";
        carregarDados();
    } else {
        document.getElementById("login-error").innerText = "Usuário ou senha inválidos";
        document.getElementById("login-error").style.color = "red";
    }
}


// BUSCAR DADOS (arquivo gerado pelo Python)
async function carregarDados() {
    const response = await fetch("dados.json?" + Date.now());
    const data = await response.json();

    let tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    data.forEach(item => {
        let tr = document.createElement("tr");

        let divergencia = item.divergencia ? "⚠️ Sim" : "—";

        tr.innerHTML = `
            <td>${item.item_id}</td>
            <td>${item.promotion_type}</td>
            <td>${item.promotion_name}</td>
            <td>${item.status}</td>
            <td>${item.price}</td>
            <td>${item.original_price}</td>
            <td>${item.min_discounted_price}</td>
            <td>${item.max_discounted_price}</td>
            <td class="${item.divergencia ? 'warning' : ''}">${divergencia}</td>
        `;
        
        tbody.appendChild(tr);
    });
}


// EXPORTAR XLSX
function exportExcel() {
    window.location.href = "dados.xlsx";
}

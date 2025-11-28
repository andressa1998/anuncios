// --- LOGIN ---
document.getElementById("login-btn").addEventListener("click", () => {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (user === "RONALD" && pass === "2101") {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("dashboard").style.display = "flex";
    } else {
        document.getElementById("login-error").textContent = "Usuário ou senha incorretos.";
    }
});

// --- MOSTRAR ANÚNCIOS AO CLICAR ---
document.getElementById("btn-anuncios").addEventListener("click", () => {
    document.getElementById("content-anuncios").style.display = "block";
    carregarDados();
});

// --- CARREGAR JSON ---
async function carregarDados() {
    try {
        const resposta = await fetch("dados.json");
        const dados = await resposta.json();

        const tabela = document.querySelector("#tabela-promos tbody");
        tabela.innerHTML = "";

        const divergenciasLista = document.getElementById("lista-divergencias");
        divergenciasLista.innerHTML = "";

        dados.forEach(item => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${item.item_id}</td>
                <td>${item.promotion_name}</td>
                <td>${item.status}</td>
                <td>${item.market_price}</td>
                <td>${item.original_price}</td>
                <td>${item.min_discount}</td>
                <td>${item.max_discount}</td>
                <td>${item.suggested_price}</td>
                <td>${item.divergencia ? "⚠️" : ""}</td>
            `;

            tabela.appendChild(tr);

            if (item.divergencia) {
                const li = document.createElement("li");
                li.textContent = `${item.item_id} - ${item.promotion_name}`;
                divergenciasLista.appendChild(li);
            }
        });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

// --- EXPORTAR XLSX ---
document.getElementById("export-btn").addEventListener("click", () => {
    const tabela = document.getElementById("tabela-promos");
    const wb = XLSX.utils.table_to_book(tabela);
    XLSX.writeFile(wb, "promocoes.xlsx");
});

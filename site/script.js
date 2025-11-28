// Usuário e senha
const users = {
    "RONALD": "2101"
};

// Login
document.getElementById("login-btn").addEventListener("click", () => {
    const username = document.getElementById("username").value.trim().toUpperCase();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("login-error");

    if(users[username] && users[username] === password){
        document.getElementById("login-container").style.display = "none";
        document.getElementById("main-container").style.display = "block";
        carregarTabela();
    } else {
        errorEl.textContent = "Usuário ou senha incorretos!";
    }
});

async function carregarTabela(){
    const response = await fetch("dados.json");
    const data = await response.json();

    const tbody = document.querySelector("#tabela-promos tbody");
    tbody.innerHTML = "";
    const divergencias = [];

    const grouped = {};
    data.forEach(item => {
        if(!grouped[item.item_id]) grouped[item.item_id] = [];
        grouped[item.item_id].push(item);
    });

    for(const item_id in grouped){
        const items = grouped[item_id];
        let startedPrice = null;

        items.forEach(i => {
            if(i.status === "started") startedPrice = i.max_discounted_price || i.price;
        });

        items.forEach(i => {
            const tr = document.createElement("tr");
            let divText = "";

            if(i.status === "candidate" && startedPrice && i.max_discounted_price > startedPrice){
                tr.classList.add("divergencia");
                divText = "Sim";
                divergencias.push(item_id);
            }

            tr.innerHTML = `
                <td>${i.item_id}</td>
                <td>${i.promotion_name}</td>
                <td>${i.status}</td>
                <td>${i.preco_mercado || "-"}</td>
                <td>${i.original_price || "-"}</td>
                <td>${i.min_discounted_price || "-"}</td>
                <td>${i.max_discounted_price || "-"}</td>
                <td>${i.suggested_discounted_price || "-"}</td>
                <td>${divText}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Lista divergências
    const lista = document.getElementById("lista-divergencias");
    lista.innerHTML = "";
    divergencias.forEach(d => {
        const li = document.createElement("li");
        li.textContent = d;
        lista.appendChild(li);
    });
}

// Exportar XLSX
document.getElementById("export-btn").addEventListener("click", () => {
    const table = document.getElementById("tabela-promos");
    const wb = XLSX.utils.table_to_book(table, {sheet:"Promoções"});
    XLSX.writeFile(wb, "promocoes.xlsx");
});

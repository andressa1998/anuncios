document.addEventListener("DOMContentLoaded", () => {
    const isDashboard = window.location.pathname.includes("dashboard.html");
    if (!isDashboard) return;

    const btnPromocoes = document.getElementById("btn-promocoes");
    const conteudo = document.getElementById("conteudo");

    btnPromocoes.addEventListener("click", () => {
        carregarTabela();
    });
});

// -------- CARREGAR JSON --------
async function carregarTabela() {
    const conteudo = document.getElementById("conteudo");
    conteudo.innerHTML = "<h2>Carregando dados...</h2>";

    try {
        const response = await fetch("dados.json");
        if (!response.ok) throw new Error("Erro ao carregar JSON");

        const dados = await response.json();
        montarTabela(dados);

    } catch (erro) {
        conteudo.innerHTML = `<p style='color:red;'>Erro ao carregar dados: ${erro}</p>`;
    }
}

// -------- MONTAR TABELA --------
function montarTabela(dados) {
    const conteudo = document.getElementById("conteudo");

    if (!Array.isArray(dados) || dados.length === 0) {
        conteudo.innerHTML = "<p>Nenhum dado encontrado.</p>";
        return;
    }

    // identificar repetições de item_id (MLB)
    const contagem = {};
    dados.forEach(d => {
        contagem[d.item_id] = (contagem[d.item_id] || 0) + 1;
    });

    // renomear status
    dados.forEach(item => {
        if (item.status === "started") item.status = "ATIVO";
        if (item.status === "candidate") item.status = "ELEGÍVEL";
    });

    let html = `
        <h2>Anúncios em promoção</h2>
        <table class="tabela-dados">
            <thead>
                <tr>
                    <th>MLB</th>
                    <th>Campanha</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Preço Mercado</th>
                    <th>Preço Atual</th>
                    <th>Preço Original</th>
                    <th>Mín.</th>
                    <th>Máx.</th>
                    <th>Sugerido</th>
                </tr>
            </thead>
            <tbody>
    `;

    dados.forEach(item => {
        const repetido = contagem[item.item_id] > 1;
        const cor = repetido ? "style='background:#fff59d;'" : "";

        html += `
            <tr ${cor}>
                <td>${item.item_id}</td>
                <td>${item.promotion_name}</td>
                <td>${item.promotion_type}</td>
                <td>${item.status}</td>
                <td>${item.preco_mercado}</td>
                <td>${item.price ?? "-"}</td>
                <td>${item.original_price ?? "-"}</td>
                <td>${item.min_discounted_price ?? "-"}</td>
                <td>${item.max_discounted_price ?? "-"}</td>
                <td>${item.suggested_discounted_price ?? "-"}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    conteudo.innerHTML = html;
}

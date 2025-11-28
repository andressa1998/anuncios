fetch("dados.json")
    .then(response => response.json())
    .then(data => {
        const tbody = document.querySelector("#tabela-promos tbody");
        data.forEach(item => {
            const tr = document.createElement("tr");
            if(item.status === "candidate" && item.max_discounted_price > item.price) {
                tr.classList.add("alerta");
            }
            tr.innerHTML = `
                <td>${item.item_id}</td>
                <td>${item.promotion_name}</td>
                <td>${item.status}</td>
                <td>${item.preco_mercado || "-"}</td>
                <td>${item.original_price || "-"}</td>
                <td>${item.max_discounted_price || "-"}</td>
            `;
            tbody.appendChild(tr);
        });
    });

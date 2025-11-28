// --- Config (usuario temporário) ---
const users = { RONALD: "2101" };

// helper
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// login
$("#login-btn").addEventListener("click", () => {
  const u = $("#username").value.trim().toUpperCase();
  const p = $("#password").value.trim();
  if (users[u] && users[u] === p) {
    $("#login-area").style.display = "none";
    $("#dashboard").style.display = "block";
    refreshAll();
  } else {
    $("#login-error").textContent = "Usuário ou senha incorretos!";
  }
});

// menu buttons
$("#btn-anuncios").addEventListener("click", () => {
  // visual
  $$(".menu-btn").forEach(b => b.classList.remove("active"));
  $("#btn-anuncios").classList.add("active");
  // ensure dashboard visible
  $("#dashboard").style.display = "block";
  // fetch and show
  refreshAll();
});

$("#btn-divergencias").addEventListener("click", () => {
  $$(".menu-btn").forEach(b => b.classList.remove("active"));
  $("#btn-divergencias").classList.add("active");
  // show dashboard and scroll to divergences
  $("#dashboard").style.display = "block";
  setTimeout(()=> {
    const list = $("#lista-divergencias");
    list.scrollIntoView({behavior:"smooth", block:"center"});
  }, 200);
});

// refresh all data and UI
async function refreshAll(){
  try {
    const resp = await fetch("dados.json", {cache: "no-store"});
    if (!resp.ok) throw new Error("Falha ao carregar dados.json");
    const data = await resp.json();

    renderStats(data);
    renderTable(data);
    renderDivergencias(data);
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dados: " + err.message);
  }
}

function renderStats(data){
  const itensCount = new Set(data.map(d => d.item_id)).size;
  const promosCount = new Set(data.map(d => d.promotion_id)).size;
  const divergencias = computeDivergencias(data);
  $("#stat-itens").textContent = itensCount;
  $("#stat-promos").textContent = promosCount;
  $("#stat-divs").textContent = divergencias.length;
}

function computeDivergencias(data){
  const grouped = {};
  data.forEach(i => {
    if (!grouped[i.item_id]) grouped[i.item_id] = [];
    grouped[i.item_id].push(i);
  });

  const divergList = [];
  for (const id in grouped){
    const group = grouped[id];
    // find started base price (min among started price values)
    const startedPrices = group.filter(x => x.status === "started").map(x => parseFloat(x.price || x.max_discounted_price || 0)).filter(Boolean);
    const base = startedPrices.length ? Math.min(...startedPrices) : null;
    if (base === null) continue;

    // any candidate with max_discounted_price > base?
    for (const it of group){
      const maxd = parseFloat(it.max_discounted_price || 0);
      if (it.status === "candidate" && maxd > base) {
        divergList.push({ item_id: id, base: base, candidate_val: maxd, record: it });
        break;
      }
    }
  }
  return divergList;
}

function renderTable(data) {
  const tbody = $("#tabela-promos tbody");
  tbody.innerHTML = "";

  // simple filter by search & status
  const search = ($("#search") && $("#search").value.trim().toLowerCase()) || "";
  const statusFilter = ($("#filter-status") && $("#filter-status").value) || "";

  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.item_id]) grouped[item.item_id] = [];
    grouped[item.item_id].push(item);
  });

  for (const id in grouped){
    const group = grouped[id];
    const startedPrices = group.filter(x => x.status === "started").map(x => parseFloat(x.price || x.max_discounted_price || 0)).filter(Boolean);
    const base = startedPrices.length ? Math.min(...startedPrices) : null;

    for (const it of group){
      // search & status filter
      const text = `${it.item_id} ${it.promotion_name || ""}`.toLowerCase();
      if (search && !text.includes(search)) continue;
      if (statusFilter && it.status !== statusFilter) continue;

      const tr = document.createElement("tr");
      const isDiverg = (it.status === "candidate" && base !== null && parseFloat(it.max_discounted_price || 0) > base);
      if (isDiverg) tr.classList.add("divergencia");

      tr.innerHTML = `
        <td>${escapeHTML(it.item_id)}</td>
        <td style="text-align:left;">${escapeHTML(it.promotion_name || "-")}</td>
        <td>${escapeHTML(it.status || "-")}</td>
        <td>${formatMoney(it.preco_mercado)}</td>
        <td>${formatMoney(it.original_price)}</td>
        <td>${formatMoney(it.min_discounted_price)}</td>
        <td>${formatMoney(it.max_discounted_price)}</td>
        <td>${formatMoney(it.suggested_discounted_price)}</td>
        <td>${isDiverg ? "SIM" : ""}</td>
      `;
      tbody.appendChild(tr);
    }
  }
}

function renderDivergencias(data){
  const list = $("#lista-divergencias");
  list.innerHTML = "";
  const diverg = computeDivergencias(data);
  if (!diverg.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhuma divergência encontrada";
    list.appendChild(li);
    return;
  }
  diverg.forEach(d => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHTML(d.item_id)}</strong> — base: ${formatMoney(d.base)} • candidate: ${formatMoney(d.candidate_val)} <span class="muted">(${escapeHTML(d.record.promotion_name||'')})</span>`;
    list.appendChild(li);
  });
}

// export to xlsx using table -> book
$("#export-btn").addEventListener("click", ()=> {
  const table = document.getElementById("tabela-promos");
  const wb = XLSX.utils.table_to_book(table, {sheet:"Promoções"});
  XLSX.writeFile(wb, "promocoes_wheeltech.xlsx");
});

// small utils
function formatMoney(v){ if (v === undefined || v === null || v === "") return "-"; const n = Number(v); if (isNaN(n)) return "-"; return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function escapeHTML(s){ if (!s && s!==0) return ""; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

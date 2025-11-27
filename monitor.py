# src/monitor.py
import os
import requests
import pandas as pd
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows
from jinja2 import Environment, FileSystemLoader

ACCESS = os.environ.get("ML_ACCESS_TOKEN")
USER = os.environ.get("ML_USER_ID", "415176739")

HEADERS = {'Authorization': f'Bearer {ACCESS}'}

OUT_DIR = "site"
TEMPLATE_DIR = "templates"

os.makedirs(OUT_DIR, exist_ok=True)

# ---- (use sua lógica já testada) ----
def get_promocoes():
    url = f"https://api.mercadolibre.com/seller-promotions/users/{USER}?app_version=v2"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        print("Erro promocoes", resp.status_code)
        return []
    return resp.json().get("results", [])

def get_itens_promocao(promo_id, promo_type):
    url = f"https://api.mercadolibre.com/seller-promotions/promotions/{promo_id}/items"
    items = []
    search_after = None
    while True:
        params = {"promotion_type": promo_type, "app_version": "v2", "limit": 50}
        if search_after: params["search_after"] = search_after
        resp = requests.get(url, headers=HEADERS, params=params)
        if resp.status_code != 200:
            break
        data = resp.json()
        items.extend(data.get("results", []))
        paging = data.get("paging", {})
        search_after = paging.get("searchAfter")
        if not search_after: break
    return items

def get_preco_item(item_id):
    url = f"https://api.mercadolibre.com/items/{item_id}/sale_price?context=channel_marketplace,buyer_loyalty_3"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("amount", None), data.get("currency_id", None)
    except Exception as e:
        print("Erro preco", e)
    return None, None

def gerar_dados():
    promos = get_promocoes()
    todos_itens = {}
    for promo in promos:
        pid = promo.get("id")
        ptype = promo.get("type")
        pname = promo.get("name", "")
        itens = get_itens_promocao(pid, ptype)
        for it in itens:
            iid = it.get("id")
            if iid is None: continue
            todos_itens.setdefault(iid, []).append({
                "promotion_id": pid,
                "promotion_type": ptype,
                "promotion_name": pname,
                "status": it.get("status"),
                "price": it.get("price"),
                "original_price": it.get("original_price"),
                "min_discounted_price": it.get("min_discounted_price"),
                "max_discounted_price": it.get("max_discounted_price"),
                "suggested_discounted_price": it.get("suggested_discounted_price"),
            })

    linhas = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(get_preco_item, iid): iid for iid in todos_itens}
        for fut in as_completed(futures):
            iid = futures[fut]
            preco, moeda = fut.result()
            for pinfo in todos_itens[iid]:
                linha = {
                    "item_id": iid,
                    "moeda": moeda,
                    "preco_mercado": preco,
                    **pinfo
                }
                linhas.append(linha)
    df = pd.DataFrame(linhas)
    return df

def salvar_excel(df, path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Dados"
    for r in dataframe_to_rows(df, index=False, header=True):
        ws.append(r)
    wb.save(path)

def gerar_alertas(df):
    # devolve dataframe com divergências conforme sua lógica
    alertas = []
    grouped = df.groupby("item_id")
    for iid, g in grouped:
        started = g[g["status"]=="started"]
        candidate = g[g["status"]=="candidate"]
        if not started.empty and not candidate.empty:
            base = started["price"].min()
            higher = candidate[candidate["max_discounted_price"] > base]
            if not higher.empty:
                for _, row in higher.iterrows():
                    alertas.append(row.to_dict())
    return pd.DataFrame(alertas)

def render_site(df, alertas_df):
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template("index_template.html")
    html = template.render(
        empresa="WHEEL TECH BICYCLIG",
        cor1="#00ADEE",
        cor2="#80D6F7",
        cor3="#76B84",   # você deu esse valor; se for typo ajuste
        cor4="#BBDCA1",
        cor5="#58595B",
        data=datetime.utcnow().isoformat(),
        rows=df.to_dict(orient="records"),
        alerts=alertas_df.to_dict(orient="records"),
        user_login = {"RONALD":"2101"}
    )
    with open(os.path.join(OUT_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)

def main():
    df = gerar_dados()
    alertas = gerar_alertas(df)
    # salvar xlsx no site
    salvar_excel(df, os.path.join(OUT_DIR, "relatorio.xlsx"))
    # salvar também localmente (opcional)
    salvar_excel(df, "relatorio.xlsx")
    # renderiza site
    render_site(df, alertas)
    # opcional: salvar alertas json
    alertas.to_json(os.path.join(OUT_DIR, "alerts.json"), orient="records", force_ascii=False)
    print("Site gerado em", OUT_DIR)

if __name__ == "__main__":
    main()

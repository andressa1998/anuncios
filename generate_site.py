import os
import pandas as pd
from pathlib import Path
from openpyxl import load_workbook

# =========================================================
# CONFIGURAÇÕES DO SISTEMA
# =========================================================
NOME_EMPRESA = "WHEEL TECH BICYCLIG"
USUARIO = "RONALD"
SENHA = "2101"

# Arquivo gerado pelo seu outro script Python
INPUT_EXCEL = "relatorio.xlsx"

# Pasta que o GitHub Actions vai publicar
OUTPUT_DIR = Path("site")
OUTPUT_DIR.mkdir(exist_ok=True)


# =========================================================
# FUNÇÃO PARA LER DADOS
# =========================================================
def carregar_dados():
    wb = load_workbook(INPUT_EXCEL)
    ws = wb["Todos os Dados"]

    rows = list(ws.values)
    header = rows[0]
    dados = rows[1:]

    df = pd.DataFrame(dados, columns=header)
    return df


# =========================================================
# GERA HTML DO DASHBOARD
# =========================================================
def gerar_dashboard(df):
    tabela_html = df.to_html(index=False, classes="tabela")

    html = f"""
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8" />
    <title>{NOME_EMPRESA} – Dashboard de Promoções</title>

    <style>
        body {{
            font-family: Arial, sans-serif;
            background-color: #f4f9fb;
            margin: 0;
        }}

        header {{
            background-color: #00ADEE;
            padding: 20px;
            color: white;
            font-size: 26px;
            font-weight: bold;
        }}

        .subheader {{
            background-color: #80D6F7;
            padding: 10px;
            color: #58595B;
            font-size: 18px;
        }}

        table {{
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
        }}

        .tabela th {{
            background-color: #76B84B;
            color: white;
            padding: 8px;
            border: 1px solid #ddd;
        }}

        .tabela td {{
            padding: 6px;
            border: 1px solid #ddd;
            background-color: #ffffff;
        }}

        .btn {{
            padding: 12px 18px;
            background-color: #00ADEE;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: 0.3s;
        }}

        .btn:hover {{
            background-color: #008abf;
        }}

        .conteudo {{
            padding: 20px;
        }}

        .login-wrapper {{
            width: 100%;
            height: 100vh;
            background-color: #BBDCA1;
            display: flex;
            align-items: center;
            justify-content: center;
        }}

        .login-box {{
            background: white;
            padding: 30px;
            border-radius: 12px;
            width: 320px;
            text-align: center;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
        }}

        input {{
            width: 90%;
            padding: 12px;
            margin: 6px 0;
            border-radius: 6px;
            border: 1px solid #999;
        }}

        #erro {{
            color: red;
            display: none;
            margin-top: 10px;
        }}

    </style>

</head>

<body>

<div id="login" class="login-wrapper">
    <div class="login-box">
        <h2>{NOME_EMPRESA}</h2>
        <input id="usuario" placeholder="Usuário" />
        <input id="senha" placeholder="Senha" type="password" />
        <button onclick="login()" class="btn">Entrar</button>
        <div id="erro">Usuário ou senha inválidos</div>
    </div>
</div>

<div id="dashboard" style="display:none;">
    <header>{NOME_EMPRESA}</header>
    <div class="subheader">Dashboard de Promoções</div>

    <div class="conteudo">
        <a href="relatorio.xlsx" class="btn">⬇ Exportar XLSX</a>

        <h2>Todos os Itens</h2>
        {tabela_html}

        <h2>Itens com divergências</h2>
        <iframe src="divergencias.html" style="width:100%; height:400px; border:none;"></iframe>
    </div>
</div>

<script>
function login() {{
    const u = document.getElementById("usuario").value;
    const s = document.getElementById("senha").value;

    if (u === "{USUARIO}" && s === "{SENHA}") {{
        document.getElementById("login").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
    }} else {{
        document.getElementById("erro").style.display = "block";
    }}
}}
</script>

</body>
</html>
"""
    return html


# =========================================================
# GERA HTML DE DIVERGÊNCIAS
# =========================================================
def gerar_divergencias(df):
    div = []

    for item_id, grupo in df.groupby("item_id"):

        started = grupo[grupo["status"] == "started"]
        candidate = grupo[grupo["status"] == "candidate"]

        if not started.empty and not candidate.empty:
            menor_started = started["price"].min()

            diverg = candidate[candidate["max_discounted_price"] > menor_started]
            if not diverg.empty:
                div.append(diverg)

    if len(div) == 0:
        return "<h3>Nenhuma divergência encontrada.</h3>"

    df_div = pd.concat(div)
    return df_div.to_html(index=False, classes="tabela")


# =========================================================
# EXECUÇÃO
# =========================================================
def main():
    print("📦 Carregando dados...")
    df = carregar_dados()

    print("📄 Gerando dashboard...")
    html = gerar_dashboard(df)
    (OUTPUT_DIR / "index.html").write_text(html, encoding="utf-8")

    print("🔎 Gerando divergências...")
    div_html = gerar_divergencias(df)
    (OUTPUT_DIR / "divergencias.html").write_text(div_html, encoding="utf-8")

    print("📑 Copiando relatório XLSX...")
    os.system(f"cp {INPUT_EXCEL} site/relatorio.xlsx")

    print("✨ Site gerado com sucesso!")


if __name__ == "__main__":
    main()

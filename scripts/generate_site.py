import os
import importlib.util
import sys
import time

# Função para print com timestamp
def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

# Caminhos absolutos
current_dir = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.abspath(os.path.join(current_dir, '..', 'Templates'))
site_dir = os.path.abspath(os.path.join(current_dir, '..', 'Site'))

# Verifica monitorar_promocoes.py
monitor_file = os.path.join(templates_dir, 'monitorar_promocoes.py')
if not os.path.exists(monitor_file):
    log(f"❌ Arquivo monitorar_promocoes.py não encontrado em {templates_dir}")
    sys.exit(1)
log("✔ monitorar_promocoes.py encontrado.")

# Import dinâmico do monitorar_promocoes.py
log("Importando módulo monitorar_promocoes...")
spec = importlib.util.spec_from_file_location("monitorar_promocoes", monitor_file)
monitor_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor_module)
MonitorPromocoesComPrecosExcel = monitor_module.MonitorPromocoesComPrecosExcel
log("✔ Módulo importado com sucesso.")

# API
ACCESS = "APP_USR-5767896809769647-112807-3a76f0ad6e81c34f53c60331a8617c3e-415176739"
USER = "415176739"

monitor = MonitorPromocoesComPrecosExcel(
    ACCESS,
    USER,
    max_threads=20,
    output_file=os.path.join(templates_dir, "relatorio.xlsx")
)

# Gerar dados
log("📊 Buscando promoções e itens...")
df = monitor.gerar_dados()
log(f"✔ Total de itens coletados: {len(df)}")

# Salvar JSON e Excel
json_path = os.path.join(site_dir, "dados.json")
log(f"💾 Salvando JSON em {json_path}...")
monitor.salvar_json(df, caminho=json_path)
log("✔ JSON salvo.")

excel_path = os.path.join(templates_dir, "relatorio.xlsx")
log(f"💾 Salvando Excel com alertas em {excel_path}...")
monitor.salvar_excel_com_alertas(df)
log("✔ Excel salvo.")

# Commit + push automático
log("🚀 Adicionando arquivos importantes no Git...")
os.chdir(os.path.join(current_dir, '..'))  # raiz PYATOGUI

# Adiciona automaticamente
os.system("git add site/dados.json Templates/relatorio.xlsx Scripts/generate_site.py")

# Commit
os.system('git commit -m "Atualizando dados JSON e Excel do site"')

# Push
os.system("git push origin master")
log("✅ Processo finalizado!")

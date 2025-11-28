import os
import importlib.util

# Caminhos absolutos
current_dir = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.abspath(os.path.join(current_dir, '..', 'Templates'))
site_dir = os.path.abspath(os.path.join(current_dir, '..', 'Site'))

# Import dinâmico do monitorar_promocoes.py
monitor_file = os.path.join(templates_dir, 'monitorar_promocoes.py')
spec = importlib.util.spec_from_file_location("monitorar_promocoes", monitor_file)
monitor_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor_module)
MonitorPromocoesComPrecosExcel = monitor_module.MonitorPromocoesComPrecosExcel

# API
ACCESS = "SEU_ACCESS_TOKEN"
USER = "SEU_USER_ID"

monitor = MonitorPromocoesComPrecosExcel(
    ACCESS,
    USER,
    max_threads=20,
    output_file=os.path.join(templates_dir, "relatorio.xlsx")
)

# Gerar dados
print("📊 Buscando promoções e itens...")
df = monitor.gerar_dados()

# Salvar JSON e Excel
print("💾 Salvando JSON no site...")
monitor.salvar_json(df, caminho=os.path.join(site_dir, "dados.json"))
print("💾 Salvando Excel com alertas...")
monitor.salvar_excel_com_alertas(df)

# Commit + push
print("🚀 Enviando dados para o GitHub...")
os.chdir(os.path.join(current_dir, '..'))
os.system("git add Site/dados.json")
os.system('git commit -m "Atualizando dados do site"')
os.system("git push origin main")
print("✅ Processo finalizado!")

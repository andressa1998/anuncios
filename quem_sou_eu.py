import requests

ACCESS_TOKEN = "APP_USR-5767896809769647-112410-3d13061ab8bac71aaed18140f0d9e8a3-415176739"

url = "https://api.mercadolibre.com/users/me"
headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

r = requests.get(url, headers=headers)

print(r.json())

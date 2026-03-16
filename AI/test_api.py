import requests

url = "http://127.0.0.1:8000/api/price/predict"
payload = {
    "cropName": "Tomato",
    "state": "Maharashtra",
    "district": "Pune",
    "month": 7,
    "season": "Kharif",
    "quantity": 100.0,
    "historicalAvgPrice": 25.0
}

response = requests.post(url, json=payload)
print(response.status_code)
print(response.json())

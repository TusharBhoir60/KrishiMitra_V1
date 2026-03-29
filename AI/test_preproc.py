import joblib
from pathlib import Path

prep_path = Path("C:/coding of all sorts/V2/KrishiMitra/AI/models/saved/price_preprocessor.joblib")
prep = joblib.load(prep_path)

print(type(prep))
print(dir(prep))

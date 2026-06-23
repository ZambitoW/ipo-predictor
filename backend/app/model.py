import numpy as np
import xgboost as xgb
from pathlib import Path 

FEATURES = [
    'Offer Size (M)',
    'Offer Price',
    'Initial Pub Offer (Shares Offered)',
    'Market Cap at Offer (M)',
    'offer_size_to_mktcap',
    'has_bulge_bracket',
    'vix',
    'nasdaq',
    'fed_funds',
    'treasury_10y',
    'cpi',
    'unemployment',
    'gdp',
    'ipo_volume',
    'market_return_1m'
]

MODEL_PATH = Path(__file__).parent.parent / "model" / "xgb_binary.json"

_model = None

def get_model():
    global _model
    if _model is None:
        _model = xgb.XGBClassifier()
        _model.load_model(MODEL_PATH)
    return _model

def predict(features: dict):
    model = get_model()
    X = np.array([[features[f] for f in FEATURES]], dtype= np.float32)

    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]

    return {
        "prediction": int(pred),
        "label": "Underpriced" if pred == 1 else "Overpriced",
        "confidence": round(float(proba[int(pred)]), 4),
        "probabilities": {
            "overpriced": round(float(proba[0]), 4),
            "underpriced": round(float(proba[1]), 4)
        }
    }
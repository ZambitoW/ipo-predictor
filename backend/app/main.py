from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from app.model import get_model, FEATURES, predict
from app.fred import get_macro_data
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title= "IPO Underpricing Predictor",
    description="Predicts whether an IPO will be underpriced using XGBoost trained on 6,110 historical IPOs.",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class IPOInput(BaseModel):
    offer_size_m: float          
    offer_price: float        
    shares_offered: float    
    market_cap_m: float        
    has_bulge_bracket: int 
    year: Optional[int] = None   
    month: Optional[int] = None 

class PredictionResponse(BaseModel):
    prediction: int
    label: str
    confidence: float
    probabilities: dict
    macro_snapshot: dict

@app.get("/")
def root():
    return {"status": "ok", "message": "IPO Underpricing Predictor API"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict", response_model=PredictionResponse)
def predict_ipo(input: IPOInput):
    try:
        macro= get_macro_data(year=input.year, month=input.month)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch macro data: {str(e)}")
    
    offer_size_to_mktcap = input.offer_size_m / input.market_cap_m if input.market_cap_m != 0 else 0.0

    features = {
        "Offer Size (M)": input.offer_size_m,
        "Offer Price": input.offer_price,
        "Initial Pub Offer (Shares Offered)": input.shares_offered,
        "Market Cap at Offer (M)": input.market_cap_m,
        "offer_size_to_mktcap": offer_size_to_mktcap,
        "has_bulge_bracket": float(input.has_bulge_bracket),
        "vix": macro["vix"],
        "nasdaq": macro["nasdaq"],
        "fed_funds": macro["fed_funds"],
        "treasury_10y": macro["treasury_10y"],
        "cpi": macro["cpi"],
        "unemployment": macro["unemployment"],
        "gdp": macro["gdp"],
        "ipo_volume": macro["ipo_volume"],
        "market_return_1m": macro["market_return_1m"],
    }

    try:
        result = predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    return PredictionResponse(
        prediction=result["prediction"],
        label=result["label"],
        confidence=result["confidence"],
        probabilities=result["probabilities"],
        macro_snapshot=macro 
    )
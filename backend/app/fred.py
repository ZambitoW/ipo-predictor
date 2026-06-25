import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

FRED_API_KEY = os.getenv("FRED_API_KEY")
FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"
SERIES = {
    "vix": "VIXCLS",
    "nasdaq": "NASDAQCOM",
    "fed_funds": "FEDFUNDS",
    "treasury_10y": "DGS10",
    "cpi": "CPIAUCSL",
    "unemployment": "UNRATE",
    "gdp": "GDPC1",
    "ipo_volume": "IPB50001N",
}

def fetch_latest(series_id):
    end = datetime.today().strftime("%Y-%m-%d")
    start = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")
    response = requests.get(FRED_BASE_URL, params={
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "observation_start": start,
        "observation_end": end,
        "sort_order": "desc",
        "limit": 2
    }, timeout=10)
    data = response.json()
    return data["observations"]

def get_valid(series_id, start, end):
    r = requests.get(FRED_BASE_URL, params={
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "observation_start": start,
        "observation_end": end,
        "sort_order": "desc",
        "limit": 10
    }, timeout=10)
    valid = [o for o in r.json()["observations"] if o["value"] != "."]
    return float(valid[0]["value"]) if valid else None


def get_macro_data(year: int = None, month: int = None) -> dict:
    """Fetch macro features. If year/month provided, fetch historical data for that month."""
    macro = {}

    if year and month:
        target_start = datetime(year, month, 1).strftime("%Y-%m-%d")
        if month == 12:
            target_end = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            target_end = datetime(year, month + 1, 1) - timedelta(days=1)
        target_end = target_end.strftime("%Y-%m-%d")
    else:
        target_end = datetime.today().strftime("%Y-%m-%d")
        target_start = (datetime.today() - timedelta(days=90)).strftime("%Y-%m-%d")

    for feature, series_id in SERIES.items():
        val = get_valid(series_id, target_start, target_end)
        if val is None:
            raise ValueError(f"No data available for {series_id} in {target_start} to {target_end}")
        macro[feature] = val

    if year and month:
        prev_end = datetime(year, month, 1) - timedelta(days=1)
        prev_start = datetime(prev_end.year, prev_end.month, 1)
        current_nasdaq = get_valid("NASDAQCOM", target_start, target_end)
        prev_nasdaq = get_valid("NASDAQCOM", prev_start.strftime("%Y-%m-%d"), prev_end.strftime("%Y-%m-%d"))
    else:
        end_recent = (datetime.today() - timedelta(days=25)).strftime("%Y-%m-%d")
        start_recent = (datetime.today() - timedelta(days=55)).strftime("%Y-%m-%d")
        end_prev = (datetime.today() - timedelta(days=55)).strftime("%Y-%m-%d")
        start_prev = (datetime.today() - timedelta(days=85)).strftime("%Y-%m-%d")
        current_nasdaq = get_valid("NASDAQCOM", start_recent, end_recent)
        prev_nasdaq = get_valid("NASDAQCOM", start_prev, end_prev)

    if current_nasdaq and prev_nasdaq:
        macro["market_return_1m"] = round((current_nasdaq - prev_nasdaq) / prev_nasdaq, 6)
    else:
        macro["market_return_1m"] = 0.0

    return macro



# IPO Underpricing Predictor

> **This is a deployed companion to the main research project.**
> The full ML pipeline, model comparisons, methodology, and analysis live in the **[ipo-underpricing-ml](https://github.com/ZambitoW/ipo-underpricing-ml)** repo. This repo is a lightweight web app that lets you interact with the best-performing model from that research.

🔗 **Live App:** [ipo-predictor.vercel.app](https://ipo-predictor.vercel.app)
📊 **Main Research Repo:** [ipo-underpricing-ml](https://github.com/ZambitoW/ipo-underpricing-ml)

---

## What This Is

After training and comparing four ML models across 6,110 historical IPOs, XGBoost came out on top with 71% accuracy and a Macro F1 of 0.70. This app takes that trained XGBoost binary and wraps it in a simple interface so anyone can run a prediction on a real or hypothetical IPO without touching a Jupyter notebook.

It is not a standalone project. It is the deployed, interactive extension of the research.

**For the full story** (feature engineering, model architecture, results tables, confusion matrices, and feature importance analysis) see the [main research repo](https://github.com/ZambitoW/ipo-underpricing-ml).

---

## How to Use It

Users enter deal information directly into the form:

- **Offer Size (M)** - total dollar value of the offering
- **Offer Price ($)** - price per share set by the underwriter
- **Shares Offered** - number of shares being sold
- **Market Cap at Offer (M)** - implied valuation at the offer price
- **Bulge Bracket Underwriter** - toggle for Goldman, Morgan Stanley, JPM, etc.
- **Historical Date (optional)** - enter a past year and month to fetch the macro conditions from that point in time, useful for testing known IPOs

Macro conditions (VIX, Fed Funds rate, 10Y Treasury, CPI, unemployment, GDP, NASDAQ level, IPO volume, 1-month market return) are pulled live from FRED automatically. If a historical date is provided, the app fetches the macro snapshot from that date instead.

Hit **Predict** and the model returns a binary prediction (Underpriced / Not Underpriced) with a confidence score.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, CSS |
| Backend | FastAPI (Python) |
| Model | XGBoost (serialized binary) |
| Frontend Deployment | Vercel |
| Backend Deployment | Railway |
| Containerization | Docker |

---

## Why XGBoost?

From the research, four models were trained on the same feature pipeline and evaluated on identical stratified 80/20 splits:

| Model | Accuracy | Macro F1 |
|-------|----------|----------|
| Logistic Regression | 58% | 0.58 |
| Neural Network (PyTorch) | 69% | 0.64 |
| Random Forest | 70% | 0.65 |
| **XGBoost** | **71%** | **0.70** |
| Naive baseline (always "underpriced") | 60% | -- |

XGBoost had the highest accuracy and the best Macro F1, meaning it was the most balanced across both classes, not just good at predicting the majority class. Offer price was the single most important feature at ~0.18 importance, nearly double the next feature (market cap at offer and GDP at ~0.09 each).

Full discussion of model selection, class imbalance handling, and feature importance is in the [research repo](https://github.com/ZambitoW/ipo-underpricing-ml).

---

## Running Locally

```bash
git clone https://github.com/ZambitoW/ipo-predictor.git
cd ipo-predictor
docker compose up
```

Frontend at `http://localhost:3000`, FastAPI backend at `http://localhost:8000`.

---

## Disclaimer

This is a school research project completed for CS 0451 Machine Learning at Middlebury College. It is not financial advice. Predictions are based on deal structure and macroeconomic conditions only. Company fundamentals, profitability, competitive dynamics, and investor sentiment are not modeled. Do not use this to make investment decisions.

---

## Author

**William Zambito**
[LinkedIn](https://linkedin.com/in/william-zambito) · [GitHub](https://github.com/ZambitoW) · [Main Research Repo](https://github.com/ZambitoW/ipo-underpricing-ml)

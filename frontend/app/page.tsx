'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface PredictionResult {
  prediction: number
  label: string
  confidence: number
  probabilities: {
    overpriced: number
    underpriced: number
  }
  macro_snapshot: {
    vix: number
    nasdaq: number
    fed_funds: number
    treasury_10y: number
    cpi: number
    unemployment: number
    gdp: number
    ipo_volume: number
    market_return_1m: number
  }
}

interface FormData {
  offer_size_m: string
  offer_price: string
  shares_offered: string
  market_cap_m: string
  has_bulge_bracket: boolean
  year: string
  month: string
}

const MACRO_LABELS: Record<string, string> = {
  vix: 'VIX',
  nasdaq: 'NASDAQ',
  fed_funds: 'Fed Funds',
  treasury_10y: '10Y Treasury',
  cpi: 'CPI',
  unemployment: 'Unemployment',
  gdp: 'GDP',
  ipo_volume: 'IPO Volume',
  market_return_1m: 'Market Return 1M',
}

export default function Home() {
  const [form, setForm] = useState<FormData>({
    offer_size_m: '',
    offer_price: '',
    shares_offered: '',
    market_cap_m: '',
    has_bulge_bracket: false,
    year: '',
    month: '',
  })
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (): string | null => {
    if (!form.offer_size_m || isNaN(parseFloat(form.offer_size_m))) return 'Offer Size is required.'
    if (!form.offer_price || isNaN(parseFloat(form.offer_price))) return 'Offer Price is required.'
    if (!form.shares_offered || isNaN(parseFloat(form.shares_offered))) return 'Shares Offered is required.'
    if (!form.market_cap_m || isNaN(parseFloat(form.market_cap_m))) return 'Market Cap at Offer is required.'
    if (parseFloat(form.offer_size_m) <= 0) return 'Offer Size must be greater than zero.'
    if (parseFloat(form.offer_price) <= 0) return 'Offer Price must be greater than zero.'
    if (parseFloat(form.shares_offered) <= 0) return 'Shares Offered must be greater than zero.'
    if (parseFloat(form.market_cap_m) <= 0) return 'Market Cap at Offer must be greater than zero.'
    if (form.year && (parseInt(form.year) < 1990 || parseInt(form.year) > new Date().getFullYear())) return 'Year must be between 1990 and the current year.'
    if (form.month && (parseInt(form.month) < 1 || parseInt(form.month) > 12)) return 'Month must be between 1 and 12.'
    if ((form.year && !form.month) || (!form.year && form.month)) return 'Provide both Year and Month, or leave both blank.'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_size_m: parseFloat(form.offer_size_m),
          offer_price: parseFloat(form.offer_price),
          shares_offered: parseFloat(form.shares_offered),
          market_cap_m: parseFloat(form.market_cap_m),
          has_bulge_bracket: form.has_bulge_bracket ? 1 : 0,
          year: form.year ? parseInt(form.year) : null,
          month: form.month ? parseInt(form.month) : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Prediction failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const isUnderpriced = result?.prediction === 1
  const confidencePct = result ? Math.round(result.confidence * 100) : 0

  const formatMacroValue = (key: string, value: number) => {
    if (key === 'market_return_1m') return `${(value * 100).toFixed(2)}%`
    if (key === 'nasdaq' || key === 'gdp') return value.toLocaleString()
    return value.toLocaleString()
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '48px 24px',
      maxWidth: '1100px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent)',
          fontSize: '12px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          ML-Powered · XGBoost · 6,110 Historical IPOs
        </p>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}>
          IPO Underpricing<br />
          <span style={{ color: 'var(--accent)' }}>Predictor</span>
        </h1>
        <p style={{
          color: 'var(--muted)',
          marginTop: '16px',
          fontSize: '15px',
          maxWidth: '520px',
          lineHeight: 1.6,
        }}>
          Enter IPO details below. Macro conditions are fetched live from FRED —
          or specify a date to test historical IPOs.
        </p>
      </div>

      {/* Two column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Left — Form */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <h2 style={{
            fontSize: '14px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}>
            IPO Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { key: 'offer_size_m', label: 'Offer Size (M)', placeholder: 'e.g. 3360' },
              { key: 'offer_price', label: 'Offer Price ($)', placeholder: 'e.g. 120' },
              { key: 'shares_offered', label: 'Shares Offered', placeholder: 'e.g. 28000000' },
              { key: 'market_cap_m', label: 'Market Cap at Offer (M)', placeholder: 'e.g. 33200' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '6px',
                  letterSpacing: '0.05em',
                }}>
                  {label}
                </label>
                <input
                  type="number"
                  placeholder={placeholder}
                  value={form[key as keyof FormData] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            ))}

            {/* Bulge Bracket Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 14px',
            }}>
              <div>
                <p style={{ fontSize: '14px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  Bulge Bracket Underwriter
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', opacity: 0.6, marginTop: '2px' }}>
                  Goldman, Morgan Stanley, JPM, etc.
                </p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, has_bulge_bracket: !f.has_bulge_bracket }))}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  background: form.has_bulge_bracket ? 'var(--accent)' : 'var(--border)',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: form.has_bulge_bracket ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {/* Date — optional */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: 'var(--muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '6px',
                letterSpacing: '0.05em',
              }}>
                Historical Date (optional)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Year (e.g. 2020)"
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <input
                  type="number"
                  placeholder="Month (1-12)"
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: loading ? 'var(--muted)' : '#0a0a0f',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                marginTop: '8px',
              }}
            >
              {loading ? 'Fetching macro data...' : 'Predict'}
            </button>

            {error && (
              <p style={{
                color: 'var(--red)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Right — Results */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: result ? 'flex-start' : 'center',
          alignItems: result ? 'stretch' : 'center',
        }}>
          {!result && !loading && (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted)',
                fontSize: '14px',
              }}>
                Fill in the form and hit Predict
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                fontSize: '14px',
              }}>
                Running model...
              </p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{
                fontSize: '15px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                Prediction
              </h2>

              {/* Verdict */}
              <div style={{
                padding: '24px',
                borderRadius: '12px',
                background: isUnderpriced
                  ? 'rgba(0, 212, 170, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${isUnderpriced ? 'rgba(0,212,170,0.3)' : 'rgba(239,68,68,0.3)'}`,
                textAlign: 'center',
              }}>
                <p style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: isUnderpriced ? 'var(--accent)' : 'var(--red)',
                  letterSpacing: '-0.02em',
                }}>
                  {result.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  color: 'var(--muted)',
                  marginTop: '4px',
                }}>
                  {confidencePct}% confidence
                </p>
              </div>

              {/* Confidence bar */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                    Confidence
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    color: isUnderpriced ? 'var(--accent)' : 'var(--red)',
                    fontWeight: 600,
                  }}>
                    {confidencePct}%
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'var(--border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${confidencePct}%`,
                    background: isUnderpriced ? 'var(--accent)' : 'var(--red)',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                }}>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>0%</span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>100%</span>
                </div>
              </div>

              {/* Macro snapshot */}
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}>
                  Macro Snapshot
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}>
                  {Object.entries(result.macro_snapshot).map(([key, value]) => (
                    <div key={key} style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)',
                      }}>
                        {MACRO_LABELS[key] ?? key}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text)',
                        fontWeight: 600,
                      }}>
                        {formatMacroValue(key, value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limitations */}
              <div style={{
                background: 'rgba(107, 114, 128, 0.08)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
              }}>
                <p style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                  marginBottom: '8px',
                }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>Model:</span> XGBoost binary classifier trained on 6,110 IPOs (2000–2024), achieving 71% accuracy vs. a 60% naive baseline. Macro F1 of 0.70 across stratified 80/20 splits.
                </p>
                <p style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>Limitations:</span> Predictions are based on deal structure and macroeconomic conditions only. Company fundamentals, profitability, competitive dynamics, and investor sentiment are not modeled. The training data is 60% underpriced, so the model has a natural lean toward underpriced predictions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        marginTop: '48px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--muted)',
      }}>
        For research purposes only · Not financial advice · Extension of IPO Underpricing Capstone Project
      </p>
    </main>
  )
}
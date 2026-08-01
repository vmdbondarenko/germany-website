"use client"

import { useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { X, TrendingDown, TrendingUp, Minus } from "lucide-react"

export type PriceHistoryEntry = {
  id: string
  date: string | Date
  totalPrice: number | null
  pricePerSqm: number | null
  parkingPrice?: number | null
  storagePrice?: number | null
  rightsPrice?: number | null
  otherPrice?: number | null
}

interface PriceHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  area: number | null
  currentPrice: number | null
  currentExtras?: {
    parkingPrice: number | null; storagePrice: number | null
    rightsPrice: number | null; otherPrice: number | null
  }
  history: PriceHistoryEntry[]
}

function fullOf(h: Pick<PriceHistoryEntry, 'totalPrice' | 'parkingPrice' | 'storagePrice' | 'rightsPrice' | 'otherPrice'>): number | null {
  if (h.totalPrice == null) return null
  return h.totalPrice + (h.parkingPrice ?? 0) + (h.storagePrice ?? 0) + (h.rightsPrice ?? 0) + (h.otherPrice ?? 0)
}

function fmtPLN(v: number | null | undefined) {
  if (v == null) return "—"
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v)
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function PriceHistoryModal({ isOpen, onClose, title, area, currentPrice, currentExtras, history }: PriceHistoryModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Build rows: newest first, with previous-entry delta. Synthesize a single
  // "current" row when no history exists but a current price is known so units
  // that never had a price change still display meaningful information.
  // "Cena" shown in the table is fullPrice (totalPrice + art. 19a extras);
  // "Cena/m²" still uses totalPrice / area per earlier UI decision.
  const rows = useMemo(() => {
    let sortedAsc = [...history]
      .filter(h => h.totalPrice != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (sortedAsc.length === 0 && currentPrice != null) {
      sortedAsc = [{
        id: 'current',
        date: new Date().toISOString(),
        totalPrice: currentPrice,
        pricePerSqm: area ? currentPrice / area : null,
        parkingPrice: currentExtras?.parkingPrice ?? null,
        storagePrice: currentExtras?.storagePrice ?? null,
        rightsPrice: currentExtras?.rightsPrice ?? null,
        otherPrice: currentExtras?.otherPrice ?? null,
      }]
    }
    return sortedAsc
      .map((h, i) => {
        const prev = i > 0 ? sortedAsc[i - 1] : null
        const full = fullOf(h)
        const prevFull = prev ? fullOf(prev) : null
        const delta = prevFull != null && full != null ? full - prevFull : null
        return { ...h, fullPrice: full, delta }
      })
      .reverse()
  }, [history, currentPrice, currentExtras, area])

  // Omnibus: lowest full price in the 30 days before the most recent change, if current is a reduction
  const omnibusLow = useMemo(() => {
    const currentFull = rows.length > 0 ? rows[0].fullPrice : null
    if (!currentFull || rows.length < 2) return null
    const sortedAsc = [...history]
      .filter(h => h.totalPrice != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const latest = sortedAsc[sortedAsc.length - 1]
    const latestTime = new Date(latest.date).getTime()
    const windowStart = latestTime - 30 * 24 * 60 * 60 * 1000
    const prior = sortedAsc.slice(0, -1).filter(h => new Date(h.date).getTime() >= windowStart)
    if (prior.length === 0) return null
    const priorFulls = prior.map(fullOf).filter((v): v is number => v != null)
    if (priorFulls.length === 0) return null
    const min = Math.min(...priorFulls)
    return min > currentFull ? min : null
  }, [history, rows])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-secondary/30">
          <div>
            <h2 className="font-serif text-lg font-semibold" style={{ color: "#3E1718" }}>Preisverlauf</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6E2E2A" }}>{title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground/10 hover:bg-foreground/20 transition-colors"
            aria-label="Schließen"
          >
            <X className="h-3.5 w-3.5" />
            Schließen
          </button>
        </div>

        {omnibusLow != null && (
          <div className="px-6 py-3 border-b border-border/60 bg-amber-50">
            <p className="text-xs" style={{ color: "#3E1718" }}>
              Niedrigster Preis der letzten 30 Tage vor der Senkung:{" "}
              <span className="font-semibold" style={{ textDecoration: "line-through" }}>{fmtPLN(omnibusLow)}</span>
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "#3E1718", opacity: 0.6 }}>
              Kein Preisverlauf für diese Immobilie vorhanden.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 sticky top-0">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#3E1718" }}>Datum</th>
                  <th className="px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "#3E1718" }}>Preis</th>
                  {area ? (
                    <th className="px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "#3E1718" }}>Preis/m²</th>
                  ) : null}
                  <th className="px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "#3E1718" }}>Änderung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((h, i) => {
                  const isCurrent = i === 0
                  const deltaPct = h.delta != null && h.fullPrice != null && h.fullPrice - h.delta !== 0
                    ? (h.delta / (h.fullPrice - h.delta)) * 100
                    : null
                  return (
                    <tr key={h.id} className={isCurrent ? "bg-secondary/20" : ""}>
                      <td className="px-6 py-2" style={{ color: "#3E1718" }}>
                        {fmtDate(h.date)}
                        {isCurrent && <span className="ml-2 text-[10px] uppercase font-semibold" style={{ color: "#6E2E2A" }}>aktuell</span>}
                      </td>
                      <td className="px-6 py-2 text-right font-semibold" style={{ color: "#6E2E2A" }}>
                        {fmtPLN(h.fullPrice)}
                      </td>
                      {area ? (
                        <td className="px-6 py-2 text-right" style={{ color: "#3E1718", opacity: 0.75 }}>
                          {h.totalPrice != null ? `${Math.round((h.totalPrice as number) / area).toLocaleString("de-DE")} €` : "—"}
                        </td>
                      ) : null}
                      <td className="px-6 py-2 text-right text-xs">
                        {h.delta == null ? (
                          <span style={{ color: "#3E1718", opacity: 0.4 }}>—</span>
                        ) : h.delta === 0 ? (
                          <span className="inline-flex items-center gap-1" style={{ color: "#3E1718", opacity: 0.5 }}>
                            <Minus className="h-3 w-3" /> keine Änderung
                          </span>
                        ) : h.delta > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <TrendingUp className="h-3 w-3" />
                            +{fmtPLN(h.delta)}{deltaPct != null ? ` (${deltaPct.toFixed(1)}%)` : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-700">
                            <TrendingDown className="h-3 w-3" />
                            {fmtPLN(h.delta)}{deltaPct != null ? ` (${deltaPct.toFixed(1)}%)` : ""}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border/60 bg-secondary/10 text-[11px]" style={{ color: "#3E1718", opacity: 0.6 }}>
          Übersicht über die bisherige Preisentwicklung dieser Immobilie.
        </div>
      </div>
    </div>,
    document.body
  )
}

"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Download } from "lucide-react"

interface PdfModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  title: string
}

export function PdfModal({ isOpen, onClose, pdfUrl, title }: PdfModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-secondary/30">
          <h2 className="font-serif text-lg font-semibold" style={{ color: '#3E1718' }}>
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: '#6E2E2A', border: '1px solid rgba(110,46,42,0.3)' }}
            >
              <Download className="h-3.5 w-3.5" />
              Pobierz
            </a>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground/10 hover:bg-foreground/20 transition-colors"
              aria-label="Zamknij"
            >
              <X className="h-3.5 w-3.5" />
              Zamknij
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 bg-neutral-100">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={title}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

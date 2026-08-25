/* ── QrInvite ─────────────────────────────────────────────────────────────────
   Shows the family-room invite as a QR code so nearby devices join by camera —
   no accounts, no texting. Generated entirely on this device: the room link
   (which carries the private key) never touches any outside service. */

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function QrInvite({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let active = true
    import('qrcode').then((QRCode) => {
      if (!active || !canvasRef.current) return
      QRCode.toCanvas(canvasRef.current, window.location.href, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#191114', light: '#ffffff' },
      })
    })
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      active = false
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="profile-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="profile-card qr-card" role="dialog" aria-label="Join by camera">
        <header>
          <b>Join by camera</b>
          <button className="theme-close" aria-label="Close" onClick={onClose}><X size={17} /></button>
        </header>
        <div className="qr-frame">
          <canvas ref={canvasRef} />
        </div>
        <p className="qr-hint">Point another phone’s camera at this code — it opens our family room. Then just enter a name and birthday.</p>
      </section>
    </div>
  )
}

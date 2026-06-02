import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmSheetProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  if (!open) {
    return null
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <section
        aria-label="确认操作"
        aria-modal="true"
        className="settings-sheet confirm-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="confirm-sheet-head">
          <div className="brand-mark confirm-sheet-icon" aria-hidden="true">
            <AlertTriangle size={18} />
          </div>
          <div className="confirm-sheet-copy">
            <p className="section-kicker">确认操作</p>
            <h2>{title}</h2>
            <div className="muted-copy confirm-sheet-body">{message}</div>
          </div>
        </div>

        <div className="confirm-sheet-actions">
          <button className="ghost-button" onClick={onClose} type="button">
            先取消
          </button>
          <button className="primary-button confirm-sheet-danger" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

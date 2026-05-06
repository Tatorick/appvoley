import React, { useState } from 'react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * DeletePaymentModal
 * Props:
 *   movement  — the treasury_movements row to delete
 *   onClose   — called when modal is dismissed
 *   onSuccess — called after successful deletion
 */
export default function DeletePaymentModal({ movement, onClose, onSuccess }) {
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  if (!movement) return null

  const isIncome  = movement.type === 'income'
  const amountFmt = `$${Number(movement.amount).toFixed(2)}`
  const dateFmt   = movement.date
    ? new Date(movement.date + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : '—'

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('delete_payment', {
        p_movement_id: movement.id,
        p_notes:       notes.trim() || null,
      })
      if (rpcError) throw rpcError
      onSuccess()
    } catch (err) {
      console.error('delete_payment error:', err)
      setError('No se pudo eliminar el movimiento. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Eliminar Movimiento</h2>
              <p className="text-sm text-slate-500">Esta acción quedará registrada en el historial.</p>
            </div>
          </div>
        </div>

        {/* Movement Summary */}
        <div className="px-6 pt-5">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-800 text-sm">{movement.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">{dateFmt}</p>
              </div>
              <span
                className={`text-base font-bold font-mono ${isIncome ? 'text-green-600' : 'text-red-500'}`}
              >
                {isIncome ? '+' : '-'}{amountFmt}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                {movement.category || 'Sin categoría'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {isIncome ? 'Ingreso' : 'Egreso'}
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="px-6 pt-4">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              El movimiento será marcado como eliminado. Podrás ver este cambio
              en la <strong>tab Auditoría</strong> con tu nombre, la fecha y la hora exacta.
            </p>
          </div>
        </div>

        {/* Notes field */}
        <div className="px-6 pt-4 pb-2">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            Motivo de eliminación <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej: Pago registrado por error, duplicado, etc."
            className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none
                       focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-red-600/25"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" />Eliminando...</>
            ) : (
              <><Trash2 size={16} />Eliminar</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

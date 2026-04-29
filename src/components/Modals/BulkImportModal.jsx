import React, { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { validateId } from '../../utils/validations'
import {
  X, Upload, Download, CheckCircle2, AlertCircle, Loader2,
  FileSpreadsheet, ChevronRight, Users, AlertTriangle
} from 'lucide-react'

// ──────────────────────────────────────────────────────────
//  CONSTANTS
// ──────────────────────────────────────────────────────────
const TEMPLATE_COLUMNS = [
  'Nombres', 'Apellidos', 'Fecha Nacimiento', 'Genero',
  'Cedula DNI', 'Telefono', 'Altura cm', 'Posicion', 'Dorsal',
  'Equipo', 'Genero Equipo', 'Categoria'
]

const POSITIONS = ['Punta', 'Opuesto', 'Central', 'Armador', 'Libero', 'Universal']
const EXAMPLE_ROWS = [
  ['MARIA', 'PEREZ LOPEZ', '15/03/2005', 'Femenino', '1712345678', '0987654321', '172', 'Punta', '7', 'Sub 16', 'Femenino', 'Sub 16'],
  ['ANA', 'GÓMEZ VERA', '22/09/2008', 'Femenino', '1709876543', '0991234567', '165', 'Libero', '1', 'Sub 14', 'Femenino', 'Sub 14'],
  ['SOFIA', 'TORRES', '05/12/2002', 'Femenino', '1703456789', '', '178', 'Central', '3', 'Libre', 'Femenino', 'Libre'],
]

// ──────────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────────
function parseExcelDate(value) {
  if (!value) return null
  // Excel serial date
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  // String formats: DD/MM/YYYY or YYYY-MM-DD
  const str = String(value).trim()
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymd) return str
  return null
}

function validateRow(row, index) {
  const errors = []
  if (!row.first_name?.trim()) errors.push('Nombres requerido')
  if (!row.last_name?.trim()) errors.push('Apellidos requerido')
  if (!row.dob) errors.push('Fecha de nacimiento obligatoria y válida')
  if (!['Femenino', 'Masculino'].includes(row.gender)) errors.push('Género debe ser Femenino o Masculino')
  if (!row.dni) errors.push('Cédula DNI es obligatoria')
  else if (!validateId(row.dni)) errors.push('Cédula DNI inválida (dígito verificador incorrecto)')
  return errors
}

function parseRows(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (raw.length < 2) return []

  // Find header row (first row with 'Nombres' or 'nombres')
  let headerIdx = 0
  const headerRow = raw[headerIdx].map(c => String(c).trim().toLowerCase())

  return raw.slice(headerIdx + 1)
    .filter(r => r.some(c => c !== '' && c !== null && c !== undefined))
    .map((r, i) => {
      const get = (col) => {
        const idx = headerRow.indexOf(col)
        return idx >= 0 ? String(r[idx] ?? '').trim() : ''
      }
      const dobRaw = (() => {
        const idx = headerRow.indexOf('fecha nacimiento')
        return idx >= 0 ? r[idx] : ''
      })()

      return {
        _rowIndex: i + 2,
        first_name: get('nombres').toUpperCase(),
        last_name: get('apellidos').toUpperCase(),
        dob: parseExcelDate(dobRaw),
        gender: get('genero'),
        dni: get('cedula dni') || null,
        phone: get('telefono') || null,
        height: get('altura cm') ? parseInt(get('altura cm')) || null : null,
        position: POSITIONS.find(p => p.toLowerCase() === get('posicion').toLowerCase()) || null,
        jersey_number: get('dorsal') ? parseInt(get('dorsal')) || null : null,
        team_name: get('equipo') || null,
        team_gender: get('genero equipo') || null,
        team_category: get('categoria') || null,
      }
    })
}

// ──────────────────────────────────────────────────────────
//  COMPONENT
// ──────────────────────────────────────────────────────────
export default function BulkImportModal({ isOpen, onClose, clubId, onSuccess }) {
  const [step, setStep] = useState(1) // 1 = upload, 2 = preview, 3 = done
  const [rows, setRows] = useState([])
  const [rowErrors, setRowErrors] = useState({}) // { rowIndex: [errors] }
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState({ success: 0, failed: 0, errors: [] })
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const wsData = [TEMPLATE_COLUMNS, ...EXAMPLE_ROWS]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Column widths (12 cols)
    ws['!cols'] = [18, 20, 18, 12, 14, 13, 10, 12, 8, 14, 14, 14].map(w => ({ wch: w }))

    XLSX.utils.book_append_sheet(wb, ws, 'Jugadoras')
    XLSX.writeFile(wb, 'plantilla_jugadoras.xlsx')
  }

  const processFile = useCallback((file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const parsed = parseRows(ws)

        // Validate each row
        const errors = {}
        const seenDnis = new Set()
        parsed.forEach((row, i) => {
          const errs = validateRow(row, i)
          if (row.dni) {
            if (seenDnis.has(row.dni)) errs.push('DNI duplicado en el archivo')
            else seenDnis.add(row.dni)
          }
          if (errs.length > 0) errors[i] = errs
        })

        setRows(parsed)
        setRowErrors(errors)
        setStep(2)
      } catch (err) {
        alert('Error leyendo el archivo. Verifica que sea un Excel (.xlsx) válido.')
        console.error(err)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleFileDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e) => {
    processFile(e.target.files[0])
    e.target.value = ''
  }

  const handleImport = async () => {
    setImporting(true)
    const validRows = rows.filter((_, i) => !rowErrors[i])
    let success = 0
    let failed = 0
    const errors = []

    // Cache teams to avoid duplicate DB lookups/creates
    const teamCache = {} // name -> id

    const getOrCreateTeam = async (teamName, teamGender, teamCategory) => {
      if (!teamName) return null
      const cacheKey = teamName.trim().toLowerCase()
      if (teamCache[cacheKey]) return teamCache[cacheKey]

      // Try to find existing team
      const { data: existing } = await supabase
        .from('teams')
        .select('id')
        .eq('club_id', clubId)
        .ilike('nombre', teamName.trim())
        .maybeSingle()

      if (existing) {
        teamCache[cacheKey] = existing.id
        return existing.id
      }

      // If category name provided, find or create it
      let categoryId = null
      if (teamCategory) {
        const { data: existingCat } = await supabase
          .from('categories')
          .select('id')
          .ilike('nombre', teamCategory.trim())
          .maybeSingle()

        if (existingCat) {
          categoryId = existingCat.id
        } else {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({ nombre: teamCategory.trim(), club_id: clubId, edad_min: 0, edad_max: 99 })
            .select('id')
            .single()
          categoryId = newCat?.id || null
        }
      }

      // Create new team with full info
      const { data: created, error } = await supabase
        .from('teams')
        .insert({
          nombre: teamName.trim(),
          club_id: clubId,
          genero: teamGender || 'Mixto',
          category_id: categoryId
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating team:', error)
        return null
      }

      teamCache[cacheKey] = created.id
      return created.id
    }

    for (const row of validRows) {
      try {
        // 1. Pre-check DNI uniqueness
        if (row.dni) {
          const { data: dup } = await supabase
            .from('players')
            .select('id, club_id')
            .eq('dni', row.dni)
            .maybeSingle()

          if (dup) {
            failed++
            const msg = dup.club_id === clubId
              ? `Fila ${row._rowIndex}: La jugadora con cédula ${row.dni} ya existe en este club`
              : `Fila ${row._rowIndex}: La cédula ${row.dni} ya está registrada en otro club`
            errors.push(msg)
            continue
          }
        }

        // 2. Insert player
        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            first_name: row.first_name,
            last_name: row.last_name,
            dob: row.dob,
            gender: row.gender,
            dni: row.dni || null,
            phone: row.phone || null,
            height: row.height,
            position: row.position,
            jersey_number: row.jersey_number,
            club_id: clubId
          })
          .select('id')
          .single()

        if (playerError) {
          failed++
          errors.push(`Fila ${row._rowIndex}: ${playerError.message}`)
          continue
        }

        // 3. Get or create team and assign
        if (row.team_name) {
          const teamId = await getOrCreateTeam(row.team_name, row.team_gender, row.team_category)
          if (teamId) {
            await supabase.from('team_assignments').insert({
              player_id: player.id,
              team_id: teamId
            })
          }
        }

        success++
      } catch (err) {
        failed++
        errors.push(`Fila ${row._rowIndex}: Error inesperado — ${err.message}`)
      }
    }

    setImportResults({ success, failed, errors })
    setStep(3)
    setImporting(false)

    if (success > 0) onSuccess?.()
  }

  const handleClose = () => {
    setStep(1)
    setRows([])
    setRowErrors({})
    setImportResults({ success: 0, failed: 0, errors: [] })
    onClose()
  }

  if (!isOpen) return null

  const validCount = rows.filter((_, i) => !rowErrors[i]).length
  const errorCount = Object.keys(rowErrors).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Importar Jugadoras</h2>
              <p className="text-xs text-slate-400">
                {step === 1 && 'Carga tu archivo Excel'}
                {step === 2 && `${rows.length} filas detectadas · ${validCount} válidas · ${errorCount} con errores`}
                {step === 3 && 'Importación completada'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {['Subir Archivo', 'Revisar', 'Resultado'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-primary text-white' :
                'bg-slate-100 text-slate-400'
              }`}>
                {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-primary' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-slate-100 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Download template */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-blue-900 text-sm">Primero, descarga la plantilla</p>
                  <p className="text-blue-600 text-xs mt-0.5">El formato debe coincidir exactamente para que la importación funcione.</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shrink-0 ml-4"
                >
                  <Download size={16} /> Plantilla .xlsx
                </button>
              </div>

              {/* Upload zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
                <Upload size={36} className={`mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-slate-300'}`} />
                <p className="font-bold text-slate-700 mb-1">Arrastra tu archivo aquí</p>
                <p className="text-xs text-slate-400">o haz clic para seleccionar · .xlsx, .xls, .csv</p>
              </div>

              {/* Columns reference */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Columnas de la plantilla</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_COLUMNS.map(col => (
                    <span key={col} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg font-medium">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Los campos <strong>Nombres, Apellidos, Fecha Nacimiento, Género y Cédula DNI</strong> son <strong>obligatorios</strong>. Asegúrate de incluir cédulas válidas. Si pones un Equipo, puedes indicar su Género y Categoría para crearlo automáticamente.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold">
                  <CheckCircle2 size={16} /> {validCount} listas para importar
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-bold">
                    <AlertCircle size={16} /> {errorCount} con errores
                  </div>
                )}
              </div>

              {errorCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                    <AlertTriangle size={14} /> Las filas con errores serán omitidas
                  </p>
                  <p className="text-xs text-amber-600">Corrige el Excel y vuelve a importarlo, o continúa solo con las válidas.</p>
                </div>
              )}

              {/* Table */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Nacimiento</th>
                        <th className="px-3 py-2 text-left">Género</th>
                        <th className="px-3 py-2 text-left">Cédula</th>
                        <th className="px-3 py-2 text-left">Equipo</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rows.map((row, i) => {
                        const errs = rowErrors[i]
                        return (
                          <tr key={i} className={errs ? 'bg-red-50' : 'hover:bg-slate-50'}>
                            <td className="px-3 py-2 text-slate-400">{row._rowIndex}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{row.first_name} {row.last_name}</td>
                            <td className="px-3 py-2 text-slate-500">{row.dob || '—'}</td>
                            <td className="px-3 py-2 text-slate-500">{row.gender || '—'}</td>
                            <td className="px-3 py-2 text-slate-500 font-mono">{row.dni || '—'}</td>
                            <td className="px-3 py-2">
                              {row.team_name ? (
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  {row.team_name}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {errs ? (
                                <div className="text-red-600 flex items-start gap-1">
                                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                  <span>{errs.join(', ')}</span>
                                </div>
                              ) : (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> OK
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Results */}
          {step === 3 && (
            <div className="text-center py-6 space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                importResults.failed === 0 ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {importResults.failed === 0
                  ? <CheckCircle2 size={40} className="text-green-600" />
                  : <AlertTriangle size={40} className="text-amber-600" />
                }
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {importResults.failed === 0 ? '¡Importación completada!' : 'Importación parcial'}
                </h3>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                    <p className="text-xs text-slate-500">Importadas</p>
                  </div>
                  {importResults.failed > 0 && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-500">{importResults.failed}</p>
                      <p className="text-xs text-slate-500">Fallidas</p>
                    </div>
                  )}
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 text-left space-y-1">
                  <p className="text-xs font-bold text-red-700 mb-2">Errores durante la importación:</p>
                  {importResults.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">• {e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          {step === 1 && (
            <button onClick={handleClose} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
              Cancelar
            </button>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => { setStep(1); setRows([]); setRowErrors({}) }}
                className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                ← Volver
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {importing ? (
                  <><Loader2 size={16} className="animate-spin" /> Importando...</>
                ) : (
                  <><Users size={16} /> Importar {validCount} jugadoras</>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button onClick={handleClose} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm">
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

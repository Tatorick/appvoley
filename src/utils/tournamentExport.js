/**
 * tournamentExport.js
 * Utility functions to export tournament roster to Excel and PDF.
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Category emoji map ───────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
    'Transporte',
    'Hospedaje',
    'Alimentación',
    'Inscripción',
    'Uniformes',
    'Otro',
]

export const EXPENSE_EMOJI = {
    Transporte: '🚌',
    Hospedaje: '🏨',
    'Alimentación': '🍽',
    'Inscripción': '📋',
    Uniformes: '👕',
    Otro: '📦',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    // Force local-time parsing to avoid UTC offset shifting date
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const sanitize = (val) => (val === null || val === undefined ? '' : String(val))

// ─── Excel Export ─────────────────────────────────────────────────────────────
/**
 * Exports the confirmed roster to an Excel file.
 * Columns: #, Apellidos, Nombres, Fecha Nacimiento, Cédula
 *
 * @param {Array}  roster      - Array of tournament_roster rows (with players joined)
 * @param {Object} tournament  - Tournament object { name }
 */
export function exportRosterToExcel(roster, tournament) {
    // Filter confirmed only, but include all if none are confirmed
    const confirmed = roster.filter(r => r.status === 'confirmed')
    const data = (confirmed.length > 0 ? confirmed : roster).map((r, i) => ({
        '#': i + 1,
        'Apellidos': sanitize(r.players?.last_name),
        'Nombres': sanitize(r.players?.first_name),
        'Fecha de Nacimiento': formatDate(r.players?.dob),
        'Cédula / DNI': sanitize(r.players?.dni),
    }))

    const ws = XLSX.utils.json_to_sheet(data)

    // Column widths
    ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 20 },  // Apellidos
        { wch: 20 },  // Nombres
        { wch: 18 },  // Fecha Nac
        { wch: 15 },  // Cédula
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Convocatoria')

    const safeName = (tournament?.name || 'Torneo').replace(/[^a-zA-Z0-9_\- áéíóú]/gi, '_')
    XLSX.writeFile(wb, `Nomina_${safeName}.xlsx`)
}

// ─── PDF Ficha de Inscripción ────────────────────────────────────────────────
/**
 * Generates a tournament registration PDF (ficha de inscripción).
 * Columns: #, Apellidos, Nombres, Fecha Nacimiento, Cédula
 *
 * @param {Array}  roster      - Array of tournament_roster rows (with players joined)
 * @param {Object} tournament  - Tournament object
 * @param {Object} club        - Club object { name }
 */
export function exportRosterToPDF(roster, tournament, club) {
    const confirmed = roster.filter(r => r.status === 'confirmed')
    const rows = (confirmed.length > 0 ? confirmed : roster).map((r, i) => [
        i + 1,
        sanitize(r.players?.last_name).toUpperCase(),
        sanitize(r.players?.first_name),
        formatDate(r.players?.dob),
        sanitize(r.players?.dni),
    ])

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const primaryColor = [79, 70, 229]   // indigo-600
    const headerBg    = [238, 242, 255]  // indigo-50

    // ── Header bar ────────────────────────────────────────────────────────────
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageW, 22, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('FICHA DE INSCRIPCIÓN — TORNEO DE VOLEIBOL', pageW / 2, 10, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text((club?.name || 'Club').toUpperCase(), pageW / 2, 17, { align: 'center' })

    // ── Tournament info block ─────────────────────────────────────────────────
    doc.setFillColor(...headerBg)
    doc.rect(10, 26, pageW - 20, 18, 'F')

    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(tournament?.name || 'Torneo', pageW / 2, 33, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const dateRange = `${formatDate(tournament?.start_date)} — ${formatDate(tournament?.end_date)}`
    const location  = tournament?.location || ''
    doc.setTextColor(80, 80, 80)
    doc.text(`${dateRange}     •     ${location}`, pageW / 2, 39, { align: 'center' })

    // ── Roster table ─────────────────────────────────────────────────────────
    autoTable(doc, {
        startY: 50,
        head: [['#', 'Apellidos', 'Nombres', 'Fecha de Nacimiento', 'Cédula / DNI']],
        body: rows,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            textColor: [20, 20, 20],
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { halign: 'center', cellWidth: 32 },
            4: { halign: 'center', cellWidth: 30 },
        },
        alternateRowStyles: { fillColor: [249, 250, 255] },
        margin: { left: 10, right: 10 },
    })

    // ── Footer ────────────────────────────────────────────────────────────────
    const finalY = doc.lastAutoTable.finalY + 8
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.4)
    doc.line(10, finalY, pageW - 10, finalY)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(140, 140, 140)
    doc.text(
        `Generado con AppVoley · ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
        pageW / 2,
        finalY + 5,
        { align: 'center' }
    )

    // ── Save ──────────────────────────────────────────────────────────────────
    const safeName = (tournament?.name || 'Torneo').replace(/[^a-zA-Z0-9_\- áéíóú]/gi, '_')
    doc.save(`Ficha_${safeName}.pdf`)
}

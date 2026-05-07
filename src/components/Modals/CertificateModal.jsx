import React, { useState, useEffect, useRef } from 'react'
import { X, Printer, MessageCircle, AlertCircle, Save, Loader2, School } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLong(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateRange(start, end) {
    if (!start) return ''
    if (!end || start === end) return formatDateLong(start)
    const s = new Date(start + 'T12:00:00')
    const e = new Date(end + 'T12:00:00')
    const sDay = s.toLocaleDateString('es-EC', { day: 'numeric' })
    const eDay = e.toLocaleDateString('es-EC', { day: 'numeric' })
    const month = s.toLocaleDateString('es-EC', { month: 'long' })
    const year = s.getFullYear()
    if (s.getMonth() === e.getMonth()) {
        return `${sDay} al ${eDay} de ${month} del ${year}`
    }
    return `${formatDateLong(start)} al ${formatDateLong(end)}`
}

function getAbsenceDates(start, end) {
    if (!start) return ''
    if (!end || start === end) {
        const d = new Date(start + 'T12:00:00')
        return d.toLocaleDateString('es-EC', { day: 'numeric' }) + ' de ' + d.toLocaleDateString('es-EC', { month: 'long' })
    }
    const dates = []
    let cur = new Date(start + 'T12:00:00')
    const endD = new Date(end + 'T12:00:00')
    while (cur <= endD) {
        dates.push(cur.getDate())
        cur.setDate(cur.getDate() + 1)
    }
    const endMonth = endD.toLocaleDateString('es-EC', { month: 'long' })
    const year = endD.getFullYear()
    if (dates.length === 1) return `${dates[0]} de ${endMonth}`
    const last = dates.pop()
    return `${dates.join(', ')} y ${last} de ${endMonth} del ${year}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CertificateModal({ isOpen, onClose, player: initialPlayer, tournament, club }) {
    const [player, setPlayer] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Inline education form (if player missing education data)
    const [eduForm, setEduForm] = useState({
        school_name: '',
        school_principal: '',
        school_principal_title: 'Lic.',
        school_grade: ''
    })
    const [saveEduData, setSaveEduData] = useState(true)

    // Custom absence dates override
    const [customAbsenceDates, setCustomAbsenceDates] = useState('')

    const printRef = useRef(null)

    useEffect(() => {
        if (isOpen && initialPlayer) {
            // Fetch full player data including education fields
            fetchPlayer()
        }
    }, [isOpen, initialPlayer?.id])

    const fetchPlayer = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('players')
                .select('id, first_name, last_name, dni, dob, school_name, school_principal, school_principal_title, school_grade')
                .eq('id', initialPlayer.id)
                .single()
            if (error) throw error
            setPlayer(data)
            setEduForm({
                school_name: data.school_name || '',
                school_principal: data.school_principal || '',
                school_principal_title: data.school_principal_title || 'Lic.',
                school_grade: data.school_grade || ''
            })
        } catch (err) {
            console.error('Error fetching player for certificate:', err)
            setPlayer(initialPlayer) // fallback
            setEduForm({
                school_name: '',
                school_principal: '',
                school_principal_title: 'Lic.',
                school_grade: ''
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveEduAndPrint = async () => {
        if (saveEduData && eduForm.school_name && player?.id) {
            setSaving(true)
            try {
                await supabase
                    .from('players')
                    .update({
                        school_name: eduForm.school_name || null,
                        school_principal: eduForm.school_principal || null,
                        school_principal_title: eduForm.school_principal_title || 'Lic.',
                        school_grade: eduForm.school_grade || null
                    })
                    .eq('id', player.id)
            } catch (err) {
                console.error('Error saving education data:', err)
            } finally {
                setSaving(false)
            }
        }
        handlePrint()
    }

    const handlePrint = () => {
        window.print()
    }

    const handleWhatsApp = () => {
        if (!initialPlayer?.phone) {
            alert('Este jugador no tiene número de WhatsApp registrado.')
            return
        }
        const phone = initialPlayer.phone.replace(/\D/g, '')
        const intl = phone.startsWith('593') ? phone : `593${phone.replace(/^0/, '')}`
        const text = encodeURIComponent(
            `Hola ${initialPlayer.first_name} 👋\n\n` +
            `Te informamos que hemos enviado un certificado de justificación a tu institución educativa *${eduForm.school_name || player?.school_name || '(institución)'}*.\n\n` +
            `El certificado justifica tu ausencia del *${formatDateRange(tournament?.start_date, tournament?.end_date)}* ` +
            `por participación en el torneo:\n` +
            `🏆 *${tournament?.name}*\n` +
            `📍 ${tournament?.location}\n\n` +
            `¡Mucho éxito en el torneo! 🏐`
        )
        window.open(`https://wa.me/${intl}?text=${text}`, '_blank', 'noreferrer')
    }

    if (!isOpen) return null

    // ── Computed Values ──────────────────────────────────────────────────────
    const schoolName = eduForm.school_name || player?.school_name || ''
    const principalTitle = eduForm.school_principal_title || player?.school_principal_title || 'Lic.'
    const principalName = eduForm.school_principal || player?.school_principal || ''
    const grade = eduForm.school_grade || player?.school_grade || ''
    const absenceDates = customAbsenceDates || getAbsenceDates(tournament?.start_date, tournament?.end_date)
    const tournamentDates = formatDateRange(tournament?.start_date, tournament?.end_date)

    const today = new Date()
    const todayStr = today.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
    const cityStr = club?.ciudad || tournament?.location?.split(',')[0] || ''

    const coachName = club?.coach_certificate_name || ''
    const coachTitle = club?.coach_certificate_title || 'Entrenador'
    const clubName = club?.nombre || ''
    const ministerialAgreement = club?.ministerial_agreement || ''
    const clubEmail = club?.club_email || ''
    const signatureUrl = club?.coach_signature_url || null

    const missingEduData = !schoolName || !principalName || !grade
    const playerFullName = player
        ? `${player.last_name} ${player.first_name}`
        : `${initialPlayer?.last_name || ''} ${initialPlayer?.first_name || ''}`

    return (
        <>
            {/* ── Print Styles ── */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    #certificate-print-area { display: block !important; }
                    #certificate-print-area * { display: revert !important; }
                    @page { size: A4; margin: 15mm; }
                }
                @media screen {
                    #certificate-print-area { display: none; }
                }
            `}</style>

            {/* ── Certificate for print (hidden on screen) ── */}
            <div id="certificate-print-area" ref={printRef}>
                <CertificateDocument
                    playerName={playerFullName}
                    playerDni={player?.dni || initialPlayer?.dni || ''}
                    schoolName={schoolName}
                    principalTitle={principalTitle}
                    principalName={principalName}
                    grade={grade}
                    absenceDates={absenceDates}
                    tournamentName={tournament?.name || ''}
                    tournamentLocation={tournament?.location || ''}
                    tournamentDates={tournamentDates}
                    clubName={clubName}
                    coachName={coachName}
                    coachTitle={coachTitle}
                    ministerialAgreement={ministerialAgreement}
                    clubEmail={clubEmail}
                    signatureUrl={signatureUrl}
                    cityStr={cityStr}
                    todayStr={todayStr}
                />
            </div>

            {/* ── Modal UI ── */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Printer size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800 leading-tight">Certificado de Justificación</h2>
                                <p className="text-xs text-slate-400">{initialPlayer?.first_name} {initialPlayer?.last_name} · {tournament?.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={22} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-6">

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-primary" size={28} />
                            </div>
                        ) : (
                            <>
                                {/* Education data section */}
                                <div className={`rounded-xl border p-4 space-y-4 ${missingEduData ? 'border-amber-200 bg-amber-50' : 'border-green-100 bg-green-50/50'}`}>
                                    <div className="flex items-center gap-2">
                                        <School size={16} className={missingEduData ? 'text-amber-500' : 'text-green-500'} />
                                        <h3 className="font-bold text-sm text-slate-700">Datos de la Institución Educativa</h3>
                                        {missingEduData && (
                                            <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <AlertCircle size={11} /> Completar
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre de la Institución *</label>
                                            <input
                                                type="text"
                                                value={eduForm.school_name}
                                                onChange={e => setEduForm({ ...eduForm, school_name: e.target.value })}
                                                placeholder="Ej. Cambridge School of Languages"
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título del Director/Rector</label>
                                            <select
                                                value={eduForm.school_principal_title}
                                                onChange={e => setEduForm({ ...eduForm, school_principal_title: e.target.value })}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="Lic.">Lic.</option>
                                                <option value="Dr.">Dr.</option>
                                                <option value="Dra.">Dra.</option>
                                                <option value="Ing.">Ing.</option>
                                                <option value="Mgs.">Mgs.</option>
                                                <option value="Prof.">Prof.</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Rector/Director *</label>
                                            <input
                                                type="text"
                                                value={eduForm.school_principal}
                                                onChange={e => setEduForm({ ...eduForm, school_principal: e.target.value })}
                                                placeholder="Ej. Tatiana Tinoco"
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Curso / Nivel Actual *</label>
                                            <input
                                                type="text"
                                                value={eduForm.school_grade}
                                                onChange={e => setEduForm({ ...eduForm, school_grade: e.target.value })}
                                                placeholder="Ej. 3ro de Bachillerato · Nivel Teens 8°"
                                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {missingEduData && (
                                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={saveEduData}
                                                onChange={e => setSaveEduData(e.target.checked)}
                                                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                            />
                                            Guardar estos datos en el perfil de la jugadora para futuros certificados
                                        </label>
                                    )}
                                </div>

                                {/* Absence dates override */}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                        Días de Ausencia (auto-calculado, editable)
                                    </label>
                                    <input
                                        type="text"
                                        value={customAbsenceDates || absenceDates}
                                        onChange={e => setCustomAbsenceDates(e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Ej: 20, 21 y 22 de febrero del 2025"
                                    />
                                    <p className="text-xs text-slate-400">Auto-calculado desde las fechas del torneo. Puedes editar si los días de ausencia son distintos (viajes, etc.)</p>
                                </div>

                                {/* Certificate Preview */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                                        </div>
                                        <span className="text-slate-400 text-xs font-mono ml-2">Vista previa del certificado</span>
                                    </div>
                                    <div className="bg-white p-4 max-h-80 overflow-y-auto">
                                        <CertificatePreview
                                            playerName={playerFullName}
                                            playerDni={player?.dni || initialPlayer?.dni || ''}
                                            schoolName={schoolName || '[ Institución ]'}
                                            principalTitle={principalTitle}
                                            principalName={principalName || '[ Rector/Director ]'}
                                            grade={grade || '[ Curso ]'}
                                            absenceDates={absenceDates || '[ fechas ]'}
                                            tournamentName={tournament?.name || ''}
                                            tournamentLocation={tournament?.location || ''}
                                            tournamentDates={tournamentDates}
                                            clubName={clubName}
                                            coachName={coachName || '[ Nombre del Entrenador ]'}
                                            coachTitle={coachTitle}
                                            ministerialAgreement={ministerialAgreement}
                                            clubEmail={clubEmail}
                                            signatureUrl={signatureUrl}
                                            cityStr={cityStr}
                                            todayStr={todayStr}
                                        />
                                    </div>
                                </div>

                                {/* Missing coach data warning */}
                                {(!coachName || !clubName) && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>
                                            Para un certificado completo, configura el <strong>nombre del entrenador</strong> y demás datos del club en{' '}
                                            <strong>Configuración → Certificados</strong>.
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
                        >
                            Cerrar
                        </button>
                        <div className="flex items-center gap-2 flex-wrap">
                            {initialPlayer?.phone && (
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                                >
                                    <MessageCircle size={16} /> Notificar por WhatsApp
                                </button>
                            )}
                            <button
                                onClick={handleSaveEduAndPrint}
                                disabled={saving || loading}
                                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-primary/25 disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                {saving ? 'Guardando...' : 'Imprimir / Guardar PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── Certificate Preview (screen) ────────────────────────────────────────────

function CertificatePreview({ playerName, playerDni, schoolName, principalTitle, principalName, grade,
    absenceDates, tournamentName, tournamentLocation, tournamentDates, clubName, coachName,
    coachTitle, ministerialAgreement, clubEmail, signatureUrl, cityStr, todayStr }) {
    return (
        <div className="font-serif text-slate-800 text-xs leading-relaxed space-y-3">
            <p className="text-right text-xs text-slate-500">{cityStr}, {todayStr}</p>
            <div className="space-y-0.5">
                <p className="font-bold">{principalTitle}</p>
                <p className="font-bold">{principalName}.</p>
                <p className="font-bold">{schoolName} - {cityStr || 'Ciudad'}.</p>
                <p>Ciudad.</p>
            </div>
            <p className="text-slate-600">De nuestras consideraciones:</p>
            <p>
                Mediante la presente le hacemos llegar un cordial saludo y desearle el mayor de los éxitos
                en el trabajo que desempeña en su prestigiosa Institución.
            </p>
            <p>
                El motivo por el cual nos dirigimos a su autoridad es para solicitarle se justifique la falta
                de los días <strong>{absenceDates}</strong> del presente para la estudiante{' '}
                <strong>{playerName}</strong> con CI: <strong>{playerDni || '___________'}</strong>,
                que cursa el <strong>{grade}</strong> de su Institución, ya que forma parte de la Selección
                de Nuestro <strong>{clubName.toUpperCase()}</strong> para asistir al{' '}
                <strong>{tournamentName}</strong> que se realizará en la ciudad de{' '}
                <strong>{tournamentLocation}</strong> los días <strong>{tournamentDates}</strong>.
            </p>
            <p>Sin otro particular me despido de su distinguida autoridad y agradeciendo de antemano su atención.</p>
            <p>Atentamente,</p>
            <div className="mt-3">
                {signatureUrl ? (
                    <img src={signatureUrl} alt="Firma" className="h-12 object-contain mb-1" />
                ) : (
                    <div className="border-b border-dashed border-slate-400 w-36 mb-1" />
                )}
                <p className="font-bold text-xs">{coachName}</p>
                <p className="text-xs">{coachTitle} — {clubName}</p>
                {ministerialAgreement && <p className="text-xs text-slate-500">Acuerdo Ministerial Nro.- {ministerialAgreement}</p>}
                {clubEmail && <p className="text-xs text-blue-600">{clubEmail}</p>}
            </div>
        </div>
    )
}

// ─── Certificate Document (print version, full A4 quality) ──────────────────

function CertificateDocument({ playerName, playerDni, schoolName, principalTitle, principalName, grade,
    absenceDates, tournamentName, tournamentLocation, tournamentDates, clubName, coachName,
    coachTitle, ministerialAgreement, clubEmail, signatureUrl, cityStr, todayStr }) {
    return (
        <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '12pt',
            lineHeight: '1.7',
            color: '#1a1a1a',
            padding: '10mm',
            maxWidth: '190mm'
        }}>
            {/* Date */}
            <p style={{ textAlign: 'right', fontSize: '11pt', color: '#555', marginBottom: '20pt' }}>
                {cityStr}, {todayStr}
            </p>

            {/* Recipient */}
            <div style={{ marginBottom: '16pt' }}>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{principalTitle}</p>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{principalName}.</p>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Rector/Director de {schoolName}.</p>
                <p style={{ margin: 0 }}>Ciudad.</p>
            </div>

            <p style={{ marginBottom: '12pt' }}>De nuestras consideraciones:</p>

            {/* Body */}
            <p style={{ marginBottom: '12pt', textAlign: 'justify' }}>
                Mediante la presente le hacemos llegar un cordial saludo y desearle el mayor de los éxitos
                en el trabajo que desempeña en su prestigiosa Institución.
            </p>

            <p style={{ marginBottom: '20pt', textAlign: 'justify' }}>
                El motivo por el cual nos dirigimos a su autoridad es para solicitarle se justifique la falta
                de los días{' '}
                <strong style={{ fontWeight: 'bold' }}>{absenceDates}</strong>{' '}
                del presente para la estudiante{' '}
                <strong style={{ fontWeight: 'bold' }}>{playerName}</strong>{' '}
                con CI:{' '}
                <strong style={{ fontWeight: 'bold' }}>{playerDni || '___________'}</strong>,{' '}
                que cursa el{' '}
                <strong style={{ fontWeight: 'bold' }}>{grade}</strong>{' '}
                de su Institución, ya que forma parte de la Selección de Nuestro{' '}
                <strong style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{clubName}</strong>{' '}
                para asistir al{' '}
                <strong style={{ fontWeight: 'bold' }}>{tournamentName}</strong>{' '}
                que se realizará en la ciudad de{' '}
                <strong style={{ fontWeight: 'bold' }}>{tournamentLocation}</strong>{' '}
                los días{' '}
                <strong style={{ fontWeight: 'bold' }}>{tournamentDates}</strong>.
            </p>

            <p style={{ marginBottom: '24pt', textAlign: 'justify' }}>
                Sin otro particular me despido de su distinguida autoridad y agradeciendo de antemano su atención.
            </p>

            <p style={{ marginBottom: '24pt' }}>Atentamente,</p>

            {/* Signature block */}
            <div>
                {signatureUrl ? (
                    <img
                        src={signatureUrl}
                        alt="Firma"
                        style={{ height: '60pt', objectFit: 'contain', display: 'block', marginBottom: '4pt' }}
                    />
                ) : (
                    <div style={{ borderBottom: '1px dashed #999', width: '150pt', marginBottom: '6pt' }} />
                )}
                <p style={{ fontWeight: 'bold', margin: 0, fontSize: '11pt' }}>{coachName}</p>
                <p style={{ fontWeight: 'bold', margin: 0, fontSize: '10pt' }}>{coachTitle} — {clubName}</p>
                {ministerialAgreement && (
                    <p style={{ margin: 0, fontSize: '10pt', color: '#444' }}>
                        Acuerdo Ministerial Nro.- {ministerialAgreement}
                    </p>
                )}
                {clubEmail && (
                    <p style={{ margin: 0, fontSize: '10pt', color: '#2563eb' }}>{clubEmail}</p>
                )}
            </div>
        </div>
    )
}

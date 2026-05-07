import React, { useState } from 'react'
import { X, Printer, Award } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLong(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MembershipCertificateModal({ isOpen, onClose, player, club }) {
    const [customRecipient, setCustomRecipient] = useState('')
    const [customPurpose, setCustomPurpose] = useState('')

    if (!isOpen || !player) return null

    const today = new Date()
    const todayStr = today.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
    const cityStr = club?.ciudad || ''
    const clubName = club?.nombre || ''
    const coachName = club?.coach_certificate_name || ''
    const coachTitle = club?.coach_certificate_title || 'Entrenador'
    const ministerialAgreement = club?.ministerial_agreement || ''
    const clubEmail = club?.club_email || ''
    const signatureUrl = club?.coach_signature_url || null

    const playerFullName = `${player.last_name || ''} ${player.first_name || ''}`.trim()
    const playerDni = player.dni || ''
    const playerDob = player.dob ? formatDateLong(player.dob) : ''
    const playerPosition = player.position || ''

    const purpose = customPurpose || 'los trámites que estime conveniente'
    const recipient = customRecipient || 'A quien corresponda'

    const handlePrint = () => {
        window.print()
    }

    return (
        <>
            {/* ── Print Styles ── */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    #membership-cert-print-area { display: block !important; }
                    #membership-cert-print-area * { display: revert !important; }
                    @page { size: A4; margin: 15mm; }
                }
                @media screen {
                    #membership-cert-print-area { display: none; }
                }
            `}</style>

            {/* ── Certificate for print ── */}
            <div id="membership-cert-print-area">
                <MembershipCertDocument
                    playerName={playerFullName}
                    playerDni={playerDni}
                    playerDob={playerDob}
                    playerPosition={playerPosition}
                    clubName={clubName}
                    coachName={coachName}
                    coachTitle={coachTitle}
                    ministerialAgreement={ministerialAgreement}
                    clubEmail={clubEmail}
                    signatureUrl={signatureUrl}
                    cityStr={cityStr}
                    todayStr={todayStr}
                    recipient={recipient}
                    purpose={purpose}
                />
            </div>

            {/* ── Modal UI ── */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Award size={18} className="text-purple-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800 leading-tight">Certificado de Pertenencia</h2>
                                <p className="text-xs text-slate-400">{player.first_name} {player.last_name} · {clubName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={22} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-5">

                        {/* Customization options */}
                        <div className="space-y-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personalizar Certificado</h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                    Destinatario (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={customRecipient}
                                    onChange={e => setCustomRecipient(e.target.value)}
                                    placeholder="A quien corresponda"
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                    Finalidad del certificado (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={customPurpose}
                                    onChange={e => setCustomPurpose(e.target.value)}
                                    placeholder="los trámites que estime conveniente"
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <p className="text-xs text-slate-400 mt-1">Ej: "solicitar becas deportivas", "inscripción en federación"</p>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                                </div>
                                <span className="text-slate-400 text-xs font-mono ml-2">Vista previa del certificado</span>
                            </div>
                            <div className="bg-white p-4 max-h-72 overflow-y-auto">
                                <div className="font-serif text-slate-800 text-xs leading-relaxed space-y-3">
                                    <p className="text-right text-xs text-slate-500">{cityStr}, {todayStr}</p>
                                    <p className="font-bold">{recipient}</p>
                                    <p>Ciudad.</p>
                                    <p className="text-slate-600">De nuestras consideraciones:</p>
                                    <p className="text-justify">
                                        El que suscribe, {coachTitle || 'responsable'} del <strong>{clubName}</strong>,
                                        certifica que la señorita <strong>{playerFullName}</strong>,
                                        portadora de la CI: <strong>{playerDni || '___________'}</strong>
                                        {playerDob && `, nacida el ${playerDob},`} es miembro activa de nuestro club,
                                        desempeñando el rol de <strong>{playerPosition || 'jugadora'}</strong>.
                                    </p>
                                    <p className="text-justify">
                                        La presente certificación se expide a petición de la parte interesada, para {purpose}.
                                    </p>
                                    <p>Atentamente,</p>
                                    <div>
                                        {signatureUrl
                                            ? <img src={signatureUrl} alt="Firma" className="h-10 object-contain mb-1" />
                                            : <div className="border-b border-dashed border-slate-400 w-32 mb-1" />
                                        }
                                        <p className="font-bold text-xs">{coachName || '[ Nombre del Entrenador ]'}</p>
                                        <p className="text-xs">{coachTitle} — {clubName}</p>
                                        {ministerialAgreement && <p className="text-xs text-slate-500">Acuerdo Ministerial Nro.- {ministerialAgreement}</p>}
                                        {clubEmail && <p className="text-xs text-blue-600">{clubEmail}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg"
                        >
                            <Printer size={16} /> Imprimir / Guardar PDF
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── Full print document ─────────────────────────────────────────────────────

function MembershipCertDocument({ playerName, playerDni, playerDob, playerPosition, clubName, coachName,
    coachTitle, ministerialAgreement, clubEmail, signatureUrl, cityStr, todayStr, recipient, purpose }) {
    return (
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '12pt', lineHeight: '1.7', color: '#1a1a1a', padding: '10mm', maxWidth: '190mm' }}>
            <p style={{ textAlign: 'right', fontSize: '11pt', color: '#555', marginBottom: '20pt' }}>
                {cityStr}, {todayStr}
            </p>
            <div style={{ marginBottom: '16pt' }}>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{recipient}</p>
                <p style={{ margin: 0 }}>Ciudad.</p>
            </div>
            <p style={{ marginBottom: '12pt' }}>De nuestras consideraciones:</p>
            <p style={{ marginBottom: '12pt', textAlign: 'justify' }}>
                El que suscribe, {coachTitle || 'responsable'} del <strong>{clubName}</strong>,
                certifica que la señorita <strong>{playerName}</strong>,
                portadora de la CI: <strong>{playerDni || '___________'}</strong>
                {playerDob && `, nacida el ${playerDob},`} es miembro activa de nuestro club,
                desempeñando el rol de <strong>{playerPosition || 'jugadora'}</strong>.
            </p>
            <p style={{ marginBottom: '24pt', textAlign: 'justify' }}>
                La presente certificación se expide a petición de la parte interesada, para {purpose}.
            </p>
            <p style={{ marginBottom: '28pt' }}>Atentamente,</p>
            <div>
                {signatureUrl
                    ? <img src={signatureUrl} alt="Firma" style={{ height: '60pt', objectFit: 'contain', display: 'block', marginBottom: '4pt' }} />
                    : <div style={{ borderBottom: '1px dashed #999', width: '150pt', marginBottom: '6pt' }} />
                }
                <p style={{ fontWeight: 'bold', margin: 0, fontSize: '11pt' }}>{coachName}</p>
                <p style={{ fontWeight: 'bold', margin: 0, fontSize: '10pt' }}>{coachTitle} — {clubName}</p>
                {ministerialAgreement && <p style={{ margin: 0, fontSize: '10pt', color: '#444' }}>Acuerdo Ministerial Nro.- {ministerialAgreement}</p>}
                {clubEmail && <p style={{ margin: 0, fontSize: '10pt', color: '#2563eb' }}>{clubEmail}</p>}
            </div>
        </div>
    )
}

import React, { useMemo } from 'react'

/**
 * PortalProgressChart
 * Gráfica de línea SVG pura (sin dependencias externas) para visualizar
 * la progresión de una métrica en el tiempo.
 *
 * Props:
 *   data: Array<{ date: string, value: number }>  — puntos ordenados cronológicamente
 *   label: string — nombre de la métrica para el tooltip
 *   color: string — color hex o CSS para la línea y puntos
 *   unit: string  — unidad a mostrar (cm, kg, etc.)
 *   height: number — altura del SVG (default 140)
 */
export default function PortalProgressChart({ data = [], label = '', color = '#6366f1', unit = '', height = 140 }) {
    const WIDTH = 340
    const H = height
    const PADDING = { top: 16, right: 16, bottom: 32, left: 40 }
    const chartW = WIDTH - PADDING.left - PADDING.right
    const chartH = H - PADDING.top - PADDING.bottom

    const points = useMemo(() => {
        if (!data || data.length === 0) return []
        const values = data.map(d => Number(d.value))
        const minV = Math.min(...values)
        const maxV = Math.max(...values)
        const range = maxV - minV || 1

        return data.map((d, i) => ({
            x: PADDING.left + (i / Math.max(data.length - 1, 1)) * chartW,
            y: PADDING.top + chartH - ((Number(d.value) - minV) / range) * chartH,
            value: Number(d.value),
            date: d.date,
            rawDate: new Date(d.date + 'T12:00:00')
        }))
    }, [data, chartW, chartH])

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')

    // Area fill path
    const areaPath = points.length > 1
        ? `M${points[0].x},${PADDING.top + chartH} ` +
          points.map(p => `L${p.x},${p.y}`).join(' ') +
          ` L${points[points.length - 1].x},${PADDING.top + chartH} Z`
        : ''

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-6 text-slate-300 text-sm">
                Sin datos para graficar
            </div>
        )
    }

    // Y-axis labels
    const values = data.map(d => Number(d.value))
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const yLabels = [maxV, (maxV + minV) / 2, minV]

    // X-axis date labels (mostrar máx 4)
    const xLabelIndices = data.length <= 4
        ? data.map((_, i) => i)
        : [0, Math.floor(data.length / 3), Math.floor(2 * data.length / 3), data.length - 1]

    return (
        <div className="w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${WIDTH} ${H}`}
                width="100%"
                style={{ minWidth: '240px', maxWidth: '100%' }}
                className="select-none"
            >
                {/* Grid lines */}
                {yLabels.map((val, i) => {
                    const fraction = i === 0 ? 0 : i === 1 ? 0.5 : 1
                    const y = PADDING.top + fraction * chartH
                    return (
                        <g key={i}>
                            <line
                                x1={PADDING.left} y1={y}
                                x2={PADDING.left + chartW} y2={y}
                                stroke="#f1f5f9" strokeWidth="1"
                            />
                            <text
                                x={PADDING.left - 6} y={y + 4}
                                fontSize="9" fill="#94a3b8" textAnchor="end"
                            >
                                {Number.isInteger(val) ? val : val.toFixed(1)}
                            </text>
                        </g>
                    )
                })}

                {/* Area fill */}
                {areaPath && (
                    <path d={areaPath} fill={color} fillOpacity="0.08" />
                )}

                {/* Line */}
                {points.length > 1 && (
                    <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Data points */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={5} fill="white" stroke={color} strokeWidth="2.5" />
                        {/* Value label on top */}
                        <text
                            x={p.x} y={p.y - 9}
                            fontSize="9" fill={color} textAnchor="middle" fontWeight="bold"
                        >
                            {p.value}{unit}
                        </text>
                    </g>
                ))}

                {/* X-axis date labels */}
                {xLabelIndices.map(i => {
                    if (!points[i]) return null
                    const p = points[i]
                    const d = p.rawDate
                    const label = `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`
                    return (
                        <text
                            key={i}
                            x={p.x} y={H - 6}
                            fontSize="8.5" fill="#94a3b8" textAnchor="middle"
                        >
                            {label}
                        </text>
                    )
                })}

                {/* Axis lines */}
                <line
                    x1={PADDING.left} y1={PADDING.top}
                    x2={PADDING.left} y2={PADDING.top + chartH}
                    stroke="#e2e8f0" strokeWidth="1"
                />
                <line
                    x1={PADDING.left} y1={PADDING.top + chartH}
                    x2={PADDING.left + chartW} y2={PADDING.top + chartH}
                    stroke="#e2e8f0" strokeWidth="1"
                />
            </svg>
        </div>
    )
}

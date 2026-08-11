'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { ref, get } from 'firebase/database'
import { BarChart2, Calendar, AlertTriangle, RefreshCw, Database, Zap } from 'lucide-react'

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

interface HistoryRecord {
  soilMoisture: number
  ph: number
  temperature: number
  humidity: number
  pumpIsOn: boolean
  timestamp: string
}

interface HistoryEntry {
  id: string
  data: HistoryRecord
}

// ---------------------------------------------------------------
// SVG Line Chart — native implementation, no library required
// Each series is normalized independently to its own min/max range
// so all three curves fit within the same chart height.
// Precise values are shown in the table below the chart.
// ---------------------------------------------------------------

type NumericKey = 'soilMoisture' | 'temperature' | 'humidity'

const CHART_SERIES: { key: NumericKey; label: string; color: string; unit: string }[] = [
  { key: 'soilMoisture', label: 'Humedad Suelo', color: '#3b82f6', unit: '' },
  { key: 'temperature',  label: 'Temperatura',   color: '#f97316', unit: '°C' },
  { key: 'humidity',     label: 'Humedad Aire',   color: '#14b8a6', unit: '%' },
]

// Chart SVG canvas dimensions (logical units, rendered responsively via viewBox)
const W = 900
const H = 220
const PAD = { top: 20, right: 24, bottom: 36, left: 24 }
const CW = W - PAD.left - PAD.right // chart inner width
const CH = H - PAD.top - PAD.bottom // chart inner height

function getMinMax(records: HistoryEntry[], key: NumericKey) {
  const vals = records.map((r) => Number(r.data[key]))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  return { min, max, range: max - min || 1 }
}

function buildLinePath(records: HistoryEntry[], key: NumericKey): string {
  const { min, range } = getMinMax(records, key)
  return records
    .map((r, i) => {
      const x = PAD.left + (i / (records.length - 1)) * CW
      const norm = (Number(r.data[key]) - min) / range
      const y = PAD.top + CH - norm * CH
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function buildAreaPoints(records: HistoryEntry[], key: NumericKey): string {
  const { min, range } = getMinMax(records, key)
  const dataPoints = records
    .map((r, i) => {
      const x = PAD.left + (i / (records.length - 1)) * CW
      const norm = (Number(r.data[key]) - min) / range
      const y = PAD.top + CH - norm * CH
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const baseline = (PAD.top + CH).toFixed(1)
  const x0 = PAD.left.toFixed(1)
  const xN = (PAD.left + CW).toFixed(1)
  return `${x0},${baseline} ${dataPoints} ${xN},${baseline}`
}

function SvgLineChart({ records }: { records: HistoryEntry[] }) {
  // Show dots only when the dataset is small enough not to clutter the chart
  const showDots = records.length <= 24

  // X-axis label density: show at most 8 labels
  const labelStep = Math.max(1, Math.ceil(records.length / 8))

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        aria-label="Gráfico histórico de mediciones de sensores"
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + CH * (1 - frac)}
            y2={PAD.top + CH * (1 - frac)}
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}

        {/* Subtle area fills */}
        {CHART_SERIES.map(({ key, color }) => (
          <polygon
            key={`${key}-area`}
            points={buildAreaPoints(records, key)}
            fill={color}
            opacity="0.05"
          />
        ))}

        {/* Series lines */}
        {CHART_SERIES.map(({ key, color }) => (
          <path
            key={key}
            d={buildLinePath(records, key)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Data point dots (only for small datasets) */}
        {showDots &&
          CHART_SERIES.map(({ key, color }) => {
            const { min, range } = getMinMax(records, key)
            return records.map((r, i) => {
              const x = PAD.left + (i / (records.length - 1)) * CW
              const norm = (Number(r.data[key]) - min) / range
              const y = PAD.top + CH - norm * CH
              return (
                <circle
                  key={`${key}-dot-${i}`}
                  cx={x.toFixed(1)}
                  cy={y.toFixed(1)}
                  r="3.5"
                  fill={color}
                  opacity="0.75"
                />
              )
            })
          })}

        {/* X-axis record index labels */}
        {records.map((_, i) => {
          if (i % labelStep !== 0 && i !== records.length - 1) return null
          const x = PAD.left + (i / (records.length - 1)) * CW
          return (
            <text
              key={`x-label-${i}`}
              x={x.toFixed(1)}
              y={H - 8}
              fontSize="10"
              fill="#475569"
              textAnchor="middle"
            >
              {`#${i + 1}`}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-5">
        {CHART_SERIES.map(({ key, label, color, unit }) => (
          <div key={key} className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="inline-block h-2 w-7 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
            {unit ? ` (${unit})` : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------

/**
 * HistoricoMediciones
 *
 * Reads historical telemetry records from Firebase RTDB path:
 *   /smartgarden/history/YYYY-MM-DD/{pushId}
 *
 * Reuses the existing `db` singleton from @/lib/firebase.
 * Does NOT create a new Firebase initialization.
 * Does NOT modify the real-time sensor cards or irrigation controls.
 */
export default function HistoricoMediciones() {
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [records, setRecords] = useState<HistoryEntry[]>([])

  const [loadingDates, setLoadingDates] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [errorDates, setErrorDates] = useState<string | null>(null)
  const [errorRecords, setErrorRecords] = useState<string | null>(null)

  // ------------------------------------------------------------------
  // On mount: fetch the list of available date-keys under /history
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchDates = async () => {
      setLoadingDates(true)
      setErrorDates(null)
      try {
        const snapshot = await get(ref(db, '/smartgarden/history'))
        if (snapshot.exists()) {
          const raw = snapshot.val() as Record<string, unknown>
          // Sort descending so the most recent date is first
          const sorted = Object.keys(raw).sort((a, b) => b.localeCompare(a))
          setAvailableDates(sorted)
          setSelectedDate(sorted[0])
        } else {
          setAvailableDates([])
          setSelectedDate('')
        }
      } catch (err) {
        console.error('[Histórico] Error al obtener fechas disponibles:', err)
        setErrorDates('Error al cargar el histórico.')
      } finally {
        setLoadingDates(false)
      }
    }
    fetchDates()
  }, [])

  // ------------------------------------------------------------------
  // Fetch all records for the selected date (single GET, not a listener)
  // ------------------------------------------------------------------
  const fetchRecords = useCallback(async (date: string) => {
    if (!date) return
    setLoadingRecords(true)
    setErrorRecords(null)
    setRecords([])
    try {
      const snapshot = await get(ref(db, `/smartgarden/history/${date}`))
      if (snapshot.exists()) {
        const raw = snapshot.val() as Record<string, HistoryRecord>
        const entries: HistoryEntry[] = Object.entries(raw).map(([id, record]) => ({
          id,
          data: record,
        }))
        // Sort ascending by millis-based timestamp (ESP32 uptime)
        entries.sort((a, b) => parseInt(a.data.timestamp) - parseInt(b.data.timestamp))
        setRecords(entries)
      } else {
        setRecords([])
      }
    } catch (err) {
      console.error('[Histórico] Error al obtener registros:', err)
      setErrorRecords('Error al cargar el histórico.')
    } finally {
      setLoadingRecords(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      void fetchRecords(selectedDate)
    }
  }, [selectedDate, fetchRecords])

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <section className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm space-y-6">

      {/* ---- Section header ---- */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-emerald-400" />
          Histórico de mediciones
        </h2>

        {/* Reload button — only visible once records are loaded */}
        {selectedDate && !loadingRecords && (
          <button
            onClick={() => void fetchRecords(selectedDate)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-all"
            title="Recargar registros"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recargar
          </button>
        )}
      </div>

      {/* ---- Date selector row ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 shrink-0">
          <Calendar className="h-4 w-4 text-slate-400" />
          Seleccionar fecha
        </label>

        {loadingDates ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando fechas disponibles...
          </div>
        ) : errorDates ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-950/20 border border-red-900/30 px-3 py-2 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {errorDates}
          </div>
        ) : availableDates.length === 0 ? (
          <span className="text-sm text-slate-500">
            No hay fechas con datos disponibles.
          </span>
        ) : (
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        )}

        {/* Record count badge */}
        {records.length > 0 && !loadingRecords && (
          <span className="text-xs text-slate-500">
            {records.length} registro{records.length !== 1 ? 's' : ''} encontrado
            {records.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ---- Content area: loading / error / empty / data ---- */}
      {loadingRecords ? (
        /* Loading state */
        <div className="flex items-center justify-center gap-3 py-14 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
          <span>Cargando histórico...</span>
        </div>

      ) : errorRecords ? (
        /* Firebase error */
        <div className="flex items-center gap-3 rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-white text-sm">Error de conexión</p>
            <p className="text-sm text-red-400/90">{errorRecords}</p>
          </div>
        </div>

      ) : !selectedDate || availableDates.length === 0 ? (
        /* No dates exist yet in Firebase */
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500">
          <Database className="h-10 w-10 opacity-40" />
          <p className="text-sm">No hay datos históricos disponibles en la base de datos.</p>
        </div>

      ) : records.length === 0 ? (
        /* Date exists but node is empty */
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500">
          <Database className="h-10 w-10 opacity-40" />
          <p className="text-sm">No hay mediciones registradas para esta fecha.</p>
        </div>

      ) : (
        /* ---- Data: chart + table ---- */
        <div className="space-y-6">

          {/* Chart (only rendered when there are at least 2 records for a meaningful line) */}
          {records.length >= 2 && (
            <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tendencia — {selectedDate}
              </p>
              <SvgLineChart records={records} />
              <p className="text-[11px] text-slate-700 text-center pt-1">
                * Cada serie está normalizada a su propio rango mínimo/máximo.
                Los valores exactos se muestran en la tabla.
              </p>
            </div>
          )}

          {/* Data table */}
          <div className="overflow-x-auto rounded-xl border border-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr>
                  {[
                    '#',
                    'Hora',
                    'Humedad del suelo',
                    'pH',
                    'Temperatura',
                    'Humedad del aire',
                    'Bomba',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {records.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-900/30 transition-colors"
                  >
                    {/* Row index */}
                    <td className="px-4 py-3 text-slate-600 tabular-nums text-xs">
                      {idx + 1}
                    </td>

                    {/* Hora — timestamp is ESP32 millis() uptime, not real clock time */}
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      Registro {entry.data.timestamp}
                    </td>

                    {/* Humedad del suelo (raw ADC value from ESP32) */}
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-medium text-blue-400">
                        {entry.data.soilMoisture}
                      </span>
                    </td>

                    {/* pH — calibration still pending */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400 whitespace-nowrap">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Pendiente de calibración
                      </span>
                    </td>

                    {/* Temperatura */}
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-medium text-orange-400">
                        {entry.data.temperature.toFixed(1)}&nbsp;°C
                      </span>
                    </td>

                    {/* Humedad del aire */}
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-medium text-teal-400">
                        {Math.round(entry.data.humidity)}&nbsp;%
                      </span>
                    </td>

                    {/* Bomba — boolean displayed in Spanish */}
                    <td className="px-4 py-3">
                      {entry.data.pumpIsOn ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 whitespace-nowrap">
                          <Zap className="h-3 w-3" />
                          ENCENDIDA
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-slate-700/40 bg-slate-800/60 px-2 py-0.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          APAGADA
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

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

function isValidNumber(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}
// ---------------------------------------------------------------
// SVG Line Chart — native implementation, no library required
// Each series is normalized independently to its own min/max range
// so all three curves fit within the same chart height.
// Precise values are shown in the table below the chart.
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Individual charts for each sensor variable
// ---------------------------------------------------------------

type NumericKey = 'soilMoisture' | 'temperature' | 'humidity' | 'ph'

interface MetricChartProps {
  records: HistoryEntry[]
  dataKey: NumericKey
  title: string
  color: string
  unit: string
  minValue?: number
  maxValue?: number
}

function MetricChart({
  records,
  dataKey,
  title,
  color,
  unit,
  minValue,
  maxValue,
}: MetricChartProps) {
  const W = 900
  const H = 230
  const PAD = { top: 20, right: 30, bottom: 35, left: 65 }

  const chartWidth = W - PAD.left - PAD.right
  const chartHeight = H - PAD.top - PAD.bottom

  // Mostrar únicamente las 100 mediciones más recientes
  const recentRecords = records.slice(0, 100)

  const validRecords = recentRecords.filter((record) => {
    const value = Number(record.data[dataKey])

    if (!Number.isFinite(value)) return false

    // Ignorar registros antiguos sin lecturas ambientales válidas
    if (
      (dataKey === 'temperature' || dataKey === 'humidity') &&
      value <= 0
    ) {
      return false
    }

    return true
  })

  const validValues = validRecords.map((record) =>
    Number(record.data[dataKey])
  )

  if (validValues.length < 2) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <p className="text-sm text-slate-400">
          No hay suficientes datos para mostrar {title.toLowerCase()}.
        </p>
      </div>
    )
  }

  const dataMin = Math.min(...validValues)
  const dataMax = Math.max(...validValues)

  const averageValue =
    validValues.reduce((sum, value) => sum + value, 0) /
    validValues.length

  const minimumValue = dataMin
  const maximumValue = dataMax

  const dynamicMin = dataMin === dataMax ? dataMin - 1 : dataMin
  const dynamicMax = dataMin === dataMax ? dataMax + 1 : dataMax

  const min = minValue ?? dynamicMin
  const max = maxValue ?? dynamicMax
  const range = max - min || 1

  const labelStep = Math.max(1, Math.ceil(validRecords.length / 8))

  const points = validRecords.map((record, index) => {
    const value = Number(record.data[dataKey])

    const x =
      PAD.left +
      (index / Math.max(validRecords.length - 1, 1)) * chartWidth

    const normalized = Math.max(
      0,
      Math.min(1, (value - min) / range)
    )

    const y = PAD.top + chartHeight - normalized * chartHeight

    return { x, y, value, index }
  })

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`
    )
    .join(' ')

  const latestValue = validValues[0]

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 space-y-3">

      {/* Chart header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-semibold text-slate-200">
              {title}
            </h3>
          </div>

          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {Number.isFinite(latestValue)
              ? `${latestValue.toFixed(2)} ${unit}`
              : 'No disponible'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-900/70 p-2">
            <p className="text-[10px] uppercase text-slate-500">Mínimo</p>
            <p className="text-xs font-semibold text-slate-300">
              {minimumValue.toFixed(2)} {unit}
            </p>
          </div>

          <div className="rounded-lg bg-slate-900/70 p-2">
            <p className="text-[10px] uppercase text-slate-500">Promedio</p>
            <p className="text-xs font-semibold text-slate-300">
              {averageValue.toFixed(2)} {unit}
            </p>
          </div>

          <div className="rounded-lg bg-slate-900/70 p-2">
            <p className="text-[10px] uppercase text-slate-500">Máximo</p>
            <p className="text-xs font-semibold text-slate-300">
              {maximumValue.toFixed(2)} {unit}
            </p>
          </div>
        </div>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Gráfico histórico de ${title}`}
      >
        {/* Horizontal grid lines and Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = PAD.top + chartHeight * (1 - fraction)
          const value = min + range * fraction

          return (
            <g key={fraction}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
              />

              <text
                x={PAD.left - 10}
                y={y + 4}
                fontSize="11"
                fill="#64748b"
                textAnchor="end"
              >
                {value.toFixed(1)}
              </text>
            </g>
          )
        })}

        {/* Measurement line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.length <= 30 &&
          points.map((point) => (
            <circle
              key={point.index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
            />
          ))}

        {/* X-axis labels */}
        {/* X-axis labels: máximo 8 etiquetas */}
        {points.map((point, index) => {
          if (
            index % labelStep !== 0 &&
            index !== points.length - 1
          ) {
            return null
          }

          return (
            <text
              key={`label-${point.index}`}
              x={point.x}
              y={H - 8}
              fontSize="10"
              fill="#64748b"
              textAnchor="middle"
            >
              #{point.index + 1}
            </text>
          )
        })}
      </svg>

      <p className="text-[11px] text-slate-500 text-center">
        Cada punto representa una medición registrada.
      </p>
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
          console.log('[HISTORICO] Datos originales de Firebase:', raw)
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
          data: {
            soilMoisture: Number(record.soilMoisture),
            ph: Number(record.ph),
            temperature: Number(record.temperature),
            humidity: Number(record.humidity),
            pumpIsOn: record.pumpIsOn === true,
            timestamp: String(record.timestamp ?? ''),
          },
        }))
        console.log('[HISTORICO] Primer registro convertido:', entries[0])
        // Mostrar primero los registros con mayor tiempo de actividad
        // Ordenar por ID de Firebase: primero el registro más reciente
        entries.sort((a, b) => b.id.localeCompare(a.id))
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
          {/* Cuatro gráficos individuales */}
          {records.length >= 2 && (
            <div className="space-y-5">

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Tendencia de mediciones — {selectedDate}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Evolución individual de cada variable registrada.
                </p>
              </div>

              <MetricChart
                records={records}
                dataKey="soilMoisture"
                title="Humedad del suelo"
                color="#3b82f6"
                unit="%"
                minValue={0}
                maxValue={100}
              />

              <MetricChart
                records={records}
                dataKey="temperature"
                title="Temperatura ambiental"
                color="#f97316"
                unit="°C"
                minValue={20}
                maxValue={30}
              />

              <MetricChart
                records={records}
                dataKey="humidity"
                title="Humedad del aire"
                color="#14b8a6"
                unit="%"
                minValue={0}
                maxValue={100}
              />

              <MetricChart
                records={records}
                dataKey="ph"
                title="pH del suelo"
                color="#a855f7"
                unit="pH"
                minValue={4.01}
                maxValue={9.18}
              />

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
                {records.map((entry, idx) => {
                  if (entry.id === '-P5H3V5J5kYD3FPOaSB') {
                    console.log('[REGISTRO A COMPROBAR]', entry)
                  }
                  return (
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
                      {/* Humedad del suelo (porcentaje calculado por el ESP32) */}
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-medium text-blue-400">
                          {isValidNumber(entry.data.soilMoisture) &&
                            entry.data.soilMoisture >= 0 &&
                            entry.data.soilMoisture <= 100
                            ? `${entry.data.soilMoisture.toFixed(1)} %`
                            : 'No disponible'}
                        </span>
                      </td>

                      {/* pH — calibration still pending */}
                      {/* pH calibrado por el ESP32 */}
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-medium text-purple-400">
                          {isValidNumber(entry.data.ph) &&
                            entry.data.ph >= 4.01 &&
                            entry.data.ph <= 9.18
                            ? entry.data.ph.toFixed(2)
                            : 'No disponible'}
                        </span>
                      </td>

                      {/* Temperatura ambiental */}
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-medium text-orange-400">
                          {entry.data.temperature.toFixed(1)}&nbsp;°C
                        </span>
                      </td>

                      {/* Humedad ambiental */}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

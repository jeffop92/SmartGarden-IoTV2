'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth'
import { ref, onValue, update } from 'firebase/database'
import {
  Droplet,
  Thermometer,
  Activity,
  LogOut,
  Lock,
  Mail,
  Settings,
  Power,
  AlertTriangle,
  RefreshCw,
  CheckCircle
} from 'lucide-react'

// Soil moisture calibration constants (from config.h: Dry=2800, Wet=900)
const SOIL_ADC_DRY = 2800
const SOIL_ADC_WET = 900
const MOISTURE_THRESHOLD = 30.0

interface TelemetryData {
  soilMoisture: number
  ph: number
  temperature: number
  humidity: number
  pumpIsOn: boolean
  timestamp: string
}

interface ControlState {
  isManual: boolean
  pumpState: boolean
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)

  // Auth Inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // Telemetry & Control states
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [control, setControl] = useState<ControlState>({ isManual: false, pumpState: false })
  const [lastUpdateBrowserTime, setLastUpdateBrowserTime] = useState<Date | null>(null)
  const [isDbConnected, setIsDbConnected] = useState(false)

  // Track user authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Listen to Firebase Realtime Database
  useEffect(() => {
    if (!user) return

    // Telemetry node listener
    const telemetryRef = ref(db, '/smartgarden/sensors/current')
    const unsubscribeTelemetry = onValue(
      telemetryRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setTelemetry(snapshot.val() as TelemetryData)
          setLastUpdateBrowserTime(new Date())
          setIsDbConnected(true)
        }
      },
      (error) => {
        console.error('Error fetching telemetry:', error)
        setIsDbConnected(false)
      }
    )

    // Control node listener
    const controlRef = ref(db, '/smartgarden/control')
    const unsubscribeControl = onValue(
      controlRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setControl(snapshot.val() as ControlState)
        }
      },
      (error) => {
        console.error('Error fetching control:', error)
      }
    )

    return () => {
      unsubscribeTelemetry()
      unsubscribeControl()
    }
  }, [user])

  // Actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!email || !password) {
      setAuthError('Por favor, rellene todos los campos.')
      return
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      setEmail('')
      setPassword('')
    } catch (err: unknown) {
      console.error(err)
      const firebaseError = err as { code?: string }
      if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found') {
        setAuthError('Credenciales incorrectas.')
      } else if (firebaseError.code === 'auth/email-already-in-use') {
        setAuthError('El correo electrónico ya está registrado.')
      } else if (firebaseError.code === 'auth/weak-password') {
        setAuthError('La contraseña debe tener al menos 6 caracteres.')
      } else {
        setAuthError('Ocurrió un error al autenticar. Verifique sus datos.')
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const toggleMode = async () => {
    if (!user) return
    const newIsManual = !control.isManual
    try {
      await update(ref(db, '/smartgarden/control'), {
        isManual: newIsManual,
        // Al pasar a automático, por seguridad apagamos la bomba en el control
        // aunque el ESP32 decidirá basándose en la humedad
        pumpState: newIsManual ? control.pumpState : false
      })
    } catch (err) {
      console.error('Error updating control mode:', err)
    }
  }

  const togglePump = async () => {
    if (!user || !control.isManual) return
    const newPumpState = !control.pumpState
    try {
      await update(ref(db, '/smartgarden/control'), {
        pumpState: newPumpState
      })
    } catch (err) {
      console.error('Error toggling pump:', err)
    }
  }

  // Calculate soil moisture percentage (based on constants in config.h)
  const calculateMoisturePercent = (rawAdc: number) => {
    if (!rawAdc) return 0
    // ADC 2800 is Dry (0%), ADC 900 is Wet (100%)
    const percent = ((SOIL_ADC_DRY - rawAdc) / (SOIL_ADC_DRY - SOIL_ADC_WET)) * 100
    return Math.max(0, Math.min(100, Math.round(percent)))
  }

  // Evaluate if device is active (updates received in last 90 seconds)
  const isDeviceActive = () => {
    if (!lastUpdateBrowserTime) return false
    const now = new Date()
    const diffSeconds = (now.getTime() - lastUpdateBrowserTime.getTime()) / 1000
    return diffSeconds < 90
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-slate-400 animate-pulse">Cargando SmartGarden...</p>
        </div>
      </div>
    )
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-radial from-slate-900 to-slate-950 p-4 font-sans text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Activity className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">SmartGarden IoT</h1>
            <p className="mt-2 text-sm text-slate-400">Panel de Control y Monitoreo de Cultivos</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Correo Electrónico
              </label>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contraseña
              </label>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 py-3 font-semibold text-slate-950 transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering)
                setAuthError('')
              }}
              className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isRegistering
                ? '¿Ya tienes cuenta? Inicia sesión aquí'
                : '¿No tienes cuenta? Registrate aquí'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // MAIN DASHBOARD SCREEN
  const deviceOnline = isDeviceActive()
  const moistureRaw = telemetry?.soilMoisture || 0
  const moisturePercent = calculateMoisturePercent(moistureRaw)
  const pumpActive = telemetry?.pumpIsOn || false

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans">
      {/* HEADER */}
      <header className="border-b border-slate-900 bg-slate-900/30 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SmartGarden IoT</h1>
              <p className="text-xs text-slate-500 sm:block hidden">Sistema de Control y Monitoreo de Cultivos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Connection Indicator */}
            <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 border border-slate-800 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${deviceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-slate-400 font-medium">
                {deviceOnline ? 'Dispositivo Online' : 'Dispositivo Offline'}
              </span>
            </div>

            {/* Profile & SignOut */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <span className="text-sm text-slate-400 max-w-[120px] truncate hidden md:inline" title={user.email || ''}>
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-red-400 transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* WARNINGS AND NOTICES */}
        {!isDbConnected && (
          <div className="flex items-center gap-3 rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-red-400">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <div>
              <h3 className="font-semibold text-white">Error de Conexión</h3>
              <p className="text-sm text-red-400/90">
                No se puede conectar con Firebase Realtime Database. Verifique su conexión y la configuración del proyecto.
              </p>
            </div>
          </div>
        )}

        {/* TELEMETRY GRID */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Soil Moisture */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Humedad Suelo</span>
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                <Droplet className="h-6 w-6" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">
                {telemetry ? `${moisturePercent}%` : '--'}
              </span>
              <span className="text-xs text-slate-500">calibrado</span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 w-full rounded-full bg-slate-950 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${telemetry ? moisturePercent : 0}%` }}
              />
            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>Raw: {telemetry ? `${moistureRaw} ADC` : '--'}</span>
              <span>Límite Riego: {MOISTURE_THRESHOLD}%</span>
            </div>
          </div>

          {/* Soil pH */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">pH del Suelo</span>
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">
                {telemetry ? telemetry.ph.toFixed(1) : '--'}
              </span>
              <span className="text-xs text-slate-500">pH</span>
            </div>

            {/* pH gauge simulation bar */}
            <div className="mt-4 h-2 w-full rounded-full bg-linear-to-r from-red-500 via-green-500 to-blue-500" />

            <div className="mt-3 flex items-center gap-1 text-[11px] text-amber-500 bg-amber-500/5 px-2 py-1 rounded-md border border-amber-500/10">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Pendiente calibración (Fase 5 - Stub)</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Temperatura</span>
              <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-400">
                <Thermometer className="h-6 w-6" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">
                {telemetry ? `${telemetry.temperature.toFixed(1)}°C` : '--'}
              </span>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              DHT22 — Temperatura ambiente de cultivo
            </p>
          </div>

          {/* Air Humidity */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Humedad Aire</span>
              <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-400">
                <Droplet className="h-6 w-6" />
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">
                {telemetry ? `${Math.round(telemetry.humidity)}%` : '--'}
              </span>
              <span className="text-xs text-slate-500">HR</span>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              DHT22 — Humedad relativa ambiental
            </p>
          </div>

        </section>

        {/* IRRIGATION CONTROL AND STATUS */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* CONTROL CARD */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-900 pb-3">
              <Settings className="h-5 w-5 text-emerald-400" />
              Acciones y Control del Riego
            </h2>

            {/* Mode Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-900">
              <div>
                <h3 className="font-semibold">Modo de Funcionamiento</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {control.isManual 
                    ? 'Modo Manual: Comandos enviados desde este panel.' 
                    : 'Modo Automático: El ESP32 decide según la humedad.'}
                </p>
              </div>
              
              <button
                onClick={toggleMode}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${control.isManual ? 'bg-amber-500' : 'bg-emerald-500'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${control.isManual ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Pump Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${control.isManual ? 'bg-slate-950/60 border-slate-900' : 'bg-slate-950/30 border-slate-950/40 opacity-50'}`}>
              <div>
                <h3 className="font-semibold">Bomba de Agua (Relé)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {control.isManual
                    ? 'Active o desactive manualmente la bomba de riego.'
                    : 'Deshabilitado en modo automático.'}
                </p>
              </div>

              <button
                onClick={togglePump}
                disabled={!control.isManual}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${!control.isManual ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : control.pumpState ? 'bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
              >
                <Power className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* STATUS CARD */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-900 pb-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Estado Físico del Actuador
              </h2>

              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="relative">
                  {/* Outer Pulsing Water rings */}
                  {pumpActive && (
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                  )}
                  
                  <div className={`relative flex h-24 w-24 items-center justify-center rounded-full border transition-all duration-300 ${pumpActive ? 'bg-blue-950/50 border-blue-400 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                    <Droplet className={`h-12 w-12 ${pumpActive ? 'animate-bounce' : ''}`} />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Bomba de Agua: {pumpActive ? 'ENCENDIDA' : 'APAGADA'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {control.isManual 
                      ? 'Estado forzado manualmente por el usuario' 
                      : `Decisión automática por humedad < ${MOISTURE_THRESHOLD}%`}
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnostic logs footer */}
            <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-900/50 text-xs text-slate-500 flex justify-between">
              <span>Uptime ESP32: {telemetry ? `${Math.round(parseInt(telemetry.timestamp) / 1000 / 60)} min` : '--'}</span>
              <span>Ultima Lectura: {lastUpdateBrowserTime ? lastUpdateBrowserTime.toLocaleTimeString() : 'Nunca'}</span>
            </div>
          </div>

        </section>
      </div>
    </main>
  )
}

// src/pages/InductionPanel.jsx
import { useEffect, useState } from 'react'
import {
  generateInduction, supervisorUpdate, getTrains
} from '../api/api'
import { Badge, StatusDot, Spinner, EmptyState } from '../components/ui/index'
import {
  Play,
  AlertTriangle, ChevronDown, ChevronUp, Info
} from 'lucide-react'

// ─── Traffic Selector ─────────────────────────────────────
function TrafficSelector({ value, onChange }) {
  const levels = [
    { v: 1, label: 'L1', desc: 'Very Low' },
    { v: 2, label: 'L2', desc: 'Low' },
    { v: 3, label: 'L3', desc: 'Moderate' },
    { v: 4, label: 'L4', desc: 'High' },
    { v: 5, label: 'L5', desc: 'Peak' },
  ]
  return (
    <div className="flex items-center gap-1">
      {levels.map(l => (
        <button
          key={l.v}
          onClick={() => onChange(l.v)}
          className={`flex flex-col items-center px-3 py-1.5 rounded-sm border transition-all duration-150 ${
            value === l.v
              ? 'border-depot-accent bg-depot-dim text-depot-accent'
              : 'border-depot-border text-depot-muted hover:border-depot-dim'
          }`}
        >
          <span className="font-mono text-xs font-bold">{l.label}</span>
          <span className="font-display text-2xs">{l.desc}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Train Row ────────────────────────────────────────────
function TrainRow({ train, type }) {
  const [expanded, setExpanded] = useState(false)
  const color = type === 'service' ? 'green' : type === 'standby' ? 'yellow' : type === 'cleaning' ? 'cyan' : 'red'
  return (
    <>
      <tr className="cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td>
          <div className="flex items-center gap-2">
            <StatusDot color={color} pulse={type === 'service'} />
            <span className="font-mono text-depot-white font-bold">{train.train}</span>
          </div>
        </td>
        <td>
          {type === 'service' || type === 'standby' ? (
            <span className={`font-mono text-xs ${
              train.score >= 0.7 ? 'text-depot-green' :
              train.score >= 0.4 ? 'text-depot-yellow' : 'text-depot-red'
            }`}>{typeof train.score === 'number' ? train.score.toFixed(3) : '—'}</span>
          ) : (
            <Badge variant={train.category === 'cleaning' ? 'cleaning' : 'maintenance'}>
              {train.category}
            </Badge>
          )}
        </td>
        <td>
          {type === 'service' || type === 'standby' ? (
            <span className="font-mono text-xs text-depot-muted">T{train.track} · P{train.position}</span>
          ) : (
            <span className="font-mono text-xs text-depot-muted">{type === 'cleaning' ? 'Cleaning' : 'IBL'}</span>
          )}
        </td>
        <td>
          {type === 'service' || type === 'standby' ? (
            <span className="font-mono text-xs text-depot-muted">{train.shunting_moves ?? 0}</span>
          ) : (
            <span className="text-depot-muted">—</span>
          )}
        </td>
        <td>
          <button className="text-depot-muted hover:text-depot-accent transition-colors">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-depot-bg px-4 py-3">
            {train.decision_factors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ['Mileage', train.decision_factors.mileage_label, `${train.decision_factors.mileage_km?.toLocaleString('en-IN')} km`],
                  ['Branding', train.decision_factors.branding_label, `Score ${train.decision_factors.branding_score}`],
                  ['AI risk signal', train.decision_factors.ai_label, `${train.decision_factors.ai_risk_percent}%`],
                  ['Overall score', train.decision_factors.score_label, train.decision_factors.composite_score?.toFixed(3)]
                ].map(([label, description, value]) => (
                  <div key={label} className="rounded-md border border-depot-border bg-depot-panel px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xs uppercase tracking-wider text-depot-muted">{label}</span>
                      <span className="font-mono text-xs text-depot-white">{value}</span>
                    </div>
                    <p className="mt-1 text-xs text-depot-text">{description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ['Decision reason', train.why || 'No explanation available.', train.category || type],
                  ['Assignment', type === 'cleaning' ? 'Cleaning facility' : 'Inspection / maintenance', type === 'cleaning' ? 'CLEANING' : 'TECHNICAL'],
                  ['Service status', 'Withheld from passenger service', 'NOT IN SERVICE'],
                  ['Decision category', train.category || type, 'SYSTEM DECISION']
                ].map(([label, description, value]) => (
                  <div key={label} className="rounded-md border border-depot-border bg-depot-panel px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xs uppercase tracking-wider text-depot-muted">{label}</span>
                      <span className="font-mono text-xs text-depot-white">{value}</span>
                    </div>
                    <p className="mt-1 text-xs text-depot-text">{description}</p>
                  </div>
                ))}
              </div>
            )}
            {train.parking && <p className="mt-2 text-xs text-depot-muted">{train.parking}</p>}
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Panel ────────────────────────────────────────────────
function Panel({ title, variant, trains }) {
  const colors = {
    service:     { border: '#00e676', bg: 'rgba(0,230,118,0.04)',  label: 'text-depot-green',  dot: 'green' },
    standby:     { border: '#ffd740', bg: 'rgba(255,215,64,0.04)', label: 'text-depot-yellow', dot: 'yellow' },
    maintenance: { border: '#ff1744', bg: 'rgba(255,23,68,0.04)',  label: 'text-depot-red',    dot: 'red' },
    cleaning:    { border: '#00c2ff', bg: 'rgba(0,194,255,0.04)', label: 'text-depot-accent', dot: 'cyan' },
  }
  const s = colors[variant]
  return (
    <div className="panel flex flex-col" style={{ borderColor: s.border, background: s.bg }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-depot-border">
        <div className="flex items-center gap-2">
          <StatusDot color={s.dot} pulse={variant === 'service'} />
          <span className={`font-display font-bold text-sm tracking-widest uppercase ${s.label}`}>
            {title}
          </span>
        </div>
        <span className="font-mono text-xs text-depot-muted">{trains.length} units</span>
      </div>
      <div className="flex-1 overflow-auto">
        {trains.length === 0 ? (
          <EmptyState message="No trains assigned" sub="Run induction to populate" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Train</th>
                {variant === 'service' || variant === 'standby' ? <th>Score</th> : <th>Category</th>}
                <th>Track</th>
                {variant === 'service' || variant === 'standby' ? <th>Shunts</th> : <th></th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {trains.map((t, i) => (
                <TrainRow key={i} train={t} type={variant} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Override Modal ───────────────────────────────────────
function OverrideModal({ onClose }) {
  const [trainName, setTrainName] = useState('')
  const [status, setStatus] = useState('standby')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [trains, setTrains] = useState([])
  const [trainsLoading, setTrainsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getTrains()
      .then(data => { if (mounted) setTrains(Array.isArray(data) ? data : []) })
      .catch(error => { if (mounted) setMsg({ ok: false, text: error.message }) })
      .finally(() => { if (mounted) setTrainsLoading(false) })
    return () => { mounted = false }
  }, [])

  const matchingTrains = trains.filter(train =>
    train.name?.toLowerCase().includes(trainName.trim().toLowerCase())
  )
  const selectedTrain = trains.find(train =>
    train.name?.toLowerCase() === trainName.trim().toLowerCase()
  )

  const submit = async () => {
    if (!selectedTrain || loading || trainsLoading) return
    setLoading(true)
    setMsg(null)
    try {
      await supervisorUpdate({ train_name: selectedTrain.name, override_status: status })
      setMsg({ ok: true, text: `Override applied to ${trainName}` })
      setTrainName('')
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="panel p-6 w-full max-w-sm mx-4"
        style={{ borderColor: '#ffd740', boxShadow: '0 0 40px rgba(255,215,64,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-depot-yellow" />
            <span className="font-display font-bold text-sm tracking-widest text-depot-yellow uppercase">
              Supervisor Override
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-sm border border-depot-border hover:border-depot-accent transition-colors text-depot-muted hover:text-depot-accent"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="section-label mb-1.5 block">Train ID</label>
            <input
              type="text"
              value={trainName}
              onChange={e => { setTrainName(e.target.value); setMsg(null) }}
              placeholder="e.g. T-5"
              autoFocus
              className="w-full bg-depot-bg border border-depot-border rounded-sm px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-depot-accent transition-colors"
              style={{ color: 'var(--depot-text)' }}
              autoComplete="off"
            />
            {trainName.trim() && !selectedTrain && matchingTrains.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto rounded-sm border border-depot-border bg-depot-panel shadow-lg">
                {matchingTrains.slice(0, 8).map(train => (
                  <button key={train.id ?? train.name} type="button" onClick={() => setTrainName(train.name)} className="block w-full px-3 py-2 text-left font-mono text-sm text-depot-text hover:bg-depot-dim">
                    {train.name}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1 text-2xs font-mono text-depot-muted">
              {trainsLoading ? 'Loading fleet…' : selectedTrain ? 'Valid train selected' : trainName.trim() ? matchingTrains.length ? 'Choose a matching train from the suggestions or enter its exact ID.' : 'No matching train in the fleet.' : 'Type to search or select a train.'}
            </p>
          </div>

          <div>
            <label className="section-label mb-1.5 block">Override Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('standby')}
                className={`flex-1 btn ${status === 'standby' ? 'btn-warning' : 'btn-ghost'}`}
              >
                Standby
              </button>
              <button
                onClick={() => setStatus('maintenance')}
                className={`flex-1 btn ${status === 'maintenance' ? 'btn-danger' : 'btn-ghost'}`}
              >
                Maintenance
              </button>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || trainsLoading || !selectedTrain}
            className="w-full btn btn-warning flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size={13} /> : <AlertTriangle size={13} />}
            Apply Override
          </button>

          {msg && (
            <p className={`font-mono text-xs text-center ${msg.ok ? 'text-depot-green' : 'text-depot-red'}`}>
              {msg.ok ? '✓' : '✗'} {msg.text}
            </p>
          )}

          <p className="font-body text-depot-muted text-xs text-center leading-relaxed border-t border-depot-border pt-3">
            Override auto-clears after next induction run.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function InductionPanel() {
  const [traffic, setTraffic]       = useState(3)
  const [result, setResult]         = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('transitiq:last-induction') || 'null')
    } catch {
      return null
    }
  })
  const [simResult, setSimResult]   = useState(null)
  const [loading, setLoading]       = useState('')
  const [toast, setToast]           = useState(null)
  const [simMode, setSimMode]       = useState(false)

  useEffect(() => {
    if (result) {
      localStorage.setItem('transitiq:last-induction', JSON.stringify(result))
    }
  }, [result])
  const [showOverride, setShowOverride] = useState(false)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const run = async (fn, key, ...args) => {
    setLoading(key)
    try {
      return await fn(...args)
    } catch (e) {
      showToast(e.message, false)
      return null
    } finally {
      setLoading('')
    }
  }

  const handleGenerate = async () => {
    const res = await run(generateInduction, 'generate', traffic)
    if (res) { setResult(res); setSimResult(null); setSimMode(false) }
  }

  const display = simMode ? simResult : result

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-sm border font-mono text-xs shadow-lg ${
          toast.ok
            ? 'bg-depot-panel border-depot-green text-depot-green'
            : 'bg-depot-panel border-depot-red text-depot-red'
        }`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* Override Modal */}
      {showOverride && <OverrideModal onClose={() => setShowOverride(false)} />}

      {/* ── Top Controls ── */}
      <div className="panel p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="section-label whitespace-nowrap">Traffic Level</span>
            <TrafficSelector value={traffic} onChange={setTraffic} />
          </div>

          <div className="h-6 w-px bg-depot-border mx-1" />

          <button onClick={handleGenerate} disabled={!!loading} className="btn btn-primary">
            {loading === 'generate' ? <Spinner size={12} /> : <Play size={12} />}
            Generate Induction
          </button>

          <button onClick={() => setShowOverride(true)} className="btn btn-warning">
            <AlertTriangle size={12} />
            Supervisor Override
          </button>
        </div>

        {simMode && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-depot-dim rounded-sm border border-depot-yellow/40">
            <Zap size={12} className="text-depot-yellow" />
            <span className="font-display text-depot-yellow text-xs tracking-wide">
              SIMULATION MODE — results are hypothetical and not saved to database
            </span>
            <button
              onClick={() => { setSimMode(false); setSimResult(null) }}
              className="ml-auto text-depot-muted hover:text-depot-yellow text-xs font-mono"
            >
              ✕ dismiss
            </button>
          </div>
        )}
      </div>

      {/* ── 3 Panels full width ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Panel title="Service"     variant="service"      trains={display?.service     ?? []} />
        <Panel title="Standby"     variant="standby"      trains={display?.standby     ?? []} />
        <Panel title="Technical Maintenance" variant="maintenance" trains={display?.maintenance ?? []} />
        <Panel title="Cleaning" variant="cleaning" trains={display?.cleaning ?? []} />
      </div>
    </div>
  )
}
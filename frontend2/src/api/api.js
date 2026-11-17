// src/api/api.js
// Central API service layer — all calls to FastAPI backend

const BASE = '/api'

async function request(method, path, body = null, isFormData = false) {
  const opts = {
    method,
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  }

  if (body !== null && body !== undefined) {
    opts.body = isFormData ? body : JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, opts)
  } catch {
    throw new Error('Unable to connect to the TransitIQ backend. Check that the service is available and try again.')
  }

  if (!res.ok) {
    let message = `Request failed (${res.status}${res.statusText ? ` ${res.statusText}` : ''})`
    try {
      const payload = await res.json()
      const detail = payload?.detail ?? payload?.message ?? payload?.error
      if (typeof detail === 'string' && detail.trim()) message = detail
      else if (Array.isArray(detail)) {
        message = detail.map(item => item?.msg || JSON.stringify(item)).join('; ')
      }
    } catch {
      // Preserve the HTTP status message for non-JSON error responses.
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

export const getBackendHealth    = ()             => request('GET',    '/health')

// ─── Trains ──────────────────────────────────────────────
export const getTrains          = ()             => request('GET',    '/trains')
export const addTrain           = (data)         => request('POST',   '/trains', data)
export const resetDatabase      = ()             => request('DELETE', '/reset-database')
export const populateDatabase   = ()             => request('POST',   '/initialize-fleet')

// ─── Induction ───────────────────────────────────────────
export const generateInduction  = (level = 3)   => request('POST',   `/generate-induction?traffic_level=${level}`)
export const simulateInduction  = (payload)     => request('POST',   '/simulate-induction', payload)

// ─── Overrides / Updates ─────────────────────────────────
export const supervisorUpdate   = (data)         => request('PATCH',  '/supervisor-update', data)
export const maiximoUpdate      = (data)         => request('PATCH',  '/maximo-update', data)
export const iotUpdate          = (data)         => request('PATCH',  '/iot-update', data)
export const cleaningUpdate     = (data)         => request('PATCH',  '/cleaning-update', data)

// ─── Branding CSV ─────────────────────────────────────────
export const uploadBranding = (file) => {
  const form = new FormData()
  form.append('file', file)
  return request('POST', '/upload-branding', form, true)
}

// ─── Depot & Layout ──────────────────────────────────────
export const getDepotLayout     = ()             => request('GET',    '/depot-layout')
export const getDepotSummary    = ()             => request('GET',    '/depot-summary')

// ─── Cleaning ────────────────────────────────────────────
export const getCleaningPlan    = ()             => request('GET',    '/cleaning-plan')

// ─── Alerts & Health ─────────────────────────────────────
export const getAlerts          = ()             => request('GET',    '/alerts')
export const getFleetHealth     = ()             => request('GET',    '/fleet-health')

// ─── History ─────────────────────────────────────────────
export const getInductionLogs   = ()             => request('GET',    '/induction-logs')

// ─── Metrics ─────────────────────────────────────────────
export const getResourceUtil    = ()             => request('GET',    '/resource-utilization')
export const getShuntingIndex   = ()             => request('GET',    '/shunting-index')
export const getDailyReport     = ()             => request('GET',    '/daily-report')

// ─── Decision Breakdown ───────────────────────────────────
export const getDecisionBreakdown = (name)       => request('GET',    `/decision-breakdown/${name}`)
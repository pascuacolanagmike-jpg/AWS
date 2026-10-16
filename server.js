/**
 * AGRIWEATHER — Philippine Farm Forecast
 * ------------------------------------------------------------
 * Single-file Node.js server. No API keys required.
 *
 *   npm install express
 *   node server.js
 *   -> http://localhost:3000
 *
 * External services (all free, no key):
 *   - Open-Meteo          weather + soil data
 *   - Nominatim           reverse geocoding
 *   - OpenStreetMap       map tiles
 *
 * Requirements: Node.js 18+ (global fetch).
 *
 * Storm Watch is a heuristic risk indicator, not an official
 * typhoon forecast. Always follow PAGASA advisories.
 */

'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

if (typeof fetch !== 'function') {
  console.error('[AgriWeather] Node.js 18+ is required (global fetch missing). You are on ' + process.version);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/*  In-memory cache                                                   */
/* ------------------------------------------------------------------ */

const CACHE = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getJSON(url, extraHeaders = {}, timeoutMs = 6000) {
  const hit = CACHE.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'AgriWeather/1.0 (Philippine farm forecast)',
    ...extraHeaders
  };

  const opts = { headers };
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    opts.signal = AbortSignal.timeout(timeoutMs);
  }

  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('Upstream responded with ' + res.status);

  const data = await res.json();
  CACHE.set(url, { at: Date.now(), data });
  if (CACHE.size > 250) CACHE.delete(CACHE.keys().next().value);
  return data;
}

/* ------------------------------------------------------------------ */
/*  API: reverse geocode                                              */
/* ------------------------------------------------------------------ */

app.get('/api/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=json&zoom=12&accept-language=en' +
      '&lat=' + lat + '&lon=' + lon;

    const data = await getJSON(url, {}, 5000);
    const a = (data && data.address) || {};

    const name =
      a.city || a.town || a.village || a.municipality ||
      a.county || a.state_district || a.state || 'Your location';

    res.set('Cache-Control', 'public, max-age=3600');
    res.json({
      name: name,
      region: a.state || a.region || '',
      country: a.country || ''
    });
  } catch (err) {
    res.json({ name: 'Your location', region: '', country: '', error: String(err.message || err) });
  }
});

/* ------------------------------------------------------------------ */
/*  API: weather forecast                                             */
/* ------------------------------------------------------------------ */

app.get('/api/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    Math.abs(lat) > 90 || Math.abs(lon) > 180
  ) {
    return res.status(400).json({ error: 'Valid lat and lon are required' });
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'weather_code',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'precipitation'
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation_probability',
      'precipitation',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'soil_moisture_0_to_1cm',
      'soil_moisture_1_to_3cm',
      'soil_moisture_3_to_9cm',
      'soil_moisture_9_to_27cm',
      'soil_temperature_0cm',
      'soil_temperature_6cm',
      'soil_temperature_18cm',
      'soil_temperature_54cm',
      'evapotranspiration'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'et0_fao_evapotranspiration',
      'sunrise',
      'sunset'
    ].join(','),
    timezone: 'auto',
    forecast_days: '7'
  });

  try {
    const data = await getJSON('https://api.open-meteo.com/v1/forecast?' + params.toString());
    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

/* ------------------------------------------------------------------ */
/*  API: vegetation conditions (soil feed)                            */
/* ------------------------------------------------------------------ */

app.get('/api/ndvi', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly: [
        'soil_moisture_0_to_1cm',
        'soil_moisture_1_to_3cm',
        'soil_moisture_3_to_9cm',
        'soil_moisture_9_to_27cm',
        'soil_temperature_6cm',
        'soil_temperature_18cm',
        'evapotranspiration'
      ].join(','),
      daily: 'et0_fao_evapotranspiration,precipitation_sum',
      timezone: 'auto',
      forecast_days: '3'
    });

    const data = await getJSON('https://api.open-meteo.com/v1/forecast?' + params.toString());

    res.set('Cache-Control', 'public, max-age=1800');
    res.json({ source: 'soil-feed', data });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

/* ------------------------------------------------------------------ */
/*  The UI                                                            */
/* ------------------------------------------------------------------ */

const PAGE = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>AgriWeather — Philippine Farm Forecast</title>
<meta name="theme-color" content="#0f766e" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f5f7fa;
    --surface: #ffffff;
    --surface-2: #f8fafc;
    --border: #e2e8f0;
    --border-strong: #cbd5e1;
    --text: #0f172a;
    --muted: #64748b;
    --muted-2: #94a3b8;
    --accent: #0f766e;
    --accent-2: #14b8a6;
    --accent-soft: #ccfbf1;
    --rain: #0369a1;
    --rain-soft: #dbeafe;
    --warn: #c2410c;
    --warn-soft: #ffedd5;
    --ok: #15803d;
    --ok-soft: #dcfce7;
    --soil-track: #e2e8f0;
    --radius: 14px;
    --radius-lg: 20px;
    --shadow-sm: 0 1px 2px rgba(15,23,42,.06);
    --shadow: 0 4px 16px rgba(15,23,42,.08);
    --map-filter: none;
  }

  html[data-theme="dark"] {
    --bg: #0b1220;
    --surface: #131c2e;
    --surface-2: #1a2438;
    --border: #243146;
    --border-strong: #334155;
    --text: #e9eefb;
    --muted: #8595b5;
    --muted-2: #6b7c9c;
    --accent: #14b8a6;
    --accent-2: #2dd4bf;
    --accent-soft: rgba(20,184,166,.14);
    --rain: #38bdf8;
    --rain-soft: rgba(56,189,248,.14);
    --warn: #fb923c;
    --warn-soft: rgba(251,146,60,.14);
    --ok: #34d399;
    --ok-soft: rgba(52,211,153,.14);
    --soil-track: #2a3852;
    --shadow-sm: 0 1px 2px rgba(0,0,0,.4);
    --shadow: 0 4px 16px rgba(0,0,0,.5);
    --map-filter: invert(1) hue-rotate(180deg) brightness(.92) contrast(.92);
  }

  html, body { height: 100%; }

  body {
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    transition: background .3s, color .3s;
  }

  .topbar {
    position: sticky; top: 0; z-index: 100;
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }

  .brand { display: flex; flex-direction: column; gap: 2px; }

  .brand-name {
    font-size: 16px; font-weight: 800; letter-spacing: .14em;
    color: var(--accent);
  }

  .brand-sub {
    font-size: 10.5px; font-weight: 600; letter-spacing: .1em;
    color: var(--muted); text-transform: uppercase;
  }

  .topbar-right { display: flex; align-items: center; gap: 12px; }

  .gps-badge {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 14px;
    background: var(--accent-soft);
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-radius: 999px;
    font-size: 12px; font-weight: 600; color: var(--accent);
  }

  .gps-badge .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 50%, transparent);
    animation: ping 2s cubic-bezier(.2,.8,.2,1) infinite;
  }

  @keyframes ping {
    0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 50%, transparent); }
    70%  { box-shadow: 0 0 0 10px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  .gps-badge .coords { font-variant-numeric: tabular-nums; letter-spacing: .02em; }

  .theme-toggle {
    width: 40px; height: 40px; border-radius: 12px; cursor: pointer;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); display: grid; place-items: center;
    transition: .2s; flex-shrink: 0;
  }
  .theme-toggle:hover { color: var(--accent); border-color: var(--accent); }

  .shell {
    max-width: 1400px; margin: 0 auto; padding: 24px;
    display: flex; flex-direction: column; gap: 20px;
  }

  .hero {
    display: grid;
    grid-template-columns: 1.45fr 1fr;
    gap: 20px;
    align-items: stretch;
  }

  .map-panel {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: var(--shadow);
    min-height: 600px;
  }

  #map { position: absolute; inset: 0; z-index: 1; }
  #map .leaflet-tile-pane { filter: var(--map-filter); transition: filter .3s; }

  .wind-canvas {
    position: absolute; inset: 0; z-index: 400;
    pointer-events: none;
  }

  .gps-marker { background: transparent !important; border: none !important; }

  .gps-dot {
    position: relative;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--accent);
    border: 3px solid #ffffff;
    box-shadow: 0 0 0 2px var(--accent), 0 4px 12px rgba(15,118,110,.35);
  }

  .gps-dot::after {
    content: "";
    position: absolute; inset: -3px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    animation: pulse 2.2s ease-out infinite;
  }

  @keyframes pulse {
    0%   { transform: scale(1);   opacity: .85; }
    100% { transform: scale(2.6); opacity: 0;   }
  }

  .map-overlay {
    position: absolute; z-index: 500;
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    pointer-events: none;
  }

  .map-legend {
    left: 16px; bottom: 16px;
    padding: 12px 14px; max-width: 260px;
  }

  .legend-title {
    font-size: 10px; font-weight: 800; letter-spacing: .16em;
    color: var(--accent); margin-bottom: 6px; text-transform: uppercase;
  }

  .legend-item {
    font-size: 11.5px; color: var(--muted);
    font-weight: 500; line-height: 1.55;
  }

  .map-readout {
    right: 16px; top: 16px;
    padding: 12px 14px; min-width: 168px;
  }

  .readout-row {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 14px; padding: 3px 0; font-size: 11px;
  }

  .readout-row .k {
    color: var(--muted); font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase;
  }

  .readout-row .v {
    font-size: 13.5px; font-weight: 700; color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .data-panel { display: flex; flex-direction: column; gap: 12px; }

  .loc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 20px;
    box-shadow: var(--shadow-sm);
  }

  .loc-name {
    font-size: 20px; font-weight: 700;
    letter-spacing: -.015em; color: var(--text);
    line-height: 1.25;
  }

  .loc-sub {
    font-size: 12px; color: var(--muted);
    margin-top: 3px; font-weight: 500;
  }

  .temp-card {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
    color: #ffffff;
    border-radius: var(--radius-lg);
    padding: 22px 24px;
    box-shadow: 0 10px 26px rgba(15,118,110,.28);
    position: relative; overflow: hidden;
  }

  .temp-card::after {
    content: "";
    position: absolute; top: -40px; right: -40px;
    width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.20), transparent 70%);
    pointer-events: none;
  }

  .card-kicker {
    font-size: 10px; font-weight: 800; letter-spacing: .18em;
    text-transform: uppercase; opacity: .78;
  }

  .temp-value {
    display: flex; align-items: flex-start; gap: 4px;
    margin: 8px 0 4px; position: relative; z-index: 1;
  }

  .temp-value .num {
    font-size: 76px; font-weight: 200;
    line-height: .9; letter-spacing: -.05em;
    font-variant-numeric: tabular-nums;
  }

  .temp-value .unit {
    font-size: 22px; font-weight: 500;
    margin-top: 8px; opacity: .88;
  }

  .temp-feels {
    font-size: 13px; font-weight: 500; opacity: .88;
    position: relative; z-index: 1;
  }

  .temp-feels strong { font-weight: 700; }

  .mini-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .mini-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 16px;
    box-shadow: var(--shadow-sm);
  }

  .mini-card .card-kicker { color: var(--muted); opacity: 1; }

  .mini-value {
    font-size: 26px; font-weight: 300;
    letter-spacing: -.02em; margin-top: 6px;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .mini-value .u {
    font-size: 13px; font-weight: 600;
    color: var(--muted); margin-left: 4px;
  }

  .mini-sub {
    font-size: 11.5px; color: var(--muted);
    margin-top: 3px; font-weight: 500;
  }

  .mini-bar {
    height: 6px; background: var(--soil-track); border-radius: 999px;
    margin-top: 10px; overflow: hidden;
  }

  .mini-bar > span {
    display: block; height: 100%; width: 0;
    background: var(--rain); border-radius: 999px;
    transition: width .9s cubic-bezier(.2,.8,.2,1);
  }

  .veg-card,
  .soil-card,
  .storm-card,
  .crop-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    box-shadow: var(--shadow-sm);
  }

  .veg-head, .soil-head, .storm-head, .crop-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-bottom: 14px;
  }

  .veg-title, .soil-title, .storm-title, .crop-title {
    font-size: 11px; font-weight: 800; letter-spacing: .18em;
    text-transform: uppercase; color: var(--muted);
  }

  .soil-depth-label {
    font-size: 10.5px; font-weight: 700; color: var(--muted-2);
    letter-spacing: .08em; text-transform: uppercase;
  }

  .veg-level, .storm-level {
    font-size: 11px; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase;
    padding: 5px 12px; border-radius: 999px;
    border: 1px solid currentColor;
    opacity: .9;
  }

  .veg-score, .storm-score {
    display: flex; align-items: flex-start; gap: 4px;
    margin-bottom: 4px;
  }

  .veg-score .num, .storm-score .num {
    font-size: 52px; font-weight: 200; line-height: .95;
    letter-spacing: -.04em; font-variant-numeric: tabular-nums;
  }

  .veg-score .suffix, .storm-score .suffix {
    font-size: 14px; font-weight: 600; color: var(--muted);
    margin-top: 8px;
  }

  .veg-sub {
    font-size: 12px; color: var(--muted); font-weight: 500;
    margin-bottom: 16px;
  }

  .veg-factors, .storm-factors {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .veg-factor {
    padding: 9px 11px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
  }

  .veg-factor .fname {
    font-size: 9.5px; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted);
  }

  .veg-factor .fvalue {
    font-size: 13.5px; font-weight: 700;
    margin-top: 3px; font-variant-numeric: tabular-nums;
    letter-spacing: -.01em;
  }

  .factor-bar {
    height: 3px; background: var(--soil-track); border-radius: 999px;
    margin-top: 7px; overflow: hidden;
  }

  .factor-bar > span {
    display: block; height: 100%; width: 0;
    border-radius: 999px;
    transition: width .8s cubic-bezier(.2,.8,.2,1);
  }

  .veg-note, .storm-note {
    font-size: 10.5px; color: var(--muted);
    line-height: 1.55; margin-top: 14px; padding-top: 12px;
    border-top: 1px dashed var(--border);
    font-weight: 500;
  }

  .soil-layer {
    display: grid;
    grid-template-columns: 74px 1fr 74px;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  .soil-layer:last-child { border-bottom: none; }

  .soil-depth {
    font-size: 11px; font-weight: 700; color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .soil-track {
    position: relative; height: 8px; border-radius: 999px;
    background: var(--soil-track); overflow: hidden;
  }

  .soil-fill {
    position: absolute; top: 0; bottom: 0; left: 0;
    border-radius: 999px;
    transition: width .9s cubic-bezier(.2,.8,.2,1), background .4s;
  }

  .soil-value {
    font-size: 12.5px; font-weight: 700; text-align: right;
    font-variant-numeric: tabular-nums; color: var(--text);
  }

  .soil-temp-row {
    display: grid; grid-template-columns: 74px 1fr 74px;
    align-items: center; gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  .soil-temp-row:last-child { border-bottom: none; }

  .crop-selects {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px; margin-bottom: 16px;
  }

  .field { display: flex; flex-direction: column; gap: 5px; }

  .field label {
    font-size: 10px; font-weight: 800; letter-spacing: .12em;
    text-transform: uppercase; color: var(--muted);
  }

  .field select {
    width: 100%; padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    font: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 34px;
  }

  .field select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .crop-status {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid;
    margin-bottom: 14px;
  }

  .crop-status[data-status="ok"] {
    background: var(--ok-soft);
    border-color: color-mix(in srgb, var(--ok) 40%, transparent);
  }

  .crop-status[data-status="warn"] {
    background: var(--warn-soft);
    border-color: color-mix(in srgb, var(--warn) 40%, transparent);
  }

  .crop-status[data-status="bad"] {
    background: color-mix(in srgb, #ef4444 14%, transparent);
    border-color: color-mix(in srgb, #ef4444 40%, transparent);
  }

  .crop-status-text {
    font-size: 13px; font-weight: 600; line-height: 1.5;
    color: var(--text);
  }

  .crop-status-text strong { font-weight: 800; }

  .crop-range-bar {
    position: relative;
    height: 10px; border-radius: 999px;
    background: linear-gradient(90deg,
      #93c5fd 0%, #93c5fd 18%,
      #86efac 18%, #86efac 78%,
      #fca5a5 78%, #fca5a5 100%);
    margin: 18px 0 8px;
    overflow: visible;
  }

  .crop-range-marker {
    position: absolute; top: -6px;
    width: 4px; height: 22px; border-radius: 2px;
    background: var(--text);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--surface) 90%, transparent);
    transition: left .9s cubic-bezier(.2,.8,.2,1);
    transform: translateX(-50%);
  }

  .crop-range-labels {
    display: flex; justify-content: space-between;
    font-size: 9.5px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted-2);
  }

  .crop-details {
    margin-top: 16px; padding-top: 14px;
    border-top: 1px dashed var(--border);
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }

  .crop-detail {
    font-size: 11.5px; color: var(--muted); font-weight: 500;
  }

  .crop-detail strong {
    display: block; font-size: 14px; font-weight: 700;
    color: var(--text); margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }

  .storm-scale {
    position: relative; height: 8px; border-radius: 999px;
    background: linear-gradient(90deg,
      #86efac 0%, #86efac 24%,
      #fde68a 25%, #fde68a 49%,
      #fdba74 50%, #fdba74 74%,
      #fca5a5 75%, #fca5a5 100%);
    margin: 14px 0 6px; overflow: visible;
  }

  .storm-marker {
    position: absolute; top: -4px;
    width: 4px; height: 16px; border-radius: 2px;
    background: var(--text);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--surface) 90%, transparent);
    transition: left .9s cubic-bezier(.2,.8,.2,1);
    transform: translateX(-50%);
  }

  .storm-scale-labels {
    display: flex; justify-content: space-between;
    font-size: 9.5px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted-2);
    margin-top: 4px;
  }

  .advice {
    background: var(--warn-soft);
    border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent);
    border-radius: var(--radius);
    padding: 16px 20px;
    transition: background .3s, border-color .3s;
  }

  .advice[data-level="ok"]   { background: var(--ok-soft);   border-color: color-mix(in srgb, var(--ok) 40%, transparent); }
  .advice[data-level="rain"] { background: var(--rain-soft); border-color: color-mix(in srgb, var(--rain) 40%, transparent); }

  .advice-title {
    font-size: 10px; font-weight: 800; letter-spacing: .16em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 8px;
  }

  .advice[data-level="ok"]   .advice-title { color: var(--ok); }
  .advice[data-level="warn"] .advice-title { color: var(--warn); }
  .advice[data-level="rain"] .advice-title { color: var(--rain); }

  .advice-text { font-size: 13px; font-weight: 500; line-height: 1.65; color: var(--text); }
  .advice-text ul { list-style: none; padding: 0; }

  .advice-text li { padding: 3px 0 3px 16px; position: relative; }

  .advice-text li::before {
    content: "";
    position: absolute; left: 0; top: 11px;
    width: 6px; height: 6px; border-radius: 50%;
    background: currentColor; opacity: .55;
  }

  .section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    box-shadow: var(--shadow-sm);
  }

  .section-title {
    font-size: 11px; font-weight: 800; letter-spacing: .18em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 14px;
  }

  .hourly {
    display: flex; gap: 10px; overflow-x: auto;
    padding-bottom: 6px; scrollbar-width: thin;
  }

  .hourly::-webkit-scrollbar { height: 6px; }
  .hourly::-webkit-scrollbar-thumb {
    background: var(--border-strong); border-radius: 999px;
  }

  .hour-card {
    flex: 0 0 98px;
    padding: 12px 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-align: center;
  }

  .hour-card.now {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  }

  .hour-time {
    font-size: 10.5px; font-weight: 700; color: var(--muted);
    letter-spacing: .08em; text-transform: uppercase;
  }

  .hour-card.now .hour-time { color: var(--accent); }

  .hour-temp {
    font-size: 21px; font-weight: 500;
    margin: 8px 0 6px; letter-spacing: -.02em;
    font-variant-numeric: tabular-nums;
  }

  .hour-rain {
    display: flex; align-items: center; gap: 6px;
    font-size: 10.5px; font-weight: 700; color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .hour-rain .bar {
    flex: 1; height: 4px; background: var(--soil-track);
    border-radius: 999px; overflow: hidden;
  }

  .hour-rain .bar > span {
    display: block; height: 100%; background: var(--rain);
    border-radius: 999px; transition: width .6s ease-out;
  }

  .hour-wind {
    font-size: 11px; color: var(--muted); margin-top: 6px;
    font-weight: 500; font-variant-numeric: tabular-nums;
  }

  .day-row {
    display: grid;
    grid-template-columns: 110px 1fr 130px 100px;
    gap: 18px; align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }

  .day-row:last-child { border-bottom: none; }

  .day-name { font-weight: 700; letter-spacing: -.01em; }

  .day-name .sub {
    display: block; font-size: 10px; color: var(--muted);
    font-weight: 600; text-transform: uppercase;
    letter-spacing: .09em; margin-top: 2px;
  }

  .day-rain {
    display: flex; align-items: center; gap: 12px;
    font-size: 12px; font-weight: 700; color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .day-rain .bar {
    flex: 1; height: 5px; background: var(--soil-track);
    border-radius: 999px; overflow: hidden; max-width: 160px;
  }

  .day-rain .bar > span {
    display: block; height: 100%; background: var(--rain);
    border-radius: 999px; transition: width .6s ease-out;
  }

  .day-temp {
    font-variant-numeric: tabular-nums; font-weight: 500;
    text-align: right; font-size: 14px;
  }

  .day-temp .max { font-weight: 700; }
  .day-temp .min { color: var(--muted); margin-left: 8px; }

  .day-wind {
    font-variant-numeric: tabular-nums; color: var(--muted);
    font-size: 12px; font-weight: 600; text-align: right;
  }

  .loading {
    display: grid; place-items: center;
    padding: 70px 20px; text-align: center;
    color: var(--muted); font-size: 14px; font-weight: 500;
  }

  .spinner {
    width: 34px; height: 34px; border-radius: 50%;
    border: 3px solid var(--border); border-top-color: var(--accent);
    animation: spin .8s linear infinite; margin: 0 auto 16px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .error-box {
    background: var(--warn-soft);
    border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent);
    color: var(--text);
    padding: 16px 20px; border-radius: var(--radius);
    font-size: 13.5px; font-weight: 500; line-height: 1.6;
  }

  @media (max-width: 1000px) {
    .hero { grid-template-columns: 1fr; }
    .map-panel { min-height: 480px; }
  }

  @media (max-width: 760px) {
    .day-row { grid-template-columns: 80px 1fr 100px; gap: 12px; }
    .day-wind { display: none; }
    .day-rain .bar { max-width: 70px; }
    .crop-selects { grid-template-columns: 1fr; }
    .veg-factors { grid-template-columns: 1fr; }
    .storm-factors { grid-template-columns: 1fr; }
    .crop-details { grid-template-columns: 1fr; }
  }

  @media (max-width: 640px) {
    .shell { padding: 14px; gap: 14px; }
    .topbar { padding: 12px 14px; flex-wrap: wrap; gap: 10px; }
    .brand-sub { display: none; }
    .gps-badge { font-size: 11px; padding: 6px 12px; }
    .temp-value .num { font-size: 60px; }
    .mini-value { font-size: 23px; }
    .map-panel { min-height: 400px; }
    .map-legend { max-width: 200px; padding: 10px 12px; }
    .map-readout { padding: 10px 12px; min-width: 148px; }
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--border-strong); border-radius: 99px;
    border: 3px solid transparent; background-clip: content-box;
  }
</style>
</head>
<body>

<header class="topbar">
  <div class="brand">
    <span class="brand-name">AGRIWEATHER</span>
    <span class="brand-sub">Philippine Farm Forecast</span>
  </div>
  <div class="topbar-right">
    <div class="gps-badge">
      <span class="dot"></span>
      <span class="coords" id="gpsCoords">Acquiring GPS signal</span>
    </div>
    <button class="theme-toggle" id="themeToggle" type="button" title="Toggle dark mode" aria-label="Toggle dark mode">
      <svg id="themeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  </div>
</header>

<main class="shell">

  <div id="loading" class="loading">
    <div>
      <div class="spinner"></div>
      <div>Requesting your GPS location</div>
    </div>
  </div>

  <div id="errorBox" class="error-box" style="display:none"></div>

  <div id="content" style="display:none">

    <div class="hero">

      <div class="map-panel">
        <div id="map"></div>

        <div class="map-overlay map-legend">
          <div class="legend-title">Live Wind Flow</div>
          <div class="legend-item">Particles drift with the wind. Denser, faster flow means stronger winds. The dashed ring shows the local storm risk zone.</div>
        </div>

        <div class="map-overlay map-readout">
          <div class="readout-row"><span class="k">Wind</span><span class="v" id="roWind">—</span></div>
          <div class="readout-row"><span class="k">From</span><span class="v" id="roDir">—</span></div>
          <div class="readout-row"><span class="k">Gusts</span><span class="v" id="roGust">—</span></div>
          <div class="readout-row"><span class="k">Pressure</span><span class="v" id="roPress">—</span></div>
        </div>
      </div>

      <div class="data-panel">

        <div class="loc-card">
          <div class="loc-name" id="locName">—</div>
          <div class="loc-sub" id="locSub">—</div>
        </div>

        <div class="temp-card">
          <div class="card-kicker">Temperature</div>
          <div class="temp-value">
            <span class="num" id="tempNum">--</span>
            <span class="unit">°C</span>
          </div>
          <div class="temp-feels">Feels like <strong id="feelsLike">--°C</strong></div>
        </div>

        <div class="mini-grid">
          <div class="mini-card">
            <div class="card-kicker">Rain Chance</div>
            <div class="mini-value"><span id="rainChance">--</span><span class="u">%</span></div>
            <div class="mini-bar"><span id="rainBar"></span></div>
          </div>
          <div class="mini-card">
            <div class="card-kicker">Humidity</div>
            <div class="mini-value"><span id="humidity">--</span><span class="u">%</span></div>
          </div>
          <div class="mini-card">
            <div class="card-kicker">Wind Speed</div>
            <div class="mini-value"><span id="windSpeed">--</span><span class="u">km/h</span></div>
          </div>
          <div class="mini-card">
            <div class="card-kicker">Wind Direction</div>
            <div class="mini-value" id="windDirCard">--</div>
            <div class="mini-sub" id="windDirSub">--</div>
          </div>
        </div>

        <div class="crop-card">
          <div class="crop-head">
            <div class="crop-title">Crop Suitability</div>
          </div>

          <div class="crop-selects">
            <div class="field">
              <label for="cropSelect">Crop</label>
              <select id="cropSelect"></select>
            </div>
            <div class="field">
              <label for="stageSelect">Growth Stage</label>
              <select id="stageSelect">
                <option value="seedling">Seedling</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="maturity">Maturity</option>
              </select>
            </div>
          </div>

          <div class="crop-status" id="cropStatus" data-status="ok">
            <div class="crop-status-text" id="cropStatusText">—</div>
          </div>

          <div class="crop-range-bar">
            <div class="crop-range-marker" id="cropMarker" style="left:50%"></div>
          </div>
          <div class="crop-range-labels">
            <span id="cropMinLabel">—</span>
            <span id="cropOptLabel">Optimal</span>
            <span id="cropMaxLabel">—</span>
          </div>

          <div class="crop-details">
            <div class="crop-detail">Current temp<strong id="cropCurrentTemp">—</strong></div>
            <div class="crop-detail">7-day high<strong id="cropHigh7">—</strong></div>
            <div class="crop-detail">7-day low<strong id="cropLow7">—</strong></div>
            <div class="crop-detail">Stage sensitivity<strong id="cropSensitivity">—</strong></div>
          </div>
        </div>

        <div class="veg-card">
          <div class="veg-head">
            <div class="veg-title">Vegetation Condition</div>
            <div class="veg-level" id="vegLevel">—</div>
          </div>

          <div class="veg-score">
            <span class="num" id="vegScore">--</span>
            <span class="suffix">/ 100</span>
          </div>
          <div class="veg-sub" id="vegSub">Root zone across the top 27 cm</div>

          <div class="veg-factors" id="vegFactors"></div>

          <div class="veg-note">
            Tracks soil moisture, soil temperature, and water balance to show whether
            root-zone conditions support active crop growth.
          </div>
        </div>

        <div class="soil-card">
          <div class="soil-head">
            <div class="soil-title">Soil Profile</div>
            <div class="soil-depth-label">Moisture by depth</div>
          </div>
          <div id="soilLayers"></div>
        </div>

        <div class="storm-card" id="stormCard">
          <div class="storm-head">
            <div class="storm-title">Storm Watch</div>
            <div class="storm-level" id="stormLevel">Low</div>
          </div>

          <div class="storm-score">
            <span class="num" id="stormScore">--</span>
            <span class="suffix">/ 100</span>
          </div>
          <div class="veg-sub">Local storm risk for the next 72 hours</div>

          <div class="storm-scale">
            <div class="storm-marker" id="stormMarker" style="left:0%"></div>
          </div>
          <div class="storm-scale-labels">
            <span>Low</span><span>Moderate</span><span>High</span><span>Severe</span>
          </div>

          <div class="storm-factors" id="stormFactors"></div>

          <div class="storm-note">
            Built from wind, gusts, pressure, pressure drop, and rainfall.
            Not an official typhoon forecast. Always follow PAGASA advisories.
          </div>
        </div>

        <div class="advice" id="adviceBox" data-level="ok">
          <div class="advice-title">Farm Advisory</div>
          <div class="advice-text" id="adviceText">—</div>
        </div>

      </div>
    </div>

    <section class="section" style="margin-top:20px">
      <div class="section-title">Next 12 Hours</div>
      <div class="hourly" id="hourlyStrip"></div>
    </section>

    <section class="section" style="margin-top:20px">
      <div class="section-title">7-Day Forecast</div>
      <div class="daily" id="dailyList"></div>
    </section>

  </div>
</main>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    html:         document.documentElement,
    loading:      $('loading'),
    error:        $('errorBox'),
    content:      $('content'),
    gpsCoords:    $('gpsCoords'),
    locName:      $('locName'),
    locSub:       $('locSub'),
    tempNum:      $('tempNum'),
    feelsLike:    $('feelsLike'),
    rainChance:   $('rainChance'),
    rainBar:      $('rainBar'),
    humidity:     $('humidity'),
    windSpeed:    $('windSpeed'),
    windDirCard:  $('windDirCard'),
    windDirSub:   $('windDirSub'),
    adviceBox:    $('adviceBox'),
    adviceText:   $('adviceText'),
    roWind:       $('roWind'),
    roDir:        $('roDir'),
    roGust:       $('roGust'),
    roPress:      $('roPress'),
    hourly:       $('hourlyStrip'),
    daily:        $('dailyList'),
    stormLevel:   $('stormLevel'),
    stormScore:   $('stormScore'),
    stormMarker:  $('stormMarker'),
    stormFactors: $('stormFactors'),
    vegLevel:     $('vegLevel'),
    vegScore:     $('vegScore'),
    vegSub:       $('vegSub'),
    vegFactors:   $('vegFactors'),
    soilLayers:   $('soilLayers'),
    cropSelect:   $('cropSelect'),
    stageSelect:  $('stageSelect'),
    cropStatus:   $('cropStatus'),
    cropStatusText: $('cropStatusText'),
    cropMarker:   $('cropMarker'),
    cropMinLabel: $('cropMinLabel'),
    cropOptLabel: $('cropOptLabel'),
    cropMaxLabel: $('cropMaxLabel'),
    cropCurrentTemp: $('cropCurrentTemp'),
    cropHigh7:    $('cropHigh7'),
    cropLow7:     $('cropLow7'),
    cropSensitivity: $('cropSensitivity'),
    themeToggle:  $('themeToggle'),
    themeIcon:    $('themeIcon')
  };

  var map = null;
  var marker = null;
  var windLayer = null;
  var stormCircle = null;
  var currentPos = null;
  var currentData = null;

  var DEFAULT_LAT = 14.5995;
  var DEFAULT_LON = 120.9842;

  /* ------------------------------------------------------------------ */
  /*  Theme                                                              */
  /* ------------------------------------------------------------------ */

  var SUN_PATH = 'M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4';
  var SUN_CIRCLE = '<circle cx="12" cy="12" r="4.2"></circle>';
  var MOON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';

  function applyTheme(mode) {
    els.html.setAttribute('data-theme', mode);
    els.themeIcon.innerHTML = mode === 'dark' ? MOON_PATH : (SUN_CIRCLE + '<path d="' + SUN_PATH + '"></path>');
    try { localStorage.setItem('agriweather.theme', mode); } catch (e) {}
    setTimeout(function () { if (map) map.invalidateSize(); }, 60);
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('agriweather.theme'); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(saved);
  }

  els.themeToggle.addEventListener('click', function () {
    applyTheme(els.html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ------------------------------------------------------------------ */
  /*  Crop definitions                                                   */
  /* ------------------------------------------------------------------ */

  var CROPS = [
    {
      id: 'rice', name: 'Rice (Palay)',
      min: 15, optMin: 20, optMax: 35, max: 40,
      sensitivity: { seedling: 'Moderate', vegetative: 'Moderate', flowering: 'Very High', maturity: 'Low' }
    },
    {
      id: 'corn', name: 'Corn (Mais)',
      min: 10, optMin: 21, optMax: 30, max: 38,
      sensitivity: { seedling: 'Low', vegetative: 'Moderate', flowering: 'Very High', maturity: 'Low' }
    },
    {
      id: 'coconut', name: 'Coconut (Niyog)',
      min: 15, optMin: 24, optMax: 29, max: 34,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'Moderate', maturity: 'Low' }
    },
    {
      id: 'banana', name: 'Banana (Saging)',
      min: 16, optMin: 25, optMax: 30, max: 37,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'High', maturity: 'Low' }
    },
    {
      id: 'sugarcane', name: 'Sugarcane (Tubo)',
      min: 12, optMin: 20, optMax: 32, max: 40,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'Moderate', maturity: 'Low' }
    },
    {
      id: 'tomato', name: 'Tomato (Kamatis)',
      min: 10, optMin: 18, optMax: 26, max: 32,
      sensitivity: { seedling: 'High', vegetative: 'Moderate', flowering: 'Very High', maturity: 'Moderate' }
    },
    {
      id: 'eggplant', name: 'Eggplant (Talong)',
      min: 12, optMin: 18, optMax: 26, max: 34,
      sensitivity: { seedling: 'High', vegetative: 'Moderate', flowering: 'High', maturity: 'Moderate' }
    },
    {
      id: 'okra', name: 'Okra',
      min: 14, optMin: 18, optMax: 30, max: 38,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'Moderate', maturity: 'Low' }
    }
  ];

  var CROP_MAP = {};
  CROPS.forEach(function (c) { CROP_MAP[c.id] = c; });

  function populateCrops() {
    var html = '';
    for (var i = 0; i < CROPS.length; i++) {
      html += '<option value="' + CROPS[i].id + '">' + CROPS[i].name + '</option>';
    }
    els.cropSelect.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /*  Utilities                                                          */
  /* ------------------------------------------------------------------ */

  var CARDINALS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  function cardinal(deg) {
    var d = ((Number(deg) % 360) + 360) % 360;
    return CARDINALS[Math.round(d / 22.5) % 16];
  }

  function fmtCoord(v, isLat) {
    var dir = v >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
    return Math.abs(v).toFixed(4) + '\u00B0 ' + dir;
  }

  function hourLabel(iso) {
    var h = parseInt(String(iso).slice(11, 13), 10);
    if (!Number.isFinite(h)) return iso;
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return h12 + ' ' + ampm;
  }

  function dayLabel(iso, idx) {
    if (idx === 0) return 'Today';
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  var WMO = {
    0:'Clear', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
    45:'Fog', 48:'Freezing fog',
    51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle',
    56:'Freezing drizzle', 57:'Freezing drizzle',
    61:'Light rain', 63:'Rain', 65:'Heavy rain',
    66:'Freezing rain', 67:'Freezing rain',
    71:'Light snow', 73:'Snow', 75:'Heavy snow', 77:'Snow grains',
    80:'Rain showers', 81:'Rain showers', 82:'Violent showers',
    85:'Snow showers', 86:'Snow showers',
    95:'Thunderstorm', 96:'Storm with hail', 99:'Storm with hail'
  };
  function wmoText(c) { return WMO[c] || 'Unknown'; }

  /* ------------------------------------------------------------------ */
  /*  Wind particle layer                                                */
  /* ------------------------------------------------------------------ */

  function WindParticleLayer(map) {
    this.map = map;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'wind-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.windDir = 0;
    this.windSpeed = 0;
    this.particles = [];
    this.running = true;

    map.getContainer().appendChild(this.canvas);

    var self = this;
    this._onResize = function () { self.resize(); };
    map.on('resize', this._onResize);

    this.resize();

    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  WindParticleLayer.prototype.resize = function () {
    var size = this.map.getSize();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = size.x;
    this.h = size.y;
    this.canvas.width  = Math.max(1, this.w * dpr);
    this.canvas.height = Math.max(1, this.h * dpr);
    this.canvas.style.width  = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._spawnParticles();
  };

  WindParticleLayer.prototype._spawnParticles = function () {
    var target = Math.floor((this.w * this.h) / 3200);
    var count = Math.max(180, Math.min(850, target));
    this.particles = [];
    for (var i = 0; i < count; i++) this.particles.push(this._newParticle());
  };

  WindParticleLayer.prototype._newParticle = function () {
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      px: 0, py: 0,
      age: 0,
      life: 50 + Math.random() * 90,
      speedVar: 0.6 + Math.random() * 0.8,
      width: 0.6 + Math.random() * 1.2
    };
  };

  WindParticleLayer.prototype.setWind = function (dir, speed) {
    this.windDir = Number(dir) || 0;
    this.windSpeed = Number(speed) || 0;
  };

  WindParticleLayer.prototype._tick = function () {
    if (!this.running) return;
    this._step();
    requestAnimationFrame(this._tick);
  };

  WindParticleLayer.prototype._step = function () {
    var ctx = this.ctx;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'source-over';

    var toRad = ((this.windDir + 180) * Math.PI) / 180;
    var dx = Math.sin(toRad);
    var dy = -Math.cos(toRad);
    var base = Math.max(0.35, Math.min(2.8, this.windSpeed * 0.06));

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.px = p.x;
      p.py = p.y;

      var v = base * p.speedVar;
      p.x += dx * v;
      p.y += dy * v;
      p.age++;

      var lifeFactor = 1 - p.age / p.life;
      var alpha = 0.55 * Math.max(0, lifeFactor);

      if (alpha > 0.02) {
        ctx.strokeStyle = 'rgba(15,118,110,' + alpha.toFixed(3) + ')';
        ctx.lineWidth = p.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      if (p.age > p.life ||
          p.x < -20 || p.x > this.w + 20 ||
          p.y < -20 || p.y > this.h + 20) {
        this.particles[i] = this._newParticle();
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Map init — OpenStreetMap standard tiles (no key, works in Leaflet)*/
  /* ------------------------------------------------------------------ */

  function initMap(lat, lon) {
    if (!map) {
      map = L.map('map', {
        zoomControl: true,
        attributionControl: true,
        zoomSnap: 0.5
      }).setView([lat, lon], 9);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      windLayer = new WindParticleLayer(map);

      var gpsIcon = L.divIcon({
        className: 'gps-marker',
        html: '<div class="gps-dot"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      marker = L.marker([lat, lon], { icon: gpsIcon }).addTo(map);
    } else {
      map.setView([lat, lon], map.getZoom() || 9);
      if (marker) marker.setLatLng([lat, lon]);
    }

    setTimeout(function () { map.invalidateSize(); }, 120);
  }

  function updateStormCircle(lat, lon, risk) {
    if (!map) return;

    var radius = 25000 + risk.score * 1200;
    var color =
      risk.level === 'severe' ? '#b91c1c' :
      risk.level === 'high'   ? '#ea580c' :
      risk.level === 'moderate' ? '#ca8a04' :
                                 '#15803d';

    if (!stormCircle) {
      stormCircle = L.circle([lat, lon], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.07,
        weight: 1.5,
        dashArray: '5 7',
        interactive: false
      }).addTo(map);
    } else {
      stormCircle.setLatLng([lat, lon]);
      stormCircle.setRadius(radius);
      stormCircle.setStyle({ color: color, fillColor: color });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Fetch helpers                                                      */
  /* ------------------------------------------------------------------ */

  function fetchWeather(lat, lon) {
    return fetch('/api/weather?lat=' + lat + '&lon=' + lon).then(function (r) {
      if (!r.ok) throw new Error('Weather service returned ' + r.status);
      return r.json();
    }).then(function (data) {
      if (data && data.error) throw new Error(data.error);
      return data;
    });
  }

  function reverseGeocode(lat, lon) {
    return fetch('/api/reverse?lat=' + lat + '&lon=' + lon)
      .then(function (r) { return r.json(); })
      .catch(function () { return { name: 'Your location', region: '', country: '' }; });
  }

  function findHourIndex(data) {
    if (!data || !data.hourly || !data.current) return 0;
    var key = String(data.current.time).slice(0, 13);
    var arr = data.hourly.time;
    for (var i = 0; i < arr.length; i++) {
      if (String(arr[i]).slice(0, 13) === key) return i;
    }
    return 0;
  }

  function safeAvg(arr, a, b) {
    var sum = 0, n = 0;
    for (var i = a; i < b; i++) {
      if (Number.isFinite(arr[i])) { sum += arr[i]; n++; }
    }
    return n ? sum / n : 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Vegetation Condition Index                                         */
  /* ------------------------------------------------------------------ */

  function computeVegetation(data) {
    var h = data.hourly;
    var idx = findHourIndex(data);
    var end = Math.min(idx + 24, h.time.length);

    var sfc  = safeAvg(h.soil_moisture_0_to_1cm, idx, end);
    var mid1 = safeAvg(h.soil_moisture_1_to_3cm, idx, end);
    var mid2 = safeAvg(h.soil_moisture_3_to_9cm, idx, end);
    var deep = safeAvg(h.soil_moisture_9_to_27cm, idx, end);
    var rootMoisture = (sfc * 0.20 + mid1 * 0.25 + mid2 * 0.30 + deep * 0.25);

    var st6  = safeAvg(h.soil_temperature_6cm, idx, end);
    var st18 = safeAvg(h.soil_temperature_18cm, idx, end);
    var soilTemp = (st6 * 0.6 + st18 * 0.4);

    var rain24 = 0;
    var et24 = 0;
    for (var i = idx; i < end; i++) {
      rain24 += (h.precipitation[i] || 0);
      et24 += (h.evapotranspiration[i] || 0);
    }
    var balance = rain24 - et24;

    var moistScore;
    if (rootMoisture < 0.10)      moistScore = 5;
    else if (rootMoisture < 0.18) moistScore = 25 + (rootMoisture - 0.10) / 0.08 * 25;
    else if (rootMoisture < 0.28) moistScore = 50 + (rootMoisture - 0.18) / 0.10 * 35;
    else if (rootMoisture <= 0.38) moistScore = 85 + (rootMoisture - 0.28) / 0.10 * 15;
    else if (rootMoisture <= 0.45) moistScore = 100 - (rootMoisture - 0.38) / 0.07 * 25;
    else                           moistScore = Math.max(10, 75 - (rootMoisture - 0.45) / 0.10 * 40);

    var tempScore;
    if (soilTemp < 12)      tempScore = 5;
    else if (soilTemp < 20) tempScore = 20 + (soilTemp - 12) / 8 * 45;
    else if (soilTemp <= 30) tempScore = 65 + (soilTemp - 20) / 10 * 35;
    else if (soilTemp <= 36) tempScore = 100 - (soilTemp - 30) / 6 * 25;
    else                     tempScore = Math.max(5, 75 - (soilTemp - 36) / 6 * 40);

    var balScore;
    if (balance < -25)      balScore = 5;
    else if (balance < -8)  balScore = 20 + (balance + 25) / 17 * 45;
    else if (balance <= 8)  balScore = 65 + (balance + 8) / 16 * 30;
    else if (balance <= 30) balScore = 95 - (balance - 8) / 22 * 25;
    else                     balScore = Math.max(20, 70 - (balance - 30) / 40 * 40);

    var total = moistScore * 0.45 + tempScore * 0.30 + balScore * 0.25;

    var level, levelText;
    if (total >= 75)      { level = 'optimal';  levelText = 'Optimal'; }
    else if (total >= 50) { level = 'fair';     levelText = 'Fair'; }
    else if (total >= 25) { level = 'stressed'; levelText = 'Stressed'; }
    else                  { level = 'critical'; levelText = 'Critical'; }

    return {
      score: Math.round(total),
      level: level,
      levelText: levelText,
      rootMoisture: rootMoisture,
      soilTemp: soilTemp,
      rain24: rain24,
      et24: et24,
      balance: balance,
      factors: [
        { name: 'Root-zone moisture', value: (rootMoisture * 100).toFixed(1) + ' %vol', score: Math.round(moistScore) },
        { name: 'Soil temperature',   value: soilTemp.toFixed(1) + ' °C',               score: Math.round(tempScore) },
        { name: 'Water balance (24h)', value: (balance >= 0 ? '+' : '') + balance.toFixed(1) + ' mm', score: Math.round(balScore) },
        { name: 'Rain / ET (24h)',    value: rain24.toFixed(1) + ' / ' + et24.toFixed(1) + ' mm', score: Math.round(balScore) }
      ]
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Soil profile rendering                                             */
  /* ------------------------------------------------------------------ */

  function soilColor(v) {
    if (v < 0.10) return '#dc2626';
    if (v < 0.18) return '#f59e0b';
    if (v < 0.28) return '#14b8a6';
    if (v <= 0.38) return '#0f766e';
    return '#0369a1';
  }

  function renderSoil(data) {
    var h = data.hourly;
    var idx = findHourIndex(data);
    var end = Math.min(idx + 24, h.time.length);

    var layers = [
      { label: '0–1 cm',   key: 'soil_moisture_0_to_1cm'  },
      { label: '1–3 cm',   key: 'soil_moisture_1_to_3cm'  },
      { label: '3–9 cm',   key: 'soil_moisture_3_to_9cm'  },
      { label: '9–27 cm',  key: 'soil_moisture_9_to_27cm' }
    ];

    var html = '';
    for (var i = 0; i < layers.length; i++) {
      var v = safeAvg(h[layers[i].key], idx, end);
      var pct = clamp(v / 0.50 * 100, 2, 100);
      var color = soilColor(v);

      html += '<div class="soil-layer">';
      html +=   '<div class="soil-depth">' + layers[i].label + '</div>';
      html +=   '<div class="soil-track"><div class="soil-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
      html +=   '<div class="soil-value">' + (v * 100).toFixed(1) + ' %vol</div>';
      html += '</div>';
    }

    var temps = [
      { label: '0 cm',  key: 'soil_temperature_0cm'  },
      { label: '6 cm',  key: 'soil_temperature_6cm'  },
      { label: '18 cm', key: 'soil_temperature_18cm' },
      { label: '54 cm', key: 'soil_temperature_54cm' }
    ];

    for (var j = 0; j < temps.length; j++) {
      var t = safeAvg(h[temps[j].key], idx, end);
      html += '<div class="soil-temp-row">';
      html +=   '<div class="soil-depth">' + temps[j].label + '</div>';
      html +=   '<div class="soil-track"><div class="soil-fill" style="width:' + clamp((t + 5) / 50 * 100, 4, 100) + '%;background:linear-gradient(90deg,#38bdf8,#fbbf24)"></div></div>';
      html +=   '<div class="soil-value">' + t.toFixed(1) + ' °C</div>';
      html += '</div>';
    }

    els.soilLayers.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /*  Vegetation rendering                                               */
  /* ------------------------------------------------------------------ */

  function renderVegetation(veg) {
    els.vegScore.textContent = veg.score;
    els.vegLevel.textContent = veg.levelText;

    var color =
      veg.level === 'optimal'  ? 'var(--ok)' :
      veg.level === 'fair'     ? '#ca8a04' :
      veg.level === 'stressed' ? 'var(--warn)' :
                                 '#b91c1c';

    els.vegLevel.style.color = color;

    var html = '';
    for (var i = 0; i < veg.factors.length; i++) {
      var f = veg.factors[i];
      var fColor =
        f.score >= 75 ? 'var(--ok)' :
        f.score >= 50 ? '#ca8a04' :
        f.score >= 25 ? 'var(--warn)' :
                        '#b91c1c';

      html += '<div class="veg-factor">';
      html +=   '<div class="fname">' + f.name + '</div>';
      html +=   '<div class="fvalue">' + f.value + '</div>';
      html +=   '<div class="factor-bar"><span style="width:' + f.score + '%;background:' + fColor + '"></span></div>';
      html += '</div>';
    }
    els.vegFactors.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /*  Crop suitability                                                   */
  /* ------------------------------------------------------------------ */

  function evaluateCrop(cropId, stage, data) {
    var crop = CROP_MAP[cropId];
    if (!crop) return null;

    var cur = data.current.temperature_2m;
    var daily = data.daily;

    var high7 = -Infinity, low7 = Infinity;
    for (var i = 0; i < daily.temperature_2m_max.length; i++) {
      if (daily.temperature_2m_max[i] > high7) high7 = daily.temperature_2m_max[i];
      if (daily.temperature_2m_min[i] < low7) low7 = daily.temperature_2m_min[i];
    }

    var sensLabel = crop.sensitivity[stage] || 'Moderate';
    var sensFactor = sensLabel === 'Very High' ? 0.65 :
                     sensLabel === 'High'      ? 0.78 :
                     sensLabel === 'Moderate'  ? 0.90 :
                                                1.00;

    var mid = (crop.optMin + crop.optMax) / 2;
    var half = (crop.optMax - crop.optMin) / 2;
    var effMin = mid - half * sensFactor;
    var effMax = mid + half * sensFactor;

    var status, message;

    if (cur < effMin) {
      var deficit = effMin - cur;
      status = deficit > 4 ? 'bad' : 'warn';
      message = '<strong>Below optimal range</strong> for ' + crop.name +
                ' at ' + stage + ' stage. Current ' + cur.toFixed(1) + ' °C is ' +
                deficit.toFixed(1) + ' °C below the comfortable band.';
    } else if (cur > effMax) {
      var excess = cur - effMax;
      status = excess > 4 ? 'bad' : 'warn';
      message = '<strong>Above optimal range</strong> for ' + crop.name +
                ' at ' + stage + ' stage. Current ' + cur.toFixed(1) + ' °C is ' +
                excess.toFixed(1) + ' °C above the comfortable band.';
    } else {
      status = 'ok';
      message = '<strong>Within optimal range</strong> for ' + crop.name +
                ' at ' + stage + ' stage. Current ' + cur.toFixed(1) + ' °C is suitable.';
    }

    if (high7 > crop.max) {
      message += ' Forecast high of ' + high7.toFixed(0) + ' °C exceeds the crop maximum of ' + crop.max + ' °C.';
      if (status === 'ok') status = 'warn';
    }
    if (low7 < crop.min) {
      message += ' Forecast low of ' + low7.toFixed(0) + ' °C is below the crop minimum of ' + crop.min + ' °C.';
      if (status === 'ok') status = 'warn';
    }

    var lo = crop.min - 4;
    var hi = crop.max + 4;
    var pct = clamp((cur - lo) / (hi - lo) * 100, 2, 98);

    return {
      crop: crop,
      status: status,
      message: message,
      markerPct: pct,
      current: cur,
      high7: high7,
      low7: low7,
      sensLabel: sensLabel
    };
  }

  function renderCrop(data) {
    var cropId = els.cropSelect.value || 'rice';
    var stage = els.stageSelect.value || 'vegetative';
    var result = evaluateCrop(cropId, stage, data);
    if (!result) return;

    els.cropStatus.setAttribute('data-status', result.status);
    els.cropStatusText.innerHTML = result.message;

    els.cropMarker.style.left = result.markerPct + '%';
    els.cropMinLabel.textContent = result.crop.min + ' °C';
    els.cropMaxLabel.textContent = result.crop.max + ' °C';

    els.cropCurrentTemp.textContent = result.current.toFixed(1) + ' °C';
    els.cropHigh7.textContent = result.high7.toFixed(0) + ' °C';
    els.cropLow7.textContent = result.low7.toFixed(0) + ' °C';
    els.cropSensitivity.textContent = result.sensLabel;
  }

  /* ------------------------------------------------------------------ */
  /*  Storm Risk Index                                                   */
  /* ------------------------------------------------------------------ */

  function computeStormRisk(data) {
    var cur = data.current;
    var hourly = data.hourly;
    var idx = findHourIndex(data);

    var end72 = Math.min(idx + 72, hourly.wind_speed_10m.length);
    var peakWind = cur.wind_speed_10m;
    var peakGust = cur.wind_gusts_10m || 0;
    for (var i = idx; i < end72; i++) {
      if (hourly.wind_speed_10m[i] > peakWind) peakWind = hourly.wind_speed_10m[i];
      if (hourly.wind_gusts_10m && hourly.wind_gusts_10m[i] > peakGust) peakGust = hourly.wind_gusts_10m[i];
    }

    var pressureNow = cur.pressure_msl;
    var pressureMin24 = pressureNow;
    var end24 = Math.min(idx + 24, hourly.pressure_msl.length);
    for (var j = idx; j < end24; j++) {
      if (hourly.pressure_msl[j] < pressureMin24) pressureMin24 = hourly.pressure_msl[j];
    }
    var pressureDrop = Math.max(0, pressureNow - pressureMin24);

    var rain24 = 0;
    for (var k = idx; k < end24; k++) rain24 += (hourly.precipitation[k] || 0);

    var windScore  = clamp((peakWind - 25) / (130 - 25) * 100, 0, 100);
    var gustScore  = clamp((peakGust - 35) / (200 - 35) * 100, 0, 100);
    var pressScore = clamp((1005 - pressureMin24) / (1005 - 960) * 100, 0, 100);
    var dropScore  = clamp((pressureDrop - 2) / (20 - 2) * 100, 0, 100);
    var rainScore  = clamp((rain24 - 25) / (200 - 25) * 100, 0, 100);

    var total = windScore * 0.25 + gustScore * 0.20 + pressScore * 0.25 +
                dropScore * 0.15 + rainScore * 0.15;

    var level, levelText;
    if (total >= 75)      { level = 'severe';   levelText = 'Severe'; }
    else if (total >= 50) { level = 'high';     levelText = 'High'; }
    else if (total >= 25) { level = 'moderate'; levelText = 'Moderate'; }
    else                  { level = 'low';      levelText = 'Low'; }

    return {
      score: Math.round(total),
      level: level,
      levelText: levelText,
      factors: [
        { name: 'Peak wind (72h)',       value: Math.round(peakWind) + ' km/h',     score: Math.round(windScore)  },
        { name: 'Peak gusts (72h)',      value: Math.round(peakGust) + ' km/h',     score: Math.round(gustScore)  },
        { name: 'Lowest pressure (24h)', value: Math.round(pressureMin24) + ' hPa', score: Math.round(pressScore) },
        { name: 'Pressure drop (24h)',   value: pressureDrop.toFixed(1) + ' hPa',   score: Math.round(dropScore)  },
        { name: 'Rainfall (24h)',        value: Math.round(rain24) + ' mm',         score: Math.round(rainScore)  }
      ]
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Farm advisory                                                      */
  /* ------------------------------------------------------------------ */

  function buildAdvice(data, risk, veg) {
    var cur = data.current;
    var hourly = data.hourly;
    var idx = findHourIndex(data);

    var maxRain6 = 0;
    var end = Math.min(idx + 6, hourly.precipitation_probability.length);
    for (var i = idx; i < end; i++) {
      if (hourly.precipitation_probability[i] > maxRain6) {
        maxRain6 = hourly.precipitation_probability[i];
      }
    }

    var temp = cur.temperature_2m;
    var wind = cur.wind_speed_10m;
    var humidity = cur.relative_humidity_2m;

    var tips = [];
    var level = 'ok';

    if (risk && (risk.level === 'high' || risk.level === 'severe')) {
      level = 'warn';
      tips.push('Storm risk is elevated. Secure seedlings, trellises, and light structures. Harvest mature crops if safe to do so.');
      tips.push('Move harvested produce to higher ground and cover stored grain to prevent rain damage.');
    } else if (risk && risk.level === 'moderate') {
      level = 'warn';
      tips.push('Storm risk is moderate. Inspect drainage and clear canals before rain arrives.');
    }

    if (veg) {
      if (veg.rootMoisture < 0.15) {
        level = 'warn';
        tips.push('Root-zone soil moisture is low. Irrigate early morning or late afternoon to reduce evaporation loss.');
      } else if (veg.rootMoisture > 0.42) {
        level = 'warn';
        tips.push('Soil is waterlogged. Check field drainage to prevent root rot and nutrient leaching.');
      }
      if (veg.soilTemp < 18) {
        tips.push('Soil temperature is cool. Root activity and nutrient uptake will be slow.');
      } else if (veg.soilTemp > 34) {
        tips.push('Soil is very warm. Mulch to protect roots and reduce moisture loss.');
      }
    }

    if (maxRain6 >= 60) {
      if (level === 'ok') level = 'rain';
      tips.push('Rain is likely within the next 6 hours. Postpone pesticide spraying, fertilizer application, and harvesting.');
    } else if (maxRain6 >= 30) {
      if (level === 'ok') level = 'rain';
      tips.push('Scattered rain is possible. Keep an eye on the sky before starting field work.');
    } else if (level === 'ok') {
      tips.push('Low rain chance in the next 6 hours. A good window for spraying and field work.');
    }

    if (wind >= 20) {
      level = 'warn';
      tips.push('Strong winds above 20 km/h. Avoid pesticide spraying — drift risk is high.');
    } else if (wind >= 12) {
      if (level === 'ok') level = 'warn';
      tips.push('Moderate wind. Spray with caution, using coarse droplets and low pressure.');
    } else if (level === 'ok') {
      tips.push('Wind is calm to light. Ideal conditions for spraying.');
    }

    if (temp >= 34) {
      if (level === 'ok') level = 'warn';
      tips.push('High heat stress. Irrigate early morning or late afternoon to protect crops.');
    }

    if (humidity >= 85 && temp >= 24 && temp <= 32) {
      if (level === 'ok') level = 'warn';
      tips.push('High humidity favors fungal disease. Inspect crops and consider preventive treatment.');
    }

    return { level: level, tips: tips };
  }

  /* ------------------------------------------------------------------ */
  /*  Renderers                                                          */
  /* ------------------------------------------------------------------ */

  function renderCurrent(data) {
    var cur = data.current;

    els.tempNum.textContent   = Math.round(cur.temperature_2m);
    els.feelsLike.textContent = Math.round(cur.apparent_temperature) + '\u00B0C';
    els.humidity.textContent  = Math.round(cur.relative_humidity_2m);
    els.windSpeed.textContent = Math.round(cur.wind_speed_10m);

    var dir = Math.round(cur.wind_direction_10m);
    els.windDirCard.textContent = cardinal(dir);
    els.windDirSub.textContent  = dir + '\u00B0 from north';

    els.roWind.textContent  = Math.round(cur.wind_speed_10m) + ' km/h';
    els.roDir.textContent   = cardinal(dir) + ' \u00B7 ' + dir + '\u00B0';
    els.roGust.textContent  = Math.round(cur.wind_gusts_10m) + ' km/h';
    els.roPress.textContent = Math.round(cur.pressure_msl) + ' hPa';

    var idx = findHourIndex(data);
    var rainNow = data.hourly.precipitation_probability[idx] || 0;
    els.rainChance.textContent = Math.round(rainNow);
    els.rainBar.style.width = Math.min(100, rainNow) + '%';

    if (windLayer) {
      windLayer.setWind(cur.wind_direction_10m, cur.wind_speed_10m);
    }
  }

  function renderStorm(risk) {
    els.stormScore.textContent = risk.score;
    els.stormLevel.textContent = risk.levelText;

    var color =
      risk.level === 'severe'   ? '#b91c1c' :
      risk.level === 'high'     ? '#ea580c' :
      risk.level === 'moderate' ? '#ca8a04' :
                                  '#15803d';

    var bg =
      risk.level === 'severe'   ? 'rgba(185,28,28,.14)' :
      risk.level === 'high'     ? 'rgba(234,88,12,.14)' :
      risk.level === 'moderate' ? 'rgba(202,138,4,.14)' :
                                  'rgba(21,128,61,.14)';

    els.stormLevel.style.color = color;
    els.stormLevel.style.background = bg;

    els.stormMarker.style.left = clamp(risk.score, 0, 100) + '%';

    var html = '';
    for (var i = 0; i < risk.factors.length; i++) {
      var f = risk.factors[i];
      var fColor =
        f.score >= 75 ? '#b91c1c' :
        f.score >= 50 ? '#ea580c' :
        f.score >= 25 ? '#ca8a04' :
                        '#15803d';

      html += '<div class="veg-factor">';
      html +=   '<div class="fname">' + f.name + '</div>';
      html +=   '<div class="fvalue">' + f.value + '</div>';
      html +=   '<div class="factor-bar"><span style="width:' + f.score + '%;background:' + fColor + '"></span></div>';
      html += '</div>';
    }
    els.stormFactors.innerHTML = html;
  }

  function renderHourly(data) {
    var idx = findHourIndex(data);
    var count = Math.min(12, data.hourly.time.length - idx);
    var html = '';

    for (var i = 0; i < count; i++) {
      var k = idx + i;
      var time = data.hourly.time[k];
      var temp = Math.round(data.hourly.temperature_2m[k]);
      var rain = Math.round(data.hourly.precipitation_probability[k] || 0);
      var wind = Math.round(data.hourly.wind_speed_10m[k]);
      var isNow = i === 0;

      html += '<div class="hour-card' + (isNow ? ' now' : '') + '">';
      html +=   '<div class="hour-time">' + (isNow ? 'Now' : hourLabel(time)) + '</div>';
      html +=   '<div class="hour-temp">' + temp + '\u00B0</div>';
      html +=   '<div class="hour-rain">';
      html +=     '<div class="bar"><span style="width:' + Math.min(100, rain) + '%"></span></div>';
      html +=     '<span>' + rain + '%</span>';
      html +=   '</div>';
      html +=   '<div class="hour-wind">' + wind + ' km/h</div>';
      html += '</div>';
    }

    els.hourly.innerHTML = html;
  }

  function renderDaily(data) {
    var d = data.daily;
    var html = '';

    for (var i = 0; i < d.time.length; i++) {
      var name = dayLabel(d.time[i], i);
      var rain = Math.round(d.precipitation_probability_max[i] || 0);
      var tmax = Math.round(d.temperature_2m_max[i]);
      var tmin = Math.round(d.temperature_2m_min[i]);
      var wmax = Math.round(d.wind_speed_10m_max[i]);
      var code = d.weather_code[i];

      html += '<div class="day-row">';
      html +=   '<div class="day-name">' + name +
                  '<span class="sub">' + wmoText(code) + '</span></div>';
      html +=   '<div class="day-rain">' +
                  '<div class="bar"><span style="width:' + Math.min(100, rain) + '%"></span></div>' +
                  '<span>' + rain + '%</span></div>';
      html +=   '<div class="day-temp">' +
                  '<span class="max">' + tmax + '\u00B0</span>' +
                  '<span class="min">' + tmin + '\u00B0</span></div>';
      html +=   '<div class="day-wind">' + wmax + ' km/h</div>';
      html += '</div>';
    }

    els.daily.innerHTML = html;
  }

  function renderAdvice(data, risk, veg) {
    var a = buildAdvice(data, risk, veg);
    els.adviceBox.setAttribute('data-level', a.level);

    var html = '<ul>';
    for (var i = 0; i < a.tips.length; i++) {
      html += '<li>' + a.tips[i] + '</li>';
    }
    html += '</ul>';
    els.adviceText.innerHTML = html;
  }

  function renderAll(data) {
    renderCurrent(data);

    var veg = computeVegetation(data);
    renderVegetation(veg);
    renderSoil(data);

    var risk = computeStormRisk(data);
    renderStorm(risk);

    renderCrop(data);
    renderHourly(data);
    renderDaily(data);
    renderAdvice(data, risk, veg);

    if (currentPos) {
      updateStormCircle(currentPos.lat, currentPos.lon, risk);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Main load                                                          */
  /* ------------------------------------------------------------------ */

  function loadAll(lat, lon, label, sub) {
    els.loading.style.display = 'grid';
    els.error.style.display = 'none';
    els.content.style.display = 'none';

    els.gpsCoords.textContent = fmtCoord(lat, true) + ' \u00B7 ' + fmtCoord(lon, false);

    fetchWeather(lat, lon).then(function (weather) {
      currentData = weather;
      currentPos = { lat: lat, lon: lon };

      els.locName.textContent = label || 'Your location';
      els.locSub.textContent  = sub || (fmtCoord(lat, true) + ' \u00B7 ' + fmtCoord(lon, false));

      els.loading.style.display = 'none';
      els.content.style.display = 'block';

      setTimeout(function () { initMap(lat, lon); }, 30);
      renderAll(weather);

      try {
        localStorage.setItem('agriweather.pos', JSON.stringify({ lat: lat, lon: lon }));
      } catch (e) {}

      if (!label) {
        reverseGeocode(lat, lon).then(function (place) {
          if (!place || !place.name) return;
          els.locName.textContent = place.name;

          var parts = [];
          if (place.region) parts.push(place.region);
          if (place.country && place.country !== 'Philippines') parts.push(place.country);
          if (weather.timezone) parts.push(String(weather.timezone).replace(/_/g, ' '));
          els.locSub.textContent = parts.filter(Boolean).join(' \u00B7 ');
        });
      }
    }).catch(function (err) {
      els.loading.style.display = 'none';
      els.error.style.display = 'block';
      els.error.textContent =
        'Unable to load weather data: ' + (err.message || 'Unknown error') +
        '. Please check your connection and refresh the page.';
    });
  }

  /* ------------------------------------------------------------------ */
  /*  GPS bootstrap                                                      */
  /* ------------------------------------------------------------------ */

  function start() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('agriweather.pos') || 'null'); } catch (e) { saved = null; }

    if (!navigator.geolocation) {
      loadAll(DEFAULT_LAT, DEFAULT_LON, 'Manila', 'Metro Manila, Philippines');
      return;
    }

    els.loading.style.display = 'grid';
    els.gpsCoords.textContent = 'Acquiring GPS signal';

    var resolved = false;

    var timeout = setTimeout(function () {
      if (resolved) return;
      resolved = true;
      loadAll(DEFAULT_LAT, DEFAULT_LON, 'Manila', 'Metro Manila, Philippines');
    }, 9000);

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        var la = pos.coords.latitude;
        var lo = pos.coords.longitude;
        var acc = Math.round(pos.coords.accuracy);
        loadAll(la, lo, null, 'GPS accuracy \u00B1' + acc + ' m');
      },
      function () {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        if (saved && typeof saved.lat === 'number' && typeof saved.lon === 'number') {
          loadAll(saved.lat, saved.lon, 'Last known location', 'GPS unavailable \u00B7 using last saved position');
        } else {
          loadAll(DEFAULT_LAT, DEFAULT_LON, 'Manila', 'Metro Manila, Philippines \u00B7 GPS unavailable');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Crop change handlers                                               */
  /* ------------------------------------------------------------------ */

  els.cropSelect.addEventListener('change', function () {
    if (currentData) renderCrop(currentData);
  });

  els.stageSelect.addEventListener('change', function () {
    if (currentData) renderCrop(currentData);
  });

  /* ------------------------------------------------------------------ */
  /*  Auto-refresh every 10 minutes                                      */
  /* ------------------------------------------------------------------ */

  setInterval(function () {
    if (!currentPos) return;
    fetchWeather(currentPos.lat, currentPos.lon).then(function (data) {
      currentData = data;
      renderAll(data);
    }).catch(function () {});
  }, 10 * 60 * 1000);

  /* ------------------------------------------------------------------ */
  /*  Responsive redraw                                                  */
  /* ------------------------------------------------------------------ */

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (windLayer) windLayer.resize();
    }, 160);
  });

  /* ------------------------------------------------------------------ */
  /*  Boot                                                               */
  /* ------------------------------------------------------------------ */

  populateCrops();
  initTheme();
  start();

})();
</script>
</body>
</html>`;

app.get('/', (_req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-cache');
  res.send(PAGE);
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error('[AgriWeather]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ┌────────────────────────────────────────────┐');
  console.log('  │  AGRIWEATHER                               │');
  console.log('  │  Philippine Farm Forecast                  │');
  console.log('  │  http://localhost:' + String(PORT).padEnd(25) + '│');
  console.log('  └────────────────────────────────────────────┘');
  console.log('');
});
'use strict';

/**
 * AGRIWEATHER — Philippine Farm Forecast
 * Zero-dependency Node.js server (built-in http + fetch).
 *
 *   node server.js
 *   -> http://localhost:3000
 *
 * External services (all free, no key):
 *   - Open-Meteo          weather + soil data
 *   - Nominatim           reverse geocoding
 *   - OpenStreetMap       map tiles
 *
 * Storm Watch is a heuristic risk indicator, not an official typhoon
 * forecast. Always follow PAGASA advisories.
 */

const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;

if (typeof fetch !== 'function') {
  console.error('[AgriWeather] Node.js 18+ is required (global fetch missing). You are on ' + process.version);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/*  In-memory cache                                                    */
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
/*  Response helper                                                    */
/* ------------------------------------------------------------------ */

function sendJSON(res, status, body, cacheSeconds) {
  if (res.headersSent) return;
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheSeconds ? 'public, max-age=' + cacheSeconds : 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(body));
}

/* ------------------------------------------------------------------ */
/*  API: reverse geocode                                               */
/* ------------------------------------------------------------------ */

async function handleReverse(u, res) {
  const lat = parseFloat(u.searchParams.get('lat'));
  const lon = parseFloat(u.searchParams.get('lon'));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return sendJSON(res, 400, { error: 'lat and lon are required' });
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

    sendJSON(res, 200, {
      name: name,
      region: a.state || a.region || '',
      country: a.country || ''
    }, 3600);
  } catch (err) {
    sendJSON(res, 200, {
      name: 'Your location', region: '', country: '',
      error: String(err.message || err)
    });
  }
}

/* ------------------------------------------------------------------ */
/*  API: weather forecast                                              */
/* ------------------------------------------------------------------ */

async function handleWeather(u, res) {
  const lat = parseFloat(u.searchParams.get('lat'));
  const lon = parseFloat(u.searchParams.get('lon'));

  if (
    !Number.isFinite(lat) || !Number.isFinite(lon) ||
    Math.abs(lat) > 90 || Math.abs(lon) > 180
  ) {
    return sendJSON(res, 400, { error: 'Valid lat and lon are required' });
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
    sendJSON(res, 200, data, 300);
  } catch (err) {
    sendJSON(res, 502, { error: String(err.message || err) });
  }
}

/* ------------------------------------------------------------------ */
/*  API: vegetation conditions (soil feed)                             */
/* ------------------------------------------------------------------ */

async function handleNdvi(u, res) {
  const lat = parseFloat(u.searchParams.get('lat'));
  const lon = parseFloat(u.searchParams.get('lon'));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return sendJSON(res, 400, { error: 'lat and lon are required' });
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
    sendJSON(res, 200, { source: 'soil-feed', data }, 1800);
  } catch (err) {
    sendJSON(res, 502, { error: String(err.message || err) });
  }
}

/* ------------------------------------------------------------------ */
/*  The UI                                                             */
/* ------------------------------------------------------------------ */

const PAGE = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>AgriWeather — Philippine Farm Forecast</title>
<meta name="theme-color" content="#0d9488" />
<meta name="description" content="Free weather, soil and crop-suitability forecast for Philippine farms. No API keys, no tracking." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; padding: 0; }
  [hidden] { display: none !important; }

  :root {
    --bg: #f3f6fa;
    --surface: #ffffff;
    --surface-2: #f7f9fc;
    --surface-3: #eef2f8;
    --border: #e4e9f1;
    --border-2: #cfd8e6;
    --ink: #0b1220;
    --ink-2: #1e293b;
    --muted: #5b6b83;
    --muted-2: #8c9bb2;
    --brand: #0d9488;
    --brand-2: #14b8a6;
    --brand-ink: #0f766e;
    --brand-soft: #e5f7f4;
    --rain: #0284c7;
    --rain-soft: #e0f2fe;
    --warn: #d97706;
    --warn-2: #ea580c;
    --warn-soft: #fff4e6;
    --danger: #dc2626;
    --danger-soft: #fee2e2;
    --ok: #15803d;
    --ok-soft: #e6f8ec;
    --track: #e6ebf3;
    --wind-rgb: 13, 148, 136;
    --radius-sm: 10px;
    --radius: 14px;
    --radius-lg: 20px;
    --radius-xl: 26px;
    --shadow-1: 0 1px 2px rgba(11,18,32,.05), 0 1px 3px rgba(11,18,32,.04);
    --shadow-2: 0 10px 26px -12px rgba(11,18,32,.20), 0 2px 8px rgba(11,18,32,.05);
    --shadow-3: 0 32px 64px -32px rgba(11,18,32,.34);
    --ring: 0 0 0 3px color-mix(in srgb, var(--brand) 28%, transparent);
    --map-filter: none;
    --ease: cubic-bezier(.2,.8,.2,1);
  }

  html[data-theme="dark"] {
    --bg: #070c15;
    --surface: #0f172a;
    --surface-2: #131d31;
    --surface-3: #1a2438;
    --border: #1e2b42;
    --border-2: #2c3b56;
    --ink: #e9eefb;
    --ink-2: #d3dcee;
    --muted: #8798b6;
    --muted-2: #6b7c9c;
    --brand: #14b8a6;
    --brand-2: #2dd4bf;
    --brand-ink: #5eead4;
    --brand-soft: rgba(20,184,166,.14);
    --rain: #38bdf8;
    --rain-soft: rgba(56,189,248,.13);
    --warn: #fbbf24;
    --warn-2: #fb923c;
    --warn-soft: rgba(251,146,60,.14);
    --danger: #f87171;
    --danger-soft: rgba(248,113,113,.14);
    --ok: #34d399;
    --ok-soft: rgba(52,211,153,.14);
    --track: #23314b;
    --wind-rgb: 45, 212, 191;
    --shadow-1: 0 1px 2px rgba(0,0,0,.5);
    --shadow-2: 0 14px 34px -16px rgba(0,0,0,.85), 0 2px 8px rgba(0,0,0,.4);
    --shadow-3: 0 32px 64px -32px rgba(0,0,0,.9);
    --map-filter: invert(1) hue-rotate(180deg) brightness(.9) contrast(.9);
  }

  html, body { height: 100%; }

  body {
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--ink);
    line-height: 1.5;
    font-size: 15px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    transition: background .35s var(--ease), color .35s var(--ease);
    overflow-x: hidden;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(820px 540px at 8% -12%, color-mix(in srgb, var(--brand) 12%, transparent), transparent 62%),
      radial-gradient(760px 520px at 102% -6%, color-mix(in srgb, var(--rain) 10%, transparent), transparent 58%);
  }

  .wrap { width: 100%; max-width: 1320px; margin: 0 auto; padding: 0 24px; }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 900;
    background: color-mix(in srgb, var(--surface) 86%, transparent);
    backdrop-filter: saturate(180%) blur(14px);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    border-bottom: 1px solid var(--border);
  }

  .topbar-in {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 66px;
  }

  .brand { display: flex; align-items: center; gap: 11px; min-width: 0; }

  .brand-mark {
    width: 36px; height: 36px;
    flex: 0 0 36px;
    display: grid; place-items: center;
    border-radius: 11px;
    color: #fff;
    background: linear-gradient(140deg, var(--brand-2), var(--brand-ink));
    box-shadow: 0 6px 16px -8px color-mix(in srgb, var(--brand) 90%, transparent);
  }

  .brand-text { display: flex; flex-direction: column; min-width: 0; }

  .brand-name {
    font-size: 15px; font-weight: 800; letter-spacing: -.01em;
    line-height: 1.15; color: var(--ink);
  }

  .brand-sub {
    font-size: 10px; font-weight: 600; letter-spacing: .13em;
    text-transform: uppercase; color: var(--muted-2); line-height: 1.3;
  }

  .topbar-actions { display: flex; align-items: center; gap: 8px; }

  .gps {
    display: inline-flex; align-items: center; gap: 8px;
    height: 34px; padding: 0 13px;
    border-radius: 999px;
    background: var(--brand-soft);
    border: 1px solid color-mix(in srgb, var(--brand) 26%, transparent);
    color: var(--brand-ink);
    font-size: 11.5px; font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: .01em;
    white-space: nowrap;
  }

  .gps-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--brand);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand) 55%, transparent);
    animation: ping 2.2s var(--ease) infinite;
    flex: 0 0 7px;
  }

  .gps[data-state="error"] { background: var(--warn-soft); border-color: color-mix(in srgb, var(--warn) 32%, transparent); color: var(--warn-2); }
  .gps[data-state="error"] .gps-dot { background: var(--warn-2); animation: none; }

  @keyframes ping {
    0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand) 55%, transparent); }
    70%  { box-shadow: 0 0 0 9px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  .icon-btn {
    width: 38px; height: 38px; flex: 0 0 38px;
    display: grid; place-items: center;
    border-radius: 11px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    transition: color .18s, border-color .18s, background .18s, transform .18s;
  }
  .icon-btn:hover { color: var(--brand); border-color: color-mix(in srgb, var(--brand) 45%, transparent); background: var(--brand-soft); }
  .icon-btn:active { transform: scale(.95); }
  .icon-btn:focus-visible { outline: none; box-shadow: var(--ring); }
  .icon-btn.is-busy svg { animation: spin .9s linear infinite; }

  @keyframes spin { to { transform: rotate(360deg); } }

  .shell { position: relative; z-index: 1; padding: 24px 0 64px; }

  .skeleton-grid { display: flex; flex-direction: column; gap: 18px; }

  .sk {
    border-radius: var(--radius-lg);
    background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 37%, var(--surface-2) 63%);
    background-size: 400% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border: 1px solid var(--border);
  }

  @keyframes shimmer {
    0%   { background-position: 100% 0; }
    100% { background-position: 0 0; }
  }

  .sk-hero { display: grid; grid-template-columns: 1fr 1.35fr; gap: 16px; }
  .sk-hero .sk { height: 360px; }
  .sk-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .sk-row .sk { height: 118px; }
  .sk-row2 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .sk-row2 .sk { height: 260px; }

  .error-card {
    display: flex; gap: 16px; align-items: flex-start;
    padding: 22px 24px;
    border-radius: var(--radius-lg);
    background: var(--danger-soft);
    border: 1px solid color-mix(in srgb, var(--danger) 35%, transparent);
    box-shadow: var(--shadow-1);
  }
  .error-icon { flex: 0 0 38px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; background: color-mix(in srgb, var(--danger) 16%, transparent); color: var(--danger); }
  .error-title { font-size: 15px; font-weight: 800; color: var(--ink); }
  .error-msg { font-size: 13.5px; color: var(--muted); margin-top: 4px; line-height: 1.6; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    height: 38px; padding: 0 16px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: var(--brand);
    color: #fff;
    font: inherit; font-size: 13px; font-weight: 700;
    cursor: pointer;
    transition: filter .18s, transform .18s, box-shadow .18s;
  }
  .btn:hover { filter: brightness(1.06); box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--brand) 90%, transparent); }
  .btn:active { transform: scale(.975); }
  .btn:focus-visible { outline: none; box-shadow: var(--ring); }
  .btn--ghost { background: var(--surface); color: var(--ink); border-color: var(--border-2); }
  .btn--ghost:hover { border-color: var(--brand); color: var(--brand-ink); background: var(--brand-soft); box-shadow: none; }

  .loc-bar {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .loc-name {
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 800;
    letter-spacing: -.025em;
    line-height: 1.15;
    color: var(--ink);
  }

  .loc-sub {
    font-size: 13px; font-weight: 500; color: var(--muted);
    margin-top: 5px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }

  .dot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--muted-2); }

  .stamp {
    display: inline-flex; align-items: center; gap: 7px;
    height: 30px; padding: 0 12px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: 11.5px; font-weight: 700; color: var(--muted);
    font-variant-numeric: tabular-nums;
    box-shadow: var(--shadow-1);
    white-space: nowrap;
  }
  .stamp b { color: var(--ink-2); font-weight: 700; }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, .92fr) minmax(0, 1.28fr);
    gap: 16px;
    align-items: stretch;
    margin-bottom: 14px;
  }

  .now-card {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-xl);
    padding: 24px 26px 22px;
    color: #fff;
    background: linear-gradient(150deg, #0f766e 0%, #0d9488 42%, #14b8a6 78%, #2dd4bf 100%);
    box-shadow: 0 24px 50px -28px rgba(13,148,136,.85), 0 2px 8px rgba(11,18,32,.06);
    display: flex; flex-direction: column;
    min-height: 360px;
  }

  html[data-theme="dark"] .now-card {
    background: linear-gradient(150deg, #0b3b3a 0%, #0d5c56 45%, #0f766e 80%, #0d9488 100%);
    box-shadow: 0 24px 50px -28px rgba(0,0,0,.9);
  }

  .now-card::before {
    content: "";
    position: absolute;
    top: -110px; right: -90px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.24), transparent 68%);
    pointer-events: none;
  }

  .now-card::after {
    content: "";
    position: absolute;
    bottom: -140px; left: -70px;
    width: 280px; height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.12), transparent 70%);
    pointer-events: none;
  }

  .now-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; position: relative; z-index: 1;
  }

  .kicker {
    font-size: 10px; font-weight: 800; letter-spacing: .17em;
    text-transform: uppercase; opacity: .82;
  }

  .now-cond {
    font-size: 12px; font-weight: 700;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.18);
    border: 1px solid rgba(255,255,255,.26);
    backdrop-filter: blur(6px);
    white-space: nowrap;
  }

  .now-temp {
    display: flex; align-items: flex-start; gap: 2px;
    margin: 16px 0 2px;
    position: relative; z-index: 1;
  }

  .now-num {
    font-size: clamp(64px, 9vw, 92px);
    font-weight: 200;
    line-height: .86;
    letter-spacing: -.055em;
    font-variant-numeric: tabular-nums;
  }

  .now-unit { font-size: 24px; font-weight: 500; margin-top: 6px; opacity: .9; }

  .now-feels {
    font-size: 13.5px; font-weight: 500; opacity: .9;
    position: relative; z-index: 1;
  }
  .now-feels b { font-weight: 800; }

  .now-foot {
    margin-top: auto;
    padding-top: 20px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    position: relative; z-index: 1;
    border-top: 1px solid rgba(255,255,255,.22);
  }

  .now-foot > div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .now-foot .k { font-size: 9.5px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; opacity: .72; }
  .now-foot b { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }

  .map-card {
    position: relative;
    border-radius: var(--radius-xl);
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: var(--shadow-2);
    min-height: 360px;
  }

  #map { position: absolute; inset: 0; z-index: 1; background: var(--surface-3); }
  #map .leaflet-tile-pane { filter: var(--map-filter); transition: filter .35s var(--ease); }
  .leaflet-container { font: inherit; }
  .leaflet-control-attribution {
    background: color-mix(in srgb, var(--surface) 88%, transparent) !important;
    color: var(--muted) !important;
    font-size: 10px !important;
    padding: 2px 8px !important;
    border-radius: 8px 0 0 0;
  }
  .leaflet-control-attribution a { color: var(--brand-ink) !important; }
  .leaflet-bar { border: none !important; box-shadow: var(--shadow-2) !important; }
  .leaflet-bar a {
    background: var(--surface) !important;
    color: var(--ink) !important;
    border-bottom: 1px solid var(--border) !important;
    width: 32px !important; height: 32px !important; line-height: 32px !important;
  }
  .leaflet-bar a:hover { background: var(--brand-soft) !important; color: var(--brand-ink) !important; }

  .wind-canvas { position: absolute; inset: 0; z-index: 400; pointer-events: none; }

  .gps-marker { background: transparent !important; border: none !important; }

  .gps-pin {
    position: relative;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--brand);
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px var(--brand), 0 6px 14px rgba(13,148,136,.45);
  }
  .gps-pin::after {
    content: "";
    position: absolute; inset: -3px;
    border-radius: 50%;
    border: 2px solid var(--brand);
    animation: pulse 2.4s var(--ease) infinite;
  }
  @keyframes pulse {
    0%   { transform: scale(1); opacity: .8; }
    100% { transform: scale(2.7); opacity: 0; }
  }

  .overlay {
    position: absolute; z-index: 500;
    background: color-mix(in srgb, var(--surface) 93%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-2);
    pointer-events: none;
  }

  .map-legend { left: 14px; bottom: 14px; padding: 12px 14px; max-width: 246px; }
  .legend-title {
    font-size: 9.5px; font-weight: 800; letter-spacing: .16em;
    text-transform: uppercase; color: var(--brand-ink); margin-bottom: 6px;
  }
  .legend-text { font-size: 11.5px; font-weight: 500; color: var(--muted); line-height: 1.55; }

  .map-readout { right: 14px; top: 14px; padding: 12px 14px; min-width: 176px; }
  .readout-row {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 16px; padding: 3.5px 0; font-size: 11px;
  }
  .readout-row .k { font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--muted-2); }
  .readout-row .v { font-size: 13px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }

  .recenter {
    position: absolute; z-index: 500;
    right: 14px; bottom: 14px;
    width: 38px; height: 38px;
    display: grid; place-items: center;
    border-radius: 11px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: var(--muted);
    cursor: pointer;
    box-shadow: var(--shadow-2);
    transition: color .18s, border-color .18s;
  }
  .recenter:hover { color: var(--brand); border-color: var(--brand); }
  .recenter:focus-visible { outline: none; box-shadow: var(--ring); }

  .metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .metric {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px 18px 15px;
    box-shadow: var(--shadow-1);
    transition: border-color .2s, box-shadow .2s, transform .2s;
    min-width: 0;
  }
  .metric:hover { border-color: var(--border-2); box-shadow: var(--shadow-2); transform: translateY(-1px); }

  .metric-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; margin-bottom: 10px;
  }
  .metric-head .kicker { color: var(--muted); }
  .metric-head svg { color: var(--muted-2); flex: 0 0 auto; }

  .metric-val {
    display: flex; align-items: baseline; gap: 3px;
    font-variant-numeric: tabular-nums;
  }
  .metric-val b {
    font-size: 30px; font-weight: 300;
    letter-spacing: -.03em; line-height: 1;
    color: var(--ink);
  }
  .metric-val .u { font-size: 12.5px; font-weight: 700; color: var(--muted-2); }

  .meter {
    height: 5px; border-radius: 999px;
    background: var(--track);
    overflow: hidden;
    margin-top: 12px;
  }
  .meter > span {
    display: block; height: 100%; width: 0;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--brand-2), var(--brand));
    transition: width .9s var(--ease), background .3s;
  }
  .meter[data-tone="rain"] > span { background: linear-gradient(90deg, #38bdf8, var(--rain)); }
  .meter[data-tone="warm"] > span { background: linear-gradient(90deg, #fbbf24, var(--warn-2)); }

  .metric-sub {
    font-size: 11px; font-weight: 600; color: var(--muted-2);
    margin-top: 9px;
    font-variant-numeric: tabular-nums;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    box-shadow: var(--shadow-1);
    min-width: 0;
  }

  .card--crop   { grid-column: span 6; }
  .card--veg    { grid-column: span 3; }
  .card--storm  { grid-column: span 3; }
  .card--soil   { grid-column: span 5; }
  .card--advice { grid-column: span 7; }

  .card-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 12px; margin-bottom: 16px;
  }

  .card-title {
    font-size: 11px; font-weight: 800; letter-spacing: .16em;
    text-transform: uppercase; color: var(--muted);
    line-height: 1.4;
  }

  .card-desc { font-size: 12px; font-weight: 500; color: var(--muted-2); margin-top: 5px; line-height: 1.55; }

  .hint { font-size: 10.5px; font-weight: 700; color: var(--muted-2); letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }

  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    height: 24px; padding: 0 11px;
    border-radius: 999px;
    font-size: 10px; font-weight: 800;
    letter-spacing: .1em; text-transform: uppercase;
    border: 1px solid currentColor;
    white-space: nowrap;
  }
  .pill[data-tone="ok"]      { color: var(--ok); background: var(--ok-soft); }
  .pill[data-tone="fair"]    { color: var(--warn); background: var(--warn-soft); }
  .pill[data-tone="warn"]    { color: var(--warn-2); background: var(--warn-soft); }
  .pill[data-tone="danger"]  { color: var(--danger); background: var(--danger-soft); }
  .pill[data-tone="rain"]    { color: var(--rain); background: var(--rain-soft); }

  .score { display: flex; align-items: flex-start; gap: 4px; }
  .score b {
    font-size: 46px; font-weight: 200; line-height: .92;
    letter-spacing: -.045em; font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  .score span { font-size: 13px; font-weight: 700; color: var(--muted-2); margin-top: 7px; }

  .factors { list-style: none; display: flex; flex-direction: column; gap: 11px; margin-top: 16px; }

  .factor-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .factor-name { font-size: 11.5px; font-weight: 600; color: var(--muted); }
  .factor-value { font-size: 12px; font-weight: 800; color: var(--ink-2); font-variant-numeric: tabular-nums; white-space: nowrap; }

  .factor-bar { height: 4px; border-radius: 999px; background: var(--track); overflow: hidden; margin-top: 6px; }
  .factor-bar > span { display: block; height: 100%; width: 0; border-radius: 999px; transition: width .9s var(--ease), background .3s; }

  .crop-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }

  .field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

  .field label {
    font-size: 10px; font-weight: 800; letter-spacing: .13em;
    text-transform: uppercase; color: var(--muted-2);
  }

  .field select {
    width: 100%; height: 42px;
    padding: 0 36px 0 13px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    color: var(--ink);
    font: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238c9bb2' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 13px center;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .field select:hover { border-color: var(--brand); }
  .field select:focus { outline: none; border-color: var(--brand); box-shadow: var(--ring); background: var(--surface); }

  .status {
    display: flex; align-items: flex-start; gap: 11px;
    padding: 13px 15px;
    border-radius: var(--radius);
    border: 1px solid;
    margin-bottom: 18px;
    transition: background .3s, border-color .3s;
  }
  .status-dot { flex: 0 0 9px; width: 9px; height: 9px; border-radius: 50%; margin-top: 6px; background: currentColor; }
  .status p { font-size: 13px; font-weight: 500; line-height: 1.6; color: var(--ink-2); }
  .status p strong { font-weight: 800; color: var(--ink); }

  .status[data-status="ok"]   { background: var(--ok-soft);     border-color: color-mix(in srgb, var(--ok) 32%, transparent);     color: var(--ok); }
  .status[data-status="warn"] { background: var(--warn-soft);   border-color: color-mix(in srgb, var(--warn) 34%, transparent);   color: var(--warn-2); }
  .status[data-status="bad"]  { background: var(--danger-soft); border-color: color-mix(in srgb, var(--danger) 34%, transparent); color: var(--danger); }

  .range { margin-bottom: 18px; }

  .range-track {
    position: relative;
    height: 9px;
    border-radius: 999px;
    background: var(--track);
    overflow: visible;
    background-image: linear-gradient(90deg, #93c5fd 0%, #93c5fd 20%, #6ee7b7 32%, #6ee7b7 72%, #fcd34d 84%, #fca5a5 100%);
    background-size: 100% 100%;
  }

  .range-marker {
    position: absolute; top: -5px;
    width: 4px; height: 19px;
    border-radius: 2px;
    background: var(--ink);
    box-shadow: 0 0 0 3px var(--surface);
    transform: translateX(-50%);
    transition: left .9s var(--ease);
  }

  .range-labels {
    display: flex; justify-content: space-between; gap: 8px;
    margin-top: 8px;
    font-size: 9.5px; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted-2);
    font-variant-numeric: tabular-nums;
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    padding-top: 16px;
    border-top: 1px dashed var(--border);
  }
  .facts > div { min-width: 0; }
  .facts dt { font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--muted-2); }
  .facts dd { font-size: 14px; font-weight: 700; color: var(--ink); margin-top: 3px; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }

  .storm-scale {
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(90deg, #6ee7b7 0%, #6ee7b7 24%, #fcd34d 25%, #fcd34d 49%, #fdba74 50%, #fdba74 74%, #fca5a5 75%, #fca5a5 100%);
    margin: 16px 0 8px;
    overflow: visible;
  }
  .storm-marker {
    position: absolute; top: -5px;
    width: 4px; height: 18px;
    border-radius: 2px;
    background: var(--ink);
    box-shadow: 0 0 0 3px var(--surface);
    transform: translateX(-50%);
    transition: left .9s var(--ease);
  }
  .storm-labels {
    display: flex; justify-content: space-between;
    font-size: 9px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; color: var(--muted-2);
  }

  .soil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }

  .soil-block h3 {
    font-size: 9.5px; font-weight: 800; letter-spacing: .13em;
    text-transform: uppercase; color: var(--muted-2);
    margin-bottom: 12px;
  }

  .soil-row {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) 68px;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
  }

  .soil-depth { font-size: 11px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }

  .soil-track { height: 6px; border-radius: 999px; background: var(--track); overflow: hidden; }
  .soil-fill { height: 100%; width: 0; border-radius: 999px; transition: width .9s var(--ease), background .3s; }

  .soil-value {
    font-size: 11.5px; font-weight: 800; text-align: right;
    color: var(--ink-2); font-variant-numeric: tabular-nums;
  }

  .card--advice { display: flex; flex-direction: column; }
  .card--advice[data-level="ok"]   { background: linear-gradient(180deg, var(--ok-soft), var(--surface) 62%); }
  .card--advice[data-level="rain"] { background: linear-gradient(180deg, var(--rain-soft), var(--surface) 62%); }
  .card--advice[data-level="warn"] { background: linear-gradient(180deg, var(--warn-soft), var(--surface) 62%); }

  .advice-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .advice-list li {
    position: relative;
    padding-left: 26px;
    font-size: 13px; font-weight: 500; line-height: 1.65;
    color: var(--ink-2);
  }
  .advice-list li::before {
    content: "";
    position: absolute; left: 0; top: 4px;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--brand) 16%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--brand) 55%, transparent);
  }
  .advice-list li::after {
    content: "";
    position: absolute; left: 5px; top: 9.5px;
    width: 5px; height: 2.5px;
    border-left: 1.5px solid var(--brand-ink);
    border-bottom: 1.5px solid var(--brand-ink);
    transform: rotate(-45deg);
  }

  .section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    box-shadow: var(--shadow-1);
    margin-bottom: 16px;
  }

  .section-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-bottom: 16px;
  }

  .section-title {
    font-size: 11px; font-weight: 800; letter-spacing: .16em;
    text-transform: uppercase; color: var(--muted);
  }

  .hourly {
    display: flex; gap: 10px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: thin;
    scroll-snap-type: x proximity;
  }
  .hourly::-webkit-scrollbar { height: 6px; }
  .hourly::-webkit-scrollbar-track { background: transparent; }
  .hourly::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 999px; }

  .hour-card {
    flex: 0 0 96px;
    padding: 13px 10px 12px;
    border-radius: var(--radius);
    background: var(--surface-2);
    border: 1px solid var(--border);
    text-align: center;
    scroll-snap-align: start;
    transition: border-color .2s, background .2s, transform .2s;
  }
  .hour-card:hover { border-color: var(--border-2); transform: translateY(-1px); }
  .hour-card.is-now {
    background: var(--brand-soft);
    border-color: color-mix(in srgb, var(--brand) 34%, transparent);
  }

  .hour-time {
    font-size: 10px; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted-2);
  }
  .hour-card.is-now .hour-time { color: var(--brand-ink); }

  .hour-temp {
    font-size: 20px; font-weight: 500;
    letter-spacing: -.03em; color: var(--ink);
    margin: 8px 0 8px;
    font-variant-numeric: tabular-nums;
  }

  .hour-rain { display: flex; align-items: center; gap: 6px; }
  .hour-rain .bar { flex: 1; height: 4px; border-radius: 999px; background: var(--track); overflow: hidden; }
  .hour-rain .bar > span { display: block; height: 100%; border-radius: 999px; background: var(--rain); transition: width .7s var(--ease); }
  .hour-rain .pct { font-size: 10px; font-weight: 800; color: var(--muted); font-variant-numeric: tabular-nums; }

  .hour-wind {
    font-size: 10.5px; font-weight: 600; color: var(--muted-2);
    margin-top: 7px; font-variant-numeric: tabular-nums;
  }

  .day-row {
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr) 92px 92px 62px;
    gap: 16px;
    align-items: center;
    padding: 13px 0;
    border-bottom: 1px solid var(--border);
  }
  .day-row:last-child { border-bottom: none; }

  .day-name { font-size: 13.5px; font-weight: 700; color: var(--ink); letter-spacing: -.01em; }
  .day-cond { display: block; font-size: 10.5px; font-weight: 600; color: var(--muted-2); margin-top: 2px; }

  .day-range { position: relative; height: 6px; border-radius: 999px; background: var(--track); }
  .day-range > span {
    position: absolute; top: 0; bottom: 0;
    border-radius: 999px;
    background: linear-gradient(90deg, #38bdf8, #fbbf24, #f97316);
    transition: left .8s var(--ease), width .8s var(--ease);
  }

  .day-temp { font-variant-numeric: tabular-nums; text-align: right; font-size: 13.5px; white-space: nowrap; }
  .day-temp .max { font-weight: 800; color: var(--ink); }
  .day-temp .min { font-weight: 600; color: var(--muted-2); margin-left: 6px; }

  .day-rain { display: flex; align-items: center; gap: 8px; }
  .day-rain .bar { flex: 1; height: 5px; border-radius: 999px; background: var(--track); overflow: hidden; }
  .day-rain .bar > span { display: block; height: 100%; border-radius: 999px; background: var(--rain); transition: width .7s var(--ease); }
  .day-rain .pct { font-size: 11px; font-weight: 800; color: var(--muted); font-variant-numeric: tabular-nums; width: 30px; text-align: right; }

  .day-wind { font-size: 11.5px; font-weight: 600; color: var(--muted-2); text-align: right; font-variant-numeric: tabular-nums; }

  .foot {
    margin-top: 26px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
    font-size: 11.5px; font-weight: 500; color: var(--muted-2);
    line-height: 1.6;
  }
  .foot strong { color: var(--muted); font-weight: 700; }

  @media (max-width: 1180px) {
    .card--crop   { grid-column: span 12; }
    .card--veg    { grid-column: span 6; }
    .card--storm  { grid-column: span 6; }
    .card--soil   { grid-column: span 12; }
    .card--advice { grid-column: span 12; }
  }

  @media (max-width: 960px) {
    .hero { grid-template-columns: minmax(0, 1fr); }
    .now-card { min-height: 300px; }
    .map-card { min-height: 380px; }
    .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .day-row { grid-template-columns: 108px minmax(0, 1fr) 84px 76px; }
    .day-wind { display: none; }
    .sk-hero { grid-template-columns: 1fr; }
  }

  @media (max-width: 720px) {
    .wrap { padding: 0 16px; }
    .shell { padding: 18px 0 48px; }
    .card--veg, .card--storm { grid-column: span 12; }
    .crop-controls { grid-template-columns: 1fr; }
    .facts { grid-template-columns: 1fr 1fr; }
    .soil-grid { grid-template-columns: 1fr; gap: 18px; }
    .brand-sub { display: none; }
    .gps { font-size: 10.5px; padding: 0 10px; }
    .now-foot { grid-template-columns: 1fr 1fr; gap: 14px; }
    .map-readout { min-width: 0; padding: 10px 12px; }
    .map-legend { max-width: 190px; padding: 10px 12px; }
    .sk-row { grid-template-columns: 1fr 1fr; }
    .sk-row2 { grid-template-columns: 1fr; }
  }

  @media (max-width: 560px) {
    .topbar-in { height: 60px; gap: 10px; }
    .gps #gpsCoords { max-width: 108px; overflow: hidden; text-overflow: ellipsis; }
    .day-row { grid-template-columns: 84px minmax(0, 1fr) 74px; gap: 12px; }
    .day-rain { display: none; }
    .section { padding: 16px; }
    .card { padding: 18px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .001ms !important;
    }
  }

  ::selection { background: color-mix(in srgb, var(--brand) 30%, transparent); }

  :focus-visible { outline: none; box-shadow: var(--ring); border-radius: 8px; }

  .skip {
    position: absolute; left: -9999px; top: 0;
    padding: 10px 16px; border-radius: 0 0 10px 0;
    background: var(--brand); color: #fff;
    font-size: 13px; font-weight: 700; z-index: 1000;
  }
  .skip:focus { left: 0; }
</style>
</head>
<body>

<a class="skip" href="#main">Skip to content</a>

<header class="topbar">
  <div class="wrap topbar-in">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 4C11 4 4 9 4 16c0 2.2 1.8 4 4 4 7 0 12-7 12-16z"/>
          <path d="M4.5 19.5C7 14 11 10.5 16 8.5"/>
        </svg>
      </span>
      <span class="brand-text">
        <span class="brand-name">AgriWeather</span>
        <span class="brand-sub">Philippine Farm Forecast</span>
      </span>
    </div>
    <div class="topbar-actions">
      <div class="gps" id="gpsChip" role="status">
        <span class="gps-dot"></span>
        <span id="gpsCoords">Locating…</span>
      </div>
      <button class="icon-btn" id="refreshBtn" type="button" aria-label="Refresh data" title="Refresh data">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
          <path d="M21 3v6h-6"/>
        </svg>
      </button>
      <button class="icon-btn" id="themeToggle" type="button" aria-label="Toggle color theme" title="Toggle color theme">
        <svg id="themeIcon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg>
      </button>
    </div>
  </div>
</header>

<main class="shell" id="main">
  <div class="wrap">

    <div id="loading" class="skeleton-grid" aria-hidden="true">
      <div class="sk-hero">
        <div class="sk"></div>
        <div class="sk"></div>
      </div>
      <div class="sk-row">
        <div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div>
      </div>
      <div class="sk-row2">
        <div class="sk"></div><div class="sk"></div><div class="sk"></div>
      </div>
    </div>

    <div id="errorBox" class="error-card" hidden>
      <div class="error-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5h.01"/>
        </svg>
      </div>
      <div style="flex:1;min-width:0">
        <div class="error-title">Could not load weather data</div>
        <p class="error-msg" id="errorMsg">Please check your connection and try again.</p>
      </div>
      <button class="btn btn--ghost" id="retryBtn" type="button">Retry</button>
    </div>

    <div id="content" hidden>

      <section class="loc-bar">
        <div style="min-width:0">
          <h1 class="loc-name" id="locName">—</h1>
          <div class="loc-sub">
            <span id="locSub">—</span>
            <span class="dot-sep" aria-hidden="true"></span>
            <span id="locCoords">—</span>
          </div>
        </div>
        <div class="stamp">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
          </svg>
          Updated <b id="updatedAt">—</b>
        </div>
      </section>

      <section class="hero">
        <article class="now-card">
          <div class="now-head">
            <span class="kicker">Right now</span>
            <span class="now-cond" id="nowCond">—</span>
          </div>
          <div class="now-temp">
            <span class="now-num" id="tempNum">--</span>
            <span class="now-unit">°C</span>
          </div>
          <div class="now-feels">Feels like <b id="feelsLike">--</b></div>
          <div class="now-foot">
            <div><span class="k">High</span><b id="todayHigh">—</b></div>
            <div><span class="k">Low</span><b id="todayLow">—</b></div>
            <div><span class="k">Sunrise</span><b id="sunrise">—</b></div>
            <div><span class="k">Sunset</span><b id="sunset">—</b></div>
          </div>
        </article>

        <article class="map-card">
          <div id="map"></div>

          <div class="overlay map-legend">
            <div class="legend-title">Live wind field</div>
            <div class="legend-text" id="legendText">Particles drift downwind. Denser, faster flow means stronger wind. The dashed ring shows the local storm-risk zone.</div>
          </div>

          <div class="overlay map-readout">
            <div class="readout-row"><span class="k">Wind</span><span class="v" id="roWind">—</span></div>
            <div class="readout-row"><span class="k">From</span><span class="v" id="roDir">—</span></div>
            <div class="readout-row"><span class="k">Gusts</span><span class="v" id="roGust">—</span></div>
            <div class="readout-row"><span class="k">Pressure</span><span class="v" id="roPress">—</span></div>
          </div>

          <button class="recenter" id="recenterBtn" type="button" aria-label="Recenter map on my location" title="Recenter map">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </button>
        </article>
      </section>

      <section class="metrics" aria-label="Current conditions detail">
        <div class="metric">
          <div class="metric-head">
            <span class="kicker">Rain chance</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10z"/>
            </svg>
          </div>
          <div class="metric-val"><b id="rainChance">--</b><span class="u">%</span></div>
          <div class="meter" data-tone="rain"><span id="rainBar"></span></div>
          <div class="metric-sub" id="rainSub">Current hour</div>
        </div>

        <div class="metric">
          <div class="metric-head">
            <span class="kicker">Humidity</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 14a4 4 0 0 1 8 0"/><path d="M12 4v3"/><path d="M6.5 8.5 8 10"/><path d="M17.5 8.5 16 10"/>
            </svg>
          </div>
          <div class="metric-val"><b id="humidity">--</b><span class="u">%</span></div>
          <div class="meter"><span id="humidityBar"></span></div>
          <div class="metric-sub" id="humiditySub">Relative humidity</div>
        </div>

        <div class="metric">
          <div class="metric-head">
            <span class="kicker">Wind</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h8"/>
            </svg>
          </div>
          <div class="metric-val"><b id="windSpeed">--</b><span class="u">km/h</span></div>
          <div class="meter"><span id="windBar"></span></div>
          <div class="metric-sub" id="windSub">—</div>
        </div>

        <div class="metric">
          <div class="metric-head">
            <span class="kicker">Pressure</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 14l3.5-3.5"/><circle cx="12" cy="14" r="1.4"/>
            </svg>
          </div>
          <div class="metric-val"><b id="pressure">--</b><span class="u">hPa</span></div>
          <div class="meter"><span id="pressureBar"></span></div>
          <div class="metric-sub" id="pressureSub">—</div>
        </div>
      </section>

      <section class="board">

        <article class="card card--crop">
          <div class="card-head">
            <div>
              <h2 class="card-title">Crop suitability</h2>
              <p class="card-desc">Temperature fit for the selected crop and growth stage.</p>
            </div>
          </div>

          <div class="crop-controls">
            <div class="field">
              <label for="cropSelect">Crop</label>
              <select id="cropSelect"></select>
            </div>
            <div class="field">
              <label for="stageSelect">Growth stage</label>
              <select id="stageSelect">
                <option value="seedling">Seedling</option>
                <option value="vegetative" selected>Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="maturity">Maturity</option>
              </select>
            </div>
          </div>

          <div class="status" id="cropStatus" data-status="ok">
            <span class="status-dot" aria-hidden="true"></span>
            <p id="cropStatusText">—</p>
          </div>

          <div class="range">
            <div class="range-track" id="cropTrack">
              <span class="range-marker" id="cropMarker" style="left:50%"></span>
            </div>
            <div class="range-labels">
              <span id="cropMinLabel">—</span>
              <span id="cropOptLabel">Optimal band</span>
              <span id="cropMaxLabel">—</span>
            </div>
          </div>

          <dl class="facts">
            <div><dt>Current</dt><dd id="cropCurrentTemp">—</dd></div>
            <div><dt>7-day high</dt><dd id="cropHigh7">—</dd></div>
            <div><dt>7-day low</dt><dd id="cropLow7">—</dd></div>
            <div><dt>Sensitivity</dt><dd id="cropSensitivity">—</dd></div>
          </dl>
        </article>

        <article class="card card--veg">
          <div class="card-head">
            <h2 class="card-title">Vegetation</h2>
            <span class="pill" id="vegLevel" data-tone="ok">—</span>
          </div>
          <div class="score"><b id="vegScore">--</b><span>/100</span></div>
          <p class="card-desc">Root-zone condition, top 27 cm, next 24 h.</p>
          <ul class="factors" id="vegFactors"></ul>
        </article>

        <article class="card card--storm">
          <div class="card-head">
            <h2 class="card-title">Storm watch</h2>
            <span class="pill" id="stormLevel" data-tone="ok">—</span>
          </div>
          <div class="score"><b id="stormScore">--</b><span>/100</span></div>
          <p class="card-desc">Local risk indicator, next 72 h.</p>

          <div class="storm-scale">
            <div class="storm-marker" id="stormMarker" style="left:0%"></div>
          </div>
          <div class="storm-labels">
            <span>Low</span><span>Moderate</span><span>High</span><span>Severe</span>
          </div>

          <ul class="factors" id="stormFactors"></ul>
        </article>

        <article class="card card--soil">
          <div class="card-head">
            <h2 class="card-title">Soil profile</h2>
            <span class="hint">Mean, next 24 h</span>
          </div>
          <div class="soil-grid" id="soilLayers"></div>
        </article>

        <article class="card card--advice" id="adviceBox" data-level="ok">
          <div class="card-head">
            <h2 class="card-title">Farm advisory</h2>
            <span class="pill" id="advicePill" data-tone="ok">—</span>
          </div>
          <ul class="advice-list" id="adviceText"></ul>
        </article>

      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">Next 12 hours</h2>
          <span class="hint">Scroll for later</span>
        </div>
        <div class="hourly" id="hourlyStrip"></div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">7-day forecast</h2>
          <span class="hint">Local time</span>
        </div>
        <div id="dailyList"></div>
      </section>

      <footer class="foot">
        <div>
          <strong>AgriWeather</strong> — free, open weather intelligence for Philippine farms.
          Data: Open-Meteo · OpenStreetMap · Nominatim. No API keys, no tracking.
        </div>
        <div>
          Storm Watch is a heuristic indicator, <strong>not</strong> an official typhoon forecast.
          Always follow PAGASA advisories.
        </div>
      </footer>

    </div>
  </div>
</main>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    html:            document.documentElement,
    loading:         $('loading'),
    errorBox:        $('errorBox'),
    errorMsg:        $('errorMsg'),
    retryBtn:        $('retryBtn'),
    content:         $('content'),
    gpsChip:         $('gpsChip'),
    gpsCoords:       $('gpsCoords'),
    refreshBtn:      $('refreshBtn'),
    themeToggle:     $('themeToggle'),
    themeIcon:       $('themeIcon'),
    locName:         $('locName'),
    locSub:          $('locSub'),
    locCoords:       $('locCoords'),
    updatedAt:       $('updatedAt'),
    nowCond:         $('nowCond'),
    tempNum:         $('tempNum'),
    feelsLike:       $('feelsLike'),
    todayHigh:       $('todayHigh'),
    todayLow:        $('todayLow'),
    sunrise:         $('sunrise'),
    sunset:          $('sunset'),
    rainChance:      $('rainChance'),
    rainBar:         $('rainBar'),
    rainSub:         $('rainSub'),
    humidity:        $('humidity'),
    humidityBar:     $('humidityBar'),
    humiditySub:     $('humiditySub'),
    windSpeed:       $('windSpeed'),
    windBar:         $('windBar'),
    windSub:         $('windSub'),
    pressure:        $('pressure'),
    pressureBar:     $('pressureBar'),
    pressureSub:     $('pressureSub'),
    roWind:          $('roWind'),
    roDir:           $('roDir'),
    roGust:          $('roGust'),
    roPress:         $('roPress'),
    recenterBtn:     $('recenterBtn'),
    cropSelect:      $('cropSelect'),
    stageSelect:     $('stageSelect'),
    cropStatus:      $('cropStatus'),
    cropStatusText:  $('cropStatusText'),
    cropTrack:       $('cropTrack'),
    cropMarker:      $('cropMarker'),
    cropMinLabel:    $('cropMinLabel'),
    cropMaxLabel:    $('cropMaxLabel'),
    cropCurrentTemp: $('cropCurrentTemp'),
    cropHigh7:       $('cropHigh7'),
    cropLow7:        $('cropLow7'),
    cropSensitivity: $('cropSensitivity'),
    vegLevel:        $('vegLevel'),
    vegScore:        $('vegScore'),
    vegFactors:      $('vegFactors'),
    stormLevel:      $('stormLevel'),
    stormScore:      $('stormScore'),
    stormMarker:     $('stormMarker'),
    stormFactors:    $('stormFactors'),
    soilLayers:      $('soilLayers'),
    adviceBox:       $('adviceBox'),
    advicePill:      $('advicePill'),
    adviceText:      $('adviceText'),
    hourly:          $('hourlyStrip'),
    daily:           $('dailyList')
  };

  var DEFAULT_LAT = 14.5995;
  var DEFAULT_LON = 120.9842;

  var state = {
    lat: null,
    lon: null,
    data: null,
    label: '',
    sub: '',
    busy: false
  };

  var map = null;
  var marker = null;
  var windLayer = null;
  var stormCircle = null;
  var autoTimer = null;

  var REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ICON_SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var ICON_MOON = '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>';

  function applyTheme(mode) {
    els.html.setAttribute('data-theme', mode);
    els.themeIcon.innerHTML = mode === 'dark' ? ICON_MOON : ICON_SUN;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#070c15' : '#0d9488');
    try { localStorage.setItem('agriweather.theme', mode); } catch (e) {}
    if (windLayer) windLayer.refreshColor();
    if (map) setTimeout(function () { map.invalidateSize(); }, 80);
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('agriweather.theme'); } catch (e) {}
    if (!saved) {
      saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'light';
    }
    applyTheme(saved);
  }

  els.themeToggle.addEventListener('click', function () {
    applyTheme(els.html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  var CROPS = [
    { id: 'rice', name: 'Rice (Palay)', min: 15, optMin: 20, optMax: 35, max: 40,
      sensitivity: { seedling: 'Moderate', vegetative: 'Moderate', flowering: 'Very High', maturity: 'Low' } },
    { id: 'corn', name: 'Corn (Mais)', min: 10, optMin: 21, optMax: 30, max: 38,
      sensitivity: { seedling: 'Low', vegetative: 'Moderate', flowering: 'Very High', maturity: 'Low' } },
    { id: 'coconut', name: 'Coconut (Niyog)', min: 15, optMin: 24, optMax: 29, max: 34,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'Moderate', maturity: 'Low' } },
    { id: 'banana', name: 'Banana (Saging)', min: 16, optMin: 25, optMax: 30, max: 37,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'High', maturity: 'Low' } },
    { id: 'sugarcane', name: 'Sugarcane (Tubo)', min: 12, optMin: 20, optMax: 32, max: 40,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'Moderate', maturity: 'Low' } },
    { id: 'tomato', name: 'Tomato (Kamatis)', min: 10, optMin: 18, optMax: 26, max: 32,
      sensitivity: { seedling: 'High', vegetative: 'Moderate', flowering: 'Very High', maturity: 'Moderate' } },
    { id: 'eggplant', name: 'Eggplant (Talong)', min: 12, optMin: 18, optMax: 26, max: 34,
      sensitivity: { seedling: 'High', vegetative: 'Moderate', flowering: 'High', maturity: 'Moderate' } },
    { id: 'okra', name: 'Okra', min: 14, optMin: 18, optMax: 30, max: 38,
      sensitivity: { seedling: 'Moderate', vegetative: 'Low', flowering: 'Moderate', maturity: 'Low' } }
  ];

  var CROP_MAP = {};
  for (var ci = 0; ci < CROPS.length; ci++) CROP_MAP[CROPS[ci].id] = CROPS[ci];

  function populateCrops() {
    var html = '';
    for (var i = 0; i < CROPS.length; i++) {
      html += '<option value="' + CROPS[i].id + '">' + CROPS[i].name + '</option>';
    }
    els.cropSelect.innerHTML = html;
    try {
      var saved = localStorage.getItem('agriweather.crop');
      if (saved && CROP_MAP[saved]) els.cropSelect.value = saved;
    } catch (e) {}
  }

  var CARDINALS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

  function cardinal(deg) {
    var d = ((Number(deg) % 360) + 360) % 360;
    return CARDINALS[Math.round(d / 22.5) % 16];
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function fmtCoord(v, isLat) {
    var dir = v >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
    return Math.abs(v).toFixed(4) + '\\u00B0 ' + dir;
  }

  function hourLabel(iso) {
    var h = parseInt(String(iso).slice(11, 13), 10);
    if (!isFinite(h)) return String(iso);
    var ap = h >= 12 ? 'PM' : 'AM';
    return (h % 12 || 12) + ' ' + ap;
  }

  function clock(iso) {
    var s = String(iso || '');
    var h = parseInt(s.slice(11, 13), 10);
    var m = s.slice(14, 16);
    if (!isFinite(h) || m.length !== 2) return '--';
    var ap = h >= 12 ? 'PM' : 'AM';
    return (h % 12 || 12) + ':' + m + ' ' + ap;
  }

  function dayLabel(iso, idx) {
    if (idx === 0) return 'Today';
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  var WMO = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Freezing fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers',
    85: 'Snow showers', 86: 'Snow showers',
    95: 'Thunderstorm', 96: 'Storm with hail', 99: 'Storm with hail'
  };

  function wmoText(c) { return WMO[c] || 'Unsettled'; }

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
    if (!arr) return 0;
    var sum = 0, n = 0;
    for (var i = a; i < b && i < arr.length; i++) {
      if (Number.isFinite(arr[i])) { sum += arr[i]; n++; }
    }
    return n ? sum / n : 0;
  }

  function toneForScore(score) {
    if (score >= 75) return 'var(--ok)';
    if (score >= 50) return '#ca8a04';
    if (score >= 25) return 'var(--warn-2)';
    return 'var(--danger)';
  }

  function WindParticleLayer(mapInstance) {
    this.map = mapInstance;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'wind-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.windDir = 0;
    this.windSpeed = 0;
    this.particles = [];
    this.running = !REDUCED_MOTION;
    this.rgb = '13,148,136';

    mapInstance.getContainer().appendChild(this.canvas);

    var self = this;
    this._onResize = function () { self.resize(); };
    mapInstance.on('resize', this._onResize);

    this.refreshColor();
    this.resize();

    this._tick = this._tick.bind(this);
    if (this.running) requestAnimationFrame(this._tick);
  }

  WindParticleLayer.prototype.refreshColor = function () {
    var v = '';
    try {
      v = getComputedStyle(document.documentElement).getPropertyValue('--wind-rgb').trim();
    } catch (e) {}
    this.rgb = v || '13,148,136';
  };

  WindParticleLayer.prototype.resize = function () {
    var size = this.map.getSize();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, size.x);
    this.h = Math.max(1, size.y);
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._spawn();
  };

  WindParticleLayer.prototype._spawn = function () {
    var target = Math.floor((this.w * this.h) / 3400);
    var count = Math.max(140, Math.min(760, target));
    this.particles = [];
    for (var i = 0; i < count; i++) this.particles.push(this._make());
  };

  WindParticleLayer.prototype._make = function () {
    return {
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      px: 0, py: 0,
      age: Math.random() * 60,
      life: 50 + Math.random() * 90,
      speedVar: 0.6 + Math.random() * 0.8,
      width: 0.6 + Math.random() * 1.1
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
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'source-over';

    var toRad = ((this.windDir + 180) * Math.PI) / 180;
    var dx = Math.sin(toRad);
    var dy = -Math.cos(toRad);
    var base = clamp(this.windSpeed * 0.06, 0.35, 2.8);
    var rgb = this.rgb;

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.px = p.x;
      p.py = p.y;

      var v = base * p.speedVar;
      p.x += dx * v;
      p.y += dy * v;
      p.age++;

      var alpha = 0.55 * Math.max(0, 1 - p.age / p.life);

      if (alpha > 0.02) {
        ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
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
        this.particles[i] = this._make();
      }
    }
  };

  function initMap(lat, lon) {
    if (typeof L === 'undefined') return;

    try {
      if (!map) {
        map = L.map('map', {
          zoomControl: true,
          attributionControl: true,
          zoomSnap: 0.5,
          worldCopyJump: true
        }).setView([lat, lon], 9);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        windLayer = new WindParticleLayer(map);

        var gpsIcon = L.divIcon({
          className: 'gps-marker',
          html: '<div class="gps-pin"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        marker = L.marker([lat, lon], { icon: gpsIcon, keyboard: false }).addTo(map);
      } else {
        map.setView([lat, lon], map.getZoom() || 9);
        if (marker) marker.setLatLng([lat, lon]);
      }

      setTimeout(function () { map.invalidateSize(); }, 140);
    } catch (err) {
      if (window.console) console.warn('[AgriWeather] map init failed:', err);
    }
  }

  function updateStormCircle(lat, lon, risk) {
    if (!map || typeof L === 'undefined') return;

    var radius = 25000 + risk.score * 1200;
    var color =
      risk.level === 'severe'   ? '#b91c1c' :
      risk.level === 'high'     ? '#ea580c' :
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

  var API_MODE = null;
  var API_PROBE = null;

  function detectApiMode() {
    if (API_MODE) return Promise.resolve(API_MODE);
    if (API_PROBE) return API_PROBE;

    API_PROBE = new Promise(function (resolve) {
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, 1500);
      var opts = { cache: 'no-store' };
      if (controller) opts.signal = controller.signal;

      fetch('/api/health', opts).then(function (r) {
        clearTimeout(timer);
        API_MODE = r.ok ? 'proxy' : 'direct';
        resolve(API_MODE);
      }).catch(function () {
        clearTimeout(timer);
        API_MODE = 'direct';
        resolve(API_MODE);
      });
    });

    return API_PROBE;
  }

  function buildWeatherParams(lat, lon) {
    return new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
        'is_day', 'weather_code', 'pressure_msl', 'wind_speed_10m',
        'wind_direction_10m', 'wind_gusts_10m', 'precipitation'
      ].join(','),
      hourly: [
        'temperature_2m', 'relative_humidity_2m', 'precipitation_probability',
        'precipitation', 'pressure_msl', 'wind_speed_10m',
        'wind_direction_10m', 'wind_gusts_10m',
        'soil_moisture_0_to_1cm', 'soil_moisture_1_to_3cm',
        'soil_moisture_3_to_9cm', 'soil_moisture_9_to_27cm',
        'soil_temperature_0cm', 'soil_temperature_6cm',
        'soil_temperature_18cm', 'soil_temperature_54cm',
        'evapotranspiration'
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'precipitation_sum', 'precipitation_probability_max',
        'wind_speed_10m_max', 'wind_gusts_10m_max',
        'et0_fao_evapotranspiration', 'sunrise', 'sunset'
      ].join(','),
      timezone: 'auto',
      forecast_days: '7'
    });
  }

  function fetchWeather(lat, lon) {
    var directUrl = 'https://api.open-meteo.com/v1/forecast?' +
                    buildWeatherParams(lat, lon).toString();

    function tryDirect() {
      return fetch(directUrl, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('Open-Meteo returned ' + r.status);
        return r.json();
      });
    }

    function tryProxy() {
      var proxyUrl = '/api/weather?lat=' + encodeURIComponent(lat) +
                     '&lon=' + encodeURIComponent(lon);
      return fetch(proxyUrl, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('Proxy returned ' + r.status);
        return r.json();
      });
    }

    return detectApiMode().then(function (mode) {
      if (mode === 'direct') return tryDirect();
      return tryProxy().catch(tryDirect);
    }).then(function (data) {
      if (data && data.error) throw new Error(data.error);
      return data;
    });
  }

  function reverseGeocode(lat, lon) {
    var directUrl = 'https://nominatim.openstreetmap.org/reverse' +
                    '?format=json&zoom=12&accept-language=en' +
                    '&lat=' + encodeURIComponent(lat) +
                    '&lon=' + encodeURIComponent(lon);

    function tryDirect() {
      return fetch(directUrl, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      }).then(function (r) {
        if (!r.ok) throw new Error('Nominatim returned ' + r.status);
        return r.json();
      });
    }

    function tryProxy() {
      var proxyUrl = '/api/reverse?lat=' + encodeURIComponent(lat) +
                     '&lon=' + encodeURIComponent(lon);
      return fetch(proxyUrl, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('Reverse proxy returned ' + r.status);
        return r.json();
      });
    }

    return detectApiMode().then(function (mode) {
      if (mode === 'direct') return tryDirect();
      return tryProxy().catch(tryDirect);
    }).then(function (data) {
      if (!data) return null;
      if (data.name && !data.address) return data;
      var a = data.address || {};
      return {
        name: a.city || a.town || a.village || a.municipality ||
              a.county || a.state_district || a.state || 'Your location',
        region: a.state || a.region || '',
        country: a.country || ''
      };
    }).catch(function () {
      return null;
    });
  }

  function computeVegetation(data) {
    var h = data.hourly;
    var idx = findHourIndex(data);
    var end = Math.min(idx + 24, h.time.length);

    var sfc  = safeAvg(h.soil_moisture_0_to_1cm, idx, end);
    var mid1 = safeAvg(h.soil_moisture_1_to_3cm, idx, end);
    var mid2 = safeAvg(h.soil_moisture_3_to_9cm, idx, end);
    var deep = safeAvg(h.soil_moisture_9_to_27cm, idx, end);

    var rootMoisture = sfc * 0.20 + mid1 * 0.25 + mid2 * 0.30 + deep * 0.25;

    var st6  = safeAvg(h.soil_temperature_6cm, idx, end);
    var st18 = safeAvg(h.soil_temperature_18cm, idx, end);
    var soilTemp = st6 * 0.6 + st18 * 0.4;

    var rain24 = 0, et24 = 0;
    for (var i = idx; i < end; i++) {
      rain24 += (h.precipitation[i] || 0);
      et24 += (h.evapotranspiration[i] || 0);
    }
    var balance = rain24 - et24;

    var moistScore;
    if (rootMoisture < 0.10)       moistScore = 5;
    else if (rootMoisture < 0.18)  moistScore = 25 + (rootMoisture - 0.10) / 0.08 * 25;
    else if (rootMoisture < 0.28)  moistScore = 50 + (rootMoisture - 0.18) / 0.10 * 35;
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

    var level, levelText, tone;
    if (total >= 75)      { level = 'optimal';  levelText = 'Optimal';  tone = 'ok'; }
    else if (total >= 50) { level = 'fair';     levelText = 'Fair';     tone = 'fair'; }
    else if (total >= 25) { level = 'stressed'; levelText = 'Stressed'; tone = 'warn'; }
    else                  { level = 'critical'; levelText = 'Critical'; tone = 'danger'; }

    return {
      score: Math.round(total),
      level: level,
      levelText: levelText,
      tone: tone,
      rootMoisture: rootMoisture,
      soilTemp: soilTemp,
      rain24: rain24,
      et24: et24,
      balance: balance,
      factors: [
        { name: 'Root-zone moisture', value: (rootMoisture * 100).toFixed(1) + ' %vol', score: Math.round(moistScore) },
        { name: 'Soil temperature',   value: soilTemp.toFixed(1) + ' \\u00B0C',           score: Math.round(tempScore) },
        { name: 'Water balance (24h)', value: (balance >= 0 ? '+' : '') + balance.toFixed(1) + ' mm', score: Math.round(balScore) },
        { name: 'Rain / ET (24h)',    value: rain24.toFixed(1) + ' / ' + et24.toFixed(1) + ' mm', score: Math.round(balScore) }
      ]
    };
  }

  function renderVegetation(veg) {
    els.vegScore.textContent = veg.score;
    els.vegLevel.textContent = veg.levelText;
    els.vegLevel.setAttribute('data-tone', veg.tone);

    var html = '';
    for (var i = 0; i < veg.factors.length; i++) {
      var f = veg.factors[i];
      html += '<li>';
      html +=   '<div class="factor-row">';
      html +=     '<span class="factor-name">' + f.name + '</span>';
      html +=     '<span class="factor-value">' + f.value + '</span>';
      html +=   '</div>';
      html +=   '<div class="factor-bar"><span style="width:' + clamp(f.score, 0, 100) +
                '%;background:' + toneForScore(f.score) + '"></span></div>';
      html += '</li>';
    }
    els.vegFactors.innerHTML = html;
  }

  function soilColor(v) {
    if (v < 0.10) return '#dc2626';
    if (v < 0.18) return '#f59e0b';
    if (v < 0.28) return '#14b8a6';
    if (v <= 0.38) return '#0f766e';
    return '#0284c7';
  }

  function renderSoil(data) {
    var h = data.hourly;
    var idx = findHourIndex(data);
    var end = Math.min(idx + 24, h.time.length);

    var moisture = [
      { label: '0–1 cm',  key: 'soil_moisture_0_to_1cm' },
      { label: '1–3 cm',  key: 'soil_moisture_1_to_3cm' },
      { label: '3–9 cm',  key: 'soil_moisture_3_to_9cm' },
      { label: '9–27 cm', key: 'soil_moisture_9_to_27cm' }
    ];

    var temps = [
      { label: '0 cm',  key: 'soil_temperature_0cm' },
      { label: '6 cm',  key: 'soil_temperature_6cm' },
      { label: '18 cm', key: 'soil_temperature_18cm' },
      { label: '54 cm', key: 'soil_temperature_54cm' }
    ];

    var html = '';

    html += '<div class="soil-block"><h3>Moisture (%vol)</h3>';
    for (var i = 0; i < moisture.length; i++) {
      var v = safeAvg(h[moisture[i].key], idx, end);
      var pct = clamp(v / 0.50 * 100, 2, 100);
      html += '<div class="soil-row">';
      html +=   '<div class="soil-depth">' + moisture[i].label + '</div>';
      html +=   '<div class="soil-track"><div class="soil-fill" style="width:' + pct +
                '%;background:' + soilColor(v) + '"></div></div>';
      html +=   '<div class="soil-value">' + (v * 100).toFixed(1) + '%</div>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="soil-block"><h3>Temperature (°C)</h3>';
    for (var j = 0; j < temps.length; j++) {
      var t = safeAvg(h[temps[j].key], idx, end);
      html += '<div class="soil-row">';
      html +=   '<div class="soil-depth">' + temps[j].label + '</div>';
      html +=   '<div class="soil-track"><div class="soil-fill" style="width:' +
                clamp((t + 5) / 50 * 100, 4, 100) +
                '%;background:linear-gradient(90deg,#38bdf8,#fbbf24)"></div></div>';
      html +=   '<div class="soil-value">' + t.toFixed(1) + '\\u00B0</div>';
      html += '</div>';
    }
    html += '</div>';

    els.soilLayers.innerHTML = html;
  }

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
    var sensFactor =
      sensLabel === 'Very High' ? 0.65 :
      sensLabel === 'High'      ? 0.78 :
      sensLabel === 'Moderate'  ? 0.90 : 1.00;

    var mid = (crop.optMin + crop.optMax) / 2;
    var half = (crop.optMax - crop.optMin) / 2;
    var effMin = mid - half * sensFactor;
    var effMax = mid + half * sensFactor;

    var status, message;

    if (cur < effMin) {
      var deficit = effMin - cur;
      status = deficit > 4 ? 'bad' : 'warn';
      message = '<strong>Below optimal range</strong> for ' + crop.name +
                ' at ' + stage + ' stage. Current ' + cur.toFixed(1) + ' \\u00B0C is ' +
                deficit.toFixed(1) + ' \\u00B0C under the comfortable band.';
    } else if (cur > effMax) {
      var excess = cur - effMax;
      status = excess > 4 ? 'bad' : 'warn';
      message = '<strong>Above optimal range</strong> for ' + crop.name +
                ' at ' + stage + ' stage. Current ' + cur.toFixed(1) + ' \\u00B0C is ' +
                excess.toFixed(1) + ' \\u00B0C over the comfortable band.';
    } else {
      status = 'ok';
      message = '<strong>Within optimal range</strong> for ' + crop.name +
                ' at ' + stage + ' stage. Current ' + cur.toFixed(1) + ' \\u00B0C is suitable.';
    }

    if (high7 > crop.max) {
      message += ' Forecast high of ' + high7.toFixed(0) + ' \\u00B0C exceeds the crop maximum of ' + crop.max + ' \\u00B0C.';
      if (status === 'ok') status = 'warn';
    }
    if (low7 < crop.min) {
      message += ' Forecast low of ' + low7.toFixed(0) + ' \\u00B0C is below the crop minimum of ' + crop.min + ' \\u00B0C.';
      if (status === 'ok') status = 'warn';
    }

    var lo = crop.min - 4;
    var hi = crop.max + 4;
    var span = hi - lo;

    return {
      crop: crop,
      status: status,
      message: message,
      markerPct: clamp((cur - lo) / span * 100, 2, 98),
      p1: clamp((crop.min - lo) / span * 100, 0, 100),
      p2: clamp((crop.optMin - lo) / span * 100, 0, 100),
      p3: clamp((crop.optMax - lo) / span * 100, 0, 100),
      p4: clamp((crop.max - lo) / span * 100, 0, 100),
      current: cur,
      high7: high7,
      low7: low7,
      sensLabel: sensLabel
    };
  }

  function renderCrop(data) {
    var cropId = els.cropSelect.value || 'rice';
    var stage = els.stageSelect.value || 'vegetative';
    var r = evaluateCrop(cropId, stage, data);
    if (!r) return;

    els.cropStatus.setAttribute('data-status', r.status);
    els.cropStatusText.innerHTML = r.message;

    els.cropMarker.style.left = r.markerPct + '%';

    els.cropTrack.style.backgroundImage =
      'linear-gradient(90deg,' +
        '#93c5fd 0%,#93c5fd ' + r.p1.toFixed(1) + '%,' +
        '#6ee7b7 ' + r.p2.toFixed(1) + '%,#6ee7b7 ' + r.p3.toFixed(1) + '%,' +
        '#fcd34d ' + r.p4.toFixed(1) + '%,#fca5a5 100%)';

    els.cropMinLabel.textContent = r.crop.min + ' \\u00B0C';
    els.cropMaxLabel.textContent = r.crop.max + ' \\u00B0C';

    els.cropCurrentTemp.textContent = r.current.toFixed(1) + ' \\u00B0C';
    els.cropHigh7.textContent = r.high7.toFixed(0) + ' \\u00B0C';
    els.cropLow7.textContent = r.low7.toFixed(0) + ' \\u00B0C';
    els.cropSensitivity.textContent = r.sensLabel;
  }

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

    var windScore  = clamp((peakWind - 25) / 105 * 100, 0, 100);
    var gustScore  = clamp((peakGust - 35) / 165 * 100, 0, 100);
    var pressScore = clamp((1005 - pressureMin24) / 45 * 100, 0, 100);
    var dropScore  = clamp((pressureDrop - 2) / 18 * 100, 0, 100);
    var rainScore  = clamp((rain24 - 25) / 175 * 100, 0, 100);

    var total = windScore * 0.25 + gustScore * 0.20 + pressScore * 0.25 +
                dropScore * 0.15 + rainScore * 0.15;

    var level, levelText, tone;
    if (total >= 75)      { level = 'severe';   levelText = 'Severe';   tone = 'danger'; }
    else if (total >= 50) { level = 'high';     levelText = 'High';     tone = 'warn'; }
    else if (total >= 25) { level = 'moderate'; levelText = 'Moderate'; tone = 'fair'; }
    else                  { level = 'low';      levelText = 'Low';      tone = 'ok'; }

    return {
      score: Math.round(total),
      level: level,
      levelText: levelText,
      tone: tone,
      factors: [
        { name: 'Peak wind (72h)',       value: Math.round(peakWind) + ' km/h',     score: Math.round(windScore) },
        { name: 'Peak gusts (72h)',      value: Math.round(peakGust) + ' km/h',     score: Math.round(gustScore) },
        { name: 'Lowest pressure (24h)', value: Math.round(pressureMin24) + ' hPa', score: Math.round(pressScore) },
        { name: 'Pressure drop (24h)',   value: pressureDrop.toFixed(1) + ' hPa',   score: Math.round(dropScore) },
        { name: 'Rainfall (24h)',        value: Math.round(rain24) + ' mm',         score: Math.round(rainScore) }
      ]
    };
  }

  function renderStorm(risk) {
    els.stormScore.textContent = risk.score;
    els.stormLevel.textContent = risk.levelText;
    els.stormLevel.setAttribute('data-tone', risk.tone);
    els.stormMarker.style.left = clamp(risk.score, 0, 100) + '%';

    var html = '';
    for (var i = 0; i < risk.factors.length; i++) {
      var f = risk.factors[i];
      html += '<li>';
      html +=   '<div class="factor-row">';
      html +=     '<span class="factor-name">' + f.name + '</span>';
      html +=     '<span class="factor-value">' + f.value + '</span>';
      html +=   '</div>';
      html +=   '<div class="factor-bar"><span style="width:' + clamp(f.score, 0, 100) +
                '%;background:' + toneForScore(f.score) + '"></span></div>';
      html += '</li>';
    }
    els.stormFactors.innerHTML = html;
  }

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
      tips.push('Storm risk is elevated. Secure seedlings, trellises and light structures. Harvest mature crops now if it is safe to do so.');
      tips.push('Move harvested produce to higher ground and cover stored grain to prevent rain damage.');
    } else if (risk && risk.level === 'moderate') {
      level = 'warn';
      tips.push('Storm risk is moderate. Inspect drainage and clear canals before the next rain arrives.');
    }

    if (veg) {
      if (veg.rootMoisture < 0.15) {
        level = 'warn';
        tips.push('Root-zone soil moisture is low. Irrigate early morning or late afternoon to cut evaporation loss.');
      } else if (veg.rootMoisture > 0.42) {
        level = 'warn';
        tips.push('Soil is waterlogged. Check field drainage to prevent root rot and nutrient leaching.');
      }
      if (veg.soilTemp < 18) {
        tips.push('Soil temperature is cool — root activity and nutrient uptake will be slow.');
      } else if (veg.soilTemp > 34) {
        tips.push('Soil is very warm. Mulch to protect roots and hold moisture.');
      }
    }

    if (maxRain6 >= 60) {
      if (level === 'ok') level = 'rain';
      tips.push('Rain is likely within the next 6 hours. Postpone spraying, fertilizer application and harvesting.');
    } else if (maxRain6 >= 30) {
      if (level === 'ok') level = 'rain';
      tips.push('Scattered rain is possible. Keep an eye on the sky before starting field work.');
    } else if (level === 'ok') {
      tips.push('Low rain chance over the next 6 hours — a good window for spraying and field work.');
    }

    if (wind >= 20) {
      level = 'warn';
      tips.push('Strong winds above 20 km/h. Avoid pesticide spraying — drift risk is high.');
    } else if (wind >= 12) {
      if (level === 'ok') level = 'warn';
      tips.push('Moderate wind. Spray with caution, using coarse droplets and low pressure.');
    } else if (level === 'ok') {
      tips.push('Wind is calm to light — ideal conditions for spraying.');
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

  function renderAdvice(data, risk, veg) {
    var a = buildAdvice(data, risk, veg);

    els.adviceBox.setAttribute('data-level', a.level);

    var tone = a.level === 'ok' ? 'ok' : (a.level === 'rain' ? 'rain' : 'warn');
    els.advicePill.setAttribute('data-tone', tone);
    els.advicePill.textContent = a.level === 'ok' ? 'Good to go' : (a.level === 'rain' ? 'Rain' : 'Caution');

    var html = '';
    for (var i = 0; i < a.tips.length; i++) {
      html += '<li>' + a.tips[i] + '</li>';
    }
    els.adviceText.innerHTML = html;
  }

  function renderCurrent(data) {
    var cur = data.current;
    var idx = findHourIndex(data);
    var daily = data.daily;

    els.nowCond.textContent = wmoText(cur.weather_code);
    els.tempNum.textContent = Math.round(cur.temperature_2m);
    els.feelsLike.textContent = Math.round(cur.apparent_temperature) + '\\u00B0C';

    els.todayHigh.textContent = Math.round(daily.temperature_2m_max[0]) + '\\u00B0';
    els.todayLow.textContent  = Math.round(daily.temperature_2m_min[0]) + '\\u00B0';
    els.sunrise.textContent   = clock(daily.sunrise[0]);
    els.sunset.textContent    = clock(daily.sunset[0]);

    var rainNow = data.hourly.precipitation_probability[idx] || 0;
    els.rainChance.textContent = Math.round(rainNow);
    els.rainBar.style.width = clamp(rainNow, 0, 100) + '%';
    els.rainSub.textContent = 'Current hour · ' + hourLabel(data.hourly.time[idx]);

    var hum = cur.relative_humidity_2m;
    els.humidity.textContent = Math.round(hum);
    els.humidityBar.style.width = clamp(hum, 0, 100) + '%';
    els.humiditySub.textContent = hum >= 85 ? 'Very humid — disease watch'
                              : hum >= 65 ? 'Comfortable range'
                              : 'Dry air';

    var wind = cur.wind_speed_10m;
    var dir = Math.round(cur.wind_direction_10m);
    els.windSpeed.textContent = Math.round(wind);
    els.windBar.style.width = clamp(wind / 60 * 100, 0, 100) + '%';
    els.windSub.textContent = 'From ' + cardinal(dir) + ' (' + dir + '\\u00B0) · gusts ' +
                              Math.round(cur.wind_gusts_10m) + ' km/h';

    var pNow = cur.pressure_msl;
    var pAheadIdx = Math.min(idx + 6, data.hourly.pressure_msl.length - 1);
    var pAhead = data.hourly.pressure_msl[pAheadIdx];
    var delta = (Number.isFinite(pAhead) ? pAhead : pNow) - pNow;

    els.pressure.textContent = Math.round(pNow);
    els.pressureBar.style.width = clamp((pNow - 960) / 65 * 100, 2, 100) + '%';
    els.pressureSub.textContent =
      (Math.abs(delta) < 0.6 ? 'Steady' : (delta < 0 ? 'Falling' : 'Rising')) +
      ' · ' + (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' hPa / 6h';

    els.roWind.textContent  = Math.round(wind) + ' km/h';
    els.roDir.textContent   = cardinal(dir) + ' · ' + dir + '\\u00B0';
    els.roGust.textContent  = Math.round(cur.wind_gusts_10m) + ' km/h';
    els.roPress.textContent = Math.round(pNow) + ' hPa';

    if (windLayer) windLayer.setWind(cur.wind_direction_10m, cur.wind_speed_10m);
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

      html += '<div class="hour-card' + (isNow ? ' is-now' : '') + '">';
      html +=   '<div class="hour-time">' + (isNow ? 'Now' : hourLabel(time)) + '</div>';
      html +=   '<div class="hour-temp">' + temp + '\\u00B0</div>';
      html +=   '<div class="hour-rain">';
      html +=     '<div class="bar"><span style="width:' + clamp(rain, 0, 100) + '%"></span></div>';
      html +=     '<span class="pct">' + rain + '%</span>';
      html +=   '</div>';
      html +=   '<div class="hour-wind">' + wind + ' km/h</div>';
      html += '</div>';
    }

    els.hourly.innerHTML = html;
  }

  function renderDaily(data) {
    var d = data.daily;
    var html = '';

    var wMin = Math.min.apply(null, d.temperature_2m_min);
    var wMax = Math.max.apply(null, d.temperature_2m_max);
    var span = Math.max(1, wMax - wMin);

    for (var i = 0; i < d.time.length; i++) {
      var tmax = d.temperature_2m_max[i];
      var tmin = d.temperature_2m_min[i];
      var left = clamp((tmin - wMin) / span * 100, 0, 96);
      var width = Math.max(4, clamp((tmax - tmin) / span * 100, 4, 100 - left));
      var rain = Math.round(d.precipitation_probability_max[i] || 0);
      var wind = Math.round(d.wind_speed_10m_max[i]);

      html += '<div class="day-row">';
      html +=   '<div class="day-name">' + dayLabel(d.time[i], i) +
                  '<span class="day-cond">' + wmoText(d.weather_code[i]) + '</span></div>';
      html +=   '<div class="day-range"><span style="left:' + left + '%;width:' + width + '%"></span></div>';
      html +=   '<div class="day-temp"><span class="max">' + Math.round(tmax) + '\\u00B0</span>' +
                  '<span class="min">' + Math.round(tmin) + '\\u00B0</span></div>';
      html +=   '<div class="day-rain"><div class="bar"><span style="width:' +
                  clamp(rain, 0, 100) + '%"></span></div><span class="pct">' + rain + '%</span></div>';
      html +=   '<div class="day-wind">' + wind + ' km/h</div>';
      html += '</div>';
    }

    els.daily.innerHTML = html;
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

    if (state.lat !== null) {
      updateStormCircle(state.lat, state.lon, risk);
    }
  }

  function setBusy(on) {
    state.busy = on;
    els.refreshBtn.classList.toggle('is-busy', on);
    els.refreshBtn.disabled = on;
  }

  function showError(msg) {
    els.loading.hidden = true;
    els.content.hidden = true;
    els.errorBox.hidden = false;
    els.errorMsg.textContent = msg || 'Please check your connection and try again.';
  }

  function stampNow() {
    var d = new Date();
    els.updatedAt.textContent = d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    });
  }

  function load(lat, lon, opts) {
    opts = opts || {};
    if (state.busy) return;

    var quiet = !!opts.quiet;

    if (!quiet) {
      els.loading.hidden = false;
      els.errorBox.hidden = true;
      els.content.hidden = true;
    }

    setBusy(true);
    els.gpsCoords.textContent = fmtCoord(lat, true) + ' · ' + fmtCoord(lon, false);
    els.gpsChip.setAttribute('data-state', 'ok');

    fetchWeather(lat, lon).then(function (weather) {
      state.data = weather;
      state.lat = lat;
      state.lon = lon;

      els.locCoords.textContent = fmtCoord(lat, true) + ' \\u00B7 ' + fmtCoord(lon, false);

      if (!opts.keepLabel) {
        els.locName.textContent = opts.label || 'Your location';
        els.locSub.textContent = opts.sub || 'Locating region…';
      }

      els.loading.hidden = true;
      els.errorBox.hidden = true;
      els.content.hidden = false;

      setTimeout(function () { initMap(lat, lon); }, 40);
      renderAll(weather);
      stampNow();

      try {
        localStorage.setItem('agriweather.pos', JSON.stringify({ lat: lat, lon: lon }));
      } catch (e) {}

      if (!opts.keepLabel) {
        reverseGeocode(lat, lon).then(function (place) {
          if (!place || !place.name || place.name === 'Your location') return;
          els.locName.textContent = place.name;

          var parts = [];
          if (place.region) parts.push(place.region);
          if (place.country && place.country !== 'Philippines') parts.push(place.country);

          els.locSub.textContent = parts.length ? parts.join(' \\u00B7 ') : 'Philippines';
        });
      }

      scheduleRefresh();
    }).catch(function (err) {
      if (quiet) return;
      showError('Could not reach the weather service' +
        (err && err.message ? ' (' + err.message + ')' : '') +
        '. Check your connection and try again.');
      els.gpsChip.setAttribute('data-state', 'error');
    }).then(function () {
      setBusy(false);
    });
  }

  function scheduleRefresh() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(function () {
      if (state.lat !== null && !document.hidden) {
        load(state.lat, state.lon, { quiet: true, keepLabel: true });
      }
    }, 10 * 60 * 1000);
  }

  function loadDefault() {
    els.gpsChip.setAttribute('data-state', 'error');
    els.gpsCoords.textContent = 'Manila (default)';
    load(DEFAULT_LAT, DEFAULT_LON, {
      label: 'Manila',
      sub: 'Metro Manila \\u00B7 Philippines'
    });
  }

  function boot() {
    initTheme();
    populateCrops();

    els.cropSelect.addEventListener('change', function () {
      try { localStorage.setItem('agriweather.crop', els.cropSelect.value); } catch (e) {}
      if (state.data) renderCrop(state.data);
    });

    els.stageSelect.addEventListener('change', function () {
      if (state.data) renderCrop(state.data);
    });

    els.refreshBtn.addEventListener('click', function () {
      if (state.lat !== null) {
        load(state.lat, state.lon, { quiet: true, keepLabel: true });
      } else {
        requestGeo();
      }
    });

    els.retryBtn.addEventListener('click', function () {
      if (state.lat !== null) {
        load(state.lat, state.lon, { keepLabel: true });
      } else {
        requestGeo();
      }
    });

    els.recenterBtn.addEventListener('click', function () {
      if (map && state.lat !== null) map.setView([state.lat, state.lon], 10);
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && state.lat !== null) {
        load(state.lat, state.lon, { quiet: true, keepLabel: true });
      }
    });

    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('agriweather.pos') || 'null'); } catch (e) {}

    if (cached && isFinite(cached.lat) && isFinite(cached.lon)) {
      load(cached.lat, cached.lon, { quiet: false });
      requestGeo(cached);
    } else {
      requestGeo(null);
    }
  }

  function distanceKm(a, b) {
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLon = (b.lon - a.lon) * Math.PI / 180;
    var la1 = a.lat * Math.PI / 180;
    var la2 = b.lat * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(la1) * Math.cos(la2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function requestGeo(previous) {
    if (!navigator.geolocation) {
      if (!previous) loadDefault();
      return;
    }

    if (!previous) els.gpsCoords.textContent = 'Locating…';

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;

        if (previous && distanceKm(previous, { lat: lat, lon: lon }) < 1.5) return;

        load(lat, lon, {});
      },
      function () {
        if (!previous) {
          loadDefault();
        } else {
          els.gpsChip.setAttribute('data-state', 'error');
          els.gpsCoords.textContent = 'Approximate';
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  }

  boot();
})();
</script>
</body>
</html>`;

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

const server = http.createServer(async (req, res) => {
  let u;
  try {
    u = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  } catch (err) {
    return sendJSON(res, 400, { error: 'Bad request' });
  }

  const path = u.pathname;

  try {
    if (path === '/' || path === '/index.html') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      return res.end(PAGE);
    }

    if (path === '/api/health') {
      return sendJSON(res, 200, { ok: true, uptime: process.uptime() });
    }

    if (path === '/api/weather')  return handleWeather(u, res);
    if (path === '/api/reverse')  return handleReverse(u, res);
    if (path === '/api/ndvi')     return handleNdvi(u, res);

    sendJSON(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[AgriWeather] handler error:', err);
    if (!res.headersSent) {
      sendJSON(res, 500, { error: String(err.message || err) });
    } else {
      try { res.end(); } catch (e) {}
    }
  }
});

/* ------------------------------------------------------------------ */
/*  Boot                                                               */
/* ------------------------------------------------------------------ */

server.listen(PORT, () => {
  console.log('[AgriWeather] Listening on http://localhost:' + PORT);
});

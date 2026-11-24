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
    border: 1px solid var(--bo

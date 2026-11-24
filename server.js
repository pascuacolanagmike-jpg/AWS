'use strict';

/**
 * 💖 BARBIE SERVER 💖
 * Pure Barbie vibes. No weather. No farm. Just chaos and glitter.
 *
 *   node server.js
 *   -> http://localhost:3000
 *
 * come on barbie, let's go party 🪩
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>💖 barbie 💖</title>
<meta name="theme-color" content="#ff2d95">
<meta name="description" content="hi barbie 💖">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Bungee&family=Fredoka:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  * { margin: 0; padding: 0; }

  :root {
    --pink: #ff2d95;
    --pink-2: #ff7ac8;
    --pink-3: #ffc2e6;
    --lavender: #b388ff;
    --ink: #3d0b2e;
    --white: #ffffff;
  }

  html, body { height: 100%; }

  body {
    font-family: 'Fredoka', system-ui, -apple-system, sans-serif;
    color: var(--ink);
    background:
      radial-gradient(circle at 15% 20%, #ffd1ec 0%, transparent 50%),
      radial-gradient(circle at 85% 10%, #ffb3d9 0%, transparent 45%),
      radial-gradient(circle at 75% 85%, #ffc2e6 0%, transparent 50%),
      radial-gradient(circle at 20% 90%, #e0b3ff 0%, transparent 45%),
      linear-gradient(135deg, #fff0f8 0%, #ffe3f3 50%, #ffd1ec 100%);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* =====================================================
     💅 START SCREEN (the prank)
     ===================================================== */
  .boot-screen {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 30px 24px;
    background:
      radial-gradient(circle at 20% 30%, #ff2d95 0%, transparent 55%),
      radial-gradient(circle at 80% 70%, #b388ff 0%, transparent 55%),
      linear-gradient(135deg, #ff2d95 0%, #b388ff 100%);
    color: #fff;
    transition: opacity .8s ease, transform .8s ease;
  }
  .boot-screen.is-gone {
    opacity: 0;
    transform: scale(1.15);
    pointer-events: none;
  }
  .boot-screen::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle, rgba(255,255,255,.35) 1px, transparent 1.5px),
      radial-gradient(circle, rgba(255,255,255,.25) 1px, transparent 1.5px);
    background-size: 70px 70px, 130px 130px;
    background-position: 0 0, 43px 61px;
    animation: sparkleDrift 20s linear infinite;
    pointer-events: none;
  }
  @keyframes sparkleDrift {
    to { background-position: 70px 70px, 173px 191px; }
  }

  .boot-inner {
    position: relative;
    z-index: 2;
    max-width: 720px;
    width: 100%;
  }

  .boot-kicker {
    font-family: 'Bungee', cursive;
    font-size: clamp(11px, 1.4vw, 13px);
    letter-spacing: .35em;
    text-transform: uppercase;
    opacity: .85;
    margin-bottom: 22px;
    animation: blink 1.6s ease-in-out infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: .35; }
    50%      { opacity: 1; }
  }

  .boot-logo {
    font-family: 'Bungee', cursive;
    font-size: clamp(44px, 11vw, 130px);
    line-height: .9;
    letter-spacing: -.01em;
    color: #fff;
    text-shadow:
      4px 4px 0 rgba(0,0,0,.18),
      0 0 60px rgba(255,255,255,.5);
    margin-bottom: 20px;
    animation: bootWobble 3s ease-in-out infinite;
  }
  @keyframes bootWobble {
    0%, 100% { transform: rotate(-1.5deg) scale(1); }
    50%      { transform: rotate(1.5deg) scale(1.03); }
  }

  .boot-sub {
    font-family: 'Pacifico', cursive;
    font-size: clamp(15px, 2.2vw, 22px);
    line-height: 1.4;
    opacity: .95;
    margin-bottom: 34px;
    text-shadow: 1px 1px 0 rgba(0,0,0,.18);
  }

  .boot-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 22px 48px;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    font-family: 'Bungee', cursive;
    font-size: clamp(14px, 2vw, 19px);
    letter-spacing: .15em;
    text-transform: uppercase;
    color: #ff2d95;
    background: #fff;
    box-shadow:
      0 10px 0 #ffc2e6,
      0 22px 44px -14px rgba(0,0,0,.5);
    transition: transform .15s ease, box-shadow .15s ease, background .2s ease;
    animation: bootBtnPulse 2s ease-in-out infinite;
  }
  @keyframes bootBtnPulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.035); }
  }
  .boot-btn:hover {
    background: #fff5fb;
    transform: translateY(-3px) scale(1.05);
    animation: none;
    box-shadow:
      0 13px 0 #ffc2e6,
      0 28px 54px -14px rgba(0,0,0,.55);
  }
  .boot-btn:active {
    transform: translateY(5px) scale(1.02);
    box-shadow:
      0 4px 0 #ffc2e6,
      0 10px 22px -14px rgba(0,0,0,.45);
  }
  .boot-btn__dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #ff2d95;
    box-shadow: 0 0 0 0 rgba(255,45,149,.55);
    animation: bootDotPing 1.4s ease-out infinite;
  }
  @keyframes bootDotPing {
    0%   { box-shadow: 0 0 0 0 rgba(255,45,149,.55); }
    80%  { box-shadow: 0 0 0 14px rgba(255,45,149,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,45,149,0); }
  }

  .boot-warn {
    margin-top: 26px;
    font-family: 'Fredoka', sans-serif;
    font-size: 11.5px;
    letter-spacing: .12em;
    text-transform: uppercase;
    opacity: .6;
    font-weight: 600;
  }

  .boot-fakebar {
    margin-top: 30px;
    max-width: 380px;
    margin-left: auto;
    margin-right: auto;
  }
  .boot-fakebar__label {
    display: flex;
    justify-content: space-between;
    font-family: 'Bungee', cursive;
    font-size: 10px;
    letter-spacing: .18em;
    text-transform: uppercase;
    opacity: .8;
    margin-bottom: 8px;
  }
  .boot-fakebar__track {
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.22);
    overflow: hidden;
  }
  .boot-fakebar__fill {
    height: 100%;
    width: 0%;
    border-radius: 999px;
    background: linear-gradient(90deg, #fff, #ffc2e6, #fff);
    background-size: 200% 100%;
    animation: fakeBar 3.6s ease-in-out infinite, hueSlide 3s linear infinite;
  }
  @keyframes fakeBar {
    0%   { width: 0%; }
    30%  { width: 22%; }
    50%  { width: 22%; }
    75%  { width: 78%; }
    90%  { width: 78%; }
    100% { width: 96%; }
  }
  @keyframes hueSlide { to { background-position: 200% 0; } }

  /* =====================================================
     🎵 YOUTUBE PLAYER (hidden iframe, audio kicks in)
     ===================================================== */
  .yt-hidden {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
    overflow: hidden;
    border: 0;
    z-index: -1;
  }

  /* =====================================================
     💖 MAIN CONTENT (revealed after boot)
     ===================================================== */
  .main-content {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity .9s ease .3s, transform .9s ease .3s;
  }
  .main-content.is-on {
    opacity: 1;
    transform: translateY(0);
  }

  /* ✨ MARQUEE ✨ */
  .marquee {
    position: relative;
    z-index: 10;
    overflow: hidden;
    padding: 14px 0;
    background: linear-gradient(90deg, #ff2d95, #ff7ac8, #b388ff, #ff2d95);
    background-size: 300% 100%;
    animation: marqueeBG 8s linear infinite;
    color: #fff;
    border-bottom: 4px solid #fff;
    box-shadow: 0 6px 24px rgba(255,45,149,.35);
  }
  @keyframes marqueeBG { to { background-position: 300% 0; } }
  .marquee__track {
    display: flex;
    gap: 60px;
    width: max-content;
    white-space: nowrap;
    animation: marqueeMove 32s linear infinite;
    font-family: 'Bungee', 'Fredoka', cursive;
    font-size: 14px;
    letter-spacing: .1em;
    text-transform: uppercase;
    text-shadow: 2px 2px 0 rgba(0,0,0,.18);
  }
  @keyframes marqueeMove {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ✨ HERO ✨ */
  .hero {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 60px 20px 20px;
  }

  .logo {
    font-family: 'Bungee', 'Fredoka', cursive;
    font-size: clamp(56px, 15vw, 180px);
    line-height: .9;
    background: linear-gradient(135deg, #ff2d95 0%, #ff7ac8 30%, #b388ff 65%, #ff2d95 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter:
      drop-shadow(4px 4px 0 #ffffff)
      drop-shadow(6px 6px 0 #ffc2e6)
      drop-shadow(10px 10px 30px rgba(255,45,149,.55));
    animation: logoPulse 4s ease-in-out infinite;
    letter-spacing: -.01em;
    user-select: none;
  }
  @keyframes logoPulse {
    0%, 100% { transform: scale(1) rotate(-2deg); background-position: 0% 50%; }
    50%      { transform: scale(1.04) rotate(2deg); background-position: 100% 50%; }
  }

  .tagline {
    font-family: 'Pacifico', cursive;
    font-size: clamp(18px, 3.4vw, 34px);
    color: #d1008f;
    margin-top: 20px;
    padding: 0 20px;
    text-shadow: 2px 2px 0 rgba(255,255,255,.7);
    line-height: 1.35;
    max-width: 900px;
  }

  /* ✨ GIF CARD ✨ */
  .gif-card {
    position: relative;
    z-index: 2;
    width: min(480px, 92vw);
    padding: 14px;
    margin: 40px auto 24px;
    border-radius: 30px;
    background: linear-gradient(135deg, #ff7ac8, #b388ff, #ff2d95);
    box-shadow:
      0 0 0 4px #ffffff,
      0 0 0 8px #ffc2e6,
      0 0 0 12px #ffffff,
      0 24px 60px -18px rgba(255,45,149,.75);
    transform: rotate(-2deg);
    animation: wiggle 6s ease-in-out infinite;
    transition: transform .4s ease, box-shadow .4s ease;
  }
  @keyframes wiggle {
    0%, 100% { transform: rotate(-2deg) scale(1); }
    50%      { transform: rotate(2deg) scale(1.02); }
  }
  .gif-card:hover {
    transform: rotate(0) scale(1.04);
    animation: none;
    box-shadow:
      0 0 0 4px #ffffff,
      0 0 0 8px #ffc2e6,
      0 0 0 12px #ffffff,
      0 30px 80px -18px rgba(255,45,149,.9);
  }
  .gif-card iframe {
    display: block;
    width: 100%;
    border: 0;
    border-radius: 22px;
    aspect-ratio: 480 / 389;
    background: #fff;
  }
  .gif-card__badge {
    position: absolute;
    top: -18px;
    left: 50%;
    transform: translateX(-50%) rotate(-3deg);
    padding: 8px 18px;
    border-radius: 999px;
    background: #fff;
    border: 3px solid #ff2d95;
    color: #ff2d95;
    font-family: 'Bungee', cursive;
    font-size: 11px;
    letter-spacing: .15em;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 6px 18px rgba(255,45,149,.35);
  }

  /* ✨ MESSAGES ✨ */
  .messages {
    position: relative;
    z-index: 2;
    margin: 20px auto 30px;
    max-width: 900px;
    padding: 0 24px;
    text-align: center;
    min-height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .message {
    font-family: 'Pacifico', cursive;
    font-size: clamp(22px, 4.6vw, 46px);
    line-height: 1.25;
    transition: opacity .5s ease, transform .5s ease;
    min-height: 2.6em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .message.swap {
    opacity: 0;
    transform: translateY(12px) rotate(-2deg) scale(.96);
  }
  .message__inner {
    background: linear-gradient(90deg, #ff2d95 0%, #b388ff 50%, #ff2d95 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: hueShift 5s linear infinite;
    padding: 4px 12px;
  }
  @keyframes hueShift { to { background-position: 200% 0; } }

  /* ✨ ACTION BUTTONS ✨ */
  .actions-wrap {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    justify-content: center;
    padding: 10px 20px 40px;
  }
  .vibe {
    display: inline-block;
    padding: 20px 36px;
    border-radius: 999px;
    background: linear-gradient(135deg, #ff2d95, #b388ff);
    color: #fff;
    text-decoration: none;
    font-family: 'Bungee', cursive;
    font-size: clamp(12px, 1.6vw, 15px);
    letter-spacing: .12em;
    text-transform: uppercase;
    text-align: center;
    box-shadow:
      0 8px 0 #d1008f,
      0 20px 40px -12px rgba(255,45,149,.7);
    transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
    text-shadow: 1px 1px 0 rgba(0,0,0,.15);
    border: 0;
    cursor: pointer;
    font-family: 'Bungee', cursive;
  }
  .vibe:hover {
    transform: translateY(-3px) rotate(-1deg);
    box-shadow:
      0 11px 0 #d1008f,
      0 24px 50px -12px rgba(255,45,149,.8);
    filter: brightness(1.06);
  }
  .vibe:active {
    transform: translateY(4px);
    box-shadow:
      0 4px 0 #d1008f,
      0 10px 20px -12px rgba(255,45,149,.6);
  }
  .vibe--mute {
    background: #fff;
    color: #ff2d95;
    box-shadow:
      0 8px 0 #ffc2e6,
      0 20px 40px -12px rgba(255,45,149,.5);
  }
  .vibe--mute:hover {
    box-shadow:
      0 11px 0 #ffc2e6,
      0 24px 50px -12px rgba(255,45,149,.6);
    background: #fff5fb;
  }
  .vibe--mute:active {
    box-shadow:
      0 4px 0 #ffc2e6,
      0 10px 20px -12px rgba(255,45,149,.4);
  }

  /* ✨ FOOTER ✨ */
  .footer {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 30px 20px 80px;
    font-family: 'Pacifico', cursive;
    font-size: clamp(16px, 2.4vw, 24px);
    color: #d1008f;
    text-shadow: 1px 1px 0 rgba(255,255,255,.7);
    line-height: 1.5;
  }
  .footer small {
    display: block;
    font-family: 'Fredoka', sans-serif;
    font-size: 11px;
    color: #a03a78;
    margin-top: 18px;
    letter-spacing: .18em;
    text-transform: uppercase;
    text-shadow: none;
    font-weight: 600;
  }

  /* ✨ FLOATERS ✨ */
  .floater {
    position: fixed;
    bottom: -60px;
    z-index: 1;
    pointer-events: none;
    animation: floatUp linear infinite;
    opacity: 0;
    user-select: none;
  }
  @keyframes floatUp {
    0%   { transform: translateY(0) rotate(0); opacity: 0; }
    10%  { opacity: .8; }
    90%  { opacity: .8; }
    100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
  }

  /* ✨ CURSOR SPARKLES ✨ */
  .sparkle {
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    font-size: 18px;
    animation: sparkleFloat .9s cubic-bezier(.2,.8,.2,1) forwards;
    transform: translate(-50%, -50%);
    user-select: none;
  }
  @keyframes sparkleFloat {
    0%   { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -180%) scale(.4) rotate(60deg); opacity: 0; }
  }

  /* ✨ DECORATIVE STARS ✨ */
  .star {
    position: fixed;
    pointer-events: none;
    z-index: 1;
    animation: twinkle 3s ease-in-out infinite;
    user-select: none;
  }
  @keyframes twinkle {
    0%, 100% { opacity: .3; transform: scale(.8) rotate(0); }
    50%      { opacity: 1; transform: scale(1.3) rotate(20deg); }
  }

  @media (max-width: 640px) {
    .hero { padding: 40px 16px 12px; }
    .gif-card { margin-top: 34px; }
    .message { min-height: 2.8em; }
    .boot-btn { padding: 18px 34px; }
  }
</style>
</head>
<body>

<!-- =====================================================
     💅 BOOT SCREEN (the prank)
     ===================================================== -->
<div class="boot-screen" id="bootScreen">
  <div class="boot-inner">
    <div class="boot-kicker">◉ system initializing ◉</div>
    <div class="boot-logo">BARBIE&nbsp;OS</div>
    <div class="boot-sub">defense is here… but luckily i'm pretty barbie</div>

    <button class="boot-btn" id="startBtn" type="button">
      <span class="boot-btn__dot"></span>
      <span>START THE SYSTEM</span>
      <span class="boot-btn__dot"></span>
    </button>

    <div class="boot-fakebar">
      <div class="boot-fakebar__label">
        <span>loading vibes</span>
        <span>100% plastic</span>
      </div>
      <div class="boot-fakebar__track">
        <div class="boot-fakebar__fill"></div>
      </div>
    </div>

    <div class="boot-warn">⚠ real system will not be started ⚠</div>
  </div>
</div>

<!-- =====================================================
     🎵 YOUTUBE (hidden, audio only after click)
     ===================================================== -->
<div id="ytHolder" style="position:fixed;bottom:0;right:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;"></div>

<!-- =====================================================
     💖 MAIN CONTENT
     ===================================================== -->
<div class="main-content" id="mainContent">

  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">
      <span>💖 hi barbie! 💖</span>
      <span>✨ come on barbie, let's go party ✨</span>
      <span>🎀 defense is here… but luckily i'm pretty barbie 🎀</span>
      <span>💅 life in plastic, it's fantastic 💅</span>
      <span>🌸 barbie girl, barbie girl 🌸</span>
      <span>🪩 make it pink! 🪩</span>
      <span>💖 hi barbie! 💖</span>
      <span>✨ come on barbie, let's go party ✨</span>
      <span>🎀 defense is here… but luckily i'm pretty barbie 🎀</span>
      <span>💅 life in plastic, it's fantastic 💅</span>
      <span>🌸 barbie girl, barbie girl 🌸</span>
      <span>🪩 make it pink! 🪩</span>
    </div>
  </div>

  <main>
    <section class="hero">
      <h1 class="logo">BARBIE</h1>
      <p class="tagline">defense is here… but luckily i'm pretty barbie 💖</p>
    </section>

    <div class="gif-card">
      <div class="gif-card__badge">✨ now playing ✨</div>
      <iframe
        src="https://giphy.com/embed/dvILshvavCEaM2tIWa"
        width="480" height="389"
        frameBorder="0"
        class="giphy-embed"
        allowFullScreen
        title="barbie mood"></iframe>
    </div>

    <section class="messages">
      <div class="message" id="msg">
        <span class="message__inner">barbie girl, barbie girl 💖</span>
      </div>
    </section>

    <div class="actions-wrap">
      <a href="https://ibb.co/60Dj9swV" target="_blank" rel="noopener" class="vibe">
        🎀 open the vibe board 🎀
      </a>
      <button class="vibe vibe--mute" id="muteBtn" type="button">
        🔊 mute the anthem
      </button>
    </div>

    <footer class="footer">
      💖 hi barbie! hi ken! hi allan! 💖
      <small>via GIPHY · 100% plastic, 0% tragic</small>
    </footer>
  </main>

</div>

<script>
(function () {
  'use strict';

  /* =====================================================
     💅 BOOT → PLAY MUSIC → REVEAL
     ===================================================== */
  var YT_VIDEO_ID = 'gsyha_CeetM';
  var ytPlayer = null;
  var ytReady = false;
  var ytMuted = false;

  var bootScreen = document.getElementById('bootScreen');
  var startBtn   = document.getElementById('startBtn');
  var mainContent = document.getElementById('mainContent');
  var ytHolder   = document.getElementById('ytHolder');
  var muteBtn    = document.getElementById('muteBtn');

  // Inject YouTube IFrame API (loaded async, but start click will wait)
  var ytApiReady = false;
  window.onYouTubeIframeAPIReady = function () {
    ytApiReady = true;
  };

  (function loadYTAPI() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  })();

  function createPlayer() {
    if (!ytApiReady) {
      // try again shortly
      setTimeout(createPlayer, 100);
      return;
    }
    if (ytPlayer) return;

    var playerDiv = document.createElement('div');
    playerDiv.id = 'ytPlayerDiv';
    ytHolder.appendChild(playerDiv);

    ytPlayer = new YT.Player('ytPlayerDiv', {
      height: '1',
      width: '1',
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        loop: 1,
        playlist: YT_VIDEO_ID
      },
      events: {
        onReady: function (e) {
          ytReady = true;
          e.target.setVolume(80);
          e.target.playVideo();
        },
        onStateChange: function (e) {
          // if somehow paused, keep it looping
          if (e.data === 0) e.target.playVideo();
        }
      }
    });
  }

  function startBarbie() {
    // 1. Kick off music (user gesture = allowed to autoplay)
    createPlayer();

    // 2. Fade out boot screen
    bootScreen.classList.add('is-gone');

    // 3. Reveal main content
    setTimeout(function () {
      mainContent.classList.add('is-on');
      bootScreen.style.display = 'none';
    }, 500);

    // 4. Explosion of sparkles for good measure
    var rect = startBtn.getBoundingClientRect();
    burstSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
  }

  startBtn.addEventListener('click', startBarbie);

  /* Mute toggle */
  muteBtn.addEventListener('click', function () {
    if (!ytPlayer || !ytReady) return;
    ytMuted = !ytMuted;
    if (ytMuted) {
      ytPlayer.mute();
      muteBtn.textContent = '🔇 unmute the anthem';
    } else {
      ytPlayer.unMute();
      muteBtn.textContent = '🔊 mute the anthem';
    }
  });

  /* =====================================================
     ✨ ROTATING BARBIE MESSAGES
     ===================================================== */
  var MESSAGES = [
    'barbie girl, barbie girl 💖',
    'defense is here… but luckily i\\'m pretty barbie ✨',
    'come on barbie, let\\'s go party 🪩',
    'LIFE IN PLASTIC, IT\\'S FANTASTIC 💅',
    'hi barbie! hi ken! hi allan! 👋',
    'i\\'m a barbie girl, in a barbie world 🌍',
    '100% plastic, 0% tragic 💖',
    'MALIBU DREAMHOUSE SAYS HI 🌴',
    'make it pink! 🎀',
    'you can brush my hair, undress me everywhere 💇‍♀️',
    'imagination, life is your creation ✨',
    'come on barbie let\\'s go party (ah ah ah yeah) 🎵'
  ];

  var msgEl = document.getElementById('msg');
  var msgInner = msgEl.querySelector('.message__inner');
  var msgIdx = 0;

  setInterval(function () {
    msgEl.classList.add('swap');
    setTimeout(function () {
      msgIdx = (msgIdx + 1) % MESSAGES.length;
      msgInner.textContent = MESSAGES[msgIdx];
      msgEl.classList.remove('swap');
    }, 500);
  }, 3800);

  /* =====================================================
     ✨ SPARKLE BURST HELPER
     ===================================================== */
  var EMOJIS = ['✨','💖','🌸','💅','🎀','⭐','💕','🦋','🩷','💫'];

  function burstSparkles(x, y, count) {
    for (var i = 0; i < count; i++) {
      (function (i) {
        var s = document.createElement('div');
        s.className = 'sparkle';
        s.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.style.animation = 'none';
        var angle = (Math.PI * 2 * i) / count;
        var dist = 90 + Math.random() * 160;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist;
        s.animate(
          [
            { transform: 'translate(-50%, -50%) scale(1.2) rotate(0)', opacity: 1 },
            { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.3) rotate(180deg)', opacity: 0 }
          ],
          { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
        document.body.appendChild(s);
        setTimeout(function () { s.remove(); }, 1400);
      })(i);
    }
  }

  /* =====================================================
     ✨ CURSOR SPARKLES
     ===================================================== */
  var lastSparkle = 0;
  document.addEventListener('mousemove', function (e) {
    var now = Date.now();
    if (now - lastSparkle < 55) return;
    lastSparkle = now;
    var s = document.createElement('div');
    s.className = 'sparkle';
    s.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    s.style.left = e.clientX + 'px';
    s.style.top = e.clientY + 'px';
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 950);
  });

  document.addEventListener('click', function (e) {
    burstSparkles(e.clientX, e.clientY, 10);
  });

  /* =====================================================
     ✨ FLOATERS + STARS
     ===================================================== */
  var FLOATERS = ['💖','💕','✨','🌸','🎀','💅','⭐','🦋','🌴','💫','🩷','🎠','🌷','🎵'];
  for (var i = 0; i < 26; i++) {
    var f = document.createElement('div');
    f.className = 'floater';
    f.textContent = FLOATERS[Math.floor(Math.random() * FLOATERS.length)];
    f.style.left = Math.random() * 100 + '%';
    f.style.animationDelay = (Math.random() * 20) + 's';
    f.style.animationDuration = (14 + Math.random() * 22) + 's';
    f.style.fontSize = (16 + Math.random() * 30) + 'px';
    document.body.appendChild(f);
  }

  var STARS = ['✦','✧','★','☆','✩'];
  for (var j = 0; j < 12; j++) {
    var st = document.createElement('div');
    st.className = 'star';
    st.textContent = STARS[Math.floor(Math.random() * STARS.length)];
    st.style.left = Math.random() * 100 + '%';
    st.style.top = Math.random() * 100 + '%';
    st.style.fontSize = (14 + Math.random() * 30) + 'px';
    st.style.color = Math.random() > .5 ? '#ff2d95' : '#b388ff';
    st.style.animationDelay = (Math.random() * 3) + 's';
    st.style.animationDuration = (2 + Math.random() * 4) + 's';
    document.body.appendChild(st);
  }
})();
</script>

</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('method not allowed');
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(PAGE);
});

server.listen(PORT, () => {
  console.log("💖 barbie server running at http://localhost:" + PORT);
  console.log("   🎵 now with a fake 'start the system' button");
  console.log("   come on barbie, let's go party 🪩");
});

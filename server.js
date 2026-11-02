// server.js
const http = require('http');

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IOT Controller Boot Fault</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    height: 100%;
    background: #000000;
    color: #c8c8c8;
    font-family: "Consolas", "Lucida Console", "Courier New", monospace;
    font-size: 15px;
    line-height: 1.55;
    padding: 40px 48px;
  }

  .header {
    color: #ffffff;
    background: #0000a8;
    padding: 2px 10px;
    display: inline-block;
    letter-spacing: 1px;
    font-weight: bold;
    margin-bottom: 24px;
  }

  .rule {
    border-top: 1px solid #3a3a3a;
    margin: 14px 0;
  }

  .section-title {
    color: #ffffff;
    background: #5a5a5a;
    padding: 1px 8px;
    display: inline-block;
    margin: 18px 0 8px 0;
    letter-spacing: 0.5px;
  }

  .row {
    display: grid;
    grid-template-columns: 260px 1fr;
    column-gap: 12px;
  }

  .k { color: #8a8a8a; }
  .v { color: #e8e8e8; }
  .v.warn { color: #ffcc00; }
  .v.err  { color: #ff5555; }
  .v.ok   { color: #55ff88; }

  .block {
    margin: 6px 0 6px 0;
    white-space: pre;
    color: #b8b8b8;
  }

  .blink {
    display: inline-block;
    width: 9px;
    height: 15px;
    background: #c8c8c8;
    vertical-align: -2px;
    animation: blink 1s steps(1) infinite;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  .footer {
    margin-top: 28px;
    color: #8a8a8a;
  }

  .contact {
    color: #ffffff;
    font-size: 18px;
    letter-spacing: 2px;
    margin-top: 10px;
  }
</style>
</head>
<body>

<div class="header">IOT-CONTROLLER FIRMWARE &nbsp; UEFI BOOT AGENT</div>

<div>Platform &nbsp; IOT-CTRL-M4 &nbsp; &nbsp; Firmware &nbsp; 2.4.1</div>
<div>Build &nbsp; 0x3F00A1 &nbsp; &nbsp; Secure Boot &nbsp; ENFORCED</div>

<div class="rule"></div>

<div>SELF TEST &nbsp; . . . . . . . . . . . . . <span class="v err">FAILED</span></div>
<div>MCU CORE &nbsp; . . . . . . . . . . . . . . <span class="v ok">OK</span></div>
<div>SRAM / HEAP &nbsp; . . . . . . . . . . . . <span class="v ok">OK</span></div>
<div>FLASH PARTITION &nbsp; . . . . . . . . . . <span class="v err">CORRUPTED</span></div>
<div>EEPROM CONFIG &nbsp; . . . . . . . . . . . <span class="v warn">MISMATCH</span></div>
<div>SENSOR BUS I2C &nbsp; . . . . . . . . . . . <span class="v ok">OK</span></div>
<div>SENSOR BUS SPI &nbsp; . . . . . . . . . . . <span class="v warn">TIMEOUT</span></div>
<div>RADIO MODULE &nbsp; . . . . . . . . . . . . <span class="v ok">OK</span></div>
<div>POWER RAIL &nbsp; . . . . . . . . . . . . . <span class="v err">FAULT FF</span></div>
<div>BROWN-OUT DETECT &nbsp; . . . . . . . . . <span class="v err">TRIPPED</span></div>

<div class="rule"></div>

<div class="section-title">BOOT EVENT LOG</div>

<div class="block">[0000] boot agent start
[0008] board descriptor read ................ MODIFIED
[0013] board regulator check ............... UNREGULATED
[0017] power rail sense .................... TRIP FF
[0021] brown-out latch ..................... SET
[0024] flash partition hash ................ MISMATCH
[0028] eeprom config block ................. INVALID
[0031] recovery image ...................... NOT FOUND
[0034] secure boot verify .................. FAILED
[0036] boot halted
[0036] device locked in protected state</div>

<div class="rule"></div>

<div class="section-title">FAULT SUMMARY</div>

<div class="row"><div class="k">Board State</div><div class="v err">MODIFIED / UNREGULATED</div></div>
<div class="row"><div class="k">Power Trip</div><div class="v err">FF</div></div>
<div class="row"><div class="k">Brown-Out</div><div class="v err">TRIPPED</div></div>
<div class="row"><div class="k">Firmware</div><div class="v err">CORRUPTED</div></div>
<div class="row"><div class="k">EEPROM Config</div><div class="v err">INVALID</div></div>
<div class="row"><div class="k">Recovery</div><div class="v err">UNAVAILABLE</div></div>
<div class="row"><div class="k">Thermal Zone</div><div class="v">MCU CORE / SENSOR 3F</div></div>
<div class="row"><div class="k">Fault Code</div><div class="v">0xFF3A2C91</div></div>
<div class="row"><div class="k">Reference</div><div class="v">PWRTRIP-UNREG-MODBRD</div></div>
<div class="row"><div class="k">Device ID</div><div class="v">IOT-4F4C-DEAD-CAFE</div></div>
<div class="row"><div class="k">Uptime</div><div class="v">00:00:04</div></div>
<div class="row"><div class="k">Timestamp</div><div class="v" id="ts">--</div></div>

<div class="rule"></div>

<div>Firmware has been corrupted due to an unregulated power trip</div>
<div>from an unregulated power supply. The device is locked in a</div>
<div>protected state until serviced by an authorized technician.</div>

<div class="footer">
  For service and recovery contact technician at
  <div class="contact">446538</div>
</div>

<div style="margin-top:22px">
  Awaiting recovery image <span class="blink"></span>
</div>

<script>
  var now = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  document.getElementById('ts').textContent =
    now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
    ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
</script>

</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});

const PORT = process.env.PORT || 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('Port ' + PORT + ' is busy. Try: $env:PORT=3001; node server.js');
  } else {
    throw err;
  }
});

server.listen(PORT, () => {
  console.log('IoT UEFI fault page running on http://localhost:' + PORT);
});

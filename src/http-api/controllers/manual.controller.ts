import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

function makeManualHtml(): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MR7901 Manual Query</title>
  <style>
    :root { --bg:#f5f3ef; --fg:#1a1a1a; --card:#fff; --accent:#0f766e; --line:#ddd; }
    body { margin:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:linear-gradient(160deg,#f5f3ef,#e9ecef); color:var(--fg); }
    .wrap { max-width:1000px; margin:24px auto; padding:0 14px; }
    .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; box-shadow:0 8px 24px rgba(0,0,0,.06); }
    h1 { margin:0 0 12px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; }
    label { font-size:12px; font-weight:600; }
    input, select, button { width:100%; box-sizing:border-box; padding:10px; border-radius:8px; border:1px solid #cbd5e1; }
    button { cursor:pointer; background:var(--accent); color:white; border:none; font-weight:700; }
    pre { white-space:pre-wrap; background:#0b1220; color:#d1fae5; padding:12px; border-radius:8px; overflow:auto; max-height:450px; }
    .row { margin-top:12px; }
    .links { display:flex; gap:12px; margin:10px 0 14px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Manual Tag Query</h1>
      <div class="links">
        <a href="/docs" target="_blank">Swagger UI</a>
        <a href="/openapi.json" target="_blank">OpenAPI JSON</a>
      </div>
      <div class="grid">
        <div><label>Tag ID</label><input id="tagid" placeholder="16100001" /></div>
        <div><label>Device</label><input id="device" placeholder="8616940..." /></div>
        <div><label>TLV Type</label><input id="tlvtype" placeholder="0x8B01" /></div>
        <div><label>Entry</label><select id="entry"><option value="">Any</option><option value="1">1</option><option value="0">0</option></select></div>
        <div><label>Staying</label><select id="staying"><option value="">Any</option><option value="1">1</option><option value="0">0</option></select></div>
        <div><label>Limit</label><input id="limit" type="number" value="100" /></div>
        <div><label>Offset</label><input id="offset" type="number" value="0" /></div>
      </div>
      <div class="row" style="display:flex;gap:10px;">
        <button id="btnQuery">Consultar</button>
        <button id="btnClear" style="background:#b91c1c;">Limpiar Data</button>
      </div>
      <div class="row"><pre id="result">Sin resultados aun.</pre></div>
    </div>
  </div>
  <script>
    async function doQuery() {
      const payload = {
        tagid: document.getElementById('tagid').value,
        device: document.getElementById('device').value,
        tlvtype: document.getElementById('tlvtype').value,
        entry: document.getElementById('entry').value,
        staying: document.getElementById('staying').value,
        limit: Number(document.getElementById('limit').value || 100),
        offset: Number(document.getElementById('offset').value || 0)
      };

      if (payload.entry === '') delete payload.entry;
      if (payload.staying === '') delete payload.staying;

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      document.getElementById('result').textContent = JSON.stringify(data, null, 2);
    }

    async function clearData() {
      const res = await fetch('/api/tags', { method: 'DELETE' });
      const data = await res.json();
      document.getElementById('result').textContent = JSON.stringify(data, null, 2);
    }

    document.getElementById('btnQuery').addEventListener('click', doQuery);
    document.getElementById('btnClear').addEventListener('click', clearData);
  </script>
</body>
</html>`;
}

@ApiExcludeController()
@Controller()
export class ManualController {
  @Get('manual')
  @Header('Content-Type', 'text/html')
  getManual(): string {
    return makeManualHtml();
  }
}

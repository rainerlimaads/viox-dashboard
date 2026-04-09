/* ============================================
   VIOX STRATEGY · PERFORMANCE DASHBOARD
   app.js — Google Sheets (Meta Ads Export) + IA
   Colunas: A=Campaign B=Reach C=Impressions D=Frequency
            E=AmountSpent F=CPM G=LinkClicks H=CPC
            I=CTR J=Purchases K=CostPerPurchase
            L=LandingPageViews M=CheckoutsInitiated
            N=CostPerCheckout O=PurchaseConversionValue P=Day
   ============================================ */

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
let CONFIG = {};
let CLIENTS = [];
let CURRENT = {};
let DATA = {};

// ─── INIT ──────────────────────────────────────
window.onload = () => loadConfig();

function loadConfig() {
  const raw = localStorage.getItem('viox_config');
  if (!raw) { showSetup(); return; }
  try {
    CONFIG = JSON.parse(raw);
    CLIENTS = parseClients(CONFIG.rawClients || '');
    if (!CLIENTS.length) { showSetup(); return; }
    bootDashboard();
  } catch(e) { showSetup(); }
}

function parseClients(raw) {
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const parts = l.split('|');
    return { name: (parts[0]||'').trim(), accountId: (parts[1]||'').trim(), sheetId: (parts[2]||'').trim() };
  }).filter(c => c.name);
}

function saveConfig() {
  const token     = document.getElementById('cfg-token').value.trim();
  const rawClients= document.getElementById('cfg-clients').value.trim();
  const sheetsKey = document.getElementById('cfg-sheets-key').value.trim();
  const claudeKey = document.getElementById('cfg-claude').value.trim();
  if (!rawClients) { alert('Adicione ao menos um cliente.'); return; }
  CONFIG = { token, rawClients, sheetsKey, claudeKey };
  localStorage.setItem('viox_config', JSON.stringify(CONFIG));
  CLIENTS = parseClients(rawClients);
  bootDashboard();
}

function openSetup() {
  const raw = localStorage.getItem('viox_config');
  if (raw) {
    const c = JSON.parse(raw);
    document.getElementById('cfg-token').value      = c.token || '';
    document.getElementById('cfg-clients').value    = c.rawClients || '';
    document.getElementById('cfg-sheets-key').value = c.sheetsKey || '';
    document.getElementById('cfg-claude').value     = c.claudeKey || '';
  }
  showSetup();
}

function showSetup() {
  document.getElementById('setup-screen').style.display = 'flex';
  document.getElementById('topbar').style.display = 'none';
  document.getElementById('tabs').style.display   = 'none';
  document.getElementById('pages').style.display  = 'none';
}

function hideSetup() {
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('topbar').style.display = 'flex';
  document.getElementById('tabs').style.display   = 'flex';
  document.getElementById('pages').style.display  = 'block';
}

function bootDashboard() {
  hideSetup();
  const sel = document.getElementById('client-select');
  sel.innerHTML = '';
  CLIENTS.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = c.name;
    sel.appendChild(opt);
  });
  switchClient();
}

function switchClient() {
  const idx = parseInt(document.getElementById('client-select').value) || 0;
  CURRENT = CLIENTS[idx] || CLIENTS[0];
  loadData();
}

// ─── DATE HELPERS ──────────────────────────────
function getDateRange(preset) {
  const now = new Date();
  const toStr = d => d.toISOString().split('T')[0];
  const sub = (d, n) => { const x = new Date(d); x.setDate(x.getDate()-n); return x; };
  switch(preset) {
    case 'last_7d':    return { from: toStr(sub(now,7)),  to: toStr(now) };
    case 'last_14d':   return { from: toStr(sub(now,14)), to: toStr(now) };
    case 'last_30d':   return { from: toStr(sub(now,30)), to: toStr(now) };
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toStr(s), to: toStr(now) };
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toStr(s), to: toStr(e) };
    }
    default: return { from: toStr(sub(now,7)), to: toStr(now) };
  }
}

// ─── LOAD DATA ─────────────────────────────────
async function loadData() {
  showLoading(true);
  clearError();

  const preset = document.getElementById('date-select').value;
  const range  = getDateRange(preset);

  // Try Google Sheets first (primary source)
  if (CURRENT.sheetId && CONFIG.sheetsKey) {
    try {
      await loadFromSheets(CURRENT.sheetId, CONFIG.sheetsKey, range);
      showLoading(false);
      return;
    } catch(e) {
      console.warn('Sheets error:', e.message);
    }
  }

  // Try Meta API fallback
  if (CONFIG.token && CURRENT.accountId) {
    try {
      await loadFromMetaAPI(range, preset);
      showLoading(false);
      return;
    } catch(e) {
      console.warn('Meta API error:', e.message);
      showError('Erro Meta API: ' + e.message);
    }
  }

  // Demo fallback
  renderDemo();
  showLoading(false);
}

// ─── GOOGLE SHEETS READER ──────────────────────
async function loadFromSheets(sheetId, apiKey, range) {
  // Detect sheet name from first request
  const metaUrl = `${SHEETS_API}/${sheetId}?fields=sheets.properties.title&key=${apiKey}`;
  let sheetName = 'Página1';
  try {
    const metaRes = await fetch(metaUrl);
    const metaJson = await metaRes.json();
    if (metaJson.sheets?.[0]?.properties?.title) {
      sheetName = metaJson.sheets[0].properties.title;
    }
  } catch(e) {}

  const url = `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(sheetName)}!A:P?key=${apiKey}`;
  const res  = await fetch(url);
  const json = await res.json();

  if (json.error) throw new Error(json.error.message);

  const rows = json.values || [];
  if (rows.length < 2) throw new Error('Planilha vazia ou sem dados');

  // Parse rows: row[0] = headers, rest = data
  const headers = rows[0].map(h => h.trim());
  const COL = {};
  headers.forEach((h, i) => { COL[h] = i; });

  // Map columns (by position based on known structure)
  const C = {
    name:      COL['Campaign Name']              ?? 0,
    reach:     COL['Reach']                      ?? 1,
    impr:      COL['Impressions']                ?? 2,
    freq:      COL['Frequency']                  ?? 3,
    spend:     COL['Amount Spent']               ?? 4,
    cpm:       COL['CPM (Cost per 1,000 Impressions)'] ?? COL['CPM'] ?? 5,
    clicks:    COL['Link Clicks']                ?? 6,
    cpc:       COL['CPC (Cost per Link Click)']  ?? COL['CPC'] ?? 7,
    ctr:       COL['CTR (Link Click-Through Rate)'] ?? COL['CTR'] ?? 8,
    purchases: COL['Purchases']                  ?? 9,
    costPurch: COL['Cost per Purchase']          ?? 10,
    lpViews:   COL['Landing Page Views']         ?? 11,
    checkouts: COL['Checkouts Initiated']        ?? COL['Initiate Checkout'] ?? 12,
    costCheck: COL['Cost per Checkout']          ?? 13,
    convValue: COL['Purchases Conversion Value'] ?? COL['Purchase Conversion Value'] ?? 14,
    day:       COL['Day']                        ?? 15,
  };

  // Filter by date range (normalize dates from any format)
  const dataRows = rows.slice(1).filter(r => {
    const raw = r[C.day];
    if (!raw) return false; // exclude rows without date
    const d = normalizeDate(raw);
    if (!d) return false;
    return d >= range.from && d <= range.to;
  });

  // Aggregate totals
  let spend=0, reach=0, impr=0, clicks=0, purchases=0, convValue=0, checkouts=0, lpViews=0;
  let freqSum=0, cpmSum=0, ctrSum=0, n=0;
  const campaignMap = {};

  dataRows.forEach(r => {
    const s = num(r[C.spend]);
    if (s === 0 && num(r[C.reach]) === 0) return; // skip empty rows

    spend     += s;
    reach     += num(r[C.reach]);
    impr      += num(r[C.impr]);
    clicks    += num(r[C.clicks]);
    purchases += num(r[C.purchases]);
    convValue += num(r[C.convValue]);
    checkouts += num(r[C.checkouts]);
    lpViews   += num(r[C.lpViews]);
    freqSum   += num(r[C.freq]);
    cpmSum    += num(r[C.cpm]);
    ctrSum    += num(r[C.ctr]);
    n++;

    // Per campaign aggregation
    const cname = r[C.name] || 'Sem nome';
    if (!campaignMap[cname]) campaignMap[cname] = { name:cname, spend:0, reach:0, purchases:0, checkouts:0, convValue:0, freq:0, fn:0 };
    campaignMap[cname].spend     += s;
    campaignMap[cname].reach     += num(r[C.reach]);
    campaignMap[cname].purchases += num(r[C.purchases]);
    campaignMap[cname].checkouts += num(r[C.checkouts]);
    campaignMap[cname].convValue += num(r[C.convValue]);
    campaignMap[cname].freq      += num(r[C.freq]);
    campaignMap[cname].fn++;
  });

  const freq = n > 0 ? freqSum / n : 0;
  const cpm  = n > 0 ? cpmSum  / n : 0;
  const ctr  = n > 0 ? ctrSum  / n : 0;
  const campaigns = Object.values(campaignMap).sort((a,b) => b.spend - a.spend);

  DATA = { spend, reach, impr, freq, cpm, ctr, clicks, purchases, convValue, checkouts, lpViews, campaigns, source: 'sheets' };
  renderFromData(DATA);
}

// ─── META API FALLBACK ─────────────────────────
async function loadFromMetaAPI(range, preset) {
  const qs = p => new URLSearchParams({ ...p, access_token: CONFIG.token });
  const get = async (path, params) => {
    const res = await fetch(`https://graph.facebook.com/v19.0${path}?${qs(params)}`);
    const j = await res.json();
    if (j.error) throw new Error(j.error.message);
    return j;
  };

  const [insR, campR] = await Promise.all([
    get(`/act_${CURRENT.accountId}/insights`, {
      fields: 'spend,reach,impressions,frequency,actions,action_values,ctr,cpm,clicks',
      date_preset: preset, level: 'account'
    }),
    get(`/act_${CURRENT.accountId}/campaigns`, {
      fields: `name,status,insights.date_preset(${preset}){spend,reach,impressions,frequency,actions,action_values}`,
      limit: 20
    })
  ]);

  const ins = insR.data?.[0] || {};
  const spend     = parseFloat(ins.spend || 0);
  const reach     = parseInt(ins.reach || 0);
  const impr      = parseInt(ins.impressions || 0);
  const freq      = parseFloat(ins.frequency || 0);
  const cpm       = parseFloat(ins.cpm || 0);
  const ctr       = parseFloat(ins.ctr || 0);
  const clicks    = parseInt(ins.clicks || 0);
  const actions   = ins.actions || [];
  const purchases = extractAction(actions, ['purchase','offsite_conversion.fb_pixel_purchase']);
  const convValue = extractValue(ins.action_values || [], ['purchase','offsite_conversion.fb_pixel_purchase']);

  const campaigns = (campR.data || []).map(c => {
    const ci = c.insights?.data?.[0] || {};
    return {
      name: c.name, status: c.status,
      spend: parseFloat(ci.spend||0), reach: parseInt(ci.reach||0),
      purchases: extractAction(ci.actions||[], ['purchase']),
      freq: parseFloat(ci.frequency||0)
    };
  }).sort((a,b) => b.spend - a.spend);

  DATA = { spend, reach, impr, freq, cpm, ctr, clicks, purchases, convValue, checkouts: 0, lpViews: 0, campaigns, source: 'meta' };
  renderFromData(DATA);
}

// ─── RENDER ────────────────────────────────────
function renderFromData(d) {
  const { spend, reach, impr, freq, cpm, ctr, clicks, purchases, convValue, checkouts, lpViews, campaigns } = d;
  const roas        = spend > 0 ? convValue / spend : 0;
  const cac         = purchases > 0 ? spend / purchases : 0;
  const ticketMedio = purchases > 0 ? convValue / purchases : 0;
  const cpPurchase  = cac;

  renderKPINegocio({ convValue, spend, roas, cac, ticketMedio, purchases });
  renderKPITrafego({ cpPurchase, purchases, freq, cpm, ctr });
  renderAlertas({ cpPurchase, freq, purchases, campaigns });
  renderFunil({ reach, clicks, lpViews, checkouts, purchases });
  renderFatSplit({ fatPago: convValue, fatOrg: 0, fatTotal: convValue });
  renderCriativos([]);
  renderCampaignsFromData(campaigns);
  renderSaude({ cpl: cpPurchase, frequency: freq, roas, leads: purchases });
  renderPlanoAcao({ cpl: cpPurchase, frequency: freq, roas });
}

// ─── KPI NEGÓCIO ───────────────────────────────
function renderKPINegocio({ convValue, spend, roas, cac, ticketMedio, purchases }) {
  document.getElementById('kpi-negocio').innerHTML = `
    ${kpiCard('green', `
      <div class="card-label">Faturamento (Meta Ads)</div>
      <div class="card-value green">${brl(convValue)}</div>
      <div class="card-delta">Purchase Conversion Value</div>
      <div class="card-source">● Google Sheets (Meta Export)</div>
    `)}
    ${kpiCard('blue', `
      <div class="card-label">Investido</div>
      <div class="card-value blue">${brl(spend)}</div>
      <div class="card-delta">Amount Spent no período</div>
      <div class="card-source">● Google Sheets (Meta Export)</div>
    `)}
    ${kpiCard('green', `
      <div class="card-label">ROAS</div>
      <div class="card-value ${roas>=5?'green':roas>=2?'yellow':'red'}">${roas.toFixed(1)}x</div>
      <div class="card-delta">Meta mínima: <span class="delta-up">5x</span></div>
      <div class="card-source">● Fórmula: Faturamento ÷ Investido</div>
    `)}
    ${kpiCard('', `
      <div class="card-label">CAC (Custo por Compra)</div>
      <div class="card-value">${brl(cac)}</div>
      <div class="card-delta">Investido ÷ ${purchases > 0 ? Math.round(spend/cac) : 0} compras</div>
      <div class="card-source">● Fórmula: Investido ÷ Purchases</div>
    `)}
    ${kpiCard('yellow', `
      <div class="card-label">Ticket Médio</div>
      <div class="card-value yellow">${brl(ticketMedio)}</div>
      <div class="card-delta">Faturamento ÷ compras</div>
      <div class="card-source">● Google Sheets (Meta Export)</div>
    `)}
  `;
}

// ─── KPI TRÁFEGO ───────────────────────────────
function renderKPITrafego({ cpPurchase, purchases, freq, cpm, ctr }) {
  document.getElementById('kpi-trafego').innerHTML = `
    ${kpiCard('', `
      <div class="card-label">Custo por Compra</div>
      <div class="card-value ${cpPurchase<200?'green':cpPurchase<500?'yellow':'red'}">${brl(cpPurchase)}</div>
      <div class="card-delta">Cost per Purchase</div>
      <div class="card-source">● Google Sheets</div>
    `)}
    ${kpiCard('', `
      <div class="card-label">Compras no Período</div>
      <div class="card-value">${purchases}</div>
      <div class="card-delta">Total de Purchases</div>
      <div class="card-source">● Google Sheets</div>
    `)}
    ${kpiCard('', `
      <div class="card-label">Frequência</div>
      <div class="card-value ${freq<2.5?'green':'red'}">${freq.toFixed(2)}</div>
      <div class="card-delta">Limite: <span class="${freq<2.5?'delta-up':'delta-dn'}">2,5</span></div>
      <div class="card-source">● Google Sheets</div>
    `)}
    ${kpiCard('', `
      <div class="card-label">CPM</div>
      <div class="card-value">${brl(cpm)}</div>
      <div class="card-delta">Custo por 1.000 impressões</div>
      <div class="card-source">● Google Sheets</div>
    `)}
  `;
}

// ─── ALERTAS ───────────────────────────────────
function renderAlertas({ cpPurchase, freq, purchases, campaigns }) {
  const items = [];

  if (purchases === 0) {
    items.push({ type:'alert', emoji:'⚠', title:'Sem compras no período', text:'Nenhuma compra registrada. Verificar pixel, campanha e criativos.' });
  } else if (cpPurchase < 200) {
    items.push({ type:'positive', emoji:'✓', title:'Custo por compra eficiente', text:`Custo por compra em <strong>${brl(cpPurchase)}</strong>. Performance acima da média para e-commerce.` });
  } else {
    items.push({ type:'alert', emoji:'⚠', title:'Custo por compra alto', text:`Custo por compra em <strong>${brl(cpPurchase)}</strong>. Revisar criativos e segmentação.` });
  }

  if (freq > 2.5) {
    items.push({ type:'alert', emoji:'⚠', title:'Frequência alta', text:`Frequência em <strong>${freq.toFixed(2)}</strong> — audiência saturando. Novos criativos urgente.` });
  } else {
    items.push({ type:'positive', emoji:'✓', title:'Frequência saudável', text:`Frequência em <strong>${freq.toFixed(2)}</strong> — dentro do limite ideal.` });
  }

  const topCamp = campaigns?.[0];
  if (topCamp) {
    items.push({ type:'action', emoji:'→', title:'Campanha principal', text:`<strong>${topCamp.name}</strong> é a campanha com maior investimento no período: <strong>${brl(topCamp.spend)}</strong>.` });
  } else {
    items.push({ type:'action', emoji:'→', title:'Monitorando', text:'Continue acompanhando os dados ao longo da semana.' });
  }

  document.getElementById('alertas').innerHTML = items.slice(0,3).map(a => `
    <div class="ai-card">
      <div class="ai-insight">
        <div class="ai-tag ${a.type}">${a.emoji} ${a.title}</div>
        <div class="ai-text">${a.text}</div>
      </div>
    </div>
  `).join('');
}

// ─── FUNIL ─────────────────────────────────────
function renderFunil({ reach, clicks, lpViews, checkouts, purchases }) {
  const tx1 = reach > 0    ? ((clicks    / reach)    * 100).toFixed(2) : '—';
  const tx2 = clicks > 0   ? ((lpViews   / clicks)   * 100).toFixed(0) : '—';
  const tx3 = lpViews > 0  ? ((checkouts / lpViews)  * 100).toFixed(0) : '—';
  const tx4 = checkouts > 0? ((purchases / checkouts)* 100).toFixed(0) : '—';
  const txG = reach > 0    ? ((purchases / reach)    * 100).toFixed(3) : '—';

  const steps = [
    { name:'👁 Alcance',         val: fmt(reach)     + ' pessoas', w:100, color:'linear-gradient(90deg,#1a1a1a,#2a2a2a)', tc:'#777', conv: null },
    { name:'🖱 Link Clicks',     val: fmt(clicks)    + ' cliques', w:Math.min(80, reach>0?clicks/reach*500+20:40), color:'linear-gradient(90deg,#3b1010,#5a1515)', conv: tx1+'% CTR' },
    { name:'📄 Landing Pages',   val: fmt(lpViews)   + ' visitas', w:Math.min(65, clicks>0?lpViews/clicks*100+15:35), color:'linear-gradient(90deg,#6b0f0f,#aa1111)', conv: tx2+'% conv.' },
    { name:'🛒 Checkouts',       val: fmt(checkouts) + ' inits',   w:Math.min(50, lpViews>0?checkouts/lpViews*200+15:25), color:'linear-gradient(90deg,#8b0000,#cc0000)', conv: tx3+'% conv.' },
    { name:'✅ Compras',         val: fmt(purchases) + ' vendas',  w:Math.min(35, checkouts>0?purchases/checkouts*100+10:15), color:'linear-gradient(90deg,#e5000a,#ff3333)', conv: tx4+'% conv.' },
  ];

  document.getElementById('funil-chart').innerHTML = `
    <div class="slabel" style="margin-bottom:18px">Funil de Conversão (E-commerce)</div>
    ${steps.map((s,i) => `
      ${i>0 ? '<div class="funil-arrow">↓</div>' : ''}
      <div class="funil-step">
        <div class="funil-name">${s.name}</div>
        <div class="funil-track">
          <div class="funil-fill" style="width:${s.w}%;background:${s.color};color:${s.tc||'#fff'}">${s.val}</div>
        </div>
        <div class="funil-conv">${s.conv ? `<span>${s.conv}</span>` : '—'}</div>
      </div>
    `).join('')}
    <div class="funil-footer">
      <div><div class="funil-footer-label">Taxa Alcance → Compra</div><div class="funil-footer-val red">${txG}%</div></div>
      <div style="text-align:right"><div class="funil-footer-label">Total Compras</div><div class="funil-footer-val green">${purchases}</div></div>
    </div>
  `;
}

// ─── FATURAMENTO SPLIT ─────────────────────────
function renderFatSplit({ fatPago, fatOrg, fatTotal }) {
  document.getElementById('fat-split').innerHTML = `
    <div class="slabel" style="margin-bottom:16px">Faturamento Atribuído</div>
    <div style="margin-bottom:16px;font-size:11px;color:#666;line-height:1.8">
      <strong style="color:#e5000a">Faturamento Meta Ads</strong> = Purchase Conversion Value rastreado pelo Pixel.<br>
      <span style="color:#333">Para separar Orgânico: adicione coluna "Fat_Organico" no Google Sheets com as vendas não atribuídas ao Meta.</span>
    </div>
    <div class="prog-row">
      <div class="prog-label" style="color:#e5000a">📢 Meta Ads</div>
      <div class="prog-track"><div class="prog-fill" style="width:100%"></div></div>
      <div class="prog-val" style="color:#e5000a">${brl(fatPago)}</div>
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #1a1a1a;font-size:10px;color:#333;line-height:2">
      <span style="color:#e5000a">Para habilitar separação Pago vs Orgânico:</span><br>
      ① Pixel com evento Purchase + valor configurado<br>
      ② UTM em todos os anúncios (utm_source=meta)<br>
      ③ Adicionar coluna Fat_Organico no Sheets
    </div>
  `;
}

// ─── CRIATIVOS ─────────────────────────────────
function renderCriativos(ads) {
  document.getElementById('creative-grid').innerHTML = `
    <div style="color:#444;font-size:13px;padding:24px;grid-column:1/-1">
      Thumbnails dos criativos disponíveis via Meta Ads API. Configure o Access Token para visualizar.
    </div>
  `;
}

// ─── CAMPAIGNS TABLE ───────────────────────────
function renderCampaignsFromData(campaigns) {
  document.getElementById('campaigns-body').innerHTML = campaigns.map(c => {
    const cpl = c.purchases > 0 ? c.spend / c.purchases : null;
    const roas = c.convValue > 0 && c.spend > 0 ? c.convValue / c.spend : null;
    const avgFreq = c.fn > 0 ? (c.freq / c.fn).toFixed(2) : '—';
    const cplColor = cpl !== null ? (cpl < 200 ? 'green' : cpl > 500 ? 'red' : '') : '';

    return `
      <tr>
        <td>${c.name}</td>
        <td>${brl(c.spend)}</td>
        <td>${c.purchases > 0 ? c.purchases + ' compras' : '—'}</td>
        <td class="${cplColor}" style="font-weight:${cpl?'700':'400'}">${cpl !== null ? brl(cpl) : '—'}</td>
        <td>${fmt(c.reach)}</td>
        <td class="${parseFloat(avgFreq)>2.5?'red':'green'}">${avgFreq}</td>
        <td><span class="badge b-ativo">Ativo</span></td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" style="color:#444;text-align:center;padding:24px">Sem dados de campanhas</td></tr>';
}

// ─── AI INSIGHTS ───────────────────────────────
async function generateInsights() {
  if (!DATA.spend && DATA.spend !== 0) { alert('Carregue os dados primeiro.'); return; }
  const { spend, purchases, convValue, freq, campaigns } = DATA;
  const roas = spend > 0 ? (convValue/spend).toFixed(1) : 0;
  const cac  = purchases > 0 ? (spend/purchases).toFixed(2) : 0;

  if (CONFIG.claudeKey) {
    document.getElementById('ai-insights').innerHTML = `<div class="ai-header"><div class="ai-icon">🤖</div><div><div class="ai-title">Gerando análise...</div></div></div><div class="spinner" style="margin:20px auto"></div>`;
    try {
      const prompt = `Você é um especialista em tráfego pago Meta Ads para e-commerce. Analise os dados e gere 3 insights diretos: ponto forte, ponto de atenção e recomendação de ação. Português, sem jargão.

Cliente: ${CURRENT.name}
Investido: R$${parseFloat(spend).toFixed(2)}
Compras: ${purchases}
Faturamento (Meta): R$${parseFloat(convValue).toFixed(2)}
ROAS: ${roas}x
CAC: R$${cac}
Frequência média: ${parseFloat(freq).toFixed(2)}
Top campanha: ${campaigns?.[0]?.name || 'N/A'} (R$${brl(campaigns?.[0]?.spend || 0)})`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json','x-api-key':CONFIG.claudeKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:600, messages:[{role:'user',content:prompt}] })
      });
      const j = await res.json();
      renderAIText(j.content?.[0]?.text || 'Erro.');
    } catch(e) { renderAIFallback({ cpl: parseFloat(cac), freq, roas: parseFloat(roas) }); }
  } else {
    renderAIFallback({ cpl: parseFloat(cac), freq, roas: parseFloat(roas) });
  }
}

function renderAIFallback({ cpl, freq, roas }) {
  renderAIText(
    `**Ponto forte:** ROAS em ${roas.toFixed(1)}x. ${roas >= 5 ? 'Retorno acima da meta mínima de 5x — conta performando bem.' : 'Abaixo da meta de 5x — otimizar criativos e segmentação.'}\n\n` +
    `**Ponto de atenção:** Frequência em ${freq.toFixed(2)}. ${freq > 2.5 ? 'Audiência saturando — novos criativos urgentes.' : 'Audiência saudável.'}\n\n` +
    `**Recomendação:** ${roas < 3 ? 'Testar novos ângulos de copy e criativos. Revisar público-alvo.' : 'Manter estrutura e escalar gradualmente (+20-30% no orçamento a cada 3 dias).'}`
  );
}

function renderAIText(text) {
  const parts = text.split('\n\n').filter(Boolean);
  const colors = ['positive','alert','action'];
  const emojis = ['✓','⚠','→'];
  const labels = ['Ponto Forte','Ponto de Atenção','Recomendação'];
  document.getElementById('ai-insights').innerHTML = `
    <div class="ai-header"><div class="ai-icon">🤖</div><div><div class="ai-title">Análise por IA</div><div class="ai-subtitle">Baseada nos dados do período</div></div></div>
    ${parts.slice(0,3).map((p,i) => `
      <div class="ai-insight">
        <div class="ai-tag ${colors[i]||'action'}">${emojis[i]} ${labels[i]||''}</div>
        <div class="ai-text">${p.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>
      </div>
    `).join('')}
  `;
}

// ─── SAÚDE ─────────────────────────────────────
function renderSaude({ cpl, frequency, roas, leads }) {
  const roasScore  = Math.min(100, roas/10*100);
  const freqScore  = Math.max(0, 100-((frequency-1)/1.5*100));
  const volScore   = Math.min(100, leads/20*100);
  const items = [
    { label:'ROAS',          score:roasScore, color:roasScore>70?'green':roasScore>40?'yellow':'' },
    { label:'Frequência',    score:freqScore, color:freqScore>70?'green':freqScore>40?'yellow':'' },
    { label:'Volume Compras',score:volScore,  color:volScore>70?'green':volScore>40?'yellow':''  },
    { label:'Pixel / Track', score:leads>0?80:20, color:leads>0?'green':'' },
  ];
  document.getElementById('saude-metricas').innerHTML = `
    <div class="slabel" style="margin-bottom:16px">Saúde das Métricas</div>
    ${items.map(i=>`
      <div class="prog-row">
        <div class="prog-label">${i.label}</div>
        <div class="prog-track"><div class="prog-fill ${i.color}" style="width:${Math.round(i.score)}%"></div></div>
        <div class="prog-val" style="color:${i.color==='green'?'#22c55e':i.color==='yellow'?'#f59e0b':'#e5000a'}">${i.score>70?'Ótimo':i.score>40?'OK':'Crítico'}</div>
      </div>
    `).join('')}
  `;
}

function renderPlanoAcao({ cpl, frequency, roas }) {
  const today = new Date();
  const fd = n => { const d=new Date(today.getTime()+n*86400000); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}); };
  const acoes = [];
  if (roas < 5) acoes.push({ acao:'Revisar segmentação e criativos (ROAS abaixo da meta)', resp:'Rainer', days:2 });
  if (frequency > 2.5) acoes.push({ acao:'Novos criativos urgente (frequência alta)', resp:'Cliente', days:3 });
  acoes.push({ acao:'CS semanal com cliente', resp:'Rainer', days:2 });
  acoes.push({ acao:'Atualizar Google Sheets com dados CRM', resp:'Cliente', days:7 });
  acoes.push({ acao:'Review mensal de performance', resp:'Rainer', days:30 });
  document.getElementById('plano-body').innerHTML = acoes.map(a=>`<tr><td>${a.acao}</td><td style="color:#e5000a">${a.resp}</td><td>${fd(a.days)}</td></tr>`).join('');
}

// ─── DEMO ──────────────────────────────────────
function renderDemo() {
  showError('Configure o Sheet ID e a Google Sheets API Key para dados reais.');
  DATA = { spend:1200, reach:7752, impr:9845, freq:1.29, cpm:6.06, ctr:1.48, clicks:496, purchases:8, convValue:31400, checkouts:29, lpViews:312, campaigns:[
    { name:'Vendas 1 - rmkt/geral', spend:480, reach:3200, purchases:5, convValue:18500, checkouts:18, freq:1.35, fn:7 },
    { name:'Vendas 2 - ADV-videos',  spend:420, reach:2800, purchases:2, convValue:8400,  checkouts:8,  freq:1.28, fn:7 },
    { name:'trafego_acesso_rml',     spend:300, reach:1752, purchases:1, convValue:4500,  checkouts:3,  freq:1.18, fn:7 },
  ], source:'demo' };
  renderFromData(DATA);
}

// ─── UTILS ─────────────────────────────────────
function num(v) {
  if (!v && v !== 0) return 0;
  let s = String(v).trim();
  if (!s) return 0;
  // Handle Brazilian number format: "1.879,76" → 1879.76, "106,28" → 106.28
  const dotIdx   = s.lastIndexOf('.');
  const commaIdx = s.lastIndexOf(',');
  if (commaIdx > dotIdx) {
    // Comma is decimal separator (BR): remove thousand dots, replace comma with dot
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (dotIdx > commaIdx && commaIdx !== -1) {
    // Dot is decimal separator, comma is thousands separator (US/EU)
    s = s.replace(/,/g, '');
  }
  return parseFloat(s) || 0;
}

function normalizeDate(d) {
  if (!d) return null;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10); // ISO: 2026-02-01
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`; // DD/MM/YYYY
  if (/^\d{5}$/.test(s)) { // Excel serial number
    const dt = new Date((parseInt(s) - 25569) * 86400 * 1000);
    return dt.toISOString().split('T')[0];
  }
  return null;
}
function extractAction(actions, types) { return actions.filter(a=>types.includes(a.action_type)).reduce((s,a)=>s+parseInt(a.value||0),0); }
function extractValue(vals, types)   { return vals.filter(a=>types.includes(a.action_type)).reduce((s,a)=>s+parseFloat(a.value||0),0); }
function brl(n) { return 'R$\u00a0'+parseFloat(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmt(n) { return parseInt(n||0).toLocaleString('pt-BR'); }
function kpiCard(color, content) { return `<div class="card"><div class="card-top ${color}"></div><div class="card-inner">${content}</div></div>`; }
function showLoading(v) { document.getElementById('loading').style.display = v?'flex':'none'; }
function showError(msg) { const b=document.getElementById('error-bar'); b.textContent=msg; b.style.display='block'; }
function clearError() { document.getElementById('error-bar').style.display='none'; }
function goTab(id, el) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pg-'+id).classList.add('active');
}
function showCreativeDetail() {}

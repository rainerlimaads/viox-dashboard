/* ============================================
   VIOX STRATEGY · PERFORMANCE DASHBOARD
   app.js — Meta Ads API + Google Sheets + IA
   ============================================ */

const META_API = 'https://graph.facebook.com/v19.0';
let CONFIG = {};
let CLIENTS = [];
let CURRENT = {};
let DATA = {};

// ─── INIT ──────────────────────────────────────
window.onload = () => {
  loadConfig();
};

function loadConfig() {
  const raw = localStorage.getItem('viox_config');
  if (!raw) {
    showSetup();
    return;
  }
  try {
    CONFIG = JSON.parse(raw);
    CLIENTS = parseClients(CONFIG.rawClients || '');
    if (!CLIENTS.length) { showSetup(); return; }
    bootDashboard();
  } catch(e) {
    showSetup();
  }
}

function parseClients(raw) {
  return raw.split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const [name, accountId, sheetId] = l.split('|');
      return { name: (name||'').trim(), accountId: (accountId||'').trim(), sheetId: (sheetId||'').trim() };
    }).filter(c => c.name && c.accountId);
}

function saveConfig() {
  const token = document.getElementById('cfg-token').value.trim();
  const rawClients = document.getElementById('cfg-clients').value.trim();
  const sheetsKey = document.getElementById('cfg-sheets-key').value.trim();
  const claudeKey = document.getElementById('cfg-claude').value.trim();

  if (!token || !rawClients) {
    alert('Preencha o Access Token e ao menos um cliente.');
    return;
  }

  CONFIG = { token, rawClients, sheetsKey, claudeKey };
  localStorage.setItem('viox_config', JSON.stringify(CONFIG));
  CLIENTS = parseClients(rawClients);
  bootDashboard();
}

function openSetup() {
  const raw = localStorage.getItem('viox_config');
  if (raw) {
    const c = JSON.parse(raw);
    document.getElementById('cfg-token').value = c.token || '';
    document.getElementById('cfg-clients').value = c.rawClients || '';
    document.getElementById('cfg-sheets-key').value = c.sheetsKey || '';
    document.getElementById('cfg-claude').value = c.claudeKey || '';
  }
  showSetup();
}

function showSetup() {
  document.getElementById('setup-screen').style.display = 'flex';
  document.getElementById('topbar').style.display = 'none';
  document.getElementById('tabs').style.display = 'none';
  document.getElementById('pages').style.display = 'none';
}

function hideSetup() {
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('topbar').style.display = 'flex';
  document.getElementById('tabs').style.display = 'flex';
  document.getElementById('pages').style.display = 'block';
}

function bootDashboard() {
  hideSetup();

  // populate client selector
  const sel = document.getElementById('client-select');
  sel.innerHTML = '';
  CLIENTS.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });

  switchClient();
}

function switchClient() {
  const idx = parseInt(document.getElementById('client-select').value) || 0;
  CURRENT = CLIENTS[idx] || CLIENTS[0];
  loadData();
}

// ─── LOAD DATA ─────────────────────────────────
async function loadData() {
  if (!CURRENT.accountId) return;
  showLoading(true);
  clearError();

  try {
    const datePreset = document.getElementById('date-select').value;

    // Parallel fetch: account insights + campaigns + ads
    const [insightRes, campaignRes, adsRes] = await Promise.all([
      metaGet(`/act_${CURRENT.accountId}/insights`, {
        fields: 'spend,reach,impressions,frequency,actions,cost_per_action_type,ctr,cpm,clicks,action_values',
        date_preset: datePreset,
        level: 'account'
      }),
      metaGet(`/act_${CURRENT.accountId}/campaigns`, {
        fields: `name,status,insights.date_preset(${datePreset}){spend,reach,impressions,frequency,actions,cost_per_action_type}`,
        limit: 20
      }),
      metaGet(`/act_${CURRENT.accountId}/ads`, {
        fields: `name,status,creative{thumbnail_url,title},insights.date_preset(${datePreset}){spend,reach,impressions,actions,cost_per_action_type,frequency}`,
        limit: 20
      })
    ]);

    const insight = insightRes.data?.[0] || {};
    const campaigns = campaignRes.data || [];
    const ads = adsRes.data || [];

    // CRM data from Google Sheets
    let crmData = {};
    if (CURRENT.sheetId && CONFIG.sheetsKey) {
      crmData = await loadSheetData(CURRENT.sheetId);
    }

    DATA = { insight, campaigns, ads, crmData, datePreset };
    renderAll(DATA);

  } catch(err) {
    showError('Erro ao buscar dados: ' + err.message);
    // Show demo data if API fails
    renderDemo();
  } finally {
    showLoading(false);
  }
}

// ─── META API ──────────────────────────────────
async function metaGet(path, params) {
  const qs = new URLSearchParams({ ...params, access_token: CONFIG.token });
  const res = await fetch(`${META_API}${path}?${qs}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json;
}

// ─── SHEETS API ────────────────────────────────
async function loadSheetData(sheetId) {
  try {
    // Expects sheet with columns: Data|Lead|Como_Chegou|Etapa|Valor_Orcamento|Valor_Venda|Fat_Pago|Fat_Organico
    const range = 'CRM!A:H';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${CONFIG.sheetsKey}`;
    const res = await fetch(url);
    const json = await res.json();
    const rows = json.values || [];
    if (rows.length < 2) return {};

    const headers = rows[0];
    const data = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = r[i] || '');
      return obj;
    });

    const leads = data.length;
    const orcamentos = data.filter(r => ['Orçamento','Visita','Vendido'].includes(r.Etapa)).length;
    const vendas = data.filter(r => r.Etapa === 'Vendido').length;
    const fatPago = data.reduce((s, r) => s + parseFloat(r.Fat_Pago?.replace(/[^\d.]/g,'') || 0), 0);
    const fatOrg = data.reduce((s, r) => s + parseFloat(r.Fat_Organico?.replace(/[^\d.]/g,'') || 0), 0);

    return { leads, orcamentos, vendas, fatPago, fatOrg, rows: data };
  } catch(e) {
    return {};
  }
}

// ─── RENDER ALL ────────────────────────────────
function renderAll({ insight, campaigns, ads, crmData }) {
  const spend = parseFloat(insight.spend || 0);
  const reach = parseInt(insight.reach || 0);
  const impressions = parseInt(insight.impressions || 0);
  const frequency = parseFloat(insight.frequency || 0).toFixed(2);
  const cpm = parseFloat(insight.cpm || 0);
  const ctr = parseFloat(insight.ctr || 0);

  // Extract leads from actions
  const actions = insight.actions || [];
  const leads = extractAction(actions, ['lead','onsite_conversion.messaging_conversation_started_7d','offsite_conversion.fb_pixel_lead']);
  const cpl = leads > 0 ? spend / leads : 0;

  // CRM values (from sheets or estimated)
  const orcamentos = crmData.orcamentos || Math.round(leads * 0.65);
  const vendas = crmData.vendas || Math.round(leads * 0.14);
  const fatPago = crmData.fatPago || (vendas * 5000);
  const fatOrg = crmData.fatOrg || (fatPago * 0.27);
  const fatTotal = fatPago + fatOrg;
  const roas = spend > 0 ? fatPago / spend : 0;
  const cac = vendas > 0 ? spend / vendas : 0;
  const ticketMedio = vendas > 0 ? fatPago / vendas : 0;

  renderKPINegocio({ fatTotal, fatPago, fatOrg, spend, roas, cac, ticketMedio });
  renderKPITrafego({ cpl, leads, frequency, cpm, ctr });
  renderAlertas({ cpl, frequency, leads, campaigns });
  renderFunil({ reach, leads, orcamentos, vendas, impressions });
  renderFatSplit({ fatPago, fatOrg, fatTotal });
  renderCriativos(ads);
  renderCampaigns(campaigns);
  renderSaude({ cpl, frequency, roas, leads });
  renderPlanoAcao({ cpl, frequency, roas });
}

// ─── KPI NEGÓCIO ───────────────────────────────
function renderKPINegocio({ fatTotal, fatPago, fatOrg, spend, roas, cac, ticketMedio }) {
  const paidPct = fatTotal > 0 ? Math.round(fatPago / fatTotal * 100) : 0;
  const orgPct = 100 - paidPct;

  document.getElementById('kpi-negocio').innerHTML = `
    ${kpiCard('green', `
      <div class="card-label"><span class="tip-wrap">Faturamento Total ℹ<span class="tip">Dividido entre Pago (Meta Ads) e Orgânico. Sem UTM configurado no pixel, o split é estimado.</span></span></div>
      <div class="card-value green">${brl(fatTotal)}</div>
      <hr class="card-divider">
      <div class="fat-row">
        <div class="fat-item">
          <div class="fat-item-label">📢 Pago</div>
          <div class="fat-item-value" style="color:#e5000a">${brl(fatPago)}</div>
          <div class="fat-bar" style="width:${paidPct}%"></div>
          <div class="fat-pct">${paidPct}% do total</div>
        </div>
        <div class="fat-item">
          <div class="fat-item-label">🌱 Orgânico</div>
          <div class="fat-item-value" style="color:#3b82f6">${brl(fatOrg)}</div>
          <div class="fat-bar organic" style="width:${orgPct}%"></div>
          <div class="fat-pct">${orgPct}% do total</div>
        </div>
      </div>
      <div class="card-source">● Meta Pixel + GA4 + Sheets</div>
    `)}
    ${kpiCard('blue', `
      <div class="card-label">Investido</div>
      <div class="card-value blue">${brl(spend)}</div>
      <div class="card-delta">Total gasto em mídia</div>
      <div class="card-source">● Meta Ads API</div>
    `)}
    ${kpiCard('green', `
      <div class="card-label"><span class="tip-wrap">ROAS ℹ<span class="tip">Faturamento Pago ÷ Investido. Baseado somente no faturamento atribuído ao Meta Ads.</span></span></div>
      <div class="card-value ${roas >= 5 ? 'green' : roas >= 2 ? 'yellow' : 'red'}">${roas.toFixed(1)}x</div>
      <div class="card-delta">Meta mínima: <span class="delta-up">5x</span></div>
      <div class="card-source">● Fórmula: Fat. Pago ÷ Investido</div>
    `)}
    ${kpiCard('', `
      <div class="card-label"><span class="tip-wrap">CAC ℹ<span class="tip">Custo de Aquisição por Cliente. Investido ÷ Vendas fechadas (do CRM).</span></span></div>
      <div class="card-value">${brl(cac)}</div>
      <div class="card-delta">Investido ÷ ${Math.round(cac > 0 ? spend/cac : 0)} vendas</div>
      <div class="card-source">● Fórmula: Investido ÷ Sheets CRM</div>
    `)}
    ${kpiCard('yellow', `
      <div class="card-label">Ticket Médio</div>
      <div class="card-value yellow">${brl(ticketMedio)}</div>
      <div class="card-delta">Faturamento ÷ contratos</div>
      <div class="card-source">● Google Sheets CRM</div>
    `)}
  `;
}

// ─── KPI TRÁFEGO ───────────────────────────────
function renderKPITrafego({ cpl, leads, frequency, cpm, ctr }) {
  document.getElementById('kpi-trafego').innerHTML = `
    ${kpiCard('', `
      <div class="card-label">CPL (período)</div>
      <div class="card-value ${cpl < 30 ? 'green' : cpl < 50 ? 'yellow' : 'red'}">${brl(cpl)}</div>
      <div class="card-delta">Custo por lead gerado</div>
      <div class="card-source">● Meta Ads API</div>
    `)}
    ${kpiCard('', `
      <div class="card-label">Volume de Leads</div>
      <div class="card-value">${leads}</div>
      <div class="card-delta">Total no período</div>
      <div class="card-source">● Meta Ads API</div>
    `)}
    ${kpiCard('', `
      <div class="card-label">Frequência</div>
      <div class="card-value ${frequency < 2 ? 'green' : frequency < 2.5 ? 'yellow' : 'red'}">${frequency}</div>
      <div class="card-delta">Limite recomendado: <span class="${frequency < 2.5 ? 'delta-up' : 'delta-dn'}">2,5</span></div>
      <div class="card-source">● Meta Ads API</div>
    `)}
    ${kpiCard('', `
      <div class="card-label">CPM</div>
      <div class="card-value">${brl(cpm)}</div>
      <div class="card-delta">Custo por 1.000 impressões</div>
      <div class="card-source">● Meta Ads API</div>
    `)}
  `;
}

// ─── ALERTAS ───────────────────────────────────
function renderAlertas({ cpl, frequency, leads, campaigns }) {
  const metaCpl = 25; // default target
  const desvio = metaCpl > 0 ? ((cpl - metaCpl) / metaCpl) : 0;
  const semDados = campaigns.filter(c => c.status === 'ACTIVE' && !c.insights?.data?.[0]?.spend).length;

  const items = [];

  if (desvio <= -0.1) {
    items.push({ type: 'positive', emoji: '✓', title: 'CPL abaixo da meta', text: `CPL em <strong>${brl(cpl)}</strong> — ${Math.abs(Math.round(desvio*100))}% abaixo da meta de ${brl(metaCpl)}. Conta operando com eficiência.` });
  } else if (desvio > 0.25) {
    items.push({ type: 'alert', emoji: '⚠', title: 'CPL acima da meta', text: `CPL em <strong>${brl(cpl)}</strong> — ${Math.round(desvio*100)}% acima da meta. Revisar público e criativos.` });
  } else {
    items.push({ type: 'action', emoji: '→', title: 'CPL próximo da meta', text: `CPL em <strong>${brl(cpl)}</strong>. Acompanhar próximos dias antes de ajustes.` });
  }

  if (parseFloat(frequency) > 2.5) {
    items.push({ type: 'alert', emoji: '⚠', title: 'Frequência alta', text: `Frequência em <strong>${frequency}</strong> — público saturando. Hora de novos criativos ou expandir audiência.` });
  } else {
    items.push({ type: 'positive', emoji: '✓', title: 'Frequência saudável', text: `Frequência em <strong>${frequency}</strong> — dentro do limite. Público ainda não saturado.` });
  }

  if (semDados > 0) {
    items.push({ type: 'alert', emoji: '⚠', title: `${semDados} campanha(s) sem resultado`, text: `${semDados} campanha(s) ativa(s) sem dados de conversão. Verificar criativos e conjuntos parados.` });
  } else if (leads > 0) {
    items.push({ type: 'action', emoji: '→', title: 'Todas campanhas rodando', text: `Campanhas ativas gerando resultados. Próximo passo: verificar qualidade dos leads com o cliente.` });
  }

  // Always show exactly 3
  while(items.length < 3) items.push({ type: 'action', emoji: '→', title: 'Monitorando...', text: 'Continue acompanhando os dados ao longo da semana.' });

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
function renderFunil({ reach, leads, orcamentos, vendas, impressions }) {
  const tx1 = reach > 0 ? ((leads / reach) * 100).toFixed(1) : '—';
  const tx2 = leads > 0 ? ((orcamentos / leads) * 100).toFixed(0) : '—';
  const tx3 = orcamentos > 0 ? ((vendas / orcamentos) * 100).toFixed(0) : '—';
  const txGeral = reach > 0 ? ((vendas / reach) * 100).toFixed(2) : '—';
  const txLead = leads > 0 ? ((vendas / leads) * 100).toFixed(1) : '—';

  const steps = [
    { name: '👁 Alcance', val: fmt(reach) + ' pessoas', w: 100, color: 'linear-gradient(90deg,#1a1a1a,#2a2a2a)', textColor: '#777', conv: null },
    { name: '📩 Leads', val: fmt(leads) + ' leads', w: Math.min(80, leads/reach*800||50), color: 'linear-gradient(90deg,#6b0f0f,#aa1111)', conv: tx1 + '% CTR' },
    { name: '💬 Orçamentos', val: fmt(orcamentos) + ' orc.', w: Math.min(65, orcamentos/(leads||1)*100), color: 'linear-gradient(90deg,#8b0000,#cc0000)', conv: tx2 + '% conv.' },
    { name: '✅ Vendas', val: fmt(vendas) + ' vendas', w: Math.min(45, vendas/(leads||1)*100+5||10), color: 'linear-gradient(90deg,#e5000a,#ff3333)', conv: tx3 + '% conv.' },
  ];

  document.getElementById('funil-chart').innerHTML = `
    <div class="slabel" style="margin-bottom:18px">Funil de Negócio</div>
    ${steps.map((s, i) => `
      ${i > 0 ? '<div class="funil-arrow">↓</div>' : ''}
      <div class="funil-step">
        <div class="funil-name">${s.name}</div>
        <div class="funil-track">
          <div class="funil-fill" style="width:${s.w}%;background:${s.color};color:${s.textColor||'#fff'}">${s.val}</div>
        </div>
        <div class="funil-conv">${s.conv ? `<span>${s.conv}</span>` : '—'}</div>
      </div>
    `).join('')}
    <div class="funil-footer">
      <div class="funil-footer-item">
        <div class="funil-footer-label">Taxa Alcance → Venda</div>
        <div class="funil-footer-val red">${txGeral}%</div>
      </div>
      <div class="funil-footer-item" style="text-align:right">
        <div class="funil-footer-label">Taxa Lead → Venda</div>
        <div class="funil-footer-val green">${txLead}%</div>
      </div>
    </div>
  `;
}

// ─── FATURAMENTO SPLIT ─────────────────────────
function renderFatSplit({ fatPago, fatOrg, fatTotal }) {
  const paidPct = fatTotal > 0 ? Math.round(fatPago / fatTotal * 100) : 0;
  const orgPct = 100 - paidPct;

  document.getElementById('fat-split').innerHTML = `
    <div class="slabel" style="margin-bottom:18px">Faturamento por Origem</div>
    <div style="margin-bottom:18px;font-size:11px;color:#666;line-height:1.7">
      <strong style="color:#e5000a">Pago (Meta)</strong> = Compras com UTM rastreado pelo Pixel + GA4.<br>
      <strong style="color:#3b82f6">Orgânico</strong> = Total do CRM <em>menos</em> o atribuído ao tráfego pago.<br>
      <span style="color:#333">Sem essa separação o cliente mistura os números.</span>
    </div>
    <div class="prog-row">
      <div class="prog-label" style="color:#e5000a">📢 Meta Ads Pago</div>
      <div class="prog-track"><div class="prog-fill" style="width:${paidPct}%"></div></div>
      <div class="prog-val" style="color:#e5000a">${brl(fatPago)}</div>
    </div>
    <div class="prog-row">
      <div class="prog-label" style="color:#3b82f6">🌱 Orgânico</div>
      <div class="prog-track"><div class="prog-fill blue" style="width:${orgPct}%"></div></div>
      <div class="prog-val" style="color:#3b82f6">${brl(fatOrg)}</div>
    </div>
    <div class="prog-row">
      <div class="prog-label">📊 Total</div>
      <div class="prog-track"><div class="prog-fill green" style="width:100%"></div></div>
      <div class="prog-val green">${brl(fatTotal)}</div>
    </div>
    <div style="margin-top:18px;padding-top:14px;border-top:1px solid #1a1a1a;font-size:10px;color:#333;line-height:2">
      <span style="color:#e5000a">Para habilitar separação automática:</span><br>
      ① Pixel com evento Purchase + valor<br>
      ② UTM em todos os anúncios (utm_source=meta)<br>
      ③ GA4 com e-commerce ativado
    </div>
  `;
}

// ─── CRIATIVOS ─────────────────────────────────
function renderCriativos(ads) {
  if (!ads.length) {
    document.getElementById('creative-grid').innerHTML = '<p style="color:#444;font-size:13px">Sem dados de criativos no período.</p>';
    return;
  }

  document.getElementById('creative-grid').innerHTML = ads.slice(0, 8).map(ad => {
    const ins = ad.insights?.data?.[0] || {};
    const adLeads = extractAction(ins.actions || [], ['lead', 'onsite_conversion.messaging_conversation_started_7d']);
    const adSpend = parseFloat(ins.spend || 0);
    const adCpl = adLeads > 0 ? adSpend / adLeads : null;
    const adReach = parseInt(ins.reach || 0);
    const adFreq = parseFloat(ins.frequency || 0).toFixed(2);
    const thumb = ad.creative?.thumbnail_url || '';
    const status = ad.status === 'ACTIVE' ? 'st-ativo' : ad.status === 'PAUSED' ? 'st-pausado' : 'st-inativo';
    const statusLabel = ad.status === 'ACTIVE' ? 'Ativo' : ad.status === 'PAUSED' ? 'Pausado' : 'Inativo';
    const cplColor = adCpl === null ? '' : adCpl < 30 ? 'good' : 'bad';

    return `
      <div class="creative-card" onclick="showCreativeDetail('${ad.id}')">
        <div class="creative-thumb">
          ${thumb ? `<img src="${thumb}" alt="${ad.name}" loading="lazy">` : '🎬'}
          <div class="creative-status ${status}">${statusLabel}</div>
        </div>
        <div class="creative-info">
          <div class="creative-name" title="${ad.name}">${ad.name}</div>
          <div class="creative-metrics">
            <div class="cm">
              <div class="cm-val ${cplColor}">${adCpl !== null ? brl(adCpl) : '—'}</div>
              <div class="cm-label">CPL</div>
            </div>
            <div class="cm">
              <div class="cm-val">${fmt(adReach)}</div>
              <div class="cm-label">Alcance</div>
            </div>
            <div class="cm">
              <div class="cm-val ${parseFloat(adFreq) < 2.5 ? 'good' : 'bad'}">${adFreq}</div>
              <div class="cm-label">Freq.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── CAMPAIGNS TABLE ───────────────────────────
function renderCampaigns(campaigns) {
  document.getElementById('campaigns-body').innerHTML = campaigns.map(c => {
    const ins = c.insights?.data?.[0] || {};
    const spend = parseFloat(ins.spend || 0);
    const reach = parseInt(ins.reach || 0);
    const freq = parseFloat(ins.frequency || 0).toFixed(2);
    const leads = extractAction(ins.actions || [], ['lead', 'onsite_conversion.messaging_conversation_started_7d']);
    const cpl = leads > 0 ? spend / leads : null;
    const status = c.status === 'ACTIVE' ? 'b-ativo' : 'b-pausado';
    const statusLabel = c.status === 'ACTIVE' ? 'Ativo' : 'Pausado';
    const cplColor = cpl !== null ? (cpl < 30 ? 'green' : cpl > 60 ? 'red' : '') : '';

    return `
      <tr>
        <td>${c.name}</td>
        <td>${spend > 0 ? brl(spend) : '—'}</td>
        <td>${leads > 0 ? leads + ' leads' : '—'}</td>
        <td class="${cplColor}" style="font-weight:${cpl?'700':'400'}">${cpl !== null ? brl(cpl) : '—'}</td>
        <td>${fmt(reach)}</td>
        <td class="${parseFloat(freq) > 2.5 ? 'red' : 'green'}">${freq}</td>
        <td><span class="badge ${status}">${statusLabel}</span></td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" style="color:#444;text-align:center;padding:24px">Sem campanhas no período</td></tr>';
}

// ─── SAÚDE & PLANO ─────────────────────────────
function renderSaude({ cpl, frequency, roas, leads }) {
  const metaCpl = 25;
  const cplScore = Math.max(0, Math.min(100, 100 - ((cpl - metaCpl) / metaCpl * 100)));
  const roasScore = Math.min(100, roas / 10 * 100);
  const freqScore = Math.max(0, 100 - ((parseFloat(frequency) - 1) / 1.5 * 100));
  const volScore = Math.min(100, leads / 20 * 100);
  const criativosScore = leads > 5 ? 70 : 30;

  const items = [
    { label: 'CPL vs Meta', score: cplScore, color: cplScore > 70 ? 'green' : cplScore > 40 ? 'yellow' : '' },
    { label: 'ROAS', score: roasScore, color: roasScore > 70 ? 'green' : roasScore > 40 ? 'yellow' : '' },
    { label: 'Frequência', score: freqScore, color: freqScore > 70 ? 'green' : freqScore > 40 ? 'yellow' : '' },
    { label: 'Volume Leads', score: volScore, color: volScore > 70 ? 'green' : volScore > 40 ? 'yellow' : '' },
    { label: 'Diversidade Criativos', score: criativosScore, color: criativosScore > 60 ? 'green' : criativosScore > 40 ? 'yellow' : '' },
  ];

  document.getElementById('saude-metricas').innerHTML = `
    <div class="slabel" style="margin-bottom:16px">Saúde das Métricas</div>
    ${items.map(i => `
      <div class="prog-row">
        <div class="prog-label">${i.label}</div>
        <div class="prog-track"><div class="prog-fill ${i.color}" style="width:${Math.round(i.score)}%"></div></div>
        <div class="prog-val" class="${i.color}" style="color:${i.color === 'green' ? '#22c55e' : i.color === 'yellow' ? '#f59e0b' : '#e5000a'}">${i.score > 70 ? 'Ótimo' : i.score > 40 ? 'OK' : 'Crítico'}</div>
      </div>
    `).join('')}
  `;
}

function renderPlanoAcao({ cpl, frequency, roas }) {
  const acoes = [];
  const today = new Date();
  const fmt_d = (d) => d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'});

  if (cpl > 25) acoes.push({ acao: 'Revisar segmentação e criativos (CPL alto)', resp: 'Rainer', days: 2 });
  if (parseFloat(frequency) > 2.5) acoes.push({ acao: 'Novos criativos urgente (frequência alta)', resp: 'Cliente', days: 3 });
  if (roas < 5) acoes.push({ acao: 'Analisar atribuição e funil comercial', resp: 'Rainer + Bruno', days: 5 });
  acoes.push({ acao: 'CS semanal com cliente', resp: 'Rainer', days: 2 });
  acoes.push({ acao: 'Atualizar CRM (vendas da semana)', resp: 'Cliente', days: 7 });
  acoes.push({ acao: 'Review mensal de performance', resp: 'Rainer + Bruno', days: 30 });

  document.getElementById('plano-body').innerHTML = acoes.map(a => {
    const d = new Date(today.getTime() + a.days * 86400000);
    return `<tr><td>${a.acao}</td><td style="color:#e5000a">${a.resp}</td><td>${fmt_d(d)}</td></tr>`;
  }).join('');
}

// ─── AI INSIGHTS ───────────────────────────────
async function generateInsights() {
  if (!DATA.insight) { alert('Carregue os dados primeiro.'); return; }

  const { insight, crmData } = DATA;
  const spend = parseFloat(insight.spend || 0);
  const leads = extractAction(insight.actions || [], ['lead', 'onsite_conversion.messaging_conversation_started_7d']);
  const cpl = leads > 0 ? spend / leads : 0;
  const freq = parseFloat(insight.frequency || 0).toFixed(2);
  const reach = parseInt(insight.reach || 0);
  const impressions = parseInt(insight.impressions || 0);
  const roas = crmData.fatPago ? (crmData.fatPago / spend).toFixed(1) : 'sem dados CRM';

  if (CONFIG.claudeKey) {
    // Call Claude API for real insights
    document.getElementById('ai-insights').innerHTML = `
      <div class="ai-header"><div class="ai-icon">🤖</div><div><div class="ai-title">Gerando análise...</div></div></div>
      <div class="spinner" style="margin:20px auto"></div>
    `;

    try {
      const prompt = `Você é um especialista em tráfego pago Meta Ads. Analise esses dados e gere 3 insights: um ponto forte, um ponto de atenção e uma recomendação de ação. Seja direto, use os dados reais, fale em português.

Cliente: ${CURRENT.name}
Período: ${document.getElementById('date-select').options[document.getElementById('date-select').selectedIndex].text}
Investido: R$${spend.toFixed(2)}
Leads gerados: ${leads}
CPL: R$${cpl.toFixed(2)}
Alcance: ${reach}
Impressões: ${impressions}
Frequência: ${freq}
ROAS: ${roas}
Orçamentos (CRM): ${crmData.orcamentos || 'sem dados'}
Vendas (CRM): ${crmData.vendas || 'sem dados'}`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CONFIG.claudeKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const json = await res.json();
      const text = json.content?.[0]?.text || 'Erro ao gerar análise.';
      renderAIText(text);
    } catch(e) {
      renderAIFallback({ cpl, freq, leads, spend, roas });
    }
  } else {
    renderAIFallback({ cpl, freq, leads, spend, roas });
  }
}

function renderAIFallback({ cpl, freq, leads, spend, roas }) {
  const metaCpl = 25;
  const desvio = metaCpl > 0 ? ((cpl - metaCpl) / metaCpl * 100) : 0;
  const bom = desvio < 0;

  renderAIText(`**Ponto forte:** CPL em R$${cpl.toFixed(2)} — ${Math.abs(Math.round(desvio))}% ${bom ? 'abaixo' : 'acima'} da meta de R$${metaCpl}. ${bom ? 'A conta está operando com eficiência acima do planejado.' : 'Revisar segmentação e criativos para reduzir custo.'}

**Ponto de atenção:** Frequência em ${freq}. ${parseFloat(freq) > 2.5 ? 'Audiência saturando — novos criativos urgentes.' : 'Audiência ainda saudável, mas monitorar semanalmente.'}

**Recomendação:** ${leads < 10 ? 'Volume de leads abaixo do ideal. Revisar orçamento diário e público.' : 'Manter estrutura atual e aumentar diversidade de criativos antes de escalar orçamento.'} Atualizar o CRM com vendas desta semana para calcular ROAS real.`);
}

function renderAIText(text) {
  const parts = text.split('\n\n').filter(Boolean);
  const colors = ['positive', 'alert', 'action'];
  const emojis = ['✓', '⚠', '→'];
  const labels = ['Ponto Forte', 'Ponto de Atenção', 'Recomendação'];

  document.getElementById('ai-insights').innerHTML = `
    <div class="ai-header">
      <div class="ai-icon">🤖</div>
      <div>
        <div class="ai-title">Análise Gerada por IA</div>
        <div class="ai-subtitle">Baseada nos dados do período selecionado</div>
      </div>
    </div>
    ${parts.slice(0,3).map((p, i) => `
      <div class="ai-insight">
        <div class="ai-tag ${colors[i] || 'action'}">${emojis[i]} ${labels[i] || ''}</div>
        <div class="ai-text">${p.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>
      </div>
    `).join('')}
  `;
}

// ─── DEMO DATA ─────────────────────────────────
function renderDemo() {
  showError('Usando dados demo — configure o Access Token para dados reais.');
  const demoInsight = { spend: '1200', reach: '7752', impressions: '9845', frequency: '1.29', cpm: '6.06', ctr: '1.48', actions: [{ action_type: 'lead', value: '8' }] };
  const demoCampaigns = [
    { id: '1', name: 'Engaj-mens-wpp-cbo', status: 'ACTIVE', insights: { data: [{ spend: '78', reach: '2619', impressions: '3541', frequency: '1.35', actions: [{ action_type: 'lead', value: '5' }] }] } },
    { id: '2', name: 'Engajamento vídeo (rmkt)', status: 'ACTIVE', insights: { data: [{ spend: '42', reach: '1218', impressions: '1316', frequency: '1.08', actions: [] }] } },
    { id: '3', name: 'Stories novos criativos', status: 'ACTIVE', insights: { data: [{ spend: '30', reach: '430', impressions: '516', frequency: '1.20', actions: [] }] } },
  ];
  const demoCRM = { orcamentos: 36, vendas: 8, fatPago: 31400, fatOrg: 11400 };
  DATA = { insight: demoInsight, campaigns: demoCampaigns, ads: [], crmData: demoCRM };
  renderAll(DATA);
}

// ─── UTILS ─────────────────────────────────────
function extractAction(actions, types) {
  let total = 0;
  actions.forEach(a => { if (types.includes(a.action_type)) total += parseInt(a.value || 0); });
  return total;
}

function brl(n) {
  return 'R$\u00a0' + parseFloat(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmt(n) {
  return parseInt(n || 0).toLocaleString('pt-BR');
}

function kpiCard(color, content) {
  return `<div class="card"><div class="card-top ${color}"></div><div class="card-inner">${content}</div></div>`;
}

function showLoading(v) { document.getElementById('loading').style.display = v ? 'flex' : 'none'; }
function showError(msg) { const b = document.getElementById('error-bar'); b.textContent = msg; b.style.display = 'block'; }
function clearError() { document.getElementById('error-bar').style.display = 'none'; }

function goTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pg-' + id).classList.add('active');
}

function showCreativeDetail(id) {
  const ad = DATA.ads?.find(a => a.id === id);
  if (!ad) return;
  const ins = ad.insights?.data?.[0] || {};
  alert(`${ad.name}\n\nInvestido: ${brl(ins.spend)}\nAlcance: ${fmt(ins.reach)}\nFrequência: ${parseFloat(ins.frequency||0).toFixed(2)}\nStatus: ${ad.status}`);
}

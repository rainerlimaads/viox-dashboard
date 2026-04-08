<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Viox Strategy · Performance Dashboard</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<!-- SETUP SCREEN -->
<div id="setup-screen" class="setup-overlay" style="display:none">
  <div class="setup-box">
    <div class="setup-logo">VIOX STRATEGY</div>
    <div class="setup-title">Configuração Inicial</div>
    <div class="setup-subtitle">Preencha as credenciais para conectar ao Meta Ads e ao CRM</div>

    <div class="setup-form">
      <label class="form-label">Meta Ads Access Token</label>
      <input type="password" id="cfg-token" class="form-input" placeholder="EAAxxxxxxxxxx...">
      <div class="form-hint">developers.facebook.com/tools/explorer → gere token com ads_read + read_insights</div>

      <label class="form-label" style="margin-top:20px">Clientes (um por linha: Nome|act_ID|SheetID)</label>
      <textarea id="cfg-clients" class="form-input form-textarea" placeholder="Athenas Móveis Planejados|1092853728175420|1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
Dr. Ademir Esperidião|2345678901234567|SHEET_ID_AQUI
Bom Boi Açougue|3456789012345678|SHEET_ID_AQUI"></textarea>
      <div class="form-hint">ID da conta: no Gerenciador de Anúncios, URL tem act=XXXXXXXXX | Sheet ID: na URL do Google Sheets</div>

      <label class="form-label" style="margin-top:20px">Google Sheets API Key</label>
      <input type="password" id="cfg-sheets-key" class="form-input" placeholder="AIzaSy...">
      <div class="form-hint">console.cloud.google.com → APIs → Sheets API → Credenciais → Chave de API</div>

      <label class="form-label" style="margin-top:20px">Claude API Key (para insights IA)</label>
      <input type="password" id="cfg-claude" class="form-input" placeholder="sk-ant-...">
      <div class="form-hint">console.anthropic.com → API Keys (opcional)</div>

      <button class="btn-primary" onclick="saveConfig()" style="margin-top:24px;width:100%">Salvar e Entrar →</button>
    </div>
  </div>
</div>

<!-- TOPBAR -->
<div class="topbar" id="topbar" style="display:none">
  <div class="topbar-left">
    <div class="logo">VIOX</div>
    <select class="client-select" id="client-select" onchange="switchClient()"></select>
  </div>
  <div class="topbar-right">
    <select class="date-select" id="date-select" onchange="loadData()">
      <option value="last_7d">Últimos 7 dias</option>
      <option value="last_14d">Últimos 14 dias</option>
      <option value="last_30d">Últimos 30 dias</option>
      <option value="this_month">Este mês</option>
      <option value="last_month">Mês passado</option>
    </select>
    <div class="live-badge"><span class="live-dot"></span>Ao vivo</div>
    <button class="btn-icon" onclick="loadData()" title="Atualizar">↻</button>
    <button class="btn-icon" onclick="openSetup()" title="Configurações">⚙</button>
  </div>
</div>

<!-- TABS -->
<div class="tabs" id="tabs" style="display:none">
  <div class="tab active" onclick="goTab('visao',this)">Visão Geral</div>
  <div class="tab" onclick="goTab('funil',this)">Funil de Negócio</div>
  <div class="tab" onclick="goTab('criativos',this)">Criativos</div>
  <div class="tab" onclick="goTab('ia',this)">Análise IA</div>
</div>

<!-- LOADING -->
<div id="loading" style="display:none" class="loading-wrap">
  <div class="spinner"></div>
  <div class="loading-text">Puxando dados do Meta Ads...</div>
</div>

<!-- ERROR -->
<div id="error-bar" class="error-bar" style="display:none"></div>

<!-- ===================== PAGES ===================== -->
<div id="pages" style="display:none">

<!-- VISÃO GERAL -->
<div class="page active" id="pg-visao">
  <div class="slabel">Resultado do Negócio</div>
  <div class="grid-5" id="kpi-negocio">
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
  </div>

  <div class="slabel">Eficiência do Tráfego</div>
  <div class="grid-4" id="kpi-trafego">
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
  </div>

  <div class="slabel">Alertas Automáticos</div>
  <div class="grid-3" id="alertas">
    <div class="card skeleton" style="height:120px"></div>
    <div class="card skeleton" style="height:120px"></div>
    <div class="card skeleton" style="height:120px"></div>
  </div>
</div>

<!-- FUNIL -->
<div class="page" id="pg-funil">
  <div class="grid-2">
    <div>
      <div class="slabel">Funil de Negócio Completo</div>
      <div class="card" id="funil-chart" style="padding:24px"></div>
    </div>
    <div>
      <div class="slabel">Faturamento: Pago vs Orgânico</div>
      <div class="card" id="fat-split" style="padding:24px"></div>

      <div class="slabel" style="margin-top:20px">Fontes de Dados</div>
      <div class="card" style="padding:20px">
        <table class="data-table">
          <thead><tr><th>Etapa</th><th>Fonte</th><th>Automático?</th></tr></thead>
          <tbody>
            <tr><td>Leads / Spend / Reach</td><td>Meta Ads API</td><td class="green">✓ Sim</td></tr>
            <tr><td>Orçamentos Enviados</td><td>Google Sheets</td><td class="yellow">⚠ Manual</td></tr>
            <tr><td>Vendas Fechadas</td><td>Google Sheets</td><td class="yellow">⚠ Manual</td></tr>
            <tr><td>Faturamento Pago</td><td>Meta Pixel + GA4</td><td class="green">✓ Sim</td></tr>
            <tr><td>Faturamento Orgânico</td><td>Google Sheets</td><td class="yellow">⚠ Manual</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- CRIATIVOS -->
<div class="page" id="pg-criativos">
  <div class="slabel">Criativos Ativos</div>
  <div id="creative-grid" class="creative-grid"></div>

  <div class="slabel" style="margin-top:24px">Campanhas</div>
  <div class="card" style="padding:0;overflow:hidden">
    <table class="data-table" id="campaigns-table">
      <thead>
        <tr>
          <th>Campanha</th><th>Investido</th><th>Resultado</th>
          <th>CPL</th><th>Alcance</th><th>Freq.</th><th>Status</th>
        </tr>
      </thead>
      <tbody id="campaigns-body"></tbody>
    </table>
  </div>
</div>

<!-- IA -->
<div class="page" id="pg-ia">
  <div class="grid-2">
    <div>
      <div class="slabel">Análise Automática por IA</div>
      <div class="ai-card" id="ai-insights">
        <div class="ai-header">
          <div class="ai-icon">🤖</div>
          <div>
            <div class="ai-title">Aguardando dados...</div>
            <div class="ai-subtitle">Clique em "Gerar Insights" após carregar os dados</div>
          </div>
        </div>
        <button class="btn-primary" onclick="generateInsights()" style="margin-top:16px">Gerar Análise com IA →</button>
      </div>
    </div>
    <div>
      <div class="slabel">Saúde das Métricas</div>
      <div class="card" id="saude-metricas" style="padding:22px"></div>

      <div class="slabel" style="margin-top:20px">Plano de Ação</div>
      <div class="card" id="plano-acao" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead><tr><th>Ação</th><th>Responsável</th><th>Prazo</th></tr></thead>
          <tbody id="plano-body"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

</div><!-- /pages -->

<script src="app.js"></script>
</body>
</html>

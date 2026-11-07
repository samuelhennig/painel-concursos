css = """/* ============================================================================
   PAINEL ESTRATÉGICO DE ESTUDOS • SISTEMA DE DESIGN INSPIRADO NO GURUJA
   TJSP Oficial · DPDF Analista · SEFAZ-DF Auditor · Núcleo Distrital
   ============================================================================ */

:root {
  /* Paleta Base Light */
  --bg-body: #f8fafc;
  --bg-surface: #ffffff;
  --bg-subtle: #f1f5f9;
  --bg-hover: #e2e8f0;
  --bg-card: #ffffff;
  --border-color: #e2e8f0;
  --border-strong: #cbd5e1;
  --border-focus: #6366f1;

  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;

  /* Cores de Ação e Destaque Guruja */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-soft: #eef2ff;
  --color-primary-text: #4338ca;

  --color-success: #10b981;
  --color-success-soft: #d1fae5;
  --color-success-text: #065f46;

  --color-info: #0284c7;
  --color-info-soft: #e0f2fe;
  --color-info-text: #0369a1;

  --color-warning: #f59e0b;
  --color-warning-soft: #fef3c7;
  --color-warning-text: #92400e;

  --color-danger: #ef4444;
  --color-danger-soft: #fee2e2;
  --color-danger-text: #991b1b;

  /* Badges de Concursos */
  --badge-tjsp-bg: #eff6ff;
  --badge-tjsp-text: #1d4ed8;
  --badge-tjsp-border: #bfdbfe;

  --badge-dpdf-bg: #ecfdf5;
  --badge-dpdf-text: #047857;
  --badge-dpdf-border: #a7f3d0;

  --badge-sefaz-bg: #f5f3ff;
  --badge-sefaz-text: #6d28d9;
  --badge-sefaz-border: #ddd6fe;

  --badge-nucleo-bg: #fffbeb;
  --badge-nucleo-text: #b45309;
  --badge-nucleo-border: #fde68a;

  /* Sombras & Bordas */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 14px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 25px -4px rgba(15, 23, 42, 0.1), 0 4px 10px -3px rgba(15, 23, 42, 0.05);

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  --transition-fast: 0.15s ease;
  --transition-base: 0.25s ease;
}

[data-theme="dark"] {
  /* Paleta Base Dark (Slate / Midnight Executivo) */
  --bg-body: #0b0f19;
  --bg-surface: #111827;
  --bg-subtle: #1e293b;
  --bg-hover: #334155;
  --bg-card: #151d30;
  --border-color: #1f293d;
  --border-strong: #374151;
  --border-focus: #818cf8;

  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;

  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-soft: rgba(99, 102, 241, 0.16);
  --color-primary-text: #a5b4fc;

  --color-success: #10b981;
  --color-success-soft: rgba(16, 185, 129, 0.16);
  --color-success-text: #6ee7b7;

  --color-info: #38bdf8;
  --color-info-soft: rgba(56, 189, 248, 0.16);
  --color-info-text: #7dd3fc;

  --color-warning: #fbbf24;
  --color-warning-soft: rgba(251, 191, 36, 0.16);
  --color-warning-text: #fde68a;

  --color-danger: #f87171;
  --color-danger-soft: rgba(248, 113, 113, 0.16);
  --color-danger-text: #fca5a5;

  --badge-tjsp-bg: rgba(59, 130, 246, 0.16);
  --badge-tjsp-text: #93c5fd;
  --badge-tjsp-border: rgba(59, 130, 246, 0.3);

  --badge-dpdf-bg: rgba(16, 185, 129, 0.16);
  --badge-dpdf-text: #6ee7b7;
  --badge-dpdf-border: rgba(16, 185, 129, 0.3);

  --badge-sefaz-bg: rgba(139, 92, 246, 0.16);
  --badge-sefaz-text: #c4b5fd;
  --badge-sefaz-border: rgba(139, 92, 246, 0.3);

  --badge-nucleo-bg: rgba(245, 158, 11, 0.16);
  --badge-nucleo-text: #fcd34d;
  --badge-nucleo-border: rgba(245, 158, 11, 0.3);

  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 14px -2px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 25px -4px rgba(0, 0, 0, 0.6);
}

/* Reset Global */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-body);
  color: var(--text-primary);
  line-height: 1.5;
  font-size: 13.5px;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

code, .mono {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
}

/* ============================================================================
   TOPBAR & HEADER
   ============================================================================ */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-xs);
  backdrop-filter: blur(10px);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), #818cf8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.brand-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

/* Pomodoro Widget Guruja */
.pomodoro-widget {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-xs);
}

.pomodoro-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pomodoro-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pomodoro-display {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary-text);
  background: var(--color-primary-soft);
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  letter-spacing: 0.05em;
}

.pomodoro-actions {
  display: flex;
  gap: 2px;
}

/* Topbar Actions & Cloud Sync Pill */
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 12px;
  padding: 5px 10px !important;
  border-radius: var(--radius-full) !important;
  border: 1px solid var(--border-color) !important;
  background: var(--bg-subtle) !important;
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-success);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
  transition: all var(--transition-fast);
}

.sync-dot-syncing {
  background-color: var(--color-warning);
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
  animation: pulseSync 1s infinite;
}

.sync-dot-offline {
  background-color: var(--text-muted);
  box-shadow: none;
}

@keyframes pulseSync {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

/* ============================================================================
   BARRA DE NAVEGAÇÃO PRINCIPAL (NAV TABS GURUJA)
   ============================================================================ */
.main-nav {
  display: flex;
  gap: 6px;
  padding: 6px 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  scrollbar-width: none;
}
.main-nav::-webkit-scrollbar { display: none; }

.nav-tab {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.nav-tab:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.nav-tab.active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: rgba(99, 102, 241, 0.25);
}

.nav-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--bg-subtle);
  color: var(--text-muted);
  font-weight: 600;
}

.nav-tab.active .nav-badge {
  background: var(--color-primary);
  color: #fff;
}

/* ============================================================================
   CONTEÚDO PRINCIPAL E TABS
   ============================================================================ */
.main-content {
  max-width: 1520px;
  margin: 0 auto;
  padding: 24px;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============================================================================
   BOTOES E ELEMENTOS DE INTERAÇÃO
   ============================================================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-xs {
  padding: 3px 8px;
  font-size: 11px;
  border-radius: var(--radius-xs);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-xs);
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg-subtle);
  border-color: var(--border-color);
  color: var(--text-primary);
}
.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}
.btn-ghost:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-icon:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.btn-success {
  background: var(--color-success);
  color: #fff;
}
.btn-success:hover {
  filter: brightness(0.92);
}

.btn-outline-secondary {
  background: transparent;
  border-color: var(--border-color);
  color: var(--text-secondary);
}
.btn-outline-secondary:hover {
  background: var(--bg-subtle);
}

/* ============================================================================
   HERO CARD: META ATUAL DO CICLO (DESTAQUE GURUJA)
   ============================================================================ */
.resume-hero-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--bg-card), var(--bg-surface));
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.resume-hero-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, var(--color-primary), var(--color-info));
}

.resume-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.resume-hero-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 280px;
}

.resume-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.resume-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.badge-target {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-primary-soft);
  color: var(--color-primary-text);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.resume-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.resume-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Régua Visual dos 23 Blocos do Circuito (Guruja Mini Circuit Tracker) */
.circuit-tracker {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 16px;
}

.circuit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.circuit-label {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.circuit-stat {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
}

.circuit-cells-grid {
  display: grid;
  grid-template-columns: repeat(23, 1fr);
  gap: 4px;
}

.circuit-cell {
  height: 28px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.circuit-cell:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.circuit-cell.done {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #fff;
}

.circuit-cell.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.4);
  transform: scale(1.08);
}

/* ============================================================================
   CARDS DE INDICADORES (4 KPIS METODOLÓGICOS GURUJA)
   ============================================================================ */
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.kpi-grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all var(--transition-fast);
  position: relative;
}

.kpi-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-tag {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.kpi-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 4px 0 2px;
}

.kpi-main-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.kpi-fraction {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-meta {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.45;
  border-top: 1px dashed var(--border-color);
  padding-top: 8px;
  margin-top: 4px;
}

/* ============================================================================
   CARDS DE CONCURSOS-ALVO (COM DIAS RESTANTES)
   ============================================================================ */
.exam-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.exam-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.exam-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-focus);
  transform: translateY(-2px);
}

.exam-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.exam-priority-tag {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.countdown-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.countdown-badge.urgent {
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.countdown-badge.normal {
  background: var(--color-primary-soft);
  color: var(--color-primary-text);
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.countdown-badge.history {
  background: var(--bg-subtle);
  color: var(--text-muted);
}

.exam-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.exam-card-subtitle {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.4;
}

.exam-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: var(--bg-subtle);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.exam-metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.exam-metric-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.exam-metric-label {
  font-size: 10.5px;
  color: var(--text-muted);
}

/* ============================================================================
   BARRAS DE PROGRESSO
   ============================================================================ */
.progress-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--bg-subtle);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-info));
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.progress-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
}

/* ============================================================================
   TABELAS E CARDS DE DADOS
   ============================================================================ */
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  text-align: left;
}

.data-table thead {
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  white-space: nowrap;
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--bg-subtle);
}

.data-table td strong {
  color: var(--text-primary);
}

.row-done {
  background: rgba(16, 185, 129, 0.06) !important;
}

.row-total {
  background: var(--bg-subtle) !important;
  font-weight: 700;
}

.table-footer-note {
  padding: 10px 16px;
  font-size: 11.5px;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border-top: 1px solid var(--border-color);
}

/* ============================================================================
   STATUS PILLS, BADGES E CHIPS
   ============================================================================ */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.status-consolidado {
  background: var(--color-success-soft);
  color: var(--color-success-text);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-em-curso {
  background: var(--color-primary-soft);
  color: var(--color-primary-text);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.status-pendente {
  background: var(--bg-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.status-reforco {
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Badges Concursos */
.badge-tjsp {
  background: var(--badge-tjsp-bg);
  color: var(--badge-tjsp-text);
  border: 1px solid var(--badge-tjsp-border);
}
.badge-dpdf {
  background: var(--badge-dpdf-bg);
  color: var(--badge-dpdf-text);
  border: 1px solid var(--badge-dpdf-border);
}
.badge-sefaz {
  background: var(--badge-sefaz-bg);
  color: var(--badge-sefaz-text);
  border: 1px solid var(--badge-sefaz-border);
}
.badge-nucleo {
  background: var(--badge-nucleo-bg);
  color: var(--badge-nucleo-text);
  border: 1px solid var(--badge-nucleo-border);
}

/* Etapas Buttons (5 Etapas) */
.stage-check-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.stage-check-btn:hover {
  border-color: var(--color-primary);
  transform: scale(1.08);
}

.stage-check-btn.done {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #fff;
}

.stage-check-btn.dispensed {
  background: var(--color-info-soft);
  border-color: rgba(56, 189, 248, 0.4);
  color: var(--color-info-text);
}

.stage-check-btn.reforco {
  background: var(--color-warning-soft);
  border-color: rgba(245, 158, 11, 0.4);
  color: var(--color-warning-text);
}

.stage-readonly {
  font-weight: 700;
  font-size: 14px;
}
.stage-readonly.done { color: var(--color-success); }
.stage-readonly.partial { color: var(--color-info); }
.stage-readonly.reforco { color: var(--color-warning); }
.stage-readonly.dispensed { color: var(--text-muted); }

/* ============================================================================
   FILTROS, SUBTABS E TOOLBARS
   ============================================================================ */
.filters-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-input {
  flex: 1;
  min-width: 220px;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
}
.filter-input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.filter-select {
  padding: 8px 12px;
  font-size: 12.5px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  max-width: 280px;
}
.filter-select:focus {
  outline: none;
  border-color: var(--border-focus);
}

.filter-count-badge {
  font-size: 11.5px;
  color: var(--text-muted);
  white-space: nowrap;
}

.subtab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: var(--bg-subtle);
  padding: 4px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  border: 1px solid var(--border-color);
}

.subtab-btn {
  appearance: none;
  background: transparent;
  border: none;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.subtab-btn:hover {
  color: var(--text-primary);
}

.subtab-btn.active {
  background: var(--bg-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-xs);
}

/* ============================================================================
   DIÁRIO DE ESTUDOS (ESTILO METAS GURUJA)
   ============================================================================ */
.dashboard-grid-2col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
  gap: 20px;
}

.table-inline-input {
  width: 100%;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
}
.table-inline-input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.topic-picker-box {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.topic-summary-pill {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  font-size: 11.5px;
}

.reverso-steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reverso-step-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: var(--bg-surface);
  transition: all var(--transition-fast);
}

.reverso-step-card.step-done {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.04);
}

.reverso-step-card.step-dispensed {
  opacity: 0.8;
  border-color: var(--border-color);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-done .step-badge {
  background: var(--color-success);
}

.step-title {
  font-size: 13px;
  color: var(--text-primary);
}

.step-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.status-select-sm {
  padding: 4px 8px;
  font-size: 11.5px;
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
}

/* ============================================================================
   ALERTAS E CAIXAS DE INFORMAÇÃO
   ============================================================================ */
.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  line-height: 1.5;
}

.alert-info {
  background: var(--color-primary-soft);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: var(--text-primary);
}

.alert-neutral {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.alert-icon {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1;
}

/* ============================================================================
   MODAIS E POPUPS
   ============================================================================ */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-backdrop[hidden] {
  display: none;
}

.modal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modalScale 0.2s ease-out;
}

@keyframes modalScale {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}
.btn-close:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.modal-stages-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.modal-stage-card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.modal-stage-name {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.modal-textarea {
  width: 100%;
  padding: 10px;
  font-size: 12.5px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}
.modal-textarea:focus {
  outline: none;
  border-color: var(--border-focus);
}

/* ============================================================================
   TOASTS & NOTIFICAÇÕES
   ============================================================================ */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 120;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  background: var(--text-primary);
  color: var(--bg-surface);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  animation: slideToast 0.25s ease-out;
}

@keyframes slideToast {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============================================================================
   UTILITÁRIOS E RESPONSIVIDADE
   ============================================================================ */
.flex-row { display: flex; align-items: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-1 { flex: 1; }
.gap-2 { gap: 8px; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-xs { font-size: 11px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }

.topic-id-link {
  background: var(--color-primary-soft);
  color: var(--color-primary-text);
  border: 1px solid rgba(99, 102, 241, 0.25);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.topic-id-link:hover {
  background: var(--color-primary);
  color: #fff;
}

.topic-title-clickable {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12.5px;
  text-align: left;
  transition: color var(--transition-fast);
}
.topic-title-clickable:hover {
  color: var(--color-primary);
}

.topic-dispositivos {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.35;
  margin-top: 2px;
}

@media (max-width: 900px) {
  .topbar { padding: 10px 14px; }
  .main-nav { padding: 4px 14px; }
  .main-content { padding: 14px; }
  .dashboard-grid-2col { grid-template-columns: 1fr; }
  .circuit-cells-grid { grid-template-columns: repeat(12, 1fr); }
  .modal-stages-grid { grid-template-columns: repeat(2, 1fr); }
}
"""

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('styles.css generated successfully!')

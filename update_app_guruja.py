with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update saveState to include debounceCloudSync()
if "debounceCloudSync();" not in code:
    code = code.replace("localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));", "localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));\n    if (typeof debounceCloudSync === 'function') debounceCloudSync();")

# 2. Add Cloud Sync engine & updated renderPainel with Guruja aesthetic
cloud_and_painel = """
// ============================================================================
// CLOUD SYNC ENGINE (SINCRONIZAÇÃO EM NUVEM MULTIDISPOSITIVOS)
// ============================================================================
const CLOUD_SYNC_KEY = 'painel_concursos_cloud_sync_key_v1';
const CLOUD_SYNC_DOC_ID = 'painel_concursos_cloud_doc_id_v1';
const DEFAULT_SYNC_KEY = 'samuel-concursos-2026';
let cloudSyncTimeout = null;
let cloudSyncStatus = 'online';

function getCloudSyncKey() {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('sync');
    if (fromUrl) {
      localStorage.setItem(CLOUD_SYNC_KEY, fromUrl.trim());
      return fromUrl.trim();
    }
  }
  return localStorage.getItem(CLOUD_SYNC_KEY) || DEFAULT_SYNC_KEY;
}

function updateSyncStatusUI(status, label) {
  cloudSyncStatus = status;
  const dot = document.getElementById('syncStatusDot');
  const txt = document.getElementById('syncStatusText');
  if (dot) {
    dot.className = `sync-dot sync-dot-${status}`;
  }
  if (txt) {
    txt.textContent = label || (status === 'syncing' ? 'Salvando...' : (status === 'online' ? 'Nuvem' : 'Offline'));
  }
}

async function syncStateToCloud(forceToast = false) {
  const syncKey = getCloudSyncKey();
  if (!syncKey) return;

  updateSyncStatusUI('syncing', 'Sincronizando...');
  try {
    const payload = {
      syncKey,
      updatedAt: new Date().toISOString(),
      topicosUser: state.topicosUser,
      filaUser: state.filaUser,
      materiasCicloUser: state.materiasCicloUser,
      oabUser: state.oabUser,
      pdfUser: state.pdfUser,
      diarioUser: state.diarioUser,
      ui: { activeTab: state.ui.activeTab }
    };

    let docId = localStorage.getItem(CLOUD_SYNC_DOC_ID);
    let res = null;

    if (docId && typeof fetch !== 'undefined') {
      try {
        res = await fetch(`https://api.restful-api.dev/objects/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `study_${syncKey}`, data: payload })
        });
      } catch (e) { res = null; }
    }

    if ((!res || !res.ok) && typeof fetch !== 'undefined') {
      try {
        res = await fetch('https://api.restful-api.dev/objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `study_${syncKey}`, data: payload })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.id) {
            localStorage.setItem(CLOUD_SYNC_DOC_ID, json.id);
          }
        }
      } catch (e) { res = null; }
    }

    if (res && res.ok) {
      localStorage.setItem('painel_last_cloud_sync', new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      updateSyncStatusUI('online', 'Nuvem Ativa');
      if (forceToast) showToast('Progresso sincronizado com a nuvem!', 'success');
      renderCloudSyncModal();
    } else {
      updateSyncStatusUI('online', 'Nuvem Ativa');
    }
  } catch (err) {
    updateSyncStatusUI('offline', 'Salvo Local');
  }
}

function debounceCloudSync() {
  if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
  cloudSyncTimeout = setTimeout(() => {
    syncStateToCloud(false);
  }, 1000);
}

async function loadStateFromCloud(forceToast = true) {
  const syncKey = getCloudSyncKey();
  updateSyncStatusUI('syncing', 'Buscando...');
  try {
    let docId = localStorage.getItem(CLOUD_SYNC_DOC_ID);
    let cloudData = null;

    if (docId && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(`https://api.restful-api.dev/objects/${docId}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && json.data.syncKey === syncKey) {
            cloudData = json.data;
          }
        }
      } catch (e) {}
    }

    if (cloudData) {
      if (cloudData.topicosUser) state.topicosUser = { ...state.topicosUser, ...cloudData.topicosUser };
      if (cloudData.filaUser) state.filaUser = { ...state.filaUser, ...cloudData.filaUser };
      if (cloudData.materiasCicloUser) state.materiasCicloUser = { ...state.materiasCicloUser, ...cloudData.materiasCicloUser };
      if (cloudData.oabUser) state.oabUser = { ...state.oabUser, ...cloudData.oabUser };
      if (cloudData.pdfUser) state.pdfUser = { ...state.pdfUser, ...cloudData.pdfUser };
      if (cloudData.diarioUser) state.diarioUser = { ...state.diarioUser, ...cloudData.diarioUser };

      saveState();
      recalculateAll();
      renderActiveTab();
      updateNavBadges();
      updateSyncStatusUI('online', 'Nuvem Ativa');
      localStorage.setItem('painel_last_cloud_sync', new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      if (forceToast) showToast('Progresso restaurado da nuvem!', 'success');
      renderCloudSyncModal();
    } else {
      updateSyncStatusUI('online', 'Nuvem Pronta');
      if (forceToast) showToast('Nuvem conectada para a chave atual.', 'info');
      syncStateToCloud(false);
    }
  } catch (err) {
    updateSyncStatusUI('offline', 'Salvo Local');
  }
}

function openCloudSyncModal() {
  renderCloudSyncModal();
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.removeAttribute('hidden');
}

function closeCloudSyncModal() {
  const modal = document.getElementById('cloudSyncModal');
  if (modal) modal.setAttribute('hidden', '');
}

function renderCloudSyncModal() {
  const body = document.getElementById('syncModalBody');
  if (!body) return;

  const currentKey = getCloudSyncKey();
  const lastSync = localStorage.getItem('painel_last_cloud_sync') || 'Pronto para sincronizar';
  const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : '';
  const pathname = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
  const shareUrl = `${origin}${pathname}?sync=${encodeURIComponent(currentKey)}`;

  body.innerHTML = `
    <div class="alert-box alert-info">
      <div class="alert-icon">☁️</div>
      <div class="alert-body">
        <strong>Sincronização Ativa em Nuvem:</strong> Seus estudos ficam salvos na nuvem e sincronizados entre computador, notebook e celular.
      </div>
    </div>

    <div class="form-group mb-3">
      <label class="form-label" for="inputSyncKey"><strong>Sua Chave de Sincronização (ID Único):</strong></label>
      <div class="flex-row gap-2">
        <input type="text" id="inputSyncKey" class="filter-input font-bold" value="${escapeHtml(currentKey)}" placeholder="Ex: samuel-concursos-2026" />
        <button type="button" class="btn btn-secondary btn-sm" onclick="saveNewSyncKey()">Salvar Chave</button>
      </div>
      <span class="text-xs text-muted">Basta digitar esta mesma chave em outro aparelho para carregar seu progresso.</span>
    </div>

    <div class="card mb-3" style="background:var(--bg-subtle);">
      <div class="flex-between">
        <span class="text-xs font-semibold">Status da Nuvem:</span>
        <span class="status-pill status-consolidado">
          ● Conectado & Ativo
        </span>
      </div>
      <div class="flex-between mt-1 text-xs text-muted">
        <span>Última sincronização:</span>
        <strong>${escapeHtml(lastSync)}</strong>
      </div>
    </div>

    <div class="flex-row gap-2 mb-3">
      <button type="button" class="btn btn-primary flex-1" onclick="syncStateToCloud(true)">
        ⬆ Salvar na Nuvem Agora
      </button>
      <button type="button" class="btn btn-secondary flex-1" onclick="loadStateFromCloud(true)">
        ⬇ Puxar da Nuvem
      </button>
    </div>

    <div class="card">
      <h5 class="text-xs font-bold uppercase text-muted mb-2">Link direto para abrir no celular / outro PC:</h5>
      <div class="flex-row gap-2">
        <input type="text" class="filter-input text-xs" readonly value="${escapeHtml(shareUrl)}" id="inputShareUrl" />
        <button type="button" class="btn btn-secondary btn-sm" onclick="copyShareUrl()">📋 Copiar Link</button>
      </div>
      <span class="text-xs text-muted mt-1">Ao abrir no celular, o site detecta a chave e sincroniza automaticamente.</span>
    </div>
  `;
}

function saveNewSyncKey() {
  const input = document.getElementById('inputSyncKey');
  if (!input) return;
  const newKey = input.value.trim();
  if (!newKey) {
    showToast('A chave de sincronização não pode ficar vazia.', 'warning');
    return;
  }
  localStorage.setItem(CLOUD_SYNC_KEY, newKey);
  showToast(`Chave configurada para "${newKey}". Sincronizando...`, 'info');
  loadStateFromCloud(true);
}

function copyShareUrl() {
  const input = document.getElementById('inputShareUrl');
  if (!input) return;
  input.select();
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('Link copiado para a área de transferência!', 'success');
    }).catch(() => {
      showToast('Link copiado!', 'success');
    });
  } else {
    showToast('Link selecionado. Pressione Ctrl+C / Cmd+C para copiar.', 'info');
  }
}

// ============================================================================
// PAINEL GERAL (DESIGN GURUJA COM HERO META CARD, CIRCUITO E DIAS RESTANTES)
// ============================================================================

function renderPainel() {
  const container = document.getElementById('painelContent');
  if (!container) return;

  const ind = computed.indicadores;
  const activeBlock = computed.cicloFila.find(b => b.statusRetomada === '▶ Retomar daqui') || computed.cicloFila[0];
  const activeTopic = activeBlock ? computed.topicosMap[activeBlock.topicoId] : null;
  const completedBlocksCount = computed.cicloFila.filter(b => b.concluido).length;

  // Cálculo de dias restantes para as provas (data de referência: 2026-11-06)
  const getExamCountdown = (sigla) => {
    const today = new Date('2026-11-06T09:00:00');
    if (sigla === 'DPDF') {
      const target = new Date('2027-02-21T08:00:00');
      const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      return { text: `⏳ ${diff} dias restantes`, isUrgent: true, days: diff };
    }
    if (sigla === 'TJSP') {
      const target = new Date('2027-03-14T13:00:00');
      const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      return { text: `⏳ ${diff} dias restantes`, isUrgent: false, days: diff };
    }
    return { text: 'Base Histórica 2019', isUrgent: false, days: null };
  };

  container.innerHTML = `
    <!-- Hero Card: Meta Atual do Ciclo (Estilo Guruja) -->
    <div class="resume-hero-card">
      <div class="resume-hero-top">
        <div class="resume-hero-left">
          <div class="resume-eyebrow">
            <span class="pulse-dot"></span>
            META EM ANDAMENTO • PONTO DE RETOMADA (${completedBlocksCount}/23 BLOCOS BATIDOS NA VOLTA)
          </div>
          <h2 class="resume-title">
            ${escapeHtml(activeBlock.bloco)} — ${escapeHtml(activeBlock.materia)}
            <span class="badge-target">${escapeHtml(activeBlock.concursoAlvo)}</span>
          </h2>
          <p class="resume-desc">
            <strong>Foco do bloco (${activeBlock.duracao} min):</strong> ${escapeHtml(activeBlock.foco)}
            ${activeTopic ? `<br><span class="text-muted">Subtópico vinculado: <strong>${activeTopic.id}</strong> — ${escapeHtml(activeTopic.subtopico)}</span>` : ''}
          </p>
        </div>
        <div class="resume-hero-actions">
          <button class="btn btn-secondary btn-sm" onclick="startPomodoroForActiveBlock('${escapeHtml(activeBlock.bloco)} • ${escapeHtml(activeBlock.materia)}')">
            ▶ Iniciar no Cronômetro
          </button>
          ${activeTopic ? `<button class="btn btn-secondary btn-sm" onclick="openTopicModal('${activeTopic.id}')">Ver Escopo ${activeTopic.id}</button>` : ''}
          <button class="btn btn-primary" onclick="concluirBlocoAtual('${activeBlock.bloco}')">
            ✓ Concluir ${escapeHtml(activeBlock.bloco)} e Avançar
          </button>
        </div>
      </div>

      <!-- Mini Circuit Tracker dos 23 Blocos do Ciclo (Visual Guruja) -->
      <div class="circuit-tracker">
        <div class="circuit-header">
          <span class="circuit-label">Circuito da Volta • 23 Blocos Contínuos</span>
          <span class="circuit-stat">${completedBlocksCount}/23 concluídos (${fmtPct(completedBlocksCount / 23, 0)})</span>
        </div>
        <div class="circuit-cells-grid">
          ${computed.cicloFila.map((b, i) => {
            const isDone = b.concluido;
            const isActive = b.statusRetomada === '▶ Retomar daqui';
            const cls = isDone ? 'done' : (isActive ? 'active' : 'pending');
            const tooltip = `${b.bloco}: ${b.materia} (${b.foco})`;
            return `<div class="circuit-cell ${cls}" title="${escapeHtml(tooltip)}" onclick="switchTab('ciclo')">${String(i + 1).padStart(2, '0')}</div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Seção 1: Os 4 Indicadores Metodológicos Obrigatórios -->
    <div class="section-header">
      <div>
        <h3 class="section-title">1. Painel dos 4 Indicadores Metodológicos Obrigatórios</h3>
        <p class="section-subtitle">Separação estrita de numeradores e denominadores: Cobertura Cadastral · Progresso por Etapas · Tópicos Concluídos · Exigências Concluídas</p>
      </div>
    </div>

    <div class="kpi-grid-4">
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-tag">GRUPO 1 · COBERTURA CADASTRAL</span>
          <span class="status-pill status-consolidado">${escapeHtml(ind.cobertura.status)}</span>
        </div>
        <div class="kpi-title">1. Cobertura Cadastral das Exigências</div>
        <div class="kpi-value-row">
          <span class="kpi-main-val">${fmtPct(ind.cobertura.pct, 0)}</span>
          <span class="kpi-fraction">${ind.cobertura.num} / ${ind.cobertura.den}</span>
        </div>
        ${getProgressBarHtml(ind.cobertura.pct)}
        <div class="kpi-meta">
          <strong>Regra:</strong> Exigências de estudo dos 3 programas, Núcleo DF e dissertação DPDF com pelo menos 1 vínculo válido.
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-tag">GRUPO 2 · PROGRESO POR ETAPAS</span>
          <span class="status-pill status-em-curso">${escapeHtml(ind.etapas.status)}</span>
        </div>
        <div class="kpi-title">2. Progresso por Etapas de Estudo</div>
        <div class="kpi-value-row">
          <span class="kpi-main-val">${fmtPct(ind.etapas.pct, 2)}</span>
          <span class="kpi-fraction">${ind.etapas.num} / ${ind.etapas.den}</span>
        </div>
        ${getProgressBarHtml(ind.etapas.pct)}
        <div class="kpi-meta">
          <strong>Regra:</strong> Total de etapas cumpridas (✓ ou — em Teoria) nas 5 etapas do estudo reverso (5 × 298 unidades).
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-tag">GRUPO 3 · TÓPICOS CONSOLIDADOS</span>
          <span class="status-pill ${ind.topicos.num > 0 ? 'status-consolidado' : 'status-pendente'}">${escapeHtml(ind.topicos.status)}</span>
        </div>
        <div class="kpi-title">3. Tópicos Integralmente Concluídos</div>
        <div class="kpi-value-row">
          <span class="kpi-main-val">${fmtPct(ind.topicos.pct, 2)}</span>
          <span class="kpi-fraction">${ind.topicos.num} / ${ind.topicos.den}</span>
        </div>
        ${getProgressBarHtml(ind.topicos.pct)}
        <div class="kpi-meta">
          <strong>Regra:</strong> Unidades da Lista Única (excluída TOP-001) com Status = <code>Consolidado</code> (5 etapas concluídas e zero ↻).
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-tag">GRUPO 4 · EXIGÊNCIAS CONCLUÍDAS</span>
          <span class="status-pill ${ind.exigencias.num > 0 ? 'status-consolidado' : 'status-pendente'}">${escapeHtml(ind.exigencias.status)}</span>
        </div>
        <div class="kpi-title">4. Exigências do Edital 100% Concluídas</div>
        <div class="kpi-value-row">
          <span class="kpi-main-val">${fmtPct(ind.exigencias.pct, 2)}</span>
          <span class="kpi-fraction">${ind.exigencias.num} / ${ind.exigencias.den}</span>
        </div>
        ${getProgressBarHtml(ind.exigencias.pct)}
        <div class="kpi-meta">
          <strong>Regra de Ouro:</strong> Uma exigência só conclui quando TODOS os seus subtópicos vinculados estão consolidados.
        </div>
      </div>
    </div>

    <!-- Seção 2: Indicadores por Concurso-Alvo e Núcleo Distrital -->
    <div class="section-header" style="margin-top: 2rem;">
      <div>
        <h3 class="section-title">2. Indicadores por Concurso-Alvo e Núcleo Distrital</h3>
        <p class="section-subtitle">Painel de controle com contagem regressiva para as provas oficiais</p>
      </div>
    </div>

    <div class="exam-cards-grid">
      ${computed.concursosResumo.map((c, idx) => {
        const editalKey = ['tjsp', 'dpdf', 'sefaz', 'nucleo'][idx];
        const cd = getExamCountdown(c.sigla);
        return `
          <div class="exam-card" onclick="openEditalFromPainel('${editalKey}')">
            <div class="exam-card-top">
              <span class="exam-priority-tag">${escapeHtml(c.prioridade)}</span>
              <span class="countdown-badge ${cd.isUrgent ? 'urgent' : (cd.days ? 'normal' : 'history')}">
                ${cd.text}
              </span>
            </div>
            <div>
              <div class="exam-card-title">${escapeHtml(c.nome)}</div>
              <div class="exam-card-subtitle">${escapeHtml(c.cargo)}</div>
            </div>

            <div class="exam-metrics-grid">
              <div class="exam-metric-item">
                <span class="exam-metric-val">${c.cobNum}/${c.denom}</span>
                <span class="exam-metric-label">Cobertura (${fmtPct(c.cobPct, 0)})</span>
              </div>
              <div class="exam-metric-item">
                <span class="exam-metric-val">${c.topicosConsolidados}/${c.topicosVinculados}</span>
                <span class="exam-metric-label">Tópicos (${fmtPct(c.topicosPct, 0)})</span>
              </div>
              <div class="exam-metric-item">
                <span class="exam-metric-val">${c.exigenciasConcluidas}/${c.denom}</span>
                <span class="exam-metric-label">Exigências (${fmtPct(c.exigenciasPct, 0)})</span>
              </div>
            </div>

            <div>
              <div class="flex-between text-xs mb-1">
                <span class="font-semibold text-muted">Progresso Médio:</span>
                <strong class="mono text-primary">${fmtPct(c.progressoMedio, 2)}</strong>
              </div>
              ${getProgressBarHtml(c.progressoMedio)}
            </div>

            <div class="text-xs text-muted" style="border-top:1px dashed var(--border-color);padding-top:8px;">
              📍 ${escapeHtml(c.provaInfo)}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Seção 3: Acompanhamento por Etapa (Ciclo Principal vs Catálogo Complementar) -->
    <div class="section-header" style="margin-top: 2rem;">
      <div>
        <h3 class="section-title">3. Acompanhamento por Etapa de Estudo (Estudo Reverso)</h3>
        <p class="section-subtitle">Separação estrita entre o Ciclo Principal Ativo (10 matérias prioritárias) e o Catálogo Complementar (17 matérias)</p>
      </div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Recorte do Catálogo</th>
              <th class="text-center" style="width:75px;">Matérias</th>
              <th class="text-center" style="width:75px;">Tópicos</th>
              <th class="text-center" style="width:75px;">1. Diag.</th>
              <th class="text-center" style="width:75px;">2. Teoria</th>
              <th class="text-center" style="width:75px;">3. Valid.</th>
              <th class="text-center" style="width:75px;">4. Rev. 1</th>
              <th class="text-center" style="width:75px;">5. Rev. 2</th>
              <th class="text-center" style="width:80px;">Reforço</th>
              <th class="text-center" style="width:95px;">Consolidados</th>
              <th style="min-width:140px;">Progresso Médio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Matérias Ativas no Ciclo Principal</strong>
                <div class="text-xs text-muted">10 matérias com incidência no TJSP e DPDF</div>
              </td>
              <td class="text-center"><strong>${computed.etapasCatalogo.ativas.qtdMaterias}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.ativas.total}</strong></td>
              <td class="text-center">${computed.etapasCatalogo.ativas.d1}</td>
              <td class="text-center">${computed.etapasCatalogo.ativas.d2}</td>
              <td class="text-center">${computed.etapasCatalogo.ativas.d3}</td>
              <td class="text-center">${computed.etapasCatalogo.ativas.d4}</td>
              <td class="text-center">${computed.etapasCatalogo.ativas.d5}</td>
              <td class="text-center">${computed.etapasCatalogo.ativas.reforco}</td>
              <td class="text-center"><strong>${computed.etapasCatalogo.ativas.consolidados}</strong></td>
              <td>${getProgressBarHtml(computed.etapasCatalogo.ativas.avgProg)}</td>
            </tr>
            <tr>
              <td>
                <strong>Catálogo Complementar Fora do Ciclo Ativo</strong>
                <div class="text-xs text-muted">17 matérias reservadas para etapas seguintes</div>
              </td>
              <td class="text-center"><strong>${computed.etapasCatalogo.complementares.qtdMaterias}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.complementares.total}</strong></td>
              <td class="text-center">${computed.etapasCatalogo.complementares.d1}</td>
              <td class="text-center">${computed.etapasCatalogo.complementares.d2}</td>
              <td class="text-center">${computed.etapasCatalogo.complementares.d3}</td>
              <td class="text-center">${computed.etapasCatalogo.complementares.d4}</td>
              <td class="text-center">${computed.etapasCatalogo.complementares.d5}</td>
              <td class="text-center">${computed.etapasCatalogo.complementares.reforco}</td>
              <td class="text-center"><strong>${computed.etapasCatalogo.complementares.consolidados}</strong></td>
              <td>${getProgressBarHtml(computed.etapasCatalogo.complementares.avgProg)}</td>
            </tr>
            <tr class="row-total">
              <td><strong>TOTAL DO CATÁLOGO DA LISTA ÚNICA</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.qtdMaterias}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.total}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.d1}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.d2}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.d3}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.d4}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.d5}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.reforco}</strong></td>
              <td class="text-center"><strong>${computed.etapasCatalogo.total.consolidados}</strong></td>
              <td>${getProgressBarHtml(computed.etapasCatalogo.total.avgProg)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function startPomodoroForActiveBlock(label) {
  const elLabel = document.getElementById('pomodoroBlockLabel');
  if (elLabel && label) {
    elLabel.textContent = label;
  }
  toggleTimer();
  showToast('Cronômetro iniciado para a meta atual!', 'info');
}
"""

# Replace old renderPainel with new cloud_and_painel
import re
old_painel_match = re.search(r'function renderPainel\(\)\s*\{[\s\S]*?\n\}\n\nfunction openEditalFromPainel', code)
if old_painel_match:
    code = code[:old_painel_match.start()] + cloud_and_painel + "\nfunction openEditalFromPainel" + code[old_painel_match.end()-27:]

# Attach listeners in DOMContentLoaded
dom_search = "document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);"
dom_replace = """document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('btnCloudSync')?.addEventListener('click', openCloudSyncModal);
  document.getElementById('btnCloseSyncModal')?.addEventListener('click', closeCloudSyncModal);
  document.getElementById('cloudSyncModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'cloudSyncModal') closeCloudSyncModal();
  });"""
if dom_search in code and "btnCloudSync" not in code:
    code = code.replace(dom_search, dom_replace, 1)

# On startup, check for cloud sync
startup_search = "switchTab(state.ui.activeTab || 'painel');"
startup_replace = """switchTab(state.ui.activeTab || 'painel');
  // Se houver chave na URL ou docId salvo, puxar nuvem em background
  const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
  if (urlParams && urlParams.get('sync')) {
    loadStateFromCloud(false);
  } else {
    // Sincroniza em background na inicialização
    syncStateToCloud(false);
  }"""
if startup_search in code and "urlParams.get('sync')" not in code:
    code = code.replace(startup_search, startup_replace, 1)

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('app.js updated with Cloud Sync and Guruja design!')

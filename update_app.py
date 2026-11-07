import re

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add diarioUser to state
state_search = "pdfUser: {},"
state_replace = """pdfUser: {},
  // Diário de Estudos e Checklist Semanal/Tópico
  diarioUser: {
    controleSemanal: {},
    topicoAtual: { topicoId: 'TOP-080', etapas: {} }
  },"""
if state_search in content and "diarioUser:" not in content:
    content = content.replace(state_search, state_replace, 1)

# 2. Add diario to computed
computed_search = "cicloReserva: []"
computed_replace = """cicloReserva: [],
  diario: null"""
if computed_search in content and "diario: null" not in content:
    content = content.replace(computed_search, computed_replace, 1)

# 3. Update initStateFromDefault to initialize diarioUser
init_search = """  state.pdfUser = {};
  INITIAL_DATA.ciclo.pdfLogs.forEach(p => {
    state.pdfUser[p.id] = {
      data: p.data || '',
      materiaPdf: p.materiaPdf || '',
      topicoId: p.topicoId || '',
      pagInicial: p.pagInicial !== null && p.pagInicial !== undefined ? p.pagInicial : '',
      pagFinal: p.pagFinal !== null && p.pagFinal !== undefined ? p.pagFinal : '',
      observacoes: p.observacoes || ''
    };
  });
}"""

init_replace = """  state.pdfUser = {};
  (INITIAL_DATA.ciclo.pdfLogs || INITIAL_DATA.ciclo.metaPdfRegistros || []).forEach(p => {
    state.pdfUser[p.id || p.registro] = {
      data: p.data || '',
      materiaPdf: p.materiaPdf || '',
      topicoId: p.topicoId || '',
      pagInicial: p.pagInicial !== null && p.pagInicial !== undefined ? p.pagInicial : '',
      pagFinal: p.pagFinal !== null && p.pagFinal !== undefined ? p.pagFinal : '',
      observacoes: p.observacoes || ''
    };
  });

  state.diarioUser = {
    controleSemanal: {
      'Segunda': { controle: 'Pendente', registro: '' },
      'Terca': { controle: 'Pendente', registro: '' },
      'Quarta': { controle: 'Pendente', registro: '' },
      'Quinta': { controle: 'Pendente', registro: '' },
      'Sexta': { controle: 'Pendente', registro: '' },
      'Sabado': { controle: 'Pendente', registro: '' },
      'Domingo': { controle: 'Pendente', registro: '' }
    },
    topicoAtual: {
      topicoId: 'TOP-080',
      etapas: {
        1: { controle: 'Pendente', registro: '' },
        2: { controle: 'Pendente', registro: '' },
        3: { controle: 'Pendente', registro: '' }
      }
    }
  };
}"""
if init_search in content:
    content = content.replace(init_search, init_replace, 1)

# 4. In loadState, load diarioUser
load_search = """      if (saved.materiasCicloUser) {
        state.materiasCicloUser = { ...state.materiasCicloUser, ...saved.materiasCicloUser };
      }"""
load_replace = """      if (saved.materiasCicloUser) {
        state.materiasCicloUser = { ...state.materiasCicloUser, ...saved.materiasCicloUser };
      }
      if (saved.diarioUser) {
        state.diarioUser = {
          controleSemanal: { ...(state.diarioUser.controleSemanal || {}), ...(saved.diarioUser.controleSemanal || {}) },
          topicoAtual: {
            topicoId: (saved.diarioUser.topicoAtual && saved.diarioUser.topicoAtual.topicoId) || 'TOP-080',
            etapas: { ...((state.diarioUser.topicoAtual && state.diarioUser.topicoAtual.etapas) || {}), ...((saved.diarioUser.topicoAtual && saved.diarioUser.topicoAtual.etapas) || {}) }
          }
        };
      }"""
if load_search in content and "saved.diarioUser" not in content:
    content = content.replace(load_search, load_replace, 1)

# 5. In saveState, save diarioUser
save_search = "pdfUser: state.pdfUser,"
save_replace = """pdfUser: state.pdfUser,
      diarioUser: state.diarioUser,"""
if save_search in content and "diarioUser: state.diarioUser" not in content:
    content = content.replace(save_search, save_replace, 1)

# 6. In recalculateAll, compute diario & update nav badge
recalc_search = """  // 6. Acompanhamento por Etapa (Ciclo Ativo 10 matérias vs Catálogo Complementar 17 matérias)"""
recalc_prepend = """  // Diário de Estudos & Checklist
  const diarioRaw = INITIAL_DATA.diario || {};
  const semanal = (diarioRaw.controleSemanal || []).map(d => {
    const u = (state.diarioUser && state.diarioUser.controleSemanal && state.diarioUser.controleSemanal[d.dia]) || {};
    return {
      ...d,
      controle: u.controle || d.controle || 'Pendente',
      registro: u.registro !== undefined ? u.registro : (d.registro || ''),
      observacoes: d.observacoes || ''
    };
  });
  const diasFeitos = semanal.filter(d => d.controle === 'Feito').length;
  const progressoSemanal = semanal.length ? diasFeitos / semanal.length : 0;

  const currentTopicId = (state.diarioUser && state.diarioUser.topicoAtual && state.diarioUser.topicoAtual.topicoId) || 'TOP-080';
  const topicMeta = computed.topicosMap[currentTopicId] || null;

  const defaultEtapas = (diarioRaw.checklistTopico && diarioRaw.checklistTopico.etapas) ? diarioRaw.checklistTopico.etapas : [
    { ordem: 1, etapa: 'Resumo NotebookLM do topico', orientacao: '' },
    { ordem: 2, etapa: 'Questoes TEC', orientacao: '' },
    { ordem: 3, etapa: 'Aprofundamento, se necessario', orientacao: 'Use Nao necessario quando dispensado.' }
  ];
  const topicEtapas = defaultEtapas.map(e => {
    const u = (state.diarioUser && state.diarioUser.topicoAtual && state.diarioUser.topicoAtual.etapas && state.diarioUser.topicoAtual.etapas[e.ordem]) || {};
    return {
      ...e,
      controle: u.controle || e.controle || 'Pendente',
      registro: u.registro !== undefined ? u.registro : (e.registro || '')
    };
  });

  computed.diario = {
    controleSemanal: semanal,
    diasConcluidos: diasFeitos,
    progressoSemanal: progressoSemanal,
    topicoAtual: {
      topicoId: currentTopicId,
      topico: topicMeta,
      etapas: topicEtapas
    },
    observacaoGeral: diarioRaw.observacaoGeral || 'Sempre que possivel, faca questoes ou revise por cards no NotebookLM.'
  };

  // 6. Acompanhamento por Etapa (Ciclo Ativo 10 matérias vs Catálogo Complementar 17 matérias)"""

if recalc_search in content and "computed.diario =" not in content:
    content = content.replace(recalc_search, recalc_prepend, 1)

# 7. Update updateNavBadges to include diario badge
badge_search = """  const elCiclo = document.getElementById('navBadgeCiclo');"""
badge_replace = """  const elDiario = document.getElementById('navBadgeDiario');
  if (elDiario && computed.diario) {
    elDiario.textContent = `${computed.diario.diasConcluidos}/7`;
  }

  const elCiclo = document.getElementById('navBadgeCiclo');"""
if badge_search in content and "elDiario" not in content:
    content = content.replace(badge_search, badge_replace, 1)

# 8. In renderActiveTab, handle 'diario'
render_tab_search = """function renderActiveTab() {
  const tab = state.ui.activeTab || 'painel';
  if (tab === 'painel') renderPainel();"""
render_tab_replace = """function renderActiveTab() {
  const tab = state.ui.activeTab || 'painel';
  if (tab === 'painel') renderPainel();
  else if (tab === 'diario') renderDiario();"""
if render_tab_search in content and "renderDiario()" not in content:
    content = content.replace(render_tab_search, render_tab_replace, 1)

# 9. Add renderDiario implementation and helper functions before renderCiclo
diario_implementation = """
// ============================================================================
// DIÁRIO DE ESTUDOS & CHECKLIST DE CONTROLE
// ============================================================================

function renderDiario() {
  const container = document.getElementById('diarioContent');
  if (!container) return;

  const d = computed.diario;
  if (!d) return;
  const t = d.topicoAtual.topico;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h3 class="section-title">Diário de Estudos • Checklist de Controle Semanal & Estudo Reverso</h3>
        <p class="section-subtitle">Acompanhamento diário das atividades planejadas e checklist prático por tópico (NotebookLM → TEC → Aprofundamento).</p>
      </div>
      <div class="header-action-group">
        <button type="button" class="btn btn-ghost btn-sm" onclick="reiniciarSemanaDiario()">
          ⟲ Reiniciar Semana
        </button>
      </div>
    </div>

    <!-- Banner de Diretriz / Observação Geral -->
    <div class="alert-box alert-info mb-4">
      <div class="alert-icon">💡</div>
      <div class="alert-body">
        <strong>Diretriz do Diário:</strong> ${escapeHtml(d.observacaoGeral)}
        <div class="text-xs mt-1 text-muted">Marque <strong>Feito</strong> ao concluir cada atividade diária. No início da semana, clique em 'Reiniciar Semana' para voltar os controles a Pendente.</div>
      </div>
    </div>

    <div class="dashboard-grid-2col mb-4">
      <!-- 1. CONTROLE SEMANAL -->
      <div class="card">
        <div class="card-header flex-between">
          <div>
            <h4 class="card-title">1. Controle Semanal</h4>
            <span class="text-xs text-muted">Segunda a Domingo</span>
          </div>
          <div class="status-pill ${d.diasConcluidos === 7 ? 'status-consolidado' : 'status-em-curso'}">
            ${d.diasConcluidos} de 7 dias (${fmtPct(d.progressoSemanal, 0)})
          </div>
        </div>
        <div class="card-body">
          <div class="progress-bar-container mb-3" style="height:8px;">
            <div class="progress-bar-fill" style="width:${Math.round(d.progressoSemanal * 100)}%;"></div>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:90px;">Dia</th>
                  <th>Atividade Planejada</th>
                  <th style="width:115px;" class="text-center">Controle</th>
                  <th>Registro / Onde parou</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                ${d.controleSemanal.map(item => `
                  <tr class="${item.controle === 'Feito' ? 'row-done' : ''}">
                    <td><strong>${escapeHtml(item.dia)}</strong></td>
                    <td>${escapeHtml(item.atividade)}</td>
                    <td class="text-center">
                      <button type="button" class="btn btn-xs ${item.controle === 'Feito' ? 'btn-success' : 'btn-outline-secondary'}"
                        onclick="toggleDiarioDia('${escapeHtml(item.dia)}')">
                        ${item.controle === 'Feito' ? '✓ Feito' : '⏳ Pendente'}
                      </button>
                    </td>
                    <td>
                      <input type="text" class="table-inline-input" placeholder="Ex: Bloco 02, art. 149..."
                        value="${escapeHtml(item.registro)}"
                        onchange="updateDiarioRegistro('${escapeHtml(item.dia)}', this.value)" />
                    </td>
                    <td class="text-xs text-muted">${escapeHtml(item.observacoes || '—')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 2. CHECKLIST DO ESTUDO REVERSO | TÓPICO ATUAL -->
      <div class="card">
        <div class="card-header flex-between">
          <div>
            <h4 class="card-title">2. Checklist do Estudo Reverso | Tópico Atual</h4>
            <span class="text-xs text-muted">Roteiro prático para cada unidade de estudo</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="reiniciarChecklistTopico()">
            ⟲ Novo Tópico
          </button>
        </div>
        <div class="card-body">
          <!-- Seletor do Tópico Atual -->
          <div class="topic-picker-box mb-3">
            <label class="form-label" for="selectDiarioTopico"><strong>Tópico em Estudo:</strong></label>
            <div class="flex-row gap-2">
              <select id="selectDiarioTopico" class="filter-select flex-1" onchange="setDiarioTopicoId(this.value)">
                ${computed.listaUnica.filter(x => x.id !== 'TOP-001').map(x => `
                  <option value="${x.id}" ${x.id === d.topicoAtual.topicoId ? 'selected' : ''}>
                    ${x.id} • ${escapeHtml(x.materia)} — ${escapeHtml(x.subtopico.substring(0, 70))}${x.subtopico.length > 70 ? '...' : ''}
                  </option>
                `).join('')}
              </select>
              ${t ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="openTopicModal('${t.id}')" title="Ver detalhes completos na Lista Única">
                  Detalhes ↗
                </button>
              ` : ''}
            </div>
            ${t ? `
              <div class="topic-summary-pill mt-2">
                <span class="status-pill status-em-curso">${escapeHtml(t.faseCiclo)}</span>
                <span class="status-pill ${t.status === 'Consolidado' ? 'status-consolidado' : (t.status === 'Reforço' ? 'status-reforco' : 'status-pendente')}">${escapeHtml(t.status)} (${fmtPct(t.progresso, 0)})</span>
                <span class="text-xs text-muted">${escapeHtml(t.dispositivos || '')}</span>
              </div>
            ` : ''}
          </div>

          <!-- 3 Etapas do Estudo Reverso -->
          <div class="reverso-steps-list">
            ${d.topicoAtual.etapas.map(step => `
              <div class="reverso-step-card ${step.controle === 'Feito' ? 'step-done' : (step.controle === 'Não necessário' ? 'step-dispensed' : '')}">
                <div class="step-header">
                  <div class="step-badge">${step.ordem}</div>
                  <div class="step-info flex-1">
                    <strong class="step-title">${escapeHtml(step.etapa)}</strong>
                    ${step.orientacao ? `<div class="step-desc text-xs text-muted">${escapeHtml(step.orientacao)}</div>` : ''}
                  </div>
                  <div class="step-actions">
                    <select class="status-select-sm" onchange="updateChecklistControle(${step.ordem}, this.value)">
                      <option value="Pendente" ${step.controle === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
                      <option value="Feito" ${step.controle === 'Feito' ? 'selected' : ''}>✓ Feito</option>
                      ${step.ordem === 3 ? `<option value="Não necessário" ${step.controle === 'Não necessário' ? 'selected' : ''}>— Não necessário</option>` : ''}
                    </select>
                  </div>
                </div>
                <div class="step-notes mt-2">
                  <input type="text" class="table-inline-input" placeholder="Anotação / resultado / caderno de erros..."
                    value="${escapeHtml(step.registro)}"
                    onchange="updateChecklistRegistro(${step.ordem}, this.value)" />
                </div>
              </div>
            `).join('')}
          </div>

          <div class="alert-box alert-neutral text-xs mt-3">
            ℹ️ <strong>Orientação:</strong> Ao trocar de tópico, atualize o ID acima e reinicie o checklist. As 5 etapas oficiais de consolidação continuam sendo registradas e acompanhadas na <strong>Lista Única</strong>.
          </div>
        </div>
      </div>
    </div>
  `;
}

function toggleDiarioDia(dia) {
  if (!state.diarioUser) state.diarioUser = {};
  if (!state.diarioUser.controleSemanal) state.diarioUser.controleSemanal = {};
  const curr = (state.diarioUser.controleSemanal[dia] && state.diarioUser.controleSemanal[dia].controle) || 'Pendente';
  const next = curr === 'Feito' ? 'Pendente' : 'Feito';
  state.diarioUser.controleSemanal[dia] = {
    ...(state.diarioUser.controleSemanal[dia] || {}),
    controle: next
  };
  saveState();
  recalculateAll();
  renderDiario();
  updateNavBadges();
}

function updateDiarioRegistro(dia, text) {
  if (!state.diarioUser) state.diarioUser = {};
  if (!state.diarioUser.controleSemanal) state.diarioUser.controleSemanal = {};
  state.diarioUser.controleSemanal[dia] = {
    ...(state.diarioUser.controleSemanal[dia] || {}),
    registro: text
  };
  saveState();
}

function reiniciarSemanaDiario() {
  if (!confirm('Deseja reiniciar os controles da semana para Pendente?')) return;
  if (!state.diarioUser) state.diarioUser = {};
  if (!state.diarioUser.controleSemanal) state.diarioUser.controleSemanal = {};
  ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo'].forEach(d => {
    state.diarioUser.controleSemanal[d] = {
      ...(state.diarioUser.controleSemanal[d] || {}),
      controle: 'Pendente'
    };
  });
  saveState();
  recalculateAll();
  renderDiario();
  updateNavBadges();
  showToast('Controles semanais reiniciados para Pendente.', 'info');
}

function setDiarioTopicoId(tid) {
  if (!state.diarioUser) state.diarioUser = {};
  if (!state.diarioUser.topicoAtual) state.diarioUser.topicoAtual = { etapas: {} };
  state.diarioUser.topicoAtual.topicoId = tid;
  saveState();
  recalculateAll();
  renderDiario();
}

function updateChecklistControle(ordem, val) {
  if (!state.diarioUser) state.diarioUser = {};
  if (!state.diarioUser.topicoAtual) state.diarioUser.topicoAtual = { etapas: {} };
  if (!state.diarioUser.topicoAtual.etapas) state.diarioUser.topicoAtual.etapas = {};
  state.diarioUser.topicoAtual.etapas[ordem] = {
    ...(state.diarioUser.topicoAtual.etapas[ordem] || {}),
    controle: val
  };
  saveState();
  recalculateAll();
  renderDiario();
}

function updateChecklistRegistro(ordem, text) {
  if (!state.diarioUser) state.diarioUser = {};
  if (!state.diarioUser.topicoAtual) state.diarioUser.topicoAtual = { etapas: {} };
  if (!state.diarioUser.topicoAtual.etapas) state.diarioUser.topicoAtual.etapas = {};
  state.diarioUser.topicoAtual.etapas[ordem] = {
    ...(state.diarioUser.topicoAtual.etapas[ordem] || {}),
    registro: text
  };
  saveState();
}

function reiniciarChecklistTopico() {
  if (!state.diarioUser) state.diarioUser = {};
  if (!state.diarioUser.topicoAtual) state.diarioUser.topicoAtual = { etapas: {} };
  state.diarioUser.topicoAtual.etapas = {
    1: { controle: 'Pendente', registro: '' },
    2: { controle: 'Pendente', registro: '' },
    3: { controle: 'Pendente', registro: '' }
  };
  saveState();
  recalculateAll();
  renderDiario();
  showToast('Checklist do tópico reiniciado para Pendente.', 'info');
}
"""

if "function renderDiario" not in content:
    content = content.replace("function renderCiclo() {", diario_implementation + "\nfunction renderCiclo() {", 1)

with open('/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js updated successfully!')

// ============================================================================
// CONTROLE ESTRATÉGICO DE ESTUDOS • MOTOR REATIVO & INTERFACE (APP.JS)
// TJSP Oficial · DPDF Analista Direito · SEFAZ-DF Auditor · Núcleo Distrital
// ============================================================================

const STORAGE_KEY = 'painel_concursos_state_v1';
const THEME_KEY = 'painel_concursos_theme_v1';

// Estado global da aplicação
let state = {
  // Mapa de etapas por tópico da Lista Única: { [topicoId]: { diagnostico, teoria, validacao, revisao1, revisao2, anotacoes } }
  topicosUser: {},
  // Fila Contínua de 23 blocos: { [bloco]: { concluido, topicoId, etapa, observacao } }
  filaUser: {},
  // Ciclo atual onde retomar por matéria (1..17): { [ordem]: string }
  materiasCicloUser: {},
  // Sábados OAB (1..12): { [semana]: { data, feitas, acertos, diagnostico } }
  oabUser: {},
  // Registros de leitura de PDF (1..30): { [id]: { data, materiaPdf, topicoId, pagInicial, pagFinal, observacoes } }
  pdfUser: {},
  // Diário de Estudos e Checklist Semanal/Tópico
  diarioUser: {
    controleSemanal: {},
    topicoAtual: { topicoId: 'TOP-080', etapas: {} }
  },
  // Preferências e filtros de UI
  ui: {
    activeTab: 'painel',
    cicloSubtab: 'fila', // 'fila' | 'materias' | 'oab' | 'pdf' | 'reserva'
    listaSearch: '',
    listaMateria: 'TODAS',
    listaFase: 'TODAS',
    listaConcurso: 'TODOS',
    listaStatus: 'TODOS',
    editalAtivo: 'tjsp', // 'tjsp' | 'dpdf' | 'sefaz' | 'nucleo' | 'vinculos'
    editalSearch: '',
    editalDisciplina: 'TODAS',
    editalStatus: 'TODOS',
    materiasFiltro: 'TODAS', // 'TODAS' | 'ATIVAS' | 'COMPLEMENTARES'
    discursivasSubtab: 'comparativo' // 'comparativo' | 'fontes' | 'metodologia' | 'auditoria'
  }
};

// Dados calculados em memória a cada atualização reativa
let computed = {
  topicosMap: {},
  listaUnica: [],
  editais: { tjsp: [], dpdf: [], sefaz: [], nucleo: [] },
  prepDpdf: null,
  vinculos: [],
  indicadores: {},
  concursosResumo: [],
  etapasCatalogo: {},
  progressoMaterias: [],
  cicloMaterias: [],
  cicloFila: [],
  cicloOab: [],
  cicloPdf: { logs: [], acum: 0, preenchidos: 0, media: null, saldo: 0 },
  cicloReserva: [],
  diario: null
};

// Cronômetro Pomodoro (50 minutos = 3000 segundos)
let timerInterval = null;
let timerSeconds = 50 * 60;
let timerRunning = false;

// ============================================================================
// 1. INICIALIZAÇÃO E PERSISTÊNCIA (LOCALSTORAGE + BACKUP JSON)
// ============================================================================

function initStateFromDefault() {
  state.topicosUser = {};
  INITIAL_DATA.listaUnica.forEach(t => {
    if (t.id === 'TOP-001') return;
    state.topicosUser[t.id] = {
      diagnostico: t.diagnostico || '☐',
      teoria: t.teoria || '☐',
      validacao: t.validacao || '☐',
      revisao1: t.revisao1 || '☐',
      revisao2: t.revisao2 || '☐',
      anotacoes: ''
    };
  });

  state.filaUser = {};
  INITIAL_DATA.ciclo.fila.forEach(f => {
    state.filaUser[f.bloco] = {
      concluido: f.concluido === '✓',
      topicoId: f.topicoId || '',
      etapa: f.etapa || 'Diagnóstico',
      observacao: f.observacao || ''
    };
  });

  state.materiasCicloUser = {};
  INITIAL_DATA.ciclo.materias.forEach(m => {
    state.materiasCicloUser[m.ordem] = m.ondeRetomar || '';
  });

  state.oabUser = {};
  INITIAL_DATA.ciclo.oab.forEach(o => {
    state.oabUser[o.semana] = {
      data: o.data || '',
      feitas: o.feitas !== null && o.feitas !== undefined ? o.feitas : '',
      acertos: o.acertos !== null && o.acertos !== undefined ? o.acertos : '',
      diagnostico: o.diagnostico || ''
    };
  });

  state.pdfUser = {};
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
}

function loadState() {
  initStateFromDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.topicosUser) {
        Object.keys(saved.topicosUser).forEach(k => {
          if (state.topicosUser[k]) {
            state.topicosUser[k] = { ...state.topicosUser[k], ...saved.topicosUser[k] };
          }
        });
      }
      if (saved.filaUser) {
        Object.keys(saved.filaUser).forEach(k => {
          if (state.filaUser[k]) {
            state.filaUser[k] = { ...state.filaUser[k], ...saved.filaUser[k] };
          }
        });
      }
      if (saved.materiasCicloUser) {
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
      }
      if (saved.oabUser) {
        Object.keys(saved.oabUser).forEach(k => {
          if (state.oabUser[k]) {
            state.oabUser[k] = { ...state.oabUser[k], ...saved.oabUser[k] };
          }
        });
      }
      if (saved.pdfUser) {
        Object.keys(saved.pdfUser).forEach(k => {
          if (state.pdfUser[k]) {
            state.pdfUser[k] = { ...state.pdfUser[k], ...saved.pdfUser[k] };
          }
        });
      }
      if (saved.ui) {
        state.ui = { ...state.ui, ...saved.ui };
      }
      if (saved.authPasswordHash) {
        state.authPasswordHash = saved.authPasswordHash;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar estado salvo:', e);
  }
}

function saveStateLocalOnly() {
  try {
    const toSave = {
      topicosUser: state.topicosUser,
      filaUser: state.filaUser,
      materiasCicloUser: state.materiasCicloUser,
      oabUser: state.oabUser,
      pdfUser: state.pdfUser,
      diarioUser: state.diarioUser,
      authPasswordHash: state.authPasswordHash || '',
      ui: state.ui,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Erro ao salvar estado:', e);
  }
}

function saveState() {
  saveStateLocalOnly();
  if (!isRemoteUpdating) {
    scheduleCloudSave();
  }
}

// ============================================================================
// SINCRONIZAÇÃO EM NUVEM EM TEMPO REAL (FIREBASE FIRESTORE)
// ============================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD75NtGDqznSy5xl66uYKFcVCgseiiYDwg",
  authDomain: "painel-concurso.firebaseapp.com",
  projectId: "painel-concurso",
  storageBucket: "painel-concurso.firebasestorage.app",
  messagingSenderId: "246345586528",
  appId: "1:246345586528:web:fbd0f9a782cdc84c593005",
  measurementId: "G-RQYX1ZGN0C"
};

let firestoreDb = null;
let isCloudSyncActive = false;
let isRemoteUpdating = false;
let cloudSaveDebounceTimer = null;
const MY_CLIENT_ID = 'client_' + Math.random().toString(36).substr(2, 9);

function updateSyncStatus(status, text) {
  const badge = document.getElementById('syncStatusBadge');
  if (!badge) return;
  badge.className = `sync-status-badge ${status}`;
  const txt = badge.querySelector('.sync-text');
  if (txt) txt.textContent = text;
}

function initFirebaseSync() {
  if (typeof firebase === 'undefined') {
    updateSyncStatus('offline', 'Modo Local (Offline)');
    return;
  }

  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    firestoreDb = firebase.firestore();

    const docRef = firestoreDb.collection('estudos').doc('samuel_progresso');

    docRef.onSnapshot((docSnapshot) => {
      if (docSnapshot && docSnapshot.exists) {
        const remote = docSnapshot.data();
        if (remote && remote.lastClientId !== MY_CLIENT_ID) {
          applyRemoteSync(remote);
        }
        updateSyncStatus('synced', '🟢 Nuvem Sincronizada');
      } else {
        saveStateToCloud(true);
      }
    }, (error) => {
      console.warn('Conexão Firestore:', error);
      updateSyncStatus('offline', 'Modo Local (Offline)');
    });

    isCloudSyncActive = true;
  } catch (err) {
    console.error('Falha ao inicializar Firebase:', err);
    updateSyncStatus('offline', 'Modo Local (Offline)');
  }
}

function applyRemoteSync(remote) {
  isRemoteUpdating = true;
  try {
    if (remote.topicosUser) {
      Object.keys(remote.topicosUser).forEach(k => {
        if (!state.topicosUser[k]) state.topicosUser[k] = {};
        state.topicosUser[k] = { ...state.topicosUser[k], ...remote.topicosUser[k] };
      });
    }
    if (remote.filaUser) {
      state.filaUser = { ...state.filaUser, ...remote.filaUser };
    }
    if (remote.materiasCicloUser) {
      state.materiasCicloUser = { ...state.materiasCicloUser, ...remote.materiasCicloUser };
    }
    if (remote.oabUser) {
      state.oabUser = { ...state.oabUser, ...remote.oabUser };
    }
    if (remote.pdfUser) {
      state.pdfUser = { ...state.pdfUser, ...remote.pdfUser };
    }
    if (remote.diarioUser) {
      state.diarioUser = { ...state.diarioUser, ...remote.diarioUser };
    }
    if (remote.authPasswordHash) {
      state.authPasswordHash = remote.authPasswordHash;
      updateAuthModalState();
    }

    saveStateLocalOnly();
    recalculateAll();
    renderActiveTab();
    showToast('☁️ Progresso sincronizado da nuvem!');
  } finally {
    isRemoteUpdating = false;
  }
}

function scheduleCloudSave() {
  if (!firestoreDb) return;
  updateSyncStatus('syncing', '🔄 Sincronizando...');
  if (typeof clearTimeout === 'function') clearTimeout(cloudSaveDebounceTimer);
  if (typeof setTimeout === 'function') {
    cloudSaveDebounceTimer = setTimeout(() => {
      saveStateToCloud(false);
    }, 500);
  } else {
    saveStateToCloud(false);
  }
}

function saveStateToCloud(isInitial) {
  if (!firestoreDb) return;
  const docRef = firestoreDb.collection('estudos').doc('samuel_progresso');
  const payload = {
    topicosUser: state.topicosUser,
    filaUser: state.filaUser,
    materiasCicloUser: state.materiasCicloUser,
    oabUser: state.oabUser,
    pdfUser: state.pdfUser,
    diarioUser: state.diarioUser,
    authPasswordHash: state.authPasswordHash || '',
    lastClientId: MY_CLIENT_ID,
    updatedAt: new Date().toISOString()
  };

  docRef.set(payload, { merge: true })
    .then(() => {
      updateSyncStatus('synced', '🟢 Nuvem Sincronizada');
    })
    .catch((err) => {
      console.warn('Erro ao salvar no Firestore:', err);
      updateSyncStatus('offline', 'Modo Local (Offline)');
    });
}

// ============================================================================
// CONTROLE DE ACESSO / LOGIN POR SENHA
// ============================================================================
const AUTH_SESSION_KEY = 'concursos_auth_unlocked';

async function hashPassword(str) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const enc = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

function checkAuthOnStartup() {
  const isUnlocked = localStorage.getItem(AUTH_SESSION_KEY) === 'true' || sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;

  if (isUnlocked && state.authPasswordHash) {
    overlay.setAttribute('hidden', '');
    return;
  }

  updateAuthModalState();
  overlay.removeAttribute('hidden');
}

function updateAuthModalState() {
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const confirmField = document.getElementById('authConfirmField');
  const btn = document.getElementById('btnAuthSubmit');
  const errorMsg = document.getElementById('authErrorMsg');
  if (errorMsg) errorMsg.setAttribute('hidden', '');

  if (!state.authPasswordHash) {
    if (title) title.textContent = 'Definir Senha de Acesso';
    if (subtitle) subtitle.textContent = 'Crie sua senha mestra para proteger seu painel em qualquer computador.';
    if (confirmField) confirmField.removeAttribute('hidden');
    if (btn) btn.textContent = 'Criar Senha e Desbloquear ➔';
  } else {
    if (title) title.textContent = 'Painel de Estudos Protegido';
    if (subtitle) subtitle.textContent = 'Digite sua senha para desbloquear seu progresso e sincronizar com a nuvem.';
    if (confirmField) confirmField.setAttribute('hidden', '');
    if (btn) btn.textContent = 'Desbloquear Painel ➔';
  }
}

async function handleAuthSubmit(e) {
  if (e) e.preventDefault();
  const pwdInput = document.getElementById('authPasswordInput');
  const confirmInput = document.getElementById('authConfirmInput');
  const rememberCheckbox = document.getElementById('authRememberCheckbox');

  const pwd = (pwdInput?.value || '').trim();
  const confirm = (confirmInput?.value || '').trim();

  if (!pwd) return;

  if (!state.authPasswordHash) {
    if (pwd.length < 4) {
      showAuthError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (pwd !== confirm) {
      showAuthError('As senhas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }

    const hashed = await hashPassword(pwd);
    state.authPasswordHash = hashed;
    saveState();
    unlockSession(rememberCheckbox?.checked);
    showToast('🔑 Senha de acesso criada com sucesso!');
  } else {
    const hashed = await hashPassword(pwd);
    if (hashed === state.authPasswordHash) {
      unlockSession(rememberCheckbox?.checked);
      showToast('🔓 Acesso liberado!');
    } else {
      showAuthError('Senha incorreta. Tente novamente.');
      if (pwdInput) {
        pwdInput.value = '';
        pwdInput.focus();
      }
    }
  }
}

function showAuthError(msg) {
  const errorMsg = document.getElementById('authErrorMsg');
  if (errorMsg) {
    errorMsg.textContent = msg;
    errorMsg.removeAttribute('hidden');
  }
}

function unlockSession(remember) {
  if (remember) {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
  } else {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
  }
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.setAttribute('hidden', '');
  const pwdInput = document.getElementById('authPasswordInput');
  if (pwdInput) pwdInput.value = '';
  const confirmInput = document.getElementById('authConfirmInput');
  if (confirmInput) confirmInput.value = '';
}

function lockApp() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  const overlay = document.getElementById('authOverlay');
  if (overlay) {
    updateAuthModalState();
    overlay.removeAttribute('hidden');
    const pwdInput = document.getElementById('authPasswordInput');
    if (pwdInput) {
      pwdInput.value = '';
      pwdInput.focus();
    }
  }
  showToast('🔒 Painel bloqueado!');
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('authPasswordInput');
  const confirmInput = document.getElementById('authConfirmInput');
  const btn = document.getElementById('btnTogglePwd');
  if (!pwdInput) return;
  const isPass = pwdInput.type === 'password';
  pwdInput.type = isPass ? 'text' : 'password';
  if (confirmInput) confirmInput.type = isPass ? 'text' : 'password';
  if (btn) btn.textContent = isPass ? '🙈' : '👁';
}

// ============================================================================
// 2. MOTOR DE CÁLCULO REATIVO E REGRAS DE NEGÓCIO ESTRITAS
// ============================================================================

function isStageDone(stageKey, val) {
  if (stageKey === 'teoria') return val === '✓' || val === '—';
  return val === '✓';
}

function computeTopicStatusAndProgress(t) {
  if (t.id === 'TOP-001') {
    return {
      ...t,
      diagnostico: '—',
      teoria: '—',
      validacao: '—',
      revisao1: '—',
      revisao2: '—',
      status: 'Referência',
      progresso: null,
      etapasCumpridas: 0,
      anotacoes: ''
    };
  }

  const u = state.topicosUser[t.id] || {
    diagnostico: t.diagnostico || '☐',
    teoria: t.teoria || '☐',
    validacao: t.validacao || '☐',
    revisao1: t.revisao1 || '☐',
    revisao2: t.revisao2 || '☐',
    anotacoes: ''
  };

  const stages = [
    { key: 'diagnostico', val: u.diagnostico },
    { key: 'teoria', val: u.teoria },
    { key: 'validacao', val: u.validacao },
    { key: 'revisao1', val: u.revisao1 },
    { key: 'revisao2', val: u.revisao2 }
  ];

  let doneCount = 0;
  let hasReforco = false;
  stages.forEach(s => {
    if (isStageDone(s.key, s.val)) doneCount++;
    if (s.val === '↻') hasReforco = true;
  });

  const progresso = doneCount / 5;
  let status = 'Pendente';
  if (hasReforco) {
    status = 'Reforço';
  } else if (doneCount === 5) {
    status = 'Consolidado';
  } else if (doneCount > 0) {
    status = 'Em curso';
  }

  return {
    ...t,
    diagnostico: u.diagnostico,
    teoria: u.teoria,
    validacao: u.validacao,
    revisao1: u.revisao1,
    revisao2: u.revisao2,
    anotacoes: u.anotacoes || '',
    status,
    progresso,
    etapasCumpridas: doneCount
  };
}

function aggregateRequirementStages(topicosIds) {
  if (!topicosIds || topicosIds.length === 0 || (topicosIds.length === 1 && topicosIds[0] === 'TOP-001')) {
    return {
      isInformativo: true,
      qtdTopicos: topicosIds ? topicosIds.length : 0,
      topicosConcluidos: 0,
      diagnostico: '—',
      teoria: '—',
      validacao: '—',
      revisao1: '—',
      revisao2: '—',
      status: 'Informativo',
      progresso: null
    };
  }

  const linked = topicosIds.map(id => computed.topicosMap[id]).filter(Boolean);
  const qtdTopicos = linked.length;
  if (qtdTopicos === 0) {
    return {
      isInformativo: false,
      qtdTopicos: 0,
      topicosConcluidos: 0,
      diagnostico: '☐',
      teoria: '☐',
      validacao: '☐',
      revisao1: '☐',
      revisao2: '☐',
      status: 'Sem vínculo',
      progresso: 0
    };
  }

  const calcStageSymbol = (stageKey) => {
    let done = 0;
    let reforco = 0;
    let dispensada = 0;
    linked.forEach(t => {
      const val = t[stageKey];
      if (isStageDone(stageKey, val)) done++;
      if (val === '↻') reforco++;
      if (stageKey === 'teoria' && val === '—') dispensada++;
    });
    if (reforco > 0) return '↻';
    if (done === qtdTopicos) {
      if (stageKey === 'teoria' && dispensada === qtdTopicos) return '—';
      return '✓';
    }
    if (done > 0) return '◐';
    return '☐';
  };

  const topicosConcluidos = linked.filter(t => t.status === 'Consolidado').length;
  const anyReforco = linked.some(t => t.status === 'Reforço');
  const sumProg = linked.reduce((acc, t) => acc + (t.progresso || 0), 0);
  const progresso = sumProg / qtdTopicos;

  // REGRA DE OURO: Exigência só muda para 'Concluído' quando TODOS os tópicos vinculados atingem 'Consolidado'
  let status = 'Pendente';
  if (anyReforco) {
    status = 'Reforço';
  } else if (topicosConcluidos === qtdTopicos && qtdTopicos > 0) {
    status = 'Concluído';
  } else if (progresso > 0) {
    status = 'Em curso';
  }

  return {
    isInformativo: false,
    qtdTopicos,
    topicosConcluidos,
    diagnostico: calcStageSymbol('diagnostico'),
    teoria: calcStageSymbol('teoria'),
    validacao: calcStageSymbol('validacao'),
    revisao1: calcStageSymbol('revisao1'),
    revisao2: calcStageSymbol('revisao2'),
    status,
    progresso
  };
}

function recalculateAll() {
  // 1. Calcular Lista Única (TOP-001 + 298 unidades de estudo)
  computed.topicosMap = {};
  computed.listaUnica = INITIAL_DATA.listaUnica.map(t => {
    const comp = computeTopicStatusAndProgress(t);
    computed.topicosMap[comp.id] = comp;
    return comp;
  });

  const studyTopics = computed.listaUnica.filter(t => t.id !== 'TOP-001'); // 298 tópicos

  // 2. Calcular Editais Verticalizados (TJSP, DPDF, SEFAZ-DF, Núcleo Distrital) e Dissertação DPDF
  ['tjsp', 'dpdf', 'sefaz', 'nucleo'].forEach(key => {
    computed.editais[key] = INITIAL_DATA.editais[key].map(item => {
      const agg = aggregateRequirementStages(item.topicosIds);
      return {
        ...item,
        ...agg
      };
    });
  });

  const prepBase = INITIAL_DATA.discursivas.prepDpdf;
  const prepAgg = aggregateRequirementStages([prepBase.topicoId]);
  computed.prepDpdf = {
    ...prepBase,
    ...prepAgg
  };

  // 3. Atualizar Matriz de Vínculos (879 relações)
  computed.vinculos = INITIAL_DATA.vinculos.map(v => {
    const top = computed.topicosMap[v.topicoId];
    const isRef = v.topicoId === 'TOP-001';
    return {
      ...v,
      diagnostico: isRef ? '—' : (top ? top.diagnostico : '☐'),
      teoria: isRef ? '—' : (top ? top.teoria : '☐'),
      validacao: isRef ? '—' : (top ? top.validacao : '☐'),
      revisao1: isRef ? '—' : (top ? top.revisao1 : '☐'),
      revisao2: isRef ? '—' : (top ? top.revisao2 : '☐'),
      statusTopico: isRef ? 'Informativo' : (top ? top.status : 'Pendente'),
      progressoTopico: isRef ? null : (top ? top.progresso : 0)
    };
  });

  // Mapear vínculos por tópico para consulta rápida O(1)
  computed.vinculosByTopic = {};
  computed.vinculos.forEach(v => {
    if (!computed.vinculosByTopic[v.topicoId]) {
      computed.vinculosByTopic[v.topicoId] = [];
    }
    computed.vinculosByTopic[v.topicoId].push(v);
  });

  // Mapear exigências dos editais para consulta de título e texto literal
  computed.exigenciasMap = {};
  ['tjsp', 'dpdf', 'sefaz', 'nucleo'].forEach(key => {
    (INITIAL_DATA.editais[key] || []).forEach(item => {
      computed.exigenciasMap[item.id] = { ...item, editalKey: key };
    });
  });

  // 4. Calcular os 4 Indicadores Metodológicos Obrigatórios
  const reqTjsp = computed.editais.tjsp.filter(r => !r.isInformativo); // 179
  const reqDpdfProg = computed.editais.dpdf.filter(r => !r.isInformativo); // 233
  const reqDpdfAll = [...reqDpdfProg, computed.prepDpdf]; // 234 (233 + 1 dissertação DPDF)
  const reqSefaz = computed.editais.sefaz.filter(r => !r.isInformativo); // 260
  const reqNucleo = computed.editais.nucleo.filter(r => !r.isInformativo); // 16

  const allStudyReqs = [...reqTjsp, ...reqDpdfAll, ...reqSefaz, ...reqNucleo]; // 689 exigências de estudo
  const linkedStudyReqs = allStudyReqs.filter(r => r.qtdTopicos > 0);
  const completedStudyReqs = allStudyReqs.filter(r => r.status === 'Concluído');

  const totalStagesDone = studyTopics.reduce((acc, t) => acc + t.etapasCumpridas, 0);
  const totalStagesPossible = studyTopics.length * 5; // 1490
  const consolidatedTopics = studyTopics.filter(t => t.status === 'Consolidado');

  computed.indicadores = {
    cobertura: {
      num: linkedStudyReqs.length,
      den: allStudyReqs.length,
      pct: allStudyReqs.length ? linkedStudyReqs.length / allStudyReqs.length : 0,
      status: linkedStudyReqs.length === allStudyReqs.length ? 'Todos os itens vinculados' : 'Vínculos pendentes'
    },
    etapas: {
      num: totalStagesDone,
      den: totalStagesPossible,
      pct: totalStagesPossible ? totalStagesDone / totalStagesPossible : 0,
      status: totalStagesDone === totalStagesPossible ? '100% Concluído' : (totalStagesDone > 0 ? 'Em andamento' : 'Não iniciado')
    },
    topicos: {
      num: consolidatedTopics.length,
      den: studyTopics.length,
      pct: studyTopics.length ? consolidatedTopics.length / studyTopics.length : 0,
      status: `${consolidatedTopics.length} consolidados`
    },
    exigencias: {
      num: completedStudyReqs.length,
      den: allStudyReqs.length,
      pct: allStudyReqs.length ? completedStudyReqs.length / allStudyReqs.length : 0,
      status: `${completedStudyReqs.length} concluídas`
    }
  };

  // 5. Indicadores por Concurso-Alvo e Núcleo Distrital
  const buildExamSummary = (prioridade, sigla, nome, cargo, reqList, filterFn, provaInfo, badgeClass) => {
    const denom = reqList.length;
    const cobNum = reqList.filter(r => r.qtdTopicos > 0).length;
    const topicsForExam = studyTopics.filter(filterFn);
    const topicsCons = topicsForExam.filter(t => t.status === 'Consolidado').length;
    const avgProg = denom ? reqList.reduce((acc, r) => acc + (r.progresso || 0), 0) / denom : 0;
    const reqConcluidas = reqList.filter(r => r.status === 'Concluído').length;
    return {
      prioridade,
      sigla,
      nome,
      cargo,
      denom,
      cobNum,
      cobPct: denom ? cobNum / denom : 0,
      topicosVinculados: topicsForExam.length,
      topicosConsolidados: topicsCons,
      topicosPct: topicsForExam.length ? topicsCons / topicsForExam.length : 0,
      progressoMedio: avgProg,
      exigenciasConcluidas: reqConcluidas,
      exigenciasPct: denom ? reqConcluidas / denom : 0,
      provaInfo,
      badgeClass
    };
  };

  computed.concursosResumo = [
    buildExamSummary(
      '1. Prioridade Máxima',
      'TJSP',
      'TJSP — Oficial',
      'Oficial de Justiça (Edital nº 01/2026 – VUNESP)',
      reqTjsp,
      t => t.tjsp === '●',
      'Prova: 14/03/2027 (Objetiva 70q + Discursiva 2q)',
      'badge-tjsp'
    ),
    buildExamSummary(
      '2. Preparação Imediata',
      'DPDF',
      'DPDF — Analista Direito',
      'Analista de Apoio à Assistência Judiciária — Direito e Legislação (Edital nº 1/2026 – ACCESS)',
      reqDpdfAll,
      t => t.dpdf === '●',
      'Prova: 21/02/2027 (Objetiva 70q + Discursiva 1 diss./3q + Títulos)',
      'badge-dpdf'
    ),
    buildExamSummary(
      '3. Objetivo Seguinte',
      'SEFAZ-DF',
      'SEFAZ-DF — Auditor',
      'Auditor-Fiscal da Receita do DF (Base histórica: Edital nº 1/2019 e Editais nº 2 a 5/2019 – Cebraspe)',
      reqSefaz,
      t => t.sefaz === '●',
      'Base histórica 2019 (P1 80 itens + P2 80 itens + P3 Discursiva); novo edital em instrução',
      'badge-sefaz'
    ),
    buildExamSummary(
      '4. Complemento Distrital',
      'Núcleo DF',
      'Núcleo Distrital',
      'Lei Distrital nº 4.949/2012 (art. 10, VII) + DPDF 2026 + SEFAZ-DF 2019 + Ref. TCDF 2026 (s/ LO/RI-TCDF)',
      reqNucleo,
      t => t.nucleoDf === '●',
      'Aplicável exclusivamente à DPDF e à SEFAZ-DF (jamais ao TJSP)',
      'badge-nucleo'
    )
  ];

  // Diário de Estudos & Checklist
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

  // 6. Acompanhamento por Etapa (Ciclo Ativo 10 matérias vs Catálogo Complementar 17 matérias)
  const summarizeTopicGroup = (list) => {
    const total = list.length;
    const d1 = list.filter(t => isStageDone('diagnostico', t.diagnostico)).length;
    const d2 = list.filter(t => isStageDone('teoria', t.teoria)).length;
    const d3 = list.filter(t => isStageDone('validacao', t.validacao)).length;
    const d4 = list.filter(t => isStageDone('revisao1', t.revisao1)).length;
    const d5 = list.filter(t => isStageDone('revisao2', t.revisao2)).length;
    const reforco = list.filter(t => t.status === 'Reforço').length;
    const consolidados = list.filter(t => t.status === 'Consolidado').length;
    const avgProg = total ? list.reduce((a, t) => a + (t.progresso || 0), 0) / total : 0;
    return { total, d1, d2, d3, d4, d5, reforco, consolidados, avgProg };
  };

  const activeTopics = studyTopics.filter(t => t.faseCiclo && t.faseCiclo.includes('Ativa no Ciclo'));
  const compTopics = studyTopics.filter(t => !t.faseCiclo || !t.faseCiclo.includes('Ativa no Ciclo'));

  computed.etapasCatalogo = {
    ativas: { qtdMaterias: 10, ...summarizeTopicGroup(activeTopics) },
    complementares: { qtdMaterias: 17, ...summarizeTopicGroup(compTopics) },
    total: { qtdMaterias: 27, ...summarizeTopicGroup(studyTopics) }
  };

  // 7. Progresso por Matéria (27 disciplinas)
  computed.progressoMaterias = INITIAL_DATA.progressoMaterias.map(m => {
    const mTopics = studyTopics.filter(t => t.materia === m.materia);
    const stats = summarizeTopicGroup(mTopics);
    let acao = 'Iniciar Diagnóstico';
    if (stats.consolidados === stats.total && stats.total > 0) {
      acao = 'Matéria Consolidada ✓';
    } else if (stats.reforco > 0) {
      acao = 'Priorizar Reforço (↻)';
    } else if (stats.avgProg > 0) {
      acao = 'Avançar Etapas';
    }
    return {
      ...m,
      ...stats,
      pctConsolidados: stats.total ? stats.consolidados / stats.total : 0,
      acao
    };
  });

  // 8. Ciclo Contínuo: Fila de 23 blocos, 17 matérias TJSP/DPDF, OAB e PDF
  let firstUnfinishedFound = false;
  computed.cicloFila = INITIAL_DATA.ciclo.fila.map(f => {
    const u = state.filaUser[f.bloco] || {
      concluido: f.concluido === '✓',
      topicoId: f.topicoId,
      etapa: f.etapa,
      observacao: f.observacao
    };
    let statusRetomada = 'Fila';
    if (u.concluido) {
      statusRetomada = 'Concluído ✓';
    } else if (!firstUnfinishedFound) {
      statusRetomada = '▶ Retomar daqui';
      firstUnfinishedFound = true;
    }
    return {
      ...f,
      concluido: u.concluido,
      topicoId: u.topicoId,
      etapa: u.etapa,
      observacao: u.observacao,
      statusRetomada
    };
  });

  // Atualizar as 17 matérias do ciclo atual com progresso real TJSP/DPDF
  computed.cicloMaterias = INITIAL_DATA.ciclo.materias.map(m => {
    const mTopics = studyTopics.filter(
      t => t.materia === m.materia && (t.tjsp === '●' || t.dpdf === '●')
    );
    const total = mTopics.length || m.topicosCount;
    const cons = mTopics.filter(t => t.status === 'Consolidado').length;
    const prog = mTopics.length
      ? mTopics.reduce((acc, t) => acc + (t.progresso || 0), 0) / mTopics.length
      : m.progresso;

    // Verificar qual o próximo tópico não consolidado dessa matéria
    const nextTopic = mTopics.find(t => t.status !== 'Consolidado') || mTopics[0];
    let defaultRetomar = m.ondeRetomar;
    if (nextTopic) {
      let nextEtapa = 'Diagnóstico';
      if (!isStageDone('diagnostico', nextTopic.diagnostico)) nextEtapa = 'Diagnóstico';
      else if (!isStageDone('teoria', nextTopic.teoria)) nextEtapa = 'Teoria';
      else if (!isStageDone('validacao', nextTopic.validacao)) nextEtapa = 'Validação';
      else if (!isStageDone('revisao1', nextTopic.revisao1)) nextEtapa = 'Revisão 1';
      else nextEtapa = 'Revisão 2';
      defaultRetomar = `Retomar em: ${nextTopic.id} (${nextEtapa})`;
    }

    return {
      ...m,
      topicosCount: total,
      consolidados: cons,
      progresso: prog,
      ondeRetomar: state.materiasCicloUser[m.ordem] || defaultRetomar
    };
  });

  // OAB Sábados
  computed.cicloOab = INITIAL_DATA.ciclo.oab.map(o => {
    const u = state.oabUser[o.semana] || { data: '', feitas: '', acertos: '', diagnostico: '' };
    const feitasNum = u.feitas !== '' && !isNaN(Number(u.feitas)) ? Number(u.feitas) : null;
    const acertosNum = u.acertos !== '' && !isNaN(Number(u.acertos)) ? Number(u.acertos) : null;
    let pctAcerto = null;
    let statusMeta = 'Aguardando';
    if (feitasNum && feitasNum > 0 && acertosNum !== null) {
      pctAcerto = acertosNum / feitasNum;
      statusMeta = pctAcerto >= 0.5 ? 'Meta Atingida (≥ 50%)' : 'Abaixo da Meta (< 50%)';
    }
    return {
      ...o,
      data: u.data,
      feitas: u.feitas,
      acertos: u.acertos,
      pctAcerto,
      statusMeta,
      diagnostico: u.diagnostico
    };
  });

  // Meta Diária PDF (50 páginas/dia)
  let acum = 0;
  let preenchidos = 0;
  let saldoAcum = 0;
  const pdfLogs = INITIAL_DATA.ciclo.pdfLogs.map(p => {
    const u = state.pdfUser[p.id] || {
      data: '',
      materiaPdf: '',
      topicoId: '',
      pagInicial: '',
      pagFinal: '',
      observacoes: ''
    };
    const pIni = u.pagInicial !== '' && !isNaN(Number(u.pagInicial)) ? Number(u.pagInicial) : null;
    const pFim = u.pagFinal !== '' && !isNaN(Number(u.pagFinal)) ? Number(u.pagFinal) : null;
    let pagLidas = null;
    let meta = null;
    let saldo = null;
    if (pIni !== null && pFim !== null && pFim >= pIni) {
      pagLidas = pFim - pIni + 1;
      meta = 50;
      saldo = pagLidas - meta;
      acum += pagLidas;
      preenchidos++;
      saldoAcum += saldo;
    }
    return {
      ...p,
      ...u,
      pagLidas,
      meta,
      saldo
    };
  });
  computed.cicloPdf = {
    logs: pdfLogs,
    acum,
    preenchidos,
    media: preenchidos > 0 ? acum / preenchidos : null,
    saldo: saldoAcum
  };

  // Reserva SEFAZ-DF (10 matérias exclusivas)
  computed.cicloReserva = INITIAL_DATA.ciclo.reservaSefaz.map(r => {
    const mTopics = studyTopics.filter(t => t.materia === r.materia);
    const cons = mTopics.filter(t => t.status === 'Consolidado').length;
    const prog = mTopics.length
      ? mTopics.reduce((acc, t) => acc + (t.progresso || 0), 0) / mTopics.length
      : 0;
    return {
      ...r,
      topicosCount: mTopics.length || r.topicosCount,
      consolidados: cons,
      progresso: prog
    };
  });

  updateNavBadges();
}

function updateNavBadges() {
  const activeBlock = computed.cicloFila.find(b => b.statusRetomada === '▶ Retomar daqui');
  const elDiario = document.getElementById('navBadgeDiario');
  if (elDiario && computed.diario) {
    elDiario.textContent = `${computed.diario.diasConcluidos}/7`;
  }

  const elCiclo = document.getElementById('navBadgeCiclo');
  if (elCiclo) {
    elCiclo.textContent = activeBlock ? activeBlock.bloco : '23/23 ✓';
  }

  const elLista = document.getElementById('navBadgeLista');
  if (elLista) {
    elLista.textContent = `${computed.indicadores.topicos.num}/298`;
  }

  const elEditais = document.getElementById('navBadgeEditais');
  if (elEditais) {
    elEditais.textContent = `${computed.indicadores.exigencias.num}/689`;
  }

  const elPomodoroLabel = document.getElementById('pomodoroBlockLabel');
  if (elPomodoroLabel) {
    elPomodoroLabel.textContent = activeBlock ? `${activeBlock.bloco} • ${activeBlock.topicoId}` : 'Volta Concluída';
  }
}

// ============================================================================
// 3. UTILITÁRIOS DE FORMATAÇÃO E COMPONENTES VISUAIS
// ============================================================================

function fmtPct(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return (val * 100).toFixed(decimals).replace('.', ',') + '%';
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getStatusBadgeHtml(status) {
  const s = status || 'Pendente';
  let cls = 'status-pendente';
  if (s === 'Consolidado' || s === 'Concluído' || s === 'Verificado' || s.includes('Atingida')) {
    cls = 'status-consolidado';
  } else if (s === 'Em curso' || s === 'Em andamento' || s === 'Vinculado') {
    cls = 'status-em-curso';
  } else if (s === 'Reforço' || s.includes('Abaixo')) {
    cls = 'status-reforco';
  } else if (s === 'Informativo' || s === 'Referência' || s.includes('Informativo')) {
    cls = 'status-informativo';
  }
  return `<span class="status-pill ${cls}">${escapeHtml(s)}</span>`;
}

function getProgressBarHtml(pct, colorClass = '') {
  const numPct = Math.max(0, Math.min(100, (pct || 0) * 100));
  const fillCls = numPct >= 100 ? 'fill-success' : (colorClass || 'fill-primary');
  return `
    <div class="progress-bar-wrap">
      <div class="progress-bar-track">
        <div class="progress-bar-fill ${fillCls}" style="width: ${numPct.toFixed(1)}%"></div>
      </div>
      <span class="progress-bar-label">${fmtPct(pct, 1)}</span>
    </div>
  `;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Ciclar valores das etapas da Lista Única com um clique
function getNextStageValue(stageKey, currentVal) {
  const order = stageKey === 'teoria' ? ['☐', '✓', '—', '↻'] : ['☐', '✓', '↻'];
  const idx = order.indexOf(currentVal);
  return order[(idx + 1) % order.length];
}

function toggleTopicStage(topicoId, stageKey, explicitVal = null) {
  if (topicoId === 'TOP-001') return;
  const u = state.topicosUser[topicoId];
  if (!u) return;
  u[stageKey] = explicitVal !== null ? explicitVal : getNextStageValue(stageKey, u[stageKey]);
  saveState();
  recalculateAll();
  renderActiveTab();
  // Se o modal estiver aberto para este tópico, re-renderizar o modal também
  const modal = document.getElementById('topicModal');
  if (modal && !modal.hasAttribute('hidden') && modal.dataset && modal.dataset.topicoId === topicoId) {
    openTopicModal(topicoId);
  }
}

function markAllStagesForTopic(topicoId, targetVal = '✓') {
  if (topicoId === 'TOP-001') return;
  const u = state.topicosUser[topicoId];
  if (!u) return;
  u.diagnostico = targetVal;
  u.teoria = targetVal;
  u.validacao = targetVal;
  u.revisao1 = targetVal;
  u.revisao2 = targetVal;
  saveState();
  recalculateAll();
  renderActiveTab();
  const modal = document.getElementById('topicModal');
  if (modal && !modal.hasAttribute('hidden') && modal.dataset && modal.dataset.topicoId === topicoId) {
    openTopicModal(topicoId);
  }
  showToast(
    targetVal === '✓'
      ? `${topicoId} marcado como Consolidado (5/5 etapas)!`
      : `Etapas de ${topicoId} reiniciadas.`,
    'success'
  );
}

// ============================================================================
// 4. RENDERIZAÇÃO DA ABA 1: PAINEL GERAL • CONTROLE ESTRATÉGICO
// ============================================================================


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

function openEditalFromPainel(editalKey) {
  state.ui.editalAtivo = editalKey;
  saveState();
  switchTab('editais');
}

function concluirBlocoAtual(blocoNome) {
  if (!state.filaUser[blocoNome]) return;
  state.filaUser[blocoNome].concluido = true;
  saveState();
  recalculateAll();
  renderActiveTab();
  showToast(`${blocoNome} concluído! Fila avançou para o próximo bloco.`, 'success');
}

// ============================================================================
// 5. RENDERIZAÇÃO DA ABA 2: CICLO CONTÍNUO DE ESTUDOS
// ============================================================================


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

function renderCiclo() {
  const container = document.getElementById('cicloContent');
  if (!container) return;

  const sub = state.ui.cicloSubtab || 'fila';
  const completedBlocks = computed.cicloFila.filter(b => b.concluido).length;
  const pctVolta = completedBlocks / 23;

  const oabFeitasTotal = computed.cicloOab.reduce((a, o) => a + (Number(o.feitas) || 0), 0);
  const oabAcertosTotal = computed.cicloOab.reduce((a, o) => a + (Number(o.acertos) || 0), 0);
  const oabPctGlobal = oabFeitasTotal > 0 ? oabAcertosTotal / oabFeitasTotal : null;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h3 class="section-title">Ciclo Contínuo de Estudos • TJSP e DPDF + OAB aos Sábados + Meta 50 Páginas PDF/Dia</h3>
        <p class="section-subtitle">Sequência contínua sem grade fixa de segunda a domingo: ao interromper, retome exatamente de onde parou ("▶ Retomar daqui"); ao concluir os 23 blocos (19h10min), reinicie a volta.</p>
      </div>
      <div class="subtab-bar">
        <button class="subtab-btn ${sub === 'fila' ? 'active' : ''}" onclick="setCicloSubtab('fila')">Fila Contínua (23 Blocos)</button>
        <button class="subtab-btn ${sub === 'materias' ? 'active' : ''}" onclick="setCicloSubtab('materias')">Matérias do Ciclo (17)</button>
        <button class="subtab-btn ${sub === 'oab' ? 'active' : ''}" onclick="setCicloSubtab('oab')">OAB aos Sábados (12)</button>
        <button class="subtab-btn ${sub === 'pdf' ? 'active' : ''}" onclick="setCicloSubtab('pdf')">Meta Diária PDF (50 págs)</button>
        <button class="subtab-btn ${sub === 'reserva' ? 'active' : ''}" onclick="setCicloSubtab('reserva')">Reserva SEFAZ-DF (10)</button>
      </div>
    </div>

    ${sub === 'fila' ? `
      <div class="toolbar-card">
        <div class="toolbar-left">
          <span class="toolbar-stat"><strong>Progresso da Volta Atual:</strong> ${completedBlocks} / 23 blocos (${fmtPct(pctVolta, 1)}) · 1.150 min (19h10min) por volta</span>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-secondary btn-sm" onclick="reiniciarVoltaFila()">↺ Limpar Marcações e Iniciar Nova Volta (0/23)</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">Passagem</th>
                <th style="width:65px;" class="text-center">Concluído</th>
                <th style="width:145px;">Status de Retomada</th>
                <th>Matéria da Fila Contínua</th>
                <th>Foco Principal do Bloco (50 min)</th>
                <th class="text-center">Concurso-Alvo</th>
                <th style="width:115px;">Subtópico Estudado</th>
                <th style="width:130px;">Etapa Executada</th>
                <th>Observação Rápida da Sessão</th>
              </tr>
            </thead>
            <tbody>
              ${computed.cicloFila.map(b => {
                const isCurrent = b.statusRetomada === '▶ Retomar daqui';
                return `
                  <tr class="${isCurrent ? 'row-highlight-resume' : (b.concluido ? 'row-completed-muted' : '')}">
                    <td><strong>${escapeHtml(b.bloco)}</strong></td>
                    <td class="text-center">
                      <button class="stage-check-btn ${b.concluido ? 'stage-ok' : ''}" onclick="toggleBlocoFila('${b.bloco}')">
                        ${b.concluido ? '✓' : '☐'}
                      </button>
                    </td>
                    <td>
                      <span class="status-pill ${isCurrent ? 'status-reforco' : (b.concluido ? 'status-consolidado' : 'status-pendente')}">
                        ${escapeHtml(b.statusRetomada)}
                      </span>
                    </td>
                    <td><strong>${escapeHtml(b.materia)}</strong></td>
                    <td class="text-muted">${escapeHtml(b.foco)}</td>
                    <td class="text-center"><span class="badge-target">${escapeHtml(b.concursoAlvo)}</span></td>
                    <td>
                      <div style="display:flex; gap:4px; align-items:center;">
                        <input type="text" class="input-inline" style="width:78px;" value="${escapeHtml(b.topicoId)}"
                          onchange="updateFilaField('${b.bloco}', 'topicoId', this.value)" />
                        ${computed.topicosMap[b.topicoId] ? `<button class="btn-icon-tiny" title="Abrir tópico" onclick="openTopicModal('${b.topicoId}')">↗</button>` : ''}
                      </div>
                    </td>
                    <td>
                      <select class="select-inline" onchange="updateFilaField('${b.bloco}', 'etapa', this.value)">
                        ${['Diagnóstico', 'Teoria', 'Validação', 'Revisão 1', 'Revisão 2'].map(et =>
                          `<option value="${et}" ${b.etapa === et ? 'selected' : ''}>${et}</option>`
                        ).join('')}
                      </select>
                    </td>
                    <td>
                      <input type="text" class="input-inline" value="${escapeHtml(b.observacao)}"
                        onchange="updateFilaField('${b.bloco}', 'observacao', this.value)" />
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${sub === 'materias' ? `
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="text-center" style="width:55px;">Ordem</th>
                <th>Matéria do Ciclo Atual (TJSP e DPDF)</th>
                <th class="text-center">Passagens</th>
                <th class="text-center">Min / Volta</th>
                <th>Incidência TJSP / DPDF</th>
                <th>Recorte e Prioridade de Estudo</th>
                <th class="text-center">Tópicos</th>
                <th class="text-center">Consolidados</th>
                <th style="min-width:150px;">Progresso</th>
                <th style="min-width:220px;">Onde Retomar (ID / Etapa / Página)</th>
              </tr>
            </thead>
            <tbody>
              ${computed.cicloMaterias.map(m => `
                <tr>
                  <td class="text-center"><strong>${m.ordem}</strong></td>
                  <td><strong>${escapeHtml(m.materia)}</strong></td>
                  <td class="text-center">${m.passagens}×</td>
                  <td class="text-center">${m.minutos} min</td>
                  <td><span class="text-muted">${escapeHtml(m.incidencia)}</span></td>
                  <td><span class="text-muted">${escapeHtml(m.recorte)}</span></td>
                  <td class="text-center"><strong>${m.topicosCount}</strong></td>
                  <td class="text-center">${m.consolidados}</td>
                  <td>${getProgressBarHtml(m.progresso)}</td>
                  <td>
                    <input type="text" class="input-inline" value="${escapeHtml(m.ondeRetomar)}"
                      onchange="updateMateriaCicloRetomar(${m.ordem}, this.value)" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${sub === 'oab' ? `
      <div class="toolbar-card">
        <div class="toolbar-left">
          <span class="toolbar-stat"><strong>Ciclo Independente OAB aos Sábados (TEC Concursos):</strong> 12 Sábados × 60 questões = 720 previstas · Realizadas: <strong>${oabFeitasTotal}</strong> · Acertos: <strong>${oabAcertosTotal}</strong> (${oabPctGlobal !== null ? fmtPct(oabPctGlobal, 1) : 'Aguardando registros'})</span>
        </div>
      </div>
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:105px;">Semana</th>
                <th style="width:130px;">Data Realizada</th>
                <th>Cadernos do Guia OAB no TEC Concursos (4 × 15q)</th>
                <th>Foco de Sinergia c/ Concursos</th>
                <th class="text-center" style="width:80px;">Previstas</th>
                <th class="text-center" style="width:90px;">Feitas</th>
                <th class="text-center" style="width:90px;">Acertos</th>
                <th class="text-center" style="width:100px;">% Acerto</th>
                <th class="text-center" style="width:150px;">Status da Meta (≥50%)</th>
                <th style="min-width:200px;">Diagnóstico / Disciplina a Reforçar</th>
              </tr>
            </thead>
            <tbody>
              ${computed.cicloOab.map(o => `
                <tr>
                  <td><strong>${escapeHtml(o.semana)}</strong></td>
                  <td>
                    <input type="date" class="input-inline" value="${escapeHtml(o.data)}"
                      onchange="updateOabField('${o.semana}', 'data', this.value)" />
                  </td>
                  <td>${escapeHtml(o.cadernos)}</td>
                  <td class="text-muted">${escapeHtml(o.sinergia)}</td>
                  <td class="text-center">${o.previstas}</td>
                  <td class="text-center">
                    <input type="number" min="0" max="200" class="input-inline text-center" value="${escapeHtml(o.feitas)}"
                      placeholder="0" onchange="updateOabField('${o.semana}', 'feitas', this.value)" />
                  </td>
                  <td class="text-center">
                    <input type="number" min="0" max="200" class="input-inline text-center" value="${escapeHtml(o.acertos)}"
                      placeholder="0" onchange="updateOabField('${o.semana}', 'acertos', this.value)" />
                  </td>
                  <td class="text-center"><strong>${o.pctAcerto !== null ? fmtPct(o.pctAcerto, 1) : '—'}</strong></td>
                  <td class="text-center">${getStatusBadgeHtml(o.statusMeta)}</td>
                  <td>
                    <input type="text" class="input-inline" value="${escapeHtml(o.diagnostico)}"
                      placeholder="Anotar ponto fraco..." onchange="updateOabField('${o.semana}', 'diagnostico', this.value)" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${sub === 'pdf' ? `
      <div class="toolbar-card">
        <div class="toolbar-left">
          <span class="toolbar-stat">
            <strong>META-01 (50 páginas PDF/dia):</strong>
            Páginas Acumuladas: <strong>${computed.cicloPdf.acum}</strong> ·
            Registros Preenchidos: <strong>${computed.cicloPdf.preenchidos} / 30</strong> ·
            Média por Registro: <strong>${computed.cicloPdf.media !== null ? computed.cicloPdf.media.toFixed(1) + ' págs' : 'Pendente'}</strong> ·
            Saldo Acumulado: <strong class="${computed.cicloPdf.saldo >= 0 ? 'text-success' : 'text-danger'}">${computed.cicloPdf.saldo >= 0 ? '+' : ''}${computed.cicloPdf.saldo} págs</strong>
          </span>
        </div>
      </div>
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="text-center" style="width:60px;">Reg.</th>
                <th style="width:130px;">Data (opcional)</th>
                <th>Matéria / PDF Utilizado</th>
                <th style="width:120px;">ID do Subtópico</th>
                <th class="text-center" style="width:95px;">Pág. Inicial</th>
                <th class="text-center" style="width:95px;">Pág. Final</th>
                <th class="text-center" style="width:95px;">Págs. Lidas</th>
                <th class="text-center" style="width:80px;">Meta</th>
                <th class="text-center" style="width:95px;">Saldo</th>
                <th>Observações / Ponto de Parada</th>
              </tr>
            </thead>
            <tbody>
              ${computed.cicloPdf.logs.map(p => `
                <tr>
                  <td class="text-center"><strong>#${p.id}</strong></td>
                  <td>
                    <input type="date" class="input-inline" value="${escapeHtml(p.data)}"
                      onchange="updatePdfField(${p.id}, 'data', this.value)" />
                  </td>
                  <td>
                    <input type="text" class="input-inline" value="${escapeHtml(p.materiaPdf)}"
                      placeholder="Ex: Direito Civil - Aula 02" onchange="updatePdfField(${p.id}, 'materiaPdf', this.value)" />
                  </td>
                  <td>
                    <input type="text" class="input-inline" value="${escapeHtml(p.topicoId)}"
                      placeholder="TOP-056" onchange="updatePdfField(${p.id}, 'topicoId', this.value)" />
                  </td>
                  <td class="text-center">
                    <input type="number" min="1" class="input-inline text-center" value="${escapeHtml(p.pagInicial)}"
                      placeholder="1" onchange="updatePdfField(${p.id}, 'pagInicial', this.value)" />
                  </td>
                  <td class="text-center">
                    <input type="number" min="1" class="input-inline text-center" value="${escapeHtml(p.pagFinal)}"
                      placeholder="50" onchange="updatePdfField(${p.id}, 'pagFinal', this.value)" />
                  </td>
                  <td class="text-center"><strong>${p.pagLidas !== null ? p.pagLidas : '—'}</strong></td>
                  <td class="text-center">${p.meta !== null ? p.meta : '50'}</td>
                  <td class="text-center">
                    ${p.saldo !== null ? `<strong class="${p.saldo >= 0 ? 'text-success' : 'text-danger'}">${p.saldo >= 0 ? '+' : ''}${p.saldo}</strong>` : '—'}
                  </td>
                  <td>
                    <input type="text" class="input-inline" value="${escapeHtml(p.observacoes)}"
                      placeholder="Parou no tópico X, pág Y..." onchange="updatePdfField(${p.id}, 'observacoes', this.value)" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${sub === 'reserva' ? `
      <div class="toolbar-card">
        <div class="toolbar-left">
          <span class="toolbar-stat"><strong>Reserva para a Etapa SEFAZ-DF:</strong> 10 matérias exclusivas fora do ciclo atual (ativar após a fase TJSP/DPDF).</span>
        </div>
      </div>
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="text-center" style="width:60px;">Ordem</th>
                <th>Matéria Reservada para SEFAZ-DF</th>
                <th>Fase de Entrada</th>
                <th class="text-center">Tópicos</th>
                <th class="text-center">Consolidados</th>
                <th style="min-width:140px;">Progresso</th>
                <th>Peso na Base SEFAZ-DF</th>
                <th>Estratégia para a Etapa Fiscal</th>
              </tr>
            </thead>
            <tbody>
              ${computed.cicloReserva.map(r => `
                <tr>
                  <td class="text-center"><strong>${r.ordem}</strong></td>
                  <td><strong>${escapeHtml(r.materia)}</strong></td>
                  <td><span class="status-pill status-pendente">${escapeHtml(r.faseEntrada)}</span></td>
                  <td class="text-center"><strong>${r.topicosCount}</strong></td>
                  <td class="text-center">${r.consolidados}</td>
                  <td>${getProgressBarHtml(r.progresso)}</td>
                  <td>${escapeHtml(r.peso)}</td>
                  <td class="text-muted">${escapeHtml(r.estrategia)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;
}

function setCicloSubtab(sub) {
  state.ui.cicloSubtab = sub;
  saveState();
  renderCiclo();
}

function toggleBlocoFila(bloco) {
  if (!state.filaUser[bloco]) return;
  state.filaUser[bloco].concluido = !state.filaUser[bloco].concluido;
  saveState();
  recalculateAll();
  renderCiclo();
}

function updateFilaField(bloco, field, val) {
  if (!state.filaUser[bloco]) return;
  state.filaUser[bloco][field] = val.trim();
  saveState();
  recalculateAll();
  renderCiclo();
}

function reiniciarVoltaFila() {
  Object.keys(state.filaUser).forEach(k => {
    state.filaUser[k].concluido = false;
  });
  saveState();
  recalculateAll();
  renderCiclo();
  showToast('Nova volta iniciada! Todos os 23 blocos estão prontos.', 'info');
}

function updateMateriaCicloRetomar(ordem, val) {
  state.materiasCicloUser[ordem] = val;
  saveState();
}

function updateOabField(semana, field, val) {
  if (!state.oabUser[semana]) return;
  state.oabUser[semana][field] = val;
  saveState();
  recalculateAll();
  renderCiclo();
}

function updatePdfField(id, field, val) {
  if (!state.pdfUser[id]) return;
  state.pdfUser[id][field] = val;
  saveState();
  recalculateAll();
  renderCiclo();
}

// ============================================================================
// 6. RENDERIZAÇÃO DA ABA 3: LISTA ÚNICA DE ESTUDOS (LOCAL ÚNICO DE MARCAÇÃO)
// ============================================================================

function renderLista() {
  const container = document.getElementById('listaContent');
  if (!container) return;

  const materiasList = INITIAL_DATA.progressoMaterias.map(m => m.materia);
  const search = (state.ui.listaSearch || '').toLowerCase().trim();
  const matFilter = state.ui.listaMateria || 'TODAS';
  const faseFilter = state.ui.listaFase || 'TODAS';
  const concFilter = state.ui.listaConcurso || 'TODOS';
  const statusFilter = state.ui.listaStatus || 'TODOS';

  const filtered = computed.listaUnica.filter(t => {
    if (matFilter !== 'TODAS' && t.materia !== matFilter) return false;
    if (faseFilter === 'ATIVAS' && (!t.faseCiclo || !t.faseCiclo.includes('Ativa no Ciclo'))) return false;
    if (faseFilter === 'COMPLEMENTARES' && (!t.faseCiclo || !t.faseCiclo.includes('Catálogo Complementar'))) return false;
    if (concFilter === 'TJSP' && t.tjsp !== '●') return false;
    if (concFilter === 'DPDF' && t.dpdf !== '●') return false;
    if (concFilter === 'SEFAZ' && t.sefaz !== '●') return false;
    if (concFilter === 'NUCLEO' && t.nucleoDf !== '●') return false;
    if (statusFilter !== 'TODOS' && t.status !== statusFilter) return false;
    if (search) {
      const hay = `${t.id} ${t.materia} ${t.eixo} ${t.subtopico} ${t.dispositivos} ${t.exigenciasVinculadas}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h3 class="section-title">Lista Única de Estudos • Local Único de Marcação das 5 Etapas</h3>
        <p class="section-subtitle">298 unidades de estudo + 1 referência administrativa (TOP-001). Clique nos botões das 5 etapas para alternar <code>☐</code> → <code>✓</code> → (<code>—</code> em Teoria) → <code>↻</code>. Toda alteração propaga instantaneamente para os editais.</p>
      </div>
    </div>

    <div class="filters-bar">
      <input type="search" class="filter-input" placeholder="Buscar por ID (ex: TOP-080), artigo, lei, tema ou exigência..."
        value="${escapeHtml(state.ui.listaSearch)}" oninput="updateListaFilter('listaSearch', this.value)" />

      <select class="filter-select" onchange="updateListaFilter('listaMateria', this.value)">
        <option value="TODAS" ${matFilter === 'TODAS' ? 'selected' : ''}>Todas as 27 Matérias</option>
        ${materiasList.map(m => `<option value="${escapeHtml(m)}" ${matFilter === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
      </select>

      <select class="filter-select" onchange="updateListaFilter('listaFase', this.value)">
        <option value="TODAS" ${faseFilter === 'TODAS' ? 'selected' : ''}>Todo o Catálogo (299)</option>
        <option value="ATIVAS" ${faseFilter === 'ATIVAS' ? 'selected' : ''}>Ativas no Ciclo (10 matérias / 200)</option>
        <option value="COMPLEMENTARES" ${faseFilter === 'COMPLEMENTARES' ? 'selected' : ''}>Complementares (17 matérias / 98)</option>
      </select>

      <select class="filter-select" onchange="updateListaFilter('listaConcurso', this.value)">
        <option value="TODOS" ${concFilter === 'TODOS' ? 'selected' : ''}>Qualquer Concurso</option>
        <option value="TJSP" ${concFilter === 'TJSP' ? 'selected' : ''}>Incidência TJSP (89)</option>
        <option value="DPDF" ${concFilter === 'DPDF' ? 'selected' : ''}>Incidência DPDF (204)</option>
        <option value="SEFAZ" ${concFilter === 'SEFAZ' ? 'selected' : ''}>Incidência SEFAZ-DF (148)</option>
        <option value="NUCLEO" ${concFilter === 'NUCLEO' ? 'selected' : ''}>Núcleo Distrital (13)</option>
      </select>

      <select class="filter-select" onchange="updateListaFilter('listaStatus', this.value)">
        <option value="TODOS" ${statusFilter === 'TODOS' ? 'selected' : ''}>Todos os Status</option>
        <option value="Pendente" ${statusFilter === 'Pendente' ? 'selected' : ''}>Pendente</option>
        <option value="Em curso" ${statusFilter === 'Em curso' ? 'selected' : ''}>Em curso</option>
        <option value="Consolidado" ${statusFilter === 'Consolidado' ? 'selected' : ''}>Consolidado ✓</option>
        <option value="Reforço" ${statusFilter === 'Reforço' ? 'selected' : ''}>Em Reforço ↻</option>
      </select>

      <span class="filter-count-badge">Exibindo <strong>${filtered.length}</strong> de 299 tópicos</span>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:92px;">ID</th>
              <th style="width:180px;">Matéria</th>
              <th>Subtópico (Título Didático) & Dispositivos Legais / Recorte</th>
              <th class="text-center" style="width:120px;">Incidência</th>
              <th class="text-center" style="width:58px;" title="1. Diagnóstico">Diag.</th>
              <th class="text-center" style="width:58px;" title="2. Teoria (✓ ou — dispensada)">Teoria</th>
              <th class="text-center" style="width:58px;" title="3. Validação por Questões">Valid.</th>
              <th class="text-center" style="width:58px;" title="4. Revisão 1">Rev. 1</th>
              <th class="text-center" style="width:58px;" title="5. Revisão 2 (Consolidação)">Rev. 2</th>
              <th class="text-center" style="width:120px;">Status</th>
              <th style="width:135px;">Progresso</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(t => renderTopicRow(t)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStageBtn(topicoId, stageKey, val) {
  if (topicoId === 'TOP-001') {
    return `<span class="text-muted">—</span>`;
  }
  let cls = '';
  if (val === '✓') cls = 'stage-ok';
  else if (val === '—') cls = 'stage-skip';
  else if (val === '↻') cls = 'stage-reforco';
  return `
    <button class="stage-check-btn ${cls}" onclick="toggleTopicStage('${topicoId}', '${stageKey}')" title="Clique para alternar etapa">
      ${escapeHtml(val)}
    </button>
  `;
}

function renderTopicRow(t) {
  const incBadges = [
    t.tjsp === '●' ? '<span class="inc-pill inc-tjsp" title="TJSP Oficial">TJSP</span>' : '',
    t.dpdf === '●' ? '<span class="inc-pill inc-dpdf" title="DPDF Analista">DPDF</span>' : '',
    t.sefaz === '●' ? '<span class="inc-pill inc-sefaz" title="SEFAZ-DF Auditor">SEFAZ</span>' : '',
    t.nucleoDf === '●' ? '<span class="inc-pill inc-nucleo" title="Núcleo Distrital">NÚC</span>' : ''
  ].filter(Boolean).join('');

  const isAccordionOpen = state.ui.accordions && state.ui.accordions[t.id];
  const vincList = (computed.vinculosByTopic && computed.vinculosByTopic[t.id]) || [];

  return `
    <tr class="${t.status === 'Consolidado' ? 'row-consolidated' : ''}" id="row-${t.id}">
      <td>
        <div class="topic-id-cell">
          <button class="topic-id-link"
            onmouseenter="showTopicPopover(event, '${t.id}')"
            onmouseleave="scheduleHideTopicPopover()"
            onclick="openTopicModal('${t.id}')"
            title="Passe o mouse para ver o painel suspenso de vínculos ou clique para abrir detalhes">
            ${escapeHtml(t.id)}
          </button>
          <button class="badge-vinculos-btn ${isAccordionOpen ? 'active' : ''}"
            onmouseenter="showTopicPopover(event, '${t.id}')"
            onmouseleave="scheduleHideTopicPopover()"
            onclick="toggleTopicAccordion('${t.id}')"
            title="Passe o mouse para ver painel suspenso ou clique para expandir na tabela">
            ${t.qtdVinculos} vínc. <span class="badge-arrow">▾</span>
          </button>
        </div>
      </td>
      <td>
        <div class="font-semibold">${escapeHtml(t.materia)}</div>
        <div class="text-xs text-muted">${escapeHtml(t.eixo)}</div>
      </td>
      <td>
        <div class="topic-title-clickable" onclick="openTopicModal('${t.id}')">${escapeHtml(t.subtopico)}</div>
        <div class="topic-dispositivos">${escapeHtml(t.dispositivos)}</div>
      </td>
      <td class="text-center">
        <div class="inc-pills-wrap">${incBadges || '<span class="text-xs text-muted">Compl. Atual</span>'}</div>
      </td>
      <td class="text-center">${renderStageBtn(t.id, 'diagnostico', t.diagnostico)}</td>
      <td class="text-center">${renderStageBtn(t.id, 'teoria', t.teoria)}</td>
      <td class="text-center">${renderStageBtn(t.id, 'validacao', t.validacao)}</td>
      <td class="text-center">${renderStageBtn(t.id, 'revisao1', t.revisao1)}</td>
      <td class="text-center">${renderStageBtn(t.id, 'revisao2', t.revisao2)}</td>
      <td class="text-center">${getStatusBadgeHtml(t.status)}</td>
      <td>${t.id === 'TOP-001' ? '<span class="text-xs text-muted">Fora do denom.</span>' : getProgressBarHtml(t.progresso)}</td>
    </tr>
    <tr id="topic-accordion-${t.id}" class="topic-accordion-row" ${isAccordionOpen ? '' : 'hidden'}>
      <td colspan="11">
        ${renderTopicAccordionContent(t, vincList)}
      </td>
    </tr>
  `;
}

function renderTopicAccordionContent(t, vincList) {
  return `
    <div class="topic-accordion-pane">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
        <div>
          <span class="topic-chip">${escapeHtml(t.id)}</span>
          <strong style="margin-left:6px; font-size:13px; color:var(--text-primary);">${escapeHtml(t.subtopico)}</strong>
          <div class="text-xs text-muted mt-1">${escapeHtml(t.materia)} • ${escapeHtml(t.eixo)}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="openTopicModal('${t.id}')">Abrir Modal Completo & Etapas ↗</button>
      </div>

      <div class="popover-dispositivos mb-3">
        <strong>Dispositivos Legais / Normas:</strong> ${escapeHtml(t.dispositivos)}
      </div>

      <div class="popover-vinculos-header">
        <span>Exigências dos Editais Vinculadas a este Tópico (${vincList.length})</span>
        <span class="text-xs text-muted">Correspondência direta da planilha</span>
      </div>

      <div class="topic-accordion-grid">
        ${vincList.length > 0 ? vincList.map(v => renderVinculoCardHtml(v)).join('') : '<div class="text-muted text-xs">Nenhum vínculo registrado.</div>'}
      </div>
    </div>
  `;
}

function renderVinculoCardHtml(v) {
  const ex = (computed.exigenciasMap && computed.exigenciasMap[v.exigenciaId]) || {};
  const concLower = (v.concurso || '').toLowerCase();
  let badgeClass = 'inc-tjsp';
  let editalKey = 'tjsp';
  if (concLower.includes('dpdf')) {
    badgeClass = 'inc-dpdf';
    editalKey = 'dpdf';
  } else if (concLower.includes('sefaz')) {
    badgeClass = 'inc-sefaz';
    editalKey = 'sefaz';
  } else if (concLower.includes('núcleo') || concLower.includes('nucleo') || concLower.includes('distrital')) {
    badgeClass = 'inc-nucleo';
    editalKey = 'nucleo';
  }

  const title = ex.tituloDidatico || ex.itemOriginal || v.justificativa || v.exigenciaId;
  const literalText = ex.textoLiteral || ex.textoReferencia || '';

  return `
    <div class="popover-vinc-item">
      <div class="popover-vinc-top">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="inc-pill ${badgeClass}">${escapeHtml(v.concurso)}</span>
          <span class="popover-vinc-code">${escapeHtml(v.exigenciaId)}</span>
        </div>
        <button class="btn btn-ghost btn-tiny" onclick="viewExigenciaInEdital('${editalKey}', '${v.exigenciaId}')" title="Ver esta exigência no edital">
          Ver no edital ↗
        </button>
      </div>
      <div class="popover-vinc-title">${escapeHtml(title)}</div>
      ${ex.disciplina ? `<div class="popover-vinc-meta">${escapeHtml(ex.disciplina)}${ex.bloco ? ` • ${escapeHtml(ex.bloco)}` : ''}</div>` : ''}
      ${literalText ? `<div class="popover-vinc-literal" title="Texto literal do edital">${escapeHtml(literalText)}</div>` : ''}
      ${v.justificativa ? `<div class="popover-vinc-justificativa">↳ ${escapeHtml(v.justificativa)}</div>` : ''}
    </div>
  `;
}

// Controle do Painel Suspenso Flutuante (Hover Popover)
let popoverTimeout = null;
let currentPopoverTopicId = null;
let popoverDismissedUntil = 0;

function showTopicPopover(e, topicoId) {
  if (Date.now() < popoverDismissedUntil && currentPopoverTopicId === topicoId) {
    return;
  }
  if (typeof clearTimeout === 'function') clearTimeout(popoverTimeout);
  currentPopoverTopicId = topicoId;

  const t = computed.topicosMap[topicoId];
  if (!t) return;

  const popover = document.getElementById('topicHoverPopover');
  if (!popover) return;

  const vincList = (computed.vinculosByTopic && computed.vinculosByTopic[topicoId]) || [];

  const incBadges = [
    t.tjsp === '●' ? '<span class="inc-pill inc-tjsp">TJSP</span>' : '',
    t.dpdf === '●' ? '<span class="inc-pill inc-dpdf">DPDF</span>' : '',
    t.sefaz === '●' ? '<span class="inc-pill inc-sefaz">SEFAZ</span>' : '',
    t.nucleoDf === '●' ? '<span class="inc-pill inc-nucleo">NÚC</span>' : ''
  ].filter(Boolean).join('');

  popover.innerHTML = `
    <div class="popover-header">
      <div class="popover-badges">
        <span class="topic-chip">${escapeHtml(t.id)}</span>
        <span class="status-pill status-em-curso">${escapeHtml(t.materia)}</span>
        ${getStatusBadgeHtml(t.status)}
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div class="inc-pills-wrap">${incBadges}</div>
        <button type="button" class="btn-close-popover" onclick="hideTopicPopover(event)" title="Fechar este painel (Esc)">✕</button>
      </div>
    </div>

    <div class="popover-body">
      <div>
        <div class="text-xs text-muted font-semibold">${escapeHtml(t.eixo)}</div>
        <div class="popover-topic-title">${escapeHtml(t.subtopico)}</div>
      </div>

      <div class="popover-dispositivos">
        <strong>Dispositivos Legais & Normas:</strong><br>
        ${escapeHtml(t.dispositivos)}
      </div>

      <div class="popover-vinculos-header">
        <span>Exigências Vinculadas dos Editais (${vincList.length})</span>
        <span class="text-xs text-muted">Correspondência direta</span>
      </div>

      <div class="popover-vinculos-list">
        ${vincList.length > 0 ? vincList.map(v => renderVinculoCardHtml(v)).join('') : '<div class="text-muted text-xs">Nenhuma exigência vinculada.</div>'}
      </div>
    </div>

    <div class="popover-footer">
      <span class="text-muted text-xs">Pressione Esc ou clique no ✕ para fechar</span>
      <button class="btn btn-secondary btn-sm" onclick="hideTopicPopover(event); openTopicModal('${t.id}')">
        Abrir Detalhes & Etapas ↗
      </button>
    </div>
  `;

  popover.onmouseenter = () => clearTimeout(popoverTimeout);
  popover.onmouseleave = () => scheduleHideTopicPopover();

  popover.removeAttribute('hidden');
  popover.style.display = 'flex';
  positionPopover(e.currentTarget, popover);
}

function positionPopover(triggerEl, popoverEl) {
  const rect = triggerEl.getBoundingClientRect();
  const popoverWidth = 480;
  const popoverHeight = Math.min(520, window.innerHeight - 32);

  let left = rect.right + 12;
  if (left + popoverWidth > window.innerWidth - 16) {
    left = Math.max(16, rect.left - popoverWidth - 12);
  }

  let top = rect.top - 6;
  if (top + popoverHeight > window.innerHeight - 16) {
    top = Math.max(16, window.innerHeight - popoverHeight - 16);
  }
  if (top < 16) top = 16;

  popoverEl.style.left = `${left}px`;
  popoverEl.style.top = `${top}px`;
}

function scheduleHideTopicPopover() {
  if (typeof clearTimeout === 'function') clearTimeout(popoverTimeout);
  if (typeof setTimeout === 'function') {
    popoverTimeout = setTimeout(() => {
      hideTopicPopover();
    }, 150);
  } else {
    hideTopicPopover();
  }
}

function hideTopicPopover(e) {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  if (typeof clearTimeout === 'function') clearTimeout(popoverTimeout);
  const popover = document.getElementById('topicHoverPopover');
  if (popover) {
    popover.setAttribute('hidden', '');
    popover.style.display = 'none';
  }
  popoverDismissedUntil = Date.now() + 800;
  currentPopoverTopicId = null;
}

function toggleTopicAccordion(topicoId) {
  if (!state.ui.accordions) state.ui.accordions = {};
  state.ui.accordions[topicoId] = !state.ui.accordions[topicoId];

  const row = document.getElementById(`topic-accordion-${topicoId}`);
  const btn = document.querySelector(`#row-${topicoId} .badge-vinculos-btn`);
  if (row) {
    if (state.ui.accordions[topicoId]) {
      row.removeAttribute('hidden');
      if (btn) btn.classList.add('active');
    } else {
      row.setAttribute('hidden', '');
      if (btn) btn.classList.remove('active');
    }
  }
}

function viewExigenciaInEdital(editalKey, exigenciaId) {
  hideTopicPopover();
  switchTab('editais');
  setEditalAtivo(editalKey);
  const searchInput = document.querySelector('#editaisContent input[type="search"]');
  if (searchInput) {
    searchInput.value = exigenciaId;
    updateEditalFilter('editalSearch', exigenciaId);
  }
}

function updateListaFilter(key, val) {
  state.ui[key] = val;
  saveState();
  renderLista();
}

// ============================================================================
// 7. RENDERIZAÇÃO DA ABA 4: EDITAIS VERTICALIZADOS & MATRIZ DE VÍNCULOS
// ============================================================================

function renderEditais() {
  const container = document.getElementById('editaisContent');
  if (!container) return;

  const editalKey = state.ui.editalAtivo || 'tjsp';
  const search = (state.ui.editalSearch || '').toLowerCase().trim();
  const discFilter = state.ui.editalDisciplina || 'TODAS';
  const statusFilter = state.ui.editalStatus || 'TODOS';

  if (editalKey === 'vinculos') {
    const filteredVinc = computed.vinculos.filter(v => {
      if (statusFilter !== 'TODOS' && v.statusTopico !== statusFilter) return false;
      if (search) {
        const hay = `${v.id} ${v.exigenciaId} ${v.topicoId} ${v.concurso} ${v.justificativa} ${v.recortes}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h3 class="section-title">Matriz de Vínculos • Correspondência Exigência do Edital ↔ Tópico da Lista Única</h3>
          <p class="section-subtitle">879 relações auditadas (872 vínculos de estudo + 7 referências sem estudo). Clique no ID do Tópico para abrir e marcar suas etapas.</p>
        </div>
        ${renderEditaisSubtabs(editalKey)}
      </div>

      <div class="filters-bar">
        <input type="search" class="filter-input" placeholder="Buscar por VINC-xxxx, ID da exigência, TOP-xxx ou justificativa..."
          value="${escapeHtml(state.ui.editalSearch)}" oninput="updateEditalFilter('editalSearch', this.value)" />
        <select class="filter-select" onchange="updateEditalFilter('editalStatus', this.value)">
          <option value="TODOS" ${statusFilter === 'TODOS' ? 'selected' : ''}>Todos os Status</option>
          <option value="Pendente" ${statusFilter === 'Pendente' ? 'selected' : ''}>Pendente</option>
          <option value="Em curso" ${statusFilter === 'Em curso' ? 'selected' : ''}>Em curso</option>
          <option value="Consolidado" ${statusFilter === 'Consolidado' ? 'selected' : ''}>Consolidado</option>
          <option value="Informativo" ${statusFilter === 'Informativo' ? 'selected' : ''}>Informativo</option>
        </select>
        <span class="filter-count-badge">Exibindo <strong>${filteredVinc.length}</strong> de 879 vínculos</span>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">ID Vínculo</th>
                <th style="width:130px;">ID Exigência</th>
                <th style="width:95px;">ID Tópico</th>
                <th style="width:140px;">Concurso / Núcleo</th>
                <th style="width:155px;">Tipo de Relação</th>
                <th>Justificativa de Equivalência & Recortes Preservados</th>
                <th class="text-center" style="width:115px;">Status Tópico</th>
                <th style="width:130px;">Progresso</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVinc.slice(0, 300).map(v => `
                <tr>
                  <td><code>${escapeHtml(v.id)}</code></td>
                  <td><strong>${escapeHtml(v.exigenciaId)}</strong></td>
                  <td>
                    <button class="topic-id-link" onclick="openTopicModal('${v.topicoId}')">${escapeHtml(v.topicoId)}</button>
                  </td>
                  <td>${escapeHtml(v.concurso)}</td>
                  <td><span class="text-xs font-semibold">${escapeHtml(v.tipoRelacao)}</span></td>
                  <td>
                    <div>${escapeHtml(v.justificativa)}</div>
                    <div class="topic-dispositivos">${escapeHtml(v.recortes)}</div>
                  </td>
                  <td class="text-center">${getStatusBadgeHtml(v.statusTopico)}</td>
                  <td>${v.progressoTopico === null ? '<span class="text-xs text-muted">Referência</span>' : getProgressBarHtml(v.progressoTopico)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${filteredVinc.length > 300 ? `<div class="table-footer-note">Exibindo os primeiros 300 de ${filteredVinc.length} vínculos. Use a busca acima para filtrar.</div>` : ''}
        </div>
      </div>
    `;
    return;
  }

  const list = computed.editais[editalKey] || [];
  const isNucleo = editalKey === 'nucleo';
  const disciplinas = Array.from(new Set(list.map(item => isNucleo ? item.eixo : item.disciplina))).filter(Boolean);

  const filtered = list.filter(item => {
    const discVal = isNucleo ? item.eixo : item.disciplina;
    if (discFilter !== 'TODAS' && discVal !== discFilter) return false;
    if (statusFilter !== 'TODOS' && item.status !== statusFilter) return false;
    if (search) {
      const hay = `${item.id} ${discVal} ${item.textoLiteral || item.textoReferencia} ${item.tituloDidatico} ${(item.topicosIds || []).join(' ')}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const studyItems = list.filter(i => !i.isInformativo);
  const completedItems = studyItems.filter(i => i.status === 'Concluído').length;
  const avgProg = studyItems.length ? studyItems.reduce((a, r) => a + (r.progresso || 0), 0) / studyItems.length : 0;

  const headersInfo = {
    tjsp: {
      title: 'TJSP — Oficial de Justiça • Edital de Abertura nº 01/2026 (Prioridade Máxima)',
      sub: 'Banca VUNESP · Prova Objetiva (70q) e Discursiva (2q): 14/03/2027 · 179 exigências de estudo + 1 regra informativa (Anexo VIII, pp. 60–62)'
    },
    dpdf: {
      title: 'DPDF — Analista de Apoio à Assistência Judiciária (Direito e Legislação) • Edital nº 1/2026',
      sub: 'Banca Instituto ACCESS · Provas Objetiva (70q) e Discursiva (1 diss. + 3q): 21/02/2027 · 233 exigências do Anexo I + 2 registros informativos'
    },
    sefaz: {
      title: 'SEFAZ-DF — Auditor-Fiscal da Receita do DF • Editais nº 1 a 5/2019 (Base Histórica Consolidada)',
      sub: 'Banca Cebraspe · 260 exigências de estudo (incluindo Administração Pública e Auditoria Fiscal itens 1 a 38) + 2 registros informativos'
    },
    nucleo: {
      title: 'Núcleo Distrital Complementar • Lei Distrital nº 4.949/2012 (art. 10, VII)',
      sub: 'Aplicável exclusivamente à DPDF e à SEFAZ-DF (jamais ao TJSP) · 16 exigências de estudo + 2 referências normativas'
    }
  }[editalKey];

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h3 class="section-title">${escapeHtml(headersInfo.title)}</h3>
        <p class="section-subtitle">${escapeHtml(headersInfo.sub)}</p>
      </div>
      ${renderEditaisSubtabs(editalKey)}
    </div>

    <div class="toolbar-card">
      <div class="toolbar-left">
        <span class="toolbar-stat">
          <strong>Resumo do Edital:</strong> ${studyItems.length} exigências de estudo ·
          Vínculos: <strong>${studyItems.length}/${studyItems.length} (100%)</strong> ·
          Exigências 100% Concluídas: <strong>${completedItems} / ${studyItems.length}</strong> ·
          Progresso Médio por Etapas: <strong>${fmtPct(avgProg, 2)}</strong>
        </span>
      </div>
    </div>

    <div class="filters-bar">
      <input type="search" class="filter-input" placeholder="Buscar por ID da exigência, texto literal do edital, artigo ou TOP-xxx..."
        value="${escapeHtml(state.ui.editalSearch)}" oninput="updateEditalFilter('editalSearch', this.value)" />

      <select class="filter-select" onchange="updateEditalFilter('editalDisciplina', this.value)">
        <option value="TODAS" ${discFilter === 'TODAS' ? 'selected' : ''}>Todas as Disciplinas / Eixos (${disciplinas.length})</option>
        ${disciplinas.map(d => `<option value="${escapeHtml(d)}" ${discFilter === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')}
      </select>

      <select class="filter-select" onchange="updateEditalFilter('editalStatus', this.value)">
        <option value="TODOS" ${statusFilter === 'TODOS' ? 'selected' : ''}>Todos os Status</option>
        <option value="Pendente" ${statusFilter === 'Pendente' ? 'selected' : ''}>Pendente</option>
        <option value="Em curso" ${statusFilter === 'Em curso' ? 'selected' : ''}>Em curso</option>
        <option value="Concluído" ${statusFilter === 'Concluído' ? 'selected' : ''}>Concluído ✓</option>
        <option value="Reforço" ${statusFilter === 'Reforço' ? 'selected' : ''}>Reforço ↻</option>
        <option value="Informativo" ${statusFilter === 'Informativo' ? 'selected' : ''}>Informativo</option>
      </select>

      <span class="filter-count-badge">Exibindo <strong>${filtered.length}</strong> de ${list.length} linhas</span>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:125px;">ID Exigência</th>
              <th style="width:185px;">${isNucleo ? 'Eixo do Núcleo Distrital' : 'Disciplina / Bloco'}</th>
              <th>Texto Oficial Literal (Preservado na Íntegra) & Título Didático</th>
              <th style="width:155px;">Tópico(s) na Lista Única</th>
              <th class="text-center" style="width:75px;" title="Tópicos Consolidados / Qtd. Tópicos">Tóp. Conc.</th>
              <th class="text-center" style="width:46px;">D</th>
              <th class="text-center" style="width:46px;">T</th>
              <th class="text-center" style="width:46px;">V</th>
              <th class="text-center" style="width:46px;">R1</th>
              <th class="text-center" style="width:46px;">R2</th>
              <th class="text-center" style="width:115px;">Status</th>
              <th style="width:130px;">Progresso</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(item => `
              <tr class="${item.status === 'Concluído' ? 'row-consolidated' : ''}">
                <td>
                  <code>${escapeHtml(item.id)}</code>
                  <div class="text-xs text-muted" style="margin-top:2px;">Item: ${escapeHtml(item.itemOriginal || item.dispositivoOriginal)}</div>
                </td>
                <td>
                  <div class="font-semibold">${escapeHtml(isNucleo ? item.eixo : item.disciplina)}</div>
                  <div class="text-xs text-muted">${escapeHtml(isNucleo ? '' : item.bloco)}</div>
                </td>
                <td>
                  <div class="edital-literal-text">${escapeHtml(item.textoLiteral || item.textoReferencia)}</div>
                  <div class="topic-dispositivos"><strong>Título Didático:</strong> ${escapeHtml(item.tituloDidatico)}</div>
                  ${isNucleo ? `
                    <div class="nucleo-inc-grid">
                      <span><strong>DPDF 2026:</strong> ${escapeHtml(item.incidenciaDpdf)}</span>
                      <span><strong>SEFAZ 2019:</strong> ${escapeHtml(item.incidenciaSefaz)}</span>
                    </div>
                  ` : ''}
                </td>
                <td>
                  <div class="topic-chips-wrap">
                    ${(item.topicosIds || []).map(tid => {
                      const tObj = computed.topicosMap[tid];
                      const tCls = tObj && tObj.status === 'Consolidado' ? 'chip-consolidado' : (tObj && tObj.status === 'Em curso' ? 'chip-em-curso' : '');
                      return `<button class="topic-chip ${tCls}" onclick="openTopicModal('${tid}')" title="Clique para gerenciar ${tid}">${escapeHtml(tid)}</button>`;
                    }).join('')}
                  </div>
                </td>
                <td class="text-center">
                  ${item.isInformativo ? '—' : `<strong>${item.topicosConcluidos} / ${item.qtdTopicos}</strong>`}
                </td>
                <td class="text-center"><span class="stage-readonly">${escapeHtml(item.diagnostico)}</span></td>
                <td class="text-center"><span class="stage-readonly">${escapeHtml(item.teoria)}</span></td>
                <td class="text-center"><span class="stage-readonly">${escapeHtml(item.validacao)}</span></td>
                <td class="text-center"><span class="stage-readonly">${escapeHtml(item.revisao1)}</span></td>
                <td class="text-center"><span class="stage-readonly">${escapeHtml(item.revisao2)}</span></td>
                <td class="text-center">${getStatusBadgeHtml(item.status)}</td>
                <td>${item.isInformativo ? '<span class="text-xs text-muted">Informativo</span>' : getProgressBarHtml(item.progresso)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderEditaisSubtabs(active) {
  return `
    <div class="subtab-bar">
      <button class="subtab-btn ${active === 'tjsp' ? 'active' : ''}" onclick="setEditalAtivo('tjsp')">TJSP Oficial (179+1)</button>
      <button class="subtab-btn ${active === 'dpdf' ? 'active' : ''}" onclick="setEditalAtivo('dpdf')">DPDF Analista (233+2)</button>
      <button class="subtab-btn ${active === 'sefaz' ? 'active' : ''}" onclick="setEditalAtivo('sefaz')">SEFAZ-DF Auditor (260+2)</button>
      <button class="subtab-btn ${active === 'nucleo' ? 'active' : ''}" onclick="setEditalAtivo('nucleo')">Núcleo Distrital (16+2)</button>
      <button class="subtab-btn ${active === 'vinculos' ? 'active' : ''}" onclick="setEditalAtivo('vinculos')">Matriz de Vínculos (879)</button>
    </div>
  `;
}

function setEditalAtivo(key) {
  state.ui.editalAtivo = key;
  state.ui.editalDisciplina = 'TODAS';
  state.ui.editalStatus = 'TODOS';
  saveState();
  renderEditais();
}

function updateEditalFilter(key, val) {
  state.ui[key] = val;
  saveState();
  renderEditais();
}

// ============================================================================
// 8. RENDERIZAÇÃO DA ABA 5: PROGRESSO POR MATÉRIA (27 DISCIPLINAS)
// ============================================================================

function renderMaterias() {
  const container = document.getElementById('materiasContent');
  if (!container) return;

  const filtro = state.ui.materiasFiltro || 'TODAS';
  const filtered = computed.progressoMaterias.filter(m => {
    if (filtro === 'ATIVAS') return m.situacao.includes('Ativa no Ciclo');
    if (filtro === 'COMPLEMENTARES') return m.situacao.includes('Catálogo Complementar');
    return true;
  });

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h3 class="section-title">Progresso por Matéria • Catálogo Completo (10 Ativas no Ciclo + 17 Complementares)</h3>
        <p class="section-subtitle">27 disciplinas · 298 unidades de estudo (referência administrativa TOP-001 fora dos totais). Clique em uma matéria para filtrar seus tópicos na Lista Única.</p>
      </div>
      <div class="subtab-bar">
        <button class="subtab-btn ${filtro === 'TODAS' ? 'active' : ''}" onclick="setMateriasFiltro('TODAS')">Todas (27)</button>
        <button class="subtab-btn ${filtro === 'ATIVAS' ? 'active' : ''}" onclick="setMateriasFiltro('ATIVAS')">Ativas no Ciclo Principal (10)</button>
        <button class="subtab-btn ${filtro === 'COMPLEMENTARES' ? 'active' : ''}" onclick="setMateriasFiltro('COMPLEMENTARES')">Catálogo Complementar (17)</button>
      </div>
    </div>

    <div class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width:45px;">Nº</th>
              <th style="width:180px;">Situação no Ciclo</th>
              <th>Matéria</th>
              <th>Incidência Oficial Mapeada</th>
              <th class="text-center">Tópicos</th>
              <th class="text-center">Diag.</th>
              <th class="text-center">Teoria</th>
              <th class="text-center">Valid.</th>
              <th class="text-center">Rev. 1</th>
              <th class="text-center">Rev. 2</th>
              <th class="text-center">Consolidados</th>
              <th class="text-center">Reforço</th>
              <th style="min-width:160px;">Progresso por Etapas</th>
              <th style="width:155px;">Próxima Ação</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(m => `
              <tr>
                <td class="text-center"><strong>${m.num}</strong></td>
                <td>
                  <span class="status-pill ${m.situacao.includes('Ativa') ? 'status-em-curso' : 'status-pendente'}">
                    ${m.situacao.includes('Ativa') ? 'Ativa no Ciclo (10)' : 'Complementar (17)'}
                  </span>
                </td>
                <td>
                  <button class="topic-title-clickable" style="background:none;border:none;padding:0;text-align:left;"
                    onclick="openMateriaInLista('${escapeHtml(m.materia)}')">
                    <strong>${escapeHtml(m.materia)}</strong> ↗
                  </button>
                </td>
                <td class="text-muted text-xs">${escapeHtml(m.incidencia)}</td>
                <td class="text-center"><strong>${m.total}</strong></td>
                <td class="text-center">${m.d1}</td>
                <td class="text-center">${m.d2}</td>
                <td class="text-center">${m.d3}</td>
                <td class="text-center">${m.d4}</td>
                <td class="text-center">${m.d5}</td>
                <td class="text-center"><strong>${m.consolidados}</strong> (${fmtPct(m.pctConsolidados, 0)})</td>
                <td class="text-center">${m.reforco}</td>
                <td>${getProgressBarHtml(m.avgProg)}</td>
                <td>${getStatusBadgeHtml(m.acao)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function setMateriasFiltro(val) {
  state.ui.materiasFiltro = val;
  saveState();
  renderMaterias();
}

function openMateriaInLista(materia) {
  state.ui.listaMateria = materia;
  state.ui.listaFase = 'TODAS';
  state.ui.listaConcurso = 'TODOS';
  state.ui.listaStatus = 'TODOS';
  state.ui.listaSearch = '';
  saveState();
  switchTab('lista');
}

// ============================================================================
// 9. RENDERIZAÇÃO DA ABA 6: DISCURSIVAS, METODOLOGIA, FONTES & AUDITORIA
// ============================================================================

function renderDiscursivas() {
  const container = document.getElementById('discursivasContent');
  if (!container) return;

  const sub = state.ui.discursivasSubtab || 'comparativo';
  const prep = computed.prepDpdf;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h3 class="section-title">Discursivas, Metodologia em 5 Etapas, Fontes Oficiais e Auditoria</h3>
        <p class="section-subtitle">Regras efetivas das provas discursivas (TJSP · DPDF · SEFAZ-DF), inventário de fontes e retificações e bateria de 9 testes automatizados + 27 correções C01–C27</p>
      </div>
      <div class="subtab-bar">
        <button class="subtab-btn ${sub === 'comparativo' ? 'active' : ''}" onclick="setDiscursivasSubtab('comparativo')">Discursivas e Etapas</button>
        <button class="subtab-btn ${sub === 'metodologia' ? 'active' : ''}" onclick="setDiscursivasSubtab('metodologia')">Metodologia (5 Etapas)</button>
        <button class="subtab-btn ${sub === 'fontes' ? 'active' : ''}" onclick="setDiscursivasSubtab('fontes')">Fontes e Retificações (8)</button>
        <button class="subtab-btn ${sub === 'auditoria' ? 'active' : ''}" onclick="setDiscursivasSubtab('auditoria')">Auditoria (9 Testes & C01–C27)</button>
      </div>
    </div>

    ${sub === 'comparativo' ? `
      <div class="toolbar-card" style="margin-bottom: 1.25rem;">
        <div class="toolbar-left">
          <span class="toolbar-stat">
            <strong>Preparação Discursiva Própria DPDF (<code>${escapeHtml(prep.id)}</code>):</strong>
            ${escapeHtml(prep.conteudo)} — <span class="text-muted">${escapeHtml(prep.fonte)}</span>
          </span>
        </div>
        <div class="toolbar-right" style="display:flex; align-items:center; gap:12px;">
          <button class="topic-chip" onclick="openTopicModal('${prep.topicoId}')">${escapeHtml(prep.topicoId)}</button>
          ${getStatusBadgeHtml(prep.status)}
          <div style="width:140px;">${getProgressBarHtml(prep.progresso)}</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:190px;">Dimensão / Regra do Edital</th>
                <th>TJSP — Oficial de Justiça (Edital nº 01/2026)</th>
                <th>DPDF — Analista Direito e Legislação (Edital nº 1/2026)</th>
                <th>SEFAZ-DF — Auditor-Fiscal (Editais nº 1 a 5/2019)</th>
                <th style="width:220px;">Condição de Eliminação & Observações</th>
              </tr>
            </thead>
            <tbody>
              ${INITIAL_DATA.discursivas.comparativo.map(row => `
                <tr>
                  <td>
                    <strong>${escapeHtml(row.dimensao)}</strong>
                    <div class="text-xs text-muted" style="margin-top:4px;">${escapeHtml(row.dispositivos)}</div>
                  </td>
                  <td>${escapeHtml(row.tjsp)}</td>
                  <td>${escapeHtml(row.dpdf)}</td>
                  <td>${escapeHtml(row.sefaz)}</td>
                  <td>
                    <div class="text-xs"><strong>Eliminação:</strong> ${escapeHtml(row.eliminacao)}</div>
                    <div class="topic-dispositivos" style="margin-top:4px;">${escapeHtml(row.observacoes)}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${sub === 'metodologia' ? `
      <div class="table-card" style="margin-bottom: 1.5rem;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:170px;">Etapa do Estudo Reverso</th>
                <th class="text-center" style="width:110px;">Valores</th>
                <th>Significado Operacional da Etapa</th>
                <th>Critério para Marcar Concluído (✓ ou —) e Quando Usar Reforço (↻)</th>
                <th>Impacto no Progresso e Propagação para os Editais</th>
              </tr>
            </thead>
            <tbody>
              ${INITIAL_DATA.metodologia.etapas.map(e => `
                <tr>
                  <td><strong>${escapeHtml(e.etapa)}</strong><div class="text-xs text-muted">${escapeHtml(e.coluna)}</div></td>
                  <td class="text-center"><code>${escapeHtml(e.valores)}</code></td>
                  <td>${escapeHtml(e.significado)}</td>
                  <td>
                    <div><strong>Concluído:</strong> ${escapeHtml(e.criterioConcluido)}</div>
                    <div class="text-xs text-muted" style="margin-top:4px;"><strong>Reforço (↻):</strong> ${escapeHtml(e.quandoReforco)}</div>
                  </td>
                  <td>
                    <div>${escapeHtml(e.impacto)}</div>
                    <div class="topic-dispositivos" style="margin-top:4px;">${escapeHtml(e.propagacao)}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${sub === 'fontes' ? `
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:140px;">Código / Órgão</th>
                <th>Documento Oficial & Cargo Confirmado</th>
                <th style="width:160px;">Data, Versão & Retificações</th>
                <th>Páginas / Dispositivos Utilizados</th>
                <th>Efeito sobre Conteúdo, Etapas ou Calendário</th>
              </tr>
            </thead>
            <tbody>
              ${INITIAL_DATA.metodologia.fontes.map(f => `
                <tr>
                  <td><strong>${escapeHtml(f.codigo)}</strong></td>
                  <td>
                    <div class="font-semibold">${escapeHtml(f.documento)}</div>
                    <div class="text-xs text-muted" style="margin-top:4px;">${escapeHtml(f.cargo)}</div>
                  </td>
                  <td>
                    <div>${escapeHtml(f.dataVersao)}</div>
                    <div class="text-xs text-muted" style="margin-top:4px;">${escapeHtml(f.retificacoes)}</div>
                  </td>
                  <td class="text-xs">${escapeHtml(f.paginas)}</td>
                  <td class="text-xs">${escapeHtml(f.efeito)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${sub === 'auditoria' ? `
      <div class="table-card" style="margin-bottom: 1.5rem;">
        <div class="card-inner-header">
          <h4>1. Bateria de 9 Testes Automatizados de Integridade Estrutural, Funcional e de Fórmulas</h4>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:210px;">Código / Teste Obrigatório</th>
                <th style="width:160px;">Escopo</th>
                <th>Critério de Aceitação & Descrição</th>
                <th class="text-center" style="width:90px;">Esperado</th>
                <th class="text-center" style="width:90px;">Encontrado</th>
                <th class="text-center" style="width:110px;">Veredito</th>
                <th>Evidência Técnica</th>
              </tr>
            </thead>
            <tbody>
              ${INITIAL_DATA.auditoria.testes.map(t => `
                <tr>
                  <td><strong>${escapeHtml(t.codigo)}</strong></td>
                  <td>${escapeHtml(t.escopo)}</td>
                  <td>
                    <div class="font-semibold">${escapeHtml(t.criterio)}</div>
                    <div class="text-xs text-muted">${escapeHtml(t.descricao)}</div>
                  </td>
                  <td class="text-center"><code>${escapeHtml(t.esperado)}</code></td>
                  <td class="text-center"><strong>${escapeHtml(t.encontrado)}</strong></td>
                  <td class="text-center">${getStatusBadgeHtml(t.veredito)}</td>
                  <td class="text-xs text-muted">${escapeHtml(t.evidencia)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-card">
        <div class="card-inner-header">
          <h4>2. Registro Auditável das 27 Correções Aplicadas à Lista Única e às Correspondências (C01 a C27)</h4>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:65px;">Achado</th>
                <th style="width:220px;">Escopo</th>
                <th style="width:160px;">Exigências Afetadas</th>
                <th style="width:150px;">Tópicos Após Correção</th>
                <th>Problema Identificado & Tratamento Aplicado</th>
                <th class="text-center" style="width:100px;">Situação</th>
              </tr>
            </thead>
            <tbody>
              ${INITIAL_DATA.auditoria.correcoes.map(c => `
                <tr>
                  <td><strong>${escapeHtml(c.achado)}</strong></td>
                  <td><strong>${escapeHtml(c.escopo)}</strong></td>
                  <td><code class="text-xs">${escapeHtml(c.exigencias)}</code></td>
                  <td><code class="text-xs">${escapeHtml(c.topicos)}</code></td>
                  <td>
                    <div class="text-xs">${escapeHtml(c.problema)}</div>
                    <div class="topic-dispositivos" style="margin-top:4px;"><strong>Solução:</strong> ${escapeHtml(c.observacao)}</div>
                  </td>
                  <td class="text-center">${getStatusBadgeHtml(c.situacao)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;
}

function setDiscursivasSubtab(sub) {
  state.ui.discursivasSubtab = sub;
  saveState();
  renderDiscursivas();
}

// ============================================================================
// 10. MODAL DE DETALHES E MARCAÇÃO DE TÓPICO DA LISTA ÚNICA
// ============================================================================

function openTopicModal(topicoId) {
  const t = computed.topicosMap[topicoId];
  if (!t) return;

  const modal = document.getElementById('topicModal');
  const badgesEl = document.getElementById('modalHeaderBadges');
  const bodyEl = document.getElementById('modalBody');
  if (!modal || !badgesEl || !bodyEl) return;

  modal.dataset.topicoId = topicoId;
  const linkedVinc = computed.vinculos.filter(v => v.topicoId === topicoId);

  badgesEl.innerHTML = `
    <span class="topic-chip">${escapeHtml(t.id)}</span>
    <span class="status-pill status-em-curso">${escapeHtml(t.materia)}</span>
    ${getStatusBadgeHtml(t.status)}
  `;

  const isRef = t.id === 'TOP-001';

  bodyEl.innerHTML = `
    <div class="modal-section">
      <div class="text-xs text-muted font-semibold">${escapeHtml(t.eixo)} · ${escapeHtml(t.faseCiclo)}</div>
      <h3 class="modal-topic-title">${escapeHtml(t.subtopico)}</h3>
      <div class="modal-dispositivos-box">
        <strong>Dispositivos Legais, Normas e Recorte Temporal:</strong><br>
        ${escapeHtml(t.dispositivos)}
      </div>
    </div>

    ${!isRef ? `
      <div class="modal-section">
        <div class="modal-section-header">
          <h4>Marcação das 5 Etapas do Estudo Reverso</h4>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="markAllStagesForTopic('${t.id}', '✓')">✓ Consolidar 5/5 Etapas</button>
            <button class="btn btn-ghost btn-sm" onclick="markAllStagesForTopic('${t.id}', '☐')">↺ Limpar</button>
          </div>
        </div>
        <div class="modal-stages-grid">
          ${[
            { key: 'diagnostico', label: '1. Diagnóstico', val: t.diagnostico, opts: ['☐', '✓', '↻'] },
            { key: 'teoria', label: '2. Teoria', val: t.teoria, opts: ['☐', '✓', '—', '↻'] },
            { key: 'validacao', label: '3. Validação', val: t.validacao, opts: ['☐', '✓', '↻'] },
            { key: 'revisao1', label: '4. Revisão 1', val: t.revisao1, opts: ['☐', '✓', '↻'] },
            { key: 'revisao2', label: '5. Revisão 2', val: t.revisao2, opts: ['☐', '✓', '↻'] }
          ].map(st => `
            <div class="modal-stage-card">
              <div class="modal-stage-name">${st.label}</div>
              <div class="modal-stage-opts">
                ${st.opts.map(opt => `
                  <button class="stage-check-btn ${st.val === opt ? (opt === '✓' ? 'stage-ok' : (opt === '—' ? 'stage-skip' : (opt === '↻' ? 'stage-reforco' : 'stage-active-empty'))) : ''}"
                    onclick="toggleTopicStage('${t.id}', '${st.key}', '${opt}')">
                    ${opt}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 12px;">
          ${getProgressBarHtml(t.progresso)}
        </div>
      </div>

      <div class="modal-section">
        <h4>Anotações Pessoais / Caderno de Erros / Ponto de Parada</h4>
        <textarea class="modal-textarea" rows="3" placeholder="Registre artigos vulneráveis, links do TEC Concursos, página do PDF ou observações de revisão..."
          onchange="saveTopicNotes('${t.id}', this.value)">${escapeHtml(t.anotacoes)}</textarea>
      </div>
    ` : ''}

    <div class="modal-section">
      <h4>Exigências dos Editais Vinculadas a ${escapeHtml(t.id)} (${linkedVinc.length})</h4>
      <div class="table-responsive" style="max-height: 240px; overflow-y: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Vínculo</th>
              <th>Exigência</th>
              <th>Concurso / Núcleo</th>
              <th>Relação</th>
              <th>Justificativa e Recortes</th>
            </tr>
          </thead>
          <tbody>
            ${linkedVinc.map(v => `
              <tr>
                <td><code>${escapeHtml(v.id)}</code></td>
                <td><strong>${escapeHtml(v.exigenciaId)}</strong></td>
                <td>${escapeHtml(v.concurso)}</td>
                <td class="text-xs">${escapeHtml(v.tipoRelacao)}</td>
                <td class="text-xs">${escapeHtml(v.justificativa)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function saveTopicNotes(topicoId, notes) {
  if (!state.topicosUser[topicoId]) return;
  state.topicosUser[topicoId].anotacoes = notes;
  saveState();
  recalculateAll();
  showToast('Anotações salvas automaticamente.', 'info');
}

function closeTopicModal() {
  const modal = document.getElementById('topicModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.dataset.topicoId = '';
  }
}

// ============================================================================
// 11. NAVEGAÇÃO ENTRE ABAS, CRONÔMETRO POMODORO E CONTROLES GLOBAIS
// ============================================================================

function switchTab(tabId) {
  hideTopicPopover();
  state.ui.activeTab = tabId;
  saveState();

  let activeBtn = null;
  document.querySelectorAll('.nav-tab').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    if (isActive) activeBtn = btn;
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tab-${tabId}`);
  });

  if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  renderActiveTab();
}

// ============================================================================
// ROLAGEM FÁCIL COM O MOUSE (WHEEL, CHEVRONS E DRAG-TO-SCROLL)
// ============================================================================
function setupHorizontalScrolling() {
  const mainNav = document.getElementById('mainNav');
  const btnLeft = document.getElementById('btnNavScrollLeft');
  const btnRight = document.getElementById('btnNavScrollRight');

  // 1. Rolagem horizontal com a roda vertical do mouse (wheel)
  document.addEventListener('wheel', (e) => {
    const target = e.target.closest && e.target.closest('.main-nav, .subtab-bar, .circuit-cells-grid, .table-responsive');
    if (!target) return;
    if (e.deltaY !== 0 && target.scrollWidth > target.clientWidth) {
      e.preventDefault();
      target.scrollLeft += e.deltaY * 1.5;
    }
  }, { passive: false });

  // 2. Botões de seta ‹ e › da barra de abas
  if (mainNav && btnLeft && btnRight) {
    btnLeft.addEventListener('click', (e) => {
      e.preventDefault();
      mainNav.scrollBy({ left: -220, behavior: 'smooth' });
    });
    btnRight.addEventListener('click', (e) => {
      e.preventDefault();
      mainNav.scrollBy({ left: 220, behavior: 'smooth' });
    });

    const updateArrows = () => {
      const hasOverflow = (mainNav.scrollWidth || 0) > (mainNav.clientWidth || 0);
      if (btnLeft && btnLeft.style) {
        btnLeft.style.display = (hasOverflow && mainNav.scrollLeft > 10) ? 'flex' : 'none';
      }
      if (btnRight && btnRight.style) {
        btnRight.style.display = (hasOverflow && mainNav.scrollLeft < mainNav.scrollWidth - mainNav.clientWidth - 10) ? 'flex' : 'none';
      }
    };

    mainNav.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    setTimeout(updateArrows, 150);
  }

  // 3. Arrastar com o mouse (Drag-to-scroll) na barra de abas
  if (mainNav) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    mainNav.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      isDown = true;
      hasMoved = false;
      mainNav.classList.add('is-dragging');
      startX = e.pageX - mainNav.offsetLeft;
      scrollLeft = mainNav.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      mainNav.classList.remove('is-dragging');
    });

    mainNav.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - mainNav.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 4) {
        hasMoved = true;
        e.preventDefault();
        mainNav.scrollLeft = scrollLeft - walk;
      }
    });

    // Se arrastou, previne o clique acidental em uma aba
    mainNav.addEventListener('click', (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }
}

function renderActiveTab() {
  const tab = state.ui.activeTab || 'painel';
  if (tab === 'painel') renderPainel();
  else if (tab === 'diario') renderDiario();
  else if (tab === 'ciclo') renderCiclo();
  else if (tab === 'lista') renderLista();
  else if (tab === 'editais') renderEditais();
  else if (tab === 'materias') renderMaterias();
  else if (tab === 'discursivas') renderDiscursivas();
}

function updateTimerDisplay() {
  const el = document.getElementById('pomodoroDisplay');
  if (!el) return;
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function toggleTimer() {
  const btn = document.getElementById('btnTimerToggle');
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    if (btn) btn.textContent = '▶';
  } else {
    timerRunning = true;
    if (btn) btn.textContent = '⏸';
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerRunning = false;
        if (btn) btn.textContent = '▶';
        showToast('Bloco de 50 minutos concluído! Marque o avanço na Fila Contínua.', 'success');
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 50 * 60;
  updateTimerDisplay();
  const btn = document.getElementById('btnTimerToggle');
  if (btn) btn.textContent = '▶';
}

function exportBackupJson() {
  const dataStr = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    state
  }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `backup-controle-estudos-${dateTag}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup JSON exportado com sucesso!', 'success');
}

function importBackupJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const importedState = parsed.state || parsed;
      if (importedState.topicosUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(importedState));
        loadState();
        recalculateAll();
        switchTab(state.ui.activeTab || 'painel');
        showToast('Backup importado e indicadores recalculados com sucesso!', 'success');
      } else {
        showToast('Arquivo JSON inválido.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao ler arquivo JSON de backup.', 'danger');
    }
  };
  reader.readAsText(file);
}

function resetToSpreadsheetDefault() {
  if (!confirm('Deseja restaurar o estado inicial exato da planilha (TOP-002 a TOP-017 em 60% e Bloco 01 concluído)?')) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  loadState();
  recalculateAll();
  renderActiveTab();
  showToast('Estado restaurado para o padrão original da planilha.', 'info');
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

// Inicialização no carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadState();
  recalculateAll();

  // Eventos das abas
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Eventos do Pomodoro e cabeçalho
  document.getElementById('btnTimerToggle')?.addEventListener('click', toggleTimer);
  document.getElementById('btnTimerReset')?.addEventListener('click', resetTimer);
  document.getElementById('btnExportBackup')?.addEventListener('click', exportBackupJson);
  document.getElementById('inputImportBackup')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      importBackupJson(e.target.files[0]);
      e.target.value = '';
    }
  });
  document.getElementById('btnResetState')?.addEventListener('click', resetToSpreadsheetDefault);
  document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);

  // Fechar modal e painel suspenso
  document.getElementById('btnCloseModal')?.addEventListener('click', closeTopicModal);
  document.getElementById('topicModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'topicModal') closeTopicModal();
  });

  // Fechar painel suspenso ao clicar fora ou rolar a página
  document.addEventListener('pointerdown', (e) => {
    const popover = document.getElementById('topicHoverPopover');
    if (popover && !popover.hasAttribute('hidden')) {
      if (!popover.contains(e.target) && !e.target.closest('.topic-id-cell') && !e.target.closest('.topic-title-clickable')) {
        hideTopicPopover();
      }
    }
  });

  window.addEventListener('scroll', () => {
    const popover = document.getElementById('topicHoverPopover');
    if (popover && !popover.hasAttribute('hidden')) {
      hideTopicPopover();
    }
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTopicModal();
      hideTopicPopover();
    }
  });

  updateTimerDisplay();
  switchTab(state.ui.activeTab || 'painel');
  setupHorizontalScrolling();
  initFirebaseSync();
  checkAuthOnStartup();
});

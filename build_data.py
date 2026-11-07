import zipfile, xml.etree.ElementTree as ET, json, re

xlsx_path = '/Users/samuelhennig/.gemini/antigravity/brain/f48cecc9-b43b-41f3-be18-68ab5e8a3a94/.user_uploaded/media_1793925547910_94e8b7ba.xlsx'

def S(val):
    if val is None:
        return ''
    return str(val).strip()

with zipfile.ZipFile(xlsx_path, 'r') as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        sst_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in sst_tree:
            t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
            if t is not None:
                shared_strings.append(t.text or '')
            else:
                text_parts = [elem.text or '' for elem in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
                shared_strings.append(''.join(text_parts))

    rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    sheet_rel = {rel.attrib['Id']: rel.attrib['Target'] for rel in rels_tree}
    wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
    ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
    r_ns = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

    def get_sheet_rows(sheet_name):
        target = None
        for s in wb_tree.findall(f'{ns}sheets/{ns}sheet'):
            if s.attrib['name'] == sheet_name:
                target = 'xl/' + sheet_rel[s.attrib[f'{r_ns}id']]
                break
        if not target: return []
        st_tree = ET.fromstring(z.read(target))
        rows = []
        for r in st_tree.findall(f'.//{ns}row'):
            row_dict = {}
            for c in r.findall(f'{ns}c'):
                v = c.find(f'{ns}v')
                val = ''
                if v is not None:
                    if c.attrib.get('t') == 's':
                        idx = int(v.text)
                        val = shared_strings[idx] if idx < len(shared_strings) else ''
                    else:
                        val = v.text
                ref = c.attrib['r']
                col = ''.join([ch for ch in ref if ch.isalpha()])
                row_dict[col] = val
            rows.append((int(r.attrib['r']), row_dict))
        return rows

    # 1. DIÁRIO DE ESTUDOS
    diario_rows = get_sheet_rows('Diário')
    controle_semanal = []
    for rn, r in diario_rows:
        if 6 <= rn <= 12:
            controle_semanal.append({
                'dia': S(r.get('A')),
                'atividade': S(r.get('B')),
                'controle': S(r.get('C')) or 'Pendente',
                'registro': S(r.get('D')),
                'observacoes': S(r.get('E'))
            })

    checklist_topico = []
    for rn, r in diario_rows:
        if 19 <= rn <= 21:
            ordem_str = S(r.get('A'))
            checklist_topico.append({
                'ordem': int(ordem_str) if ordem_str.isdigit() else 0,
                'etapa': S(r.get('B')),
                'controle': S(r.get('C')) or 'Pendente',
                'registro': S(r.get('D')),
                'orientacao': S(r.get('E'))
            })

    diario_data = {
        'controleSemanal': controle_semanal,
        'checklistTopico': {
            'topicoId': '',
            'etapas': checklist_topico
        },
        'observacaoGeral': 'Sempre que possível, faça questões ou revise por cards no NotebookLM.'
    }

    # 2. LISTA ÚNICA (299 tópicos)
    lista_rows = get_sheet_rows('Lista Única')
    topicos = []
    for rn, r in lista_rows:
        tid = S(r.get('A'))
        if not tid.startswith('TOP-'):
            continue
        vinculos_raw = S(r.get('S'))
        exigencias_vinculadas = [x.strip() for x in vinculos_raw.split(',') if x.strip()] if vinculos_raw else []

        diag = S(r.get('K')) or '☐'
        teoria = S(r.get('L')) or '☐'
        valid = S(r.get('M')) or '☐'
        rev1 = S(r.get('N')) or '☐'
        rev2 = S(r.get('O')) or '☐'

        prog_val = S(r.get('Q'))
        try:
            prog_float = float(prog_val) if prog_val else 0.0
        except ValueError:
            prog_float = 0.0

        qtd_vinc_val = S(r.get('R'))
        qtd_vinc = int(qtd_vinc_val) if qtd_vinc_val.isdigit() else len(exigencias_vinculadas)

        tjsp_dot = S(r.get('G'))
        dpdf_dot = S(r.get('H'))
        sefaz_dot = S(r.get('I'))
        nucleo_dot = S(r.get('J'))

        topico = {
            'id': tid,
            'materia': S(r.get('B')),
            'eixo': S(r.get('C')),
            'subtopico': S(r.get('D')),
            'dispositivos': S(r.get('E')),
            'faseCiclo': S(r.get('F')),
            'tjsp': tjsp_dot,
            'dpdf': dpdf_dot,
            'sefaz': sefaz_dot,
            'nucleoDf': nucleo_dot,
            'incidencia': {
                'tjsp': bool(tjsp_dot),
                'dpdf': bool(dpdf_dot),
                'sefaz': bool(sefaz_dot),
                'nucleo': bool(nucleo_dot)
            },
            'diagnostico': diag,
            'teoria': teoria,
            'validacao': valid,
            'revisao1': rev1,
            'revisao2': rev2,
            'etapas': {
                'diagnostico': diag,
                'teoria': teoria,
                'validacao': valid,
                'revisao1': rev1,
                'revisao2': rev2
            },
            'statusInicial': S(r.get('P')) or 'Pendente',
            'progressoInicial': prog_float,
            'qtdVinculos': qtd_vinc,
            'exigenciasVinculadas': exigencias_vinculadas,
            'exigenciasTexto': vinculos_raw
        }
        topicos.append(topico)

    print(f'Parsed {len(topicos)} tópicos from Lista Única')

    # 3. CICLO CONTÍNUO
    ciclo_rows = get_sheet_rows('Ciclo')
    materias_ativas = []
    fila_blocos = []
    oab_sabados = []
    reserva_sefaz = []

    for rn, r in ciclo_rows:
        colA = S(r.get('A'))
        colB = S(r.get('B'))
        
        # Materias do Ciclo Atual (1 a 17)
        if colA.isdigit() and rn < 24 and colB != 'TOTAL DO CICLO TJSP / DPDF':
            materias_ativas.append({
                'ordem': int(colA),
                'materia': colB,
                'passagens': int(S(r.get('C')) or '1'),
                'minutos': int(S(r.get('D')) or '50'),
                'incidencia': S(r.get('E')),
                'recorte': S(r.get('F')),
                'topicosCount': int(S(r.get('G')) or '0'),
                'ondeRetomar': S(r.get('J'))
            })
        
        # Fila Contínua (Bloco 01 a Bloco 23)
        elif colA.startswith('Bloco '):
            fila_blocos.append({
                'id': colA,
                'bloco': colA,
                'materia': colB,
                'foco': S(r.get('C')),
                'duracao': int(S(r.get('D')) or '50'),
                'concursoAlvo': S(r.get('E')),
                'topicoId': S(r.get('F')),
                'etapa': S(r.get('G')) or 'Diagnóstico',
                'concluido': S(r.get('H')),
                'statusRetomada': S(r.get('I')),
                'observacao': S(r.get('J'))
            })

        # Sábados OAB (Sábado 01 a Sábado 12)
        elif colA.startswith('Sábado '):
            feitas_val = S(r.get('F'))
            acertos_val = S(r.get('G'))
            oab_sabados.append({
                'semana': colA,
                'data': colB,
                'cadernos': S(r.get('C')),
                'sinergia': S(r.get('D')),
                'previstas': int(S(r.get('E')) or '60'),
                'feitas': int(feitas_val) if feitas_val.isdigit() else '',
                'acertos': int(acertos_val) if acertos_val.isdigit() else '',
                'diagnostico': S(r.get('J'))
            })

        # Reserva SEFAZ (1 a 10)
        elif colA.isdigit() and rn >= 68:
            reserva_sefaz.append({
                'ordem': int(colA),
                'materia': colB,
                'faseEntrada': S(r.get('C')),
                'objetivo': S(r.get('D')),
                'topicosCount': int(S(r.get('E')) or '0'),
                'pesoSefaz': S(r.get('H')),
                'condicaoEntrada': S(r.get('I')),
                'estrategia': S(r.get('J'))
            })

    print(f'Parsed Ciclo: materiasAtivas={len(materias_ativas)}, filaBlocos={len(fila_blocos)}, oabSabados={len(oab_sabados)}, reservaSefaz={len(reserva_sefaz)}')

    # Meta de Leitura PDF (30 slots para controle)
    meta_pdf = []
    for i in range(1, 31):
        meta_pdf.append({
            'registro': i,
            'id': i,
            'data': '',
            'materiaPdf': '',
            'topicoId': '',
            'pagInicial': '',
            'pagFinal': '',
            'observacoes': ''
        })

    # 4. PROGRESSO POR MATÉRIA (27 matérias)
    prog_rows = get_sheet_rows('Progresso por Matéria')
    catalogo_materias = []
    for rn, r in prog_rows:
        num_str = S(r.get('A'))
        if not num_str.isdigit(): continue
        tot_str = S(r.get('E'))
        catalogo_materias.append({
            'numero': int(num_str),
            'num': int(num_str),
            'situacaoCiclo': S(r.get('B')),
            'situacao': S(r.get('B')),
            'materia': S(r.get('C')),
            'incidenciaMapeada': S(r.get('D')),
            'incidencia': S(r.get('D')),
            'totalTopicos': int(tot_str) if tot_str.isdigit() else 0,
            'total': int(tot_str) if tot_str.isdigit() else 0
        })

    # 5. EDITAIS
    def parse_edital_rows(sheet_name, is_nucleo=False):
        erows = get_sheet_rows(sheet_name)
        items = []
        for rn, r in erows:
            eid = S(r.get('A'))
            if not eid or rn < 7: continue
            if is_nucleo:
                top_raw = S(r.get('K'))
                top_list = [x.strip() for x in top_raw.split(',') if x.strip()] if top_raw else []
                status_raw = S(r.get('S'))
                is_inf = status_raw == 'Informativo' or eid in ['NUC-L4949-01', 'NUC-L4949-02']
                qtd_t = len(top_list)
                qtd_str = S(r.get('L'))
                if qtd_str.isdigit(): qtd_t = int(qtd_str)
                items.append({
                    'id': eid,
                    'eixo': S(r.get('B')),
                    'bloco': S(r.get('B')),
                    'disciplina': S(r.get('B')),
                    'itemOriginal': S(r.get('C')),
                    'textoReferencia': S(r.get('D')),
                    'textoLiteral': S(r.get('D')),
                    'tituloDidatico': S(r.get('E')),
                    'incidenciaDPDF': S(r.get('F')),
                    'incidenciaSEFAZ': S(r.get('G')),
                    'complementoLegal': S(r.get('H')),
                    'referenciaTCDF': S(r.get('I')),
                    'fonte': S(r.get('J')),
                    'topicos': top_list,
                    'topicosIds': top_list,
                    'qtdTopicos': qtd_t,
                    'informativo': is_inf,
                    'isInformativo': is_inf
                })
            else:
                top_raw = S(r.get('H'))
                top_list = [x.strip() for x in top_raw.split(',') if x.strip()] if top_raw else []
                status_raw = S(r.get('P'))
                is_inf = status_raw == 'Informativo' or eid.endswith('-REG-01') or eid.endswith('-NOTA-01') or eid.endswith('-14H')
                qtd_t = len(top_list)
                qtd_str = S(r.get('I'))
                if qtd_str.isdigit(): qtd_t = int(qtd_str)
                items.append({
                    'id': eid,
                    'bloco': S(r.get('B')),
                    'disciplina': S(r.get('C')),
                    'itemOriginal': S(r.get('D')),
                    'textoLiteral': S(r.get('E')),
                    'tituloDidatico': S(r.get('F')),
                    'fonte': S(r.get('G')),
                    'topicos': top_list,
                    'topicosIds': top_list,
                    'qtdTopicos': qtd_t,
                    'informativo': is_inf,
                    'isInformativo': is_inf
                })
        return items

    editais_data = {
        'tjsp': parse_edital_rows('TJSP — Oficial'),
        'dpdf': parse_edital_rows('DPDF — Analista Direito'),
        'sefaz': parse_edital_rows('SEFAZ-DF — Auditor'),
        'nucleo': parse_edital_rows('Núcleo Distrital', is_nucleo=True)
    }

    # 6. DISCURSIVAS & ETAPAS
    disc_rows = get_sheet_rows('Discursivas e Etapas')
    quadro_comparativo = []
    for rn, r in disc_rows:
        if 7 <= rn <= 14:
            quadro_comparativo.append({
                'dimensao': S(r.get('A')),
                'tjsp': S(r.get('B')),
                'dpdf': S(r.get('C')),
                'sefaz': S(r.get('D')),
                'fonte': S(r.get('E')),
                'eliminacao': S(r.get('F')),
                'observacoes': S(r.get('G'))
            })

    prep_dpdf = {
        'id': 'DPDF-DISC-ATU-01',
        'conteudo': 'Dissertação acerca de tema de atualidade',
        'fonte': 'DPDF, item 11.1, a (registrado em C10). Sem adotar o marco temporal específico do TJSP.',
        'topicoId': 'TOP-299',
        'topicos': ['TOP-299'],
        'topicosIds': ['TOP-299'],
        'qtdTopicos': 1,
        'informativo': False,
        'isInformativo': False
    }

    # 7. METODOLOGIA E FONTES
    metod_rows = get_sheet_rows('Metodologia e Fontes')
    fontes_oficiais = []
    for rn, r in metod_rows:
        if 6 <= rn <= 13:
            fontes_oficiais.append({
                'codigo': S(r.get('A')),
                'documento': S(r.get('B')),
                'cargo': S(r.get('C')),
                'dataVersao': S(r.get('D')),
                'retificacoes': S(r.get('E')),
                'url': S(r.get('F')),
                'dispositivos': S(r.get('G')),
                'efeito': S(r.get('H'))
            })

    etapas_metodologia = []
    for rn, r in metod_rows:
        if 18 <= rn <= 22:
            etapas_metodologia.append({
                'etapa': S(r.get('A')),
                'coluna': S(r.get('B')),
                'valores': S(r.get('C')),
                'significado': S(r.get('D')),
                'criterioConclusao': S(r.get('E')),
                'criterioReforco': S(r.get('F')),
                'impacto': S(r.get('G')),
                'propagacao': S(r.get('H'))
            })

    revisao_escopo = []
    for rn, r in metod_rows:
        if 26 <= rn <= 33:
            revisao_escopo.append({
                'controle': S(r.get('A')),
                'regra': S(r.get('B')),
                'conteudo': S(r.get('C')),
                'dataRevisao': S(r.get('D')),
                'recorteTemporal': S(r.get('E')),
                'fonteConferencia': S(r.get('F')),
                'aplicacao': S(r.get('G')),
                'impacto': S(r.get('H'))
            })

    # 8. MATRIZ DE VÍNCULOS (879 relações)
    vinc_rows = get_sheet_rows('Vínculos')
    vinculos = []
    for rn, r in vinc_rows:
        vid = S(r.get('A'))
        if not vid.startswith('VINC-'): continue
        is_ref = S(r.get('C')) == 'TOP-001'
        prog_v_str = S(r.get('P'))
        try:
            prog_v = float(prog_v_str) if prog_v_str else 0.0
        except ValueError:
            prog_v = 0.0

        vinculos.append({
            'id': vid,
            'exigenciaId': S(r.get('B')),
            'topicoId': S(r.get('C')),
            'concurso': S(r.get('D')),
            'fonte': S(r.get('E')),
            'natureza': S(r.get('F')),
            'tipoRelacao': S(r.get('G')),
            'justificativa': S(r.get('H')),
            'recortes': S(r.get('I')),
            'diagnostico': '—' if is_ref else (S(r.get('J')) or '☐'),
            'teoria': '—' if is_ref else (S(r.get('K')) or '☐'),
            'validacao': '—' if is_ref else (S(r.get('L')) or '☐'),
            'revisao1': '—' if is_ref else (S(r.get('M')) or '☐'),
            'revisao2': '—' if is_ref else (S(r.get('N')) or '☐'),
            'statusTopico': 'Informativo' if is_ref else (S(r.get('O')) or 'Pendente'),
            'progressoTopico': None if is_ref else prog_v
        })

    # 9. AUDITORIA
    audit_rows = get_sheet_rows('Auditoria')
    testes_audit = []
    for rn, r in audit_rows:
        if 6 <= rn <= 14:
            testes_audit.append({
                'codigo': S(r.get('A')),
                'escopo': S(r.get('B')),
                'criterio': S(r.get('C')),
                'formula': S(r.get('D')),
                'descricao': S(r.get('E')),
                'esperado': S(r.get('F')),
                'encontrado': S(r.get('G')),
                'veredito': S(r.get('H')),
                'evidencia': S(r.get('I'))
            })

    correcoes_audit = []
    for rn, r in audit_rows:
        cid = S(r.get('A'))
        if re.match(r'^C\d{2}$', cid):
            correcoes_audit.append({
                'id': cid,
                'achado': cid,
                'escopo': S(r.get('B')),
                'exigencias': S(r.get('C')),
                'topicos': S(r.get('D')),
                'problema': S(r.get('E')),
                'tratamento': S(r.get('F')),
                'resultado': S(r.get('G')),
                'situacao': S(r.get('H')),
                'observacao': S(r.get('I'))
            })

    output_data = {
        'meta': {
            'titulo': 'Painel Estratégico de Estudos • TJSP · DPDF · SEFAZ-DF · Núcleo Distrital',
            'dataGeracao': '2026-11-05',
            'versao': '3.0'
        },
        'diario': diario_data,
        'topicos': topicos,
        'listaUnica': topicos,
        'catalogoMaterias': catalogo_materias,
        'progressoMaterias': catalogo_materias,
        'ciclo': {
            'materiasAtivas': materias_ativas,
            'materias': materias_ativas,
            'filaBlocos': fila_blocos,
            'fila': fila_blocos,
            'oabSabados': oab_sabados,
            'oab': oab_sabados,
            'metaPdfRegistros': meta_pdf,
            'pdfLogs': meta_pdf,
            'reservaSefaz': reserva_sefaz
        },
        'editais': editais_data,
        'discursivas': {
            'quadroComparativo': quadro_comparativo,
            'comparativo': quadro_comparativo,
            'preparacaoDpdf': prep_dpdf,
            'prepDpdf': prep_dpdf
        },
        'metodologiaFontes': {
            'fontesOficiais': fontes_oficiais,
            'etapasMetodologia': etapas_metodologia,
            'revisaoEscopo': revisao_escopo
        },
        'metodologia': {
            'fontes': fontes_oficiais,
            'etapas': etapas_metodologia,
            'revisaoEscopo': revisao_escopo
        },
        'vinculos': vinculos,
        'auditoria': {
            'testes': testes_audit,
            'correcoes': correcoes_audit
        }
    }

    out_file = '/Users/samuelhennig/.gemini/antigravity/scratch/painel-concursos/data.js'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write('const INITIAL_DATA = ' + json.dumps(output_data, ensure_ascii=False) + ';\n')

    print(f'data.js successfully written to {out_file}!')

import React, { useState } from 'react';
import {
  X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  ArrowRight, ArrowLeft, Wand2, Info, ChevronDown, SkipForward
} from 'lucide-react';
import api from '../services/api';

// ─── Campos do sistema a mapear (Padrão para Clientes/PTs) ────────────────────
const DEFAULT_CLIENT_FIELDS = [
  {
    key: 'parceiro_negocios',
    label: 'Parceiro de Negócios',
    keywords: ['parceiro de negócios', 'parceiro de negocios', 'parceiro', 'cliente', 'parceiro neg'],
    required: false,
  },
  {
    key: 'conta_contrato',
    label: 'Conta de Contrato',
    keywords: ['conta de contrato', 'conta contrato', 'conta', 'numero conta', 'nº conta', 'n conta'],
    required: false,
  },
  {
    key: 'municipio',
    label: 'Município / Nome',
    keywords: ['município', 'municipio', 'localidade', 'nome', 'cidade'],
    required: true,
  },
  {
    key: 'proprietario',
    label: 'Proprietário / PT',
    keywords: ['nome proprietário', 'nome proprietario', 'proprietario', 'proprietário', 'subestacao', 'subestação', 'pt', 'nome pt'],
    required: false,
  },
  {
    key: 'instalacao',
    label: 'Instalação',
    keywords: ['instalação', 'instalacao', 'nº instalação', 'nr instalacao', 'num instalacao'],
    required: false,
  },
  {
    key: 'equipamento',
    label: 'Equipamento',
    keywords: ['equipamento', 'codigo', 'código', 'nº equip', 'nr equip', 'equip'],
    required: false,
  },
  {
    key: 'categoria_tarifa',
    label: 'Categoria de Tarifa',
    keywords: ['categoria de tarifa', 'categoria tarifa', 'cat tarifa', 'cod tarifa', 'código tarifa', 'cat. tarifa'],
    required: false,
  },
  {
    key: 'txt_categoria_tarifa',
    label: 'Descrição da Tarifa',
    keywords: ['txt categoria tarifa', 'texto categoria', 'tipo tarifa', 'desc tarifa', 'descrição tarifa', 'txt cat', 'txt. cat'],
    required: false,
  },
  {
    key: 'potencia_kva',
    label: 'Potência (kVA)',
    keywords: ['potência', 'potencia', 'kva', 'unidade kva', 'pot kva', 'pot.', 'potencia kva'],
    required: false,
  },
  {
    key: 'bairro',
    label: 'Bairro / Zona',
    keywords: ['bairro', 'zona', 'bairro zona'],
    required: false,
  },
  {
    key: 'distrito_comuna',
    label: 'Distrito / Comuna',
    keywords: ['distrito', 'comuna', 'distrito comuna'],
    required: false,
  },
  {
    key: 'gps',
    label: 'GPS / Coordenadas',
    keywords: ['gps', 'coordenadas', 'lat/lng', 'latitude', 'longitude', 'lat lng'],
    required: false,
  },
  {
    key: 'concessionaria',
    label: 'Concessionária',
    keywords: ['concessionária', 'concessionaria', 'empresa'],
    required: false,
  },
  {
    key: 'zona',
    label: 'Zona / Área',
    keywords: ['zona', 'área', 'area', 'região', 'regiao'],
    required: false,
  },
  {
    key: 'operador',
    label: 'Operador',
    keywords: ['operador', 'técnico', 'tecnico', 'responsável'],
    required: false,
  },
  {
    key: 'contrato',
    label: 'Número do Contrato',
    keywords: ['contrato', 'nº contrato', 'nr contrato', 'num contrato'],
    required: false,
  },
  {
    key: 'num_serie',
    label: 'Nº de Série',
    keywords: ['nº de série', 'num serie', 'serial number', 'n serie'],
    required: false,
  },
  {
    key: 'divisao',
    label: 'Divisão',
    keywords: ['divisão', 'divisao', 'division'],
    required: false,
  },
  {
    key: 'denominacao_divisao',
    label: 'Denominação Divisão',
    keywords: ['denominação da divisão', 'denominacao divisao', 'denominacao'],
    required: false,
  },
  {
    key: 'unidade_leitura',
    label: 'Unidade de Leitura',
    keywords: ['unidade de leitura', 'unid leitura', 'leitura'],
    required: false,
  },
  {
    key: 'tipo_cliente',
    label: 'Tipo de Cliente',
    keywords: ['tipo de cliente', 'tipo cliente', 'categoria cliente'],
    required: false,
  },
  {
    key: 'montante_divida',
    label: 'Montante Dívida',
    keywords: ['montante divida', 'divida', 'valor divida', 'debito'],
    required: false,
  },
  {
    key: 'num_facturas_atraso',
    label: 'Faturas em Atraso',
    keywords: ['número de facturas não pagas', 'facturas atraso', 'faturas em atraso', 'n faturas'],
    required: false,
  },
  {
    key: 'rua',
    label: 'Rua / Endereço',
    keywords: ['rua', 'endereco', 'endereço', 'rua numero'],
    required: false,
  },
];

const IGNORE_KEY = '__IGNORE__';

// ─── Utilitários ──────────────────────────────────────────────────────────────
function normalize(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[.\s\/\-_]/g, '');     // remove pontuação e espaços
}

/**
 * Score de similaridade: 0 (nenhuma) a 3 (exata)
 */
function matchScore(header, keywords) {
  const nHeader = normalize(header);
  let best = 0;
  for (const kw of keywords) {
    const nKw = normalize(kw);
    if (nHeader === nKw) return 3;           // Exato
    if (nHeader.includes(nKw) || nKw.includes(nHeader)) best = Math.max(best, 2); // Inclusão
    // Levenshtein simplificado — apenas para strings curtas similares
    if (nHeader.length > 2 && nKw.length > 2) {
      const dist = levenshtein(nHeader, nKw);
      const maxLen = Math.max(nHeader.length, nKw.length);
      const sim = 1 - dist / maxLen;
      if (sim >= 0.75) best = Math.max(best, 1);
    }
  }
  return best;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Para um conjunto de cabeçalhos reais, devolve o melhor match por campo do sistema.
 * Retorna: { campo_key: { header: string, score: 0-3 } | null }
 */
function autoDetectMapping(headers, fields) {
  const mapping = {};
  const usedHeaders = new Set();

  for (const field of fields) {
    let bestHeader = null;
    let bestScore = 0;

    for (const h of headers) {
      if (usedHeaders.has(h)) continue;
      const score = matchScore(h, field.keywords);
      if (score > bestScore) {
        bestScore = score;
        bestHeader = h;
      }
    }

    if (bestScore > 0 && bestHeader) {
      mapping[field.key] = { header: bestHeader, score: bestScore };
      usedHeaders.add(bestHeader);
    } else {
      mapping[field.key] = null;
    }
  }
  return mapping;
}

/**
 * Aplica o mapeamento a uma lista de linhas raw do Excel.
 */
function applyMapping(rawRows, columnMap, fields) {
  return rawRows.map(row => {
    const result = {};
    for (const field of fields) {
      const mappedHeader = columnMap[field.key];
      const val = mappedHeader && mappedHeader !== IGNORE_KEY ? row[mappedHeader] : null;
      result[field.key] = val !== undefined ? val : null;
    }

    // Fallbacks genéricos básicos
    if (result.municipio && !result.localizacao) result.localizacao = result.municipio;
    if (result.municipio && !result.nome) result.nome = result.municipio;

    return result;
  });
}

// ─── Labels de score ──────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  if (score === 3) return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle2 className="w-2.5 h-2.5" /> Exato
    </span>
  );
  if (score === 2) return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
      <Wand2 className="w-2.5 h-2.5" /> Auto-detetado
    </span>
  );
  if (score === 1) return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
      <Info className="w-2.5 h-2.5" /> Sugerido
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-[#747686] bg-[#f0f2f5] px-2 py-0.5 rounded-full border border-[#e0e2e8]">
      — Ignorar
    </span>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  fields: propFields,
  apiUrl = '/clientes/bulk',
  title: propTitle
}) {
  const fields = propFields || DEFAULT_CLIENT_FIELDS;

  const [step, setStep] = useState(1);            // 1=upload, 2=mapping, 3=preview
  const [file, setFile] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]); // cabeçalhos reais do Excel
  const [rawRows, setRawRows] = useState([]);       // linhas raw [{header: val, ...}]
  const [autoMatch, setAutoMatch] = useState({});   // { key: { header, score } | null }
  const [columnMap, setColumnMap] = useState({});   // { key: selected_header | IGNORE_KEY }
  const [mappedData, setMappedData] = useState([]); // dados após aplicar mapeamento
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [importResult, setImportResult] = useState(null); // { subestacoes, pts, skipped, errors[] }

  if (!isOpen) return null;

  // ── PASSO 1: Ler ficheiro e extrair cabeçalhos ─────────────────────────────
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bstr = ev.target.result;
        const workbook = window.XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Extrair linhas como objetos (usa a 1ª linha como chave)
        const jsonRows = window.XLSX.utils.sheet_to_json(worksheet, { defval: null });

        if (jsonRows.length === 0) {
          setError('A planilha parece estar vazia ou sem cabeçalho válido.');
          setFile(null);
          return;
        }

        // Cabeçalhos reais = chaves da primeira linha
        const headers = Object.keys(jsonRows[0]);
        setRawHeaders(headers);
        setRawRows(jsonRows);

        // Auto-detetar mapeamento
        const detected = autoDetectMapping(headers, fields);
        setAutoMatch(detected);

        // Inicializar columnMap com o melhor match (ou IGNORE_KEY)
        const initMap = {};
        for (const field of fields) {
          initMap[field.key] = detected[field.key]?.header ?? IGNORE_KEY;
        }
        setColumnMap(initMap);

        setStep(2);
      } catch (err) {
        console.error('Erro ao processar Excel:', err);
        setError('Erro ao processar o ficheiro. Verifique se é um Excel válido (.xlsx / .xls).');
        setFile(null);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // ── PASSO 2: Utilizador confirma/ajusta mapeamento ─────────────────────────
  const handleMappingChange = (fieldKey, selectedHeader) => {
    setColumnMap(prev => ({ ...prev, [fieldKey]: selectedHeader }));
  };

  const handleApplyMapping = () => {
    const data = applyMapping(rawRows, columnMap, fields);
    setMappedData(data);
    setError(null);
    setStep(3);
  };

  // ── PASSO 3: Importar ──────────────────────────────────────────────────────
  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      setImportResult(null);
      const { data } = await api.post(apiUrl, mappedData);
      setImportResult(data); // { subestacoes, pts, skipped, errors[] }
      setSuccess(true);
      // Só dispara o callback se algo foi realmente importado
      if (data.pts > 0 || data.subestacoes > 0) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao importar dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setAutoMatch({});
    setColumnMap({});
    setMappedData([]);
    setError(null);
    setSuccess(false);
    setImportResult(null);
    onClose();
  };

  // ── Contagem de campos mapeados ────────────────────────────────────────────
  const mappedCount = Object.values(columnMap).filter(v => v && v !== IGNORE_KEY).length;
  const requiredMapped = fields
    .filter(f => f.required)
    .every(f => columnMap[f.key] && columnMap[f.key] !== IGNORE_KEY);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1c2c]/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[1rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-[#c4c5d7]/10 flex justify-between items-center bg-[#fcfdff]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#eff4ff] rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#0d3fd1]" />
            </div>
            <div>
              <h3 className="text-[#0f1c2c] text-base font-black uppercase tracking-tight">
                {propTitle || 'Importação em Lote (Excel)'}
              </h3>
              <p className="text-[10px] text-[#747686] font-bold uppercase tracking-wider opacity-60 mt-0.5">
                {step === 1 && 'Selecione o ficheiro Excel'}
                {step === 2 && 'Confirme o mapeamento de colunas'}
                {step === 3 && 'Pré-visualização e confirmação'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${step === s
                      ? 'bg-[#0d3fd1] text-white shadow-lg shadow-[#0d3fd1]/30'
                      : step > s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#eff4ff] text-[#747686]'
                    }`}>
                    {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${step > s ? 'bg-emerald-400' : 'bg-[#e8eaf5]'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <button onClick={handleReset} className="p-2 hover:bg-[#eff4ff] rounded-xl transition-colors text-[#747686]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Conteúdo ────────────────────────────────────────────────── */}
        <div className="flex-grow overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>

          {/* ── PASSO 1: Upload ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="border-4 border-dashed border-[#eff4ff] rounded-[1rem] p-16 flex flex-col items-center justify-center text-center hover:border-[#0d3fd1]/20 group transition-all duration-300">
              <div className="w-24 h-24 bg-[#eff4ff] rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Upload className="w-10 h-10 text-[#0d3fd1]" />
              </div>
              <h4 className="text-[#0f1c2c] font-black uppercase tracking-widest text-sm mb-2">
                Selecione o Ficheiro Excel
              </h4>
              <p className="text-[#747686] text-xs font-bold mb-8 max-w-xs leading-relaxed uppercase opacity-60">
                O sistema irá detetar automaticamente os cabeçalhos e sugerir o mapeamento de colunas
              </p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="bg-[#0d3fd1] text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] hover:bg-[#0034cc] transition-all cursor-pointer shadow-xl shadow-[#0d3fd1]/20 active:scale-95 uppercase"
              >
                Escolher Arquivo
              </label>
            </div>
          )}

          {/* ── PASSO 2: Mapeamento de Colunas ───────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Ficheiro info */}
              <div className="flex items-center justify-between bg-[#eff4ff] p-4 rounded-2xl border border-[#0d3fd1]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="w-5 h-5 text-[#0d3fd1]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#0f1c2c] uppercase">{file?.name}</p>
                    <p className="text-[9px] font-bold text-[#747686] uppercase opacity-60">
                      {rawRows.length} linhas · {rawHeaders.length} colunas detetadas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-wider">{mappedCount}/{fields.length}</p>
                  <p className="text-[8px] font-bold text-[#747686] uppercase opacity-60">campos mapeados</p>
                </div>
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[9px] font-black text-[#747686] uppercase tracking-widest">Confiança:</p>
                <ScoreBadge score={3} />
                <ScoreBadge score={2} />
                <ScoreBadge score={1} />
                <ScoreBadge score={0} />
              </div>

              {/* Grid de mapeamento */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((field) => {
                  const detected = autoMatch[field.key];
                  const selected = columnMap[field.key];
                  const score = detected?.header === selected ? detected.score : (selected && selected !== IGNORE_KEY ? 2 : 0);

                  return (
                    <div
                      key={field.key}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${selected && selected !== IGNORE_KEY
                          ? 'bg-white border-[#0d3fd1]/15 shadow-sm'
                          : 'bg-[#f8f9fc] border-[#e8eaf0] opacity-70'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-black text-[#0f1c2c] uppercase tracking-wide">
                            {field.label}
                          </p>
                          {field.required && (
                            <span className="text-[7px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100 uppercase">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        <ScoreBadge score={selected && selected !== IGNORE_KEY ? (detected?.header === selected ? detected.score : 2) : 0} />
                      </div>

                      {/* Select */}
                      <div className="relative">
                        <select
                          value={selected || IGNORE_KEY}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full appearance-none bg-[#f0f4ff] border border-[#0d3fd1]/10 text-[#0f1c2c] text-[10px] font-bold rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#0d3fd1]/20 cursor-pointer transition-all uppercase"
                        >
                          <option value={IGNORE_KEY}>— Ignorar esta coluna —</option>
                          {rawHeaders.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#747686] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Aviso se obrigatórios não mapeados */}
              {!requiredMapped && (
                <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Campos obrigatórios em falta: <strong>{fields.filter(f => f.required && (!columnMap[f.key] || columnMap[f.key] === IGNORE_KEY)).map(f => f.label).join(', ')}</strong>. Selecione as colunas correspondentes.
                </div>
              )}
            </div>
          )}

          {/* ── PASSO 3: Pré-visualização ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Resumo do mapeamento aplicado */}
              <div className="bg-[#f8faff] border border-[#0d3fd1]/10 rounded-2xl p-4">
                <p className="text-[9px] font-black text-[#0d3fd1] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5" /> Mapeamento Aplicado
                </p>
                <div className="flex flex-wrap gap-2">
                  {fields.map((field) => {
                    const h = columnMap[field.key];
                    if (!h || h === IGNORE_KEY) return null;
                    return (
                      <div key={field.key} className="flex items-center gap-1.5 bg-white border border-[#0d3fd1]/10 rounded-xl px-3 py-1.5 text-[9px] font-black">
                        <span className="text-[#747686] uppercase">{field.label}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-[#0d3fd1]" />
                        <span className="text-[#0f1c2c] uppercase">{h}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabela de pré-visualização */}
              <div className="border border-[#c4c5d7]/20 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="bg-[#243141] px-4 py-2.5 text-[9px] font-black text-white uppercase tracking-widest flex items-center justify-between">
                  <span>Pré-visualização dos Dados</span>
                  <span className="opacity-50">{mappedData.length} registos</span>
                </div>
                <div className="overflow-x-auto max-h-[330px]" style={{ scrollbarWidth: 'thin' }}>
                  <table className="w-full text-left text-[10px] border-collapse min-w-[900px]">
                    <thead className="bg-[#fcfdff] sticky top-0 z-10">
                      <tr className="border-b border-[#c4c5d7]/10">
                        {fields.filter(f => columnMap[f.key] && columnMap[f.key] !== IGNORE_KEY).map(f => (
                          <th key={f.key} className="px-4 py-3 font-black text-[#747686] uppercase">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c4c5d7]/10 font-bold text-[#0f1c2c]">
                      {mappedData.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-[#f8faff] transition-colors">
                          {fields.filter(f => columnMap[f.key] && columnMap[f.key] !== IGNORE_KEY).map(f => (
                            <td key={f.key} className="px-4 py-2.5 text-[9px] truncate max-w-[150px]">
                              {row[f.key]?.toString() || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mappedData.length > 50 && (
                  <div className="p-3 text-center bg-[#fcfdff] border-t border-[#c4c5d7]/10 text-[9px] font-bold text-[#747686] uppercase tracking-[0.2em]">
                    ...e mais {mappedData.length - 50} registos
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Erros e Sucesso ──────────────────────────────────────── */}
          {error && (
            <div className="mt-5 flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && importResult && (
            <div className="mt-5 space-y-3">
              {/* Banner principal */}
              <div className={`flex items-start gap-3 p-4 rounded-2xl border text-[10px] font-bold uppercase tracking-wider ${importResult.pts > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p>Importação concluída</p>
                  <p className="opacity-70 normal-case font-medium">
                    {importResult.pts > 0 || importResult.updated > 0
                      ? `${importResult.pts} novos e ${importResult.updated} atualizados.`
                      : 'Nenhum registo novo processado.'}
                  </p>
                </div>
              </div>

              {/* Chips de resumo */}
              <div className="flex flex-wrap gap-2">
                {importResult.pts > 0 && (
                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    {importResult.pts} novos PTs
                  </div>
                )}
                {importResult.updated > 0 && (
                  <div className="flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    {importResult.updated} atualizados
                  </div>
                )}
                {importResult.skipped > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <SkipForward className="w-3 h-3" />
                    {importResult.skipped} ignorados
                  </div>
                )}
                {importResult.errors?.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <AlertCircle className="w-3 h-3" />
                    {importResult.errors.length} erro{importResult.errors.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Lista de erros (se existirem) */}
              {importResult.errors?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <p className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-2">Detalhes dos erros:</p>
                  {importResult.errors.map((msg, i) => (
                    <p key={i} className="text-[9px] font-medium text-red-600 py-0.5">{msg}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer / Navegação ──────────────────────────────────────── */}
        <div className="p-6 border-t border-[#c4c5d7]/10 flex justify-between items-center bg-[#fcfdff]">
          {/* Botão Voltar — escondido após importação bem-sucedida */}
          {!success && (
            <button
              onClick={() => step > 1 ? setStep(step - 1) : handleReset()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#747686] hover:bg-[#eff4ff] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </button>
          )}

          {/* Botão Avançar / Confirmar */}
          {step === 1 && (
            <p className="text-[9px] text-[#747686] font-bold uppercase opacity-50">
              Selecione um ficheiro para continuar
            </p>
          )}

          {step === 2 && (
            <button
              disabled={!requiredMapped}
              onClick={handleApplyMapping}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-lg ${requiredMapped
                  ? 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20 active:scale-95'
                  : 'bg-[#c4c5d7] text-white cursor-not-allowed'
                }`}
            >
              Aplicar Mapeamento
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && !success && (
            <button
              disabled={loading}
              onClick={handleImport}
              className={`flex items-center gap-3 px-10 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-lg ${loading
                  ? 'bg-[#c4c5d7] cursor-not-allowed text-white'
                  : 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20 active:scale-95'
                }`}
            >
              {loading
                ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> A importar...</>
                : <><CheckCircle2 className="w-4 h-4" /> Confirmar Importação ({mappedData.length} registos)</>
              }
            </button>
          )}

          {step === 3 && success && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase bg-[#0d3fd1] text-white hover:bg-[#0034cc] transition-all shadow-lg shadow-[#0d3fd1]/20 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
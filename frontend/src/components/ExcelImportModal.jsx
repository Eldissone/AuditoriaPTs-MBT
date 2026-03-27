import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target.result;
        const workbook = window.XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = window.XLSX.utils.sheet_to_json(worksheet);
        
        // Mapeamento de campos (Case insensitive e flexível)
        const mappedData = json.map(row => {
          // Normalizar chaves para facilitar a busca (remove pontos e espaços)
          const normalizedRow = {};
          Object.keys(row).forEach(k => {
            const normalizedKey = k.toLowerCase().replace(/[.\s]/g, '');
            normalizedRow[normalizedKey] = row[k];
          });

          const findVal = (keywords) => {
            const normalizedKeywords = keywords.map(kw => kw.toLowerCase().replace(/[.\s]/g, ''));
            
            // 1. Tentar correspondência exata primeiro
            let foundKey = Object.keys(normalizedRow).find(k => 
              normalizedKeywords.some(kw => k === kw)
            );

            // 2. Se não achou, tentar por inclusão
            if (!foundKey) {
              foundKey = Object.keys(normalizedRow).find(k => 
                normalizedKeywords.some(kw => k.includes(kw))
              );
            }
            
            return foundKey ? normalizedRow[foundKey] : null;
          };

          return {
            parceiro_negocios: findVal(['Parceiro de negócios', 'Parceiro Negocios', 'Parceiro']),
            conta_contrato: findVal(['Conta de contrato', 'Conta Contrato', 'Conta']),
            nome: findVal(['Nome Proprietário', 'Nome Proprietario', 'Subestação', 'Subestacao', 'Nome']),
            instalacao: findVal(['Instalação', 'Instalacao']),
            equipamento: findVal(['Equipamento']),
            categoria_tarifa: findVal(['Categoria de tarifa', 'Categoria Tarifa', 'Cat Tarifa', 'Cod Tarifa']),
            txt_categoria_tarifa: findVal(['Txt categoria tarifa', 'Texto Categoria', 'Tipo Tarifa', 'Desc Tarifa', 'Descrição Tarifa', 'Desc. Tarifa', 'Txt Categoria', 'Txt. Cat.']),
            potencia_total_kva: parseFloat(findVal(['potência', 'potencia', 'kva', 'total kva'])) || 0,
            municipio: findVal(['Município', 'Municipio']),
            distrito_comuna: findVal(['Distrito', 'Comuna']),
            bairro: findVal(['Bairro']),
            localizacao: findVal(['Localização', 'Localizacao']) || findVal(['Município']) || 'N/A'
          };
        });

        setData(mappedData);
        setError(null);
      } catch (err) {
        console.error('Erro ao processar Excel:', err);
        setError('Erro ao processar o arquivo. Verifique se é um ficheiro Excel válido.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/subestacoes/bulk', data);
      setSuccess(true);
      setTimeout(() => {
        onImportSuccess();
        onClose();
        setSuccess(false);
        setData([]);
        setFile(null);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao importar dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1c2c]/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="p-8 border-b border-[#c4c5d7]/10 flex justify-between items-center bg-[#fcfdff]">
          <div>
            <h3 className="text-[#0f1c2c] text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-[#0d3fd1]" />
              Importação em Lote (Excel)
            </h3>
            <p className="text-xs text-[#747686] font-medium uppercase tracking-wider opacity-60 mt-1">Carregue a planilha com os ativos industriais</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#eff4ff] rounded-xl transition-colors text-[#747686]">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {!file ? (
            <div className="border-4 border-dashed border-[#eff4ff] rounded-[2rem] p-12 flex flex-col items-center justify-center text-center transition-all hover:border-[#0d3fd1]/20 group">
              <div className="w-20 h-20 bg-[#eff4ff] rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Upload className="w-10 h-10 text-[#0d3fd1]" />
              </div>
              <h4 className="text-[#0f1c2c] font-black uppercase tracking-widest text-sm mb-2">Selecione o Ficheiro</h4>
              <p className="text-[#747686] text-xs font-bold mb-8 max-w-xs leading-relaxed uppercase opacity-60">Arraste ou clique para selecionar a planilha Excel (.xlsx ou .xls)</p>
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
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between bg-[#eff4ff] p-4 rounded-2xl border border-[#0d3fd1]/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="w-6 h-6 text-[#0d3fd1]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#0f1c2c] uppercase">{file.name}</p>
                    <p className="text-[10px] font-bold text-[#747686] uppercase opacity-60">{(file.size / 1024).toFixed(1)} KB • {data.length} registos detetados</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setData([]); }}
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                >
                  Substituir
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-[#c4c5d7]/20 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="bg-[#243141] px-4 py-2 text-[9px] font-black text-white uppercase tracking-widest">Pré-visualização dos Dados</div>
                <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
                  <table className="w-full text-left text-[10px] border-collapse min-w-[1000px]">
                    <thead className="bg-[#fcfdff] sticky top-0 z-10">
                      <tr className="border-b border-[#c4c5d7]/10">
                        <th className="px-4 py-3 font-black text-[#747686] uppercase">Contrato</th>
                        <th className="px-4 py-3 font-black text-[#747686] uppercase">Nome / Subestação</th>
                        <th className="px-4 py-3 font-black text-[#747686] uppercase">Equipamento</th>
                        <th className="px-4 py-3 font-black text-[#747686] uppercase">Potência</th>
                        <th className="px-4 py-3 font-black text-[#747686] uppercase text-center">Cat. Tarifa</th>
                        <th className="px-4 py-3 font-black text-[#747686] uppercase">Txt. Cat. Tarifa</th>
                        <th className="px-4 py-3 font-black text-[#747686] uppercase">Município</th>
                        <th className="px-4 py-3 font-black text-[#747686] uppercase">Bairro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c4c5d7]/10 font-bold text-[#0f1c2c]">
                      {data.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-[#f8faff]">
                          <td className="px-4 py-3 text-[#0d3fd1] font-mono">{row.conta_contrato || '---'}</td>
                          <td className="px-4 py-3 uppercase">{row.nome || '---'}</td>
                          <td className="px-4 py-3 text-[#444655]">{row.equipamento || '---'}</td>
                          <td className="px-4 py-3 font-black text-center">{row.potencia_total_kva} <span className="text-[8px] opacity-40 uppercase">kVA</span></td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-[#eff4ff] text-[#0d3fd1] px-2 py-1 rounded text-[9px] font-black uppercase">{row.categoria_tarifa || '---'}</span>
                          </td>
                          <td className="px-4 py-3 text-[9px] font-bold text-[#747686] uppercase">
                            {row.txt_categoria_tarifa || '---'}
                          </td>
                          <td className="px-4 py-3">{row.municipio || '---'}</td>
                          <td className="px-4 py-3">{row.bairro || '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.length > 50 && (
                  <div className="p-3 text-center bg-[#fcfdff] border-t border-[#c4c5d7]/10 text-[9px] font-bold text-[#747686] uppercase tracking-[0.2em]">
                    ...e mais {data.length - 50} registos
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-[10px] font-bold uppercase tracking-wider animate-in shake duration-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 flex items-center gap-3 bg-green-50 text-green-600 p-4 rounded-2xl border border-green-100 text-[10px] font-bold uppercase tracking-wider animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Importação concluída com sucesso! Sincronizando inventário...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-[#c4c5d7]/10 flex justify-end gap-4 bg-[#fcfdff]">
          <button 
            onClick={onClose}
            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#747686] hover:bg-[#eff4ff] transition-all"
          >
            Cancelar
          </button>
          <button 
            disabled={!file || data.length === 0 || loading || success}
            onClick={handleImport}
            className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase shadow-xl ${
              !file || data.length === 0 || loading || success
                ? 'bg-[#c4c5d7] cursor-not-allowed text-white' 
                : 'bg-[#0d3fd1] text-white hover:bg-[#0034cc] shadow-[#0d3fd1]/20 active:scale-95'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : <CheckCircle2 className="w-4 h-4" />}
            Confirmar Importação
          </button>
        </div>
      </div>
    </div>
  );
}

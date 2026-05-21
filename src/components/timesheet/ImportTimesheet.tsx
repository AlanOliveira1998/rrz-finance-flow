import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { useHourBankContracts } from '@/hooks/useHourBankContracts';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ParsedRow {
  clientName: string;
  projectName: string;
  taskTitle: string;
  userName: string;
  description: string;
  endDate: string;
  durationMinutes: number;
}

const parseMinutes = (val: unknown): number => {
  if (typeof val === 'string') {
    const parts = val.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (typeof val === 'number') {
    return Math.round(val * 24 * 60);
  }
  return 0;
};

const parseDate = (val: unknown): string => {
  if (!val) return '';
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [d, m, y] = s.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
  }
  return s;
};

const findCol = (headers: unknown[], ...names: string[]): number =>
  headers.findIndex(h =>
    names.some(n => String(h ?? '').toLowerCase().includes(n.toLowerCase()))
  );

const parseExcel = (file: File): Promise<ParsedRow[]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' });

        const headerIdx = rows.findIndex(r =>
          (r as unknown[]).some(c => String(c ?? '').toLowerCase() === 'cliente')
        );
        if (headerIdx === -1) {
          reject(new Error('Cabeçalho não encontrado. Verifique se o arquivo é um relatório do Operand.'));
          return;
        }

        const headers = rows[headerIdx] as unknown[];
        const iCliente = findCol(headers, 'cliente');
        const iProjeto = findCol(headers, 'projeto');
        const iTitulo = findCol(headers, 'título', 'titulo', 'title');
        const iUsuario = findCol(headers, 'usuário', 'usuario', 'user');
        const iDescricao = findCol(headers, 'descrição', 'descricao', 'description', 'timesheet');
        const iData = findCol(headers, 'data fim', 'data');
        const iTempo = findCol(headers, 'tempo', 'time', 'duration');

        const result: ParsedRow[] = [];
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i] as unknown[];
          const clientName = String(row[iCliente] ?? '').trim();
          if (!clientName || clientName === '') continue;

          const tempo = iTempo >= 0 ? row[iTempo] : 0;
          const minutes = parseMinutes(tempo);
          if (minutes === 0) continue;

          const rawDate = iData >= 0 ? row[iData] : '';
          const endDate = parseDate(rawDate);
          if (!endDate) continue;

          result.push({
            clientName,
            projectName: String(row[iProjeto] ?? '').trim(),
            taskTitle: iTitulo >= 0 ? String(row[iTitulo] ?? '').trim() : '',
            userName: iUsuario >= 0 ? String(row[iUsuario] ?? '').trim() : '',
            description: iDescricao >= 0 ? String(row[iDescricao] ?? '').trim() : '',
            endDate,
            durationMinutes: minutes,
          });
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });

export const ImportTimesheet: React.FC = () => {
  const { contracts } = useHourBankContracts();
  const { clients } = useClients();
  const { toast } = useToast();

  const [contractId, setContractId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const selectedContract = contracts.find(c => c.id === contractId);

  const handleFile = async (f: File) => {
    setFile(f);
    setRows(null);
    setDone(false);
    setParsing(true);
    try {
      const parsed = await parseExcel(f);
      setRows(parsed);
    } catch (err: unknown) {
      toast({ title: 'Erro ao processar arquivo', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!contractId || !rows || rows.length === 0) return;
    setImporting(true);
    try {
      const periodDates = rows.map(r => r.endDate).sort();
      const { data: batchData, error: batchError } = await supabase
        .from('timesheet_imports')
        .insert([{
          contract_id: contractId,
          filename: file!.name,
          entries_count: rows.length,
          period_start: periodDates[0],
          period_end: periodDates[periodDates.length - 1],
        }])
        .select();
      if (batchError) throw batchError;

      const batchId = batchData![0].id as string;
      const entries = rows.map(r => ({
        contract_id: contractId,
        import_batch_id: batchId,
        client_name: r.clientName,
        project_name: r.projectName,
        task_title: r.taskTitle,
        user_name: r.userName,
        description: r.description,
        end_date: r.endDate,
        duration_minutes: r.durationMinutes,
      }));

      const { error: entriesError } = await supabase.from('timesheet_entries').insert(entries);
      if (entriesError) throw entriesError;

      setDone(true);
      toast({ title: `${rows.length} registros importados com sucesso!` });
      setFile(null);
      setRows(null);
    } catch (err: unknown) {
      toast({ title: 'Erro na importação', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const totalHours = rows ? rows.reduce((s, r) => s + r.durationMinutes, 0) / 60 : 0;
  const periodStart = rows?.length ? rows.map(r => r.endDate).sort()[0] : null;
  const periodEnd = rows?.length ? rows.map(r => r.endDate).sort().at(-1) : null;

  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Importar Horas</h2>
        <p className="text-gray-500 text-sm mt-0.5">Upload do relatório de timesheet exportado do Operand</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Step 1: Select contract */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            1. Selecione o contrato
          </label>
          <select
            className="w-full border rounded px-3 py-2 text-sm bg-white"
            value={contractId}
            onChange={e => { setContractId(e.target.value); setRows(null); setDone(false); }}
          >
            <option value="">Selecione um contrato</option>
            {contracts.map(c => {
              const client = clients.find(cl => cl.id === c.clientId);
              return (
                <option key={c.id} value={c.id}>
                  {client?.razaoSocial || client?.nomeFantasia || '—'} — {c.projectName}
                </option>
              );
            })}
          </select>
          {selectedContract && (
            <p className="text-xs text-gray-400 mt-1">
              {selectedContract.monthlyHours}h/mês · R${selectedContract.hourlyRate.toLocaleString('pt-BR')}/h excedente
            </p>
          )}
        </div>

        {/* Step 2: Upload file */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            2. Faça upload do arquivo Excel (.xlsx)
          </label>
          <label className={`flex items-center justify-center gap-3 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
          }`}>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Upload size={20} className={file ? 'text-green-500' : 'text-gray-400'} />
            <span className="text-sm text-gray-600">
              {file ? file.name : 'Clique ou arraste o arquivo aqui'}
            </span>
          </label>
        </div>

        {/* Parsing */}
        {parsing && (
          <div className="text-sm text-gray-500 text-center py-4">Processando arquivo...</div>
        )}

        {/* Preview */}
        {rows !== null && !parsing && (
          <div className="space-y-3">
            {rows.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                <AlertTriangle size={16} />
                Nenhum registro encontrado. Verifique se o arquivo é um relatório do Operand.
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-4 space-y-1">
                  <p className="text-sm font-semibold text-blue-800">
                    {rows.length} registros encontrados
                  </p>
                  <p className="text-xs text-blue-600">
                    {totalHours.toFixed(1)}h totais ·{' '}
                    {periodStart && periodEnd ? `${fmtDate(periodStart)} – ${fmtDate(periodEnd)}` : ''}
                  </p>
                </div>

                {/* Preview table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Data</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Usuário</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Título</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Tempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-600">
                            {new Date(r.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{r.userName}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{r.taskTitle}</td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {Math.floor(r.durationMinutes / 60)}:{String(r.durationMinutes % 60).padStart(2, '0')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 5 && (
                    <div className="px-3 py-2 text-xs text-gray-400 border-t bg-gray-50">
                      ... e mais {rows.length - 5} registros
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Done */}
        {done && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle2 size={16} />
            Importação concluída com sucesso!
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setFile(null); setRows(null); setDone(false); }}
          >
            Limpar
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!contractId || !rows || rows.length === 0 || importing}
            onClick={handleImport}
          >
            {importing ? 'Importando...' : `Importar ${rows?.length ?? 0} registros`}
          </Button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface KanbanTask {
  id: string;
  text: string;
  status: string;
  user_id?: string;
  created_at?: string;
}

interface KanbanState {
  todo: KanbanTask[];
  doing: KanbanTask[];
  done: KanbanTask[];
  lembretes: KanbanTask[];
  reunioes: KanbanTask[];
}

const COLUMNS = [
  { key: 'todo', label: 'A Fazer', color: 'bg-red-50' },
  { key: 'doing', label: 'Em Andamento', color: 'bg-yellow-50' },
  { key: 'done', label: 'Realizado', color: 'bg-green-50' },
  { key: 'lembretes', label: 'Lembretes', color: 'bg-blue-50' },
  { key: 'reunioes', label: 'Reuniões', color: 'bg-purple-50' },
]

const KanbanAtividades: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [kanban, setKanban] = useState<KanbanState>({
    todo: [], doing: [], done: [], lembretes: [], reunioes: [],
  });
  const [loading, setLoading] = useState(false);
  const [newTasks, setNewTasks] = useState<Record<string, string>>({
    todo: '', doing: '', done: '', lembretes: '', reunioes: '',
  });
  const [editingTask, setEditingTask] = useState<{ col: string | null; idx: number | null }>({ col: null, idx: null });
  const [editingText, setEditingText] = useState('');
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; col: string | null; idx: number | null }>({ open: false, col: null, idx: null });

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from('kanban_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setKanban({
            todo: data.filter(t => t.status === 'todo'),
            doing: data.filter(t => t.status === 'doing'),
            done: data.filter(t => t.status === 'done'),
            lembretes: data.filter(t => t.status === 'lembretes'),
            reunioes: data.filter(t => t.status === 'reunioes'),
          });
        }
        setLoading(false);
      });
  }, [user?.id]);

  const handleAddTask = async (colKey: string) => {
    const text = newTasks[colKey]?.trim();
    if (!text || !user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('kanban_tasks')
      .insert([{ user_id: user.id, text, status: colKey }])
      .select();
    if (!error && data && data[0]) {
      setKanban(prev => ({ ...prev, [colKey]: [...prev[colKey as keyof KanbanState], data[0]] }));
      setNewTasks(prev => ({ ...prev, [colKey]: '' }));
      toast({ title: 'Tarefa criada', description: `Tarefa adicionada em "${COLUMNS.find(c => c.key === colKey)?.label}".` });
    }
    setLoading(false);
  };

  const moveTask = async (fromCol: string, fromIdx: number, toCol: string) => {
    const item = kanban[fromCol as keyof KanbanState][fromIdx];
    if (!item) return;
    setLoading(true);
    const { error } = await supabase.from('kanban_tasks').update({ status: toCol }).eq('id', item.id);
    if (!error) {
      setKanban(prev => {
        const newFrom = [...prev[fromCol as keyof KanbanState]];
        newFrom.splice(fromIdx, 1);
        const newTo = [...prev[toCol as keyof KanbanState], { ...item, status: toCol }];
        return { ...prev, [fromCol]: newFrom, [toCol]: newTo };
      });
      toast({ title: 'Tarefa movida', description: `Tarefa movida para "${COLUMNS.find(c => c.key === toCol)?.label}".` });
    }
    setLoading(false);
  };

  const removeTask = async (col: string, idx: number) => {
    const item = kanban[col as keyof KanbanState][idx];
    if (!item) return;
    setLoading(true);
    const { error } = await supabase.from('kanban_tasks').delete().eq('id', item.id);
    if (!error) {
      setKanban(prev => {
        const newCol = [...prev[col as keyof KanbanState]];
        newCol.splice(idx, 1);
        return { ...prev, [col]: newCol };
      });
      toast({ title: 'Tarefa removida', description: 'A tarefa foi removida com sucesso.' });
    }
    setLoading(false);
  };

  const handleEditSave = async (col: string, idx: number) => {
    const item = kanban[col as keyof KanbanState][idx];
    if (!item || !editingText.trim()) {
      setEditingTask({ col: null, idx: null });
      setEditingText('');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('kanban_tasks').update({ text: editingText.trim() }).eq('id', item.id);
    if (!error) {
      setKanban(prev => {
        const newCol = [...prev[col as keyof KanbanState]];
        newCol[idx] = { ...newCol[idx], text: editingText.trim() };
        return { ...prev, [col]: newCol };
      });
      toast({ title: 'Tarefa editada', description: 'O texto da tarefa foi atualizado.' });
    }
    setEditingTask({ col: null, idx: null });
    setEditingText('');
    setLoading(false);
  };

  const handleDragStart = (col: string, idx: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('col', col);
    e.dataTransfer.setData('idx', String(idx));
  };

  const handleDrop = (targetCol: string) => (e: React.DragEvent) => {
    const fromCol = e.dataTransfer.getData('col');
    const fromIdx = parseInt(e.dataTransfer.getData('idx'), 10);
    if (fromCol && fromCol !== targetCol) moveTask(fromCol, fromIdx, targetCol);
  };

  return (
    <div className="flex gap-6 h-[70vh]">
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          className={`flex-1 rounded-lg shadow p-4 flex flex-col ${col.color}`}
          onDrop={handleDrop(col.key)}
          onDragOver={e => e.preventDefault()}
        >
          <h3 className="font-bold text-lg mb-4 text-gray-700">{col.label}</h3>
          <div className="mb-4 flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              placeholder={`Adicionar em ${col.label}...`}
              value={newTasks[col.key] || ''}
              onChange={e => setNewTasks(prev => ({ ...prev, [col.key]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddTask(col.key)}
              disabled={loading}
            />
            <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleAddTask(col.key)} disabled={loading}>
              Adicionar
            </button>
          </div>
          <div className="flex-1 space-y-2 min-h-[40px]">
            {kanban[col.key as keyof KanbanState]?.map((card, idx) => (
              <div
                key={card.id}
                className="bg-gray-100 rounded p-3 shadow cursor-move group flex items-center"
                draggable
                onDragStart={handleDragStart(col.key, idx)}
              >
                {editingTask.col === col.key && editingTask.idx === idx ? (
                  <input
                    className="flex-1 border rounded px-2 py-1 mr-2"
                    value={editingText}
                    autoFocus
                    onChange={e => setEditingText(e.target.value)}
                    onBlur={() => handleEditSave(col.key, idx)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSave(col.key, idx);
                      if (e.key === 'Escape') { setEditingTask({ col: null, idx: null }); setEditingText(''); }
                    }}
                    disabled={loading}
                  />
                ) : (
                  <span className="flex-1 cursor-pointer" onClick={() => { setEditingTask({ col: col.key, idx }); setEditingText(card.text); }}>
                    {card.text}
                  </span>
                )}
                <button
                  className="ml-2 text-xs text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition"
                  onClick={() => setRemoveDialog({ open: true, col: col.key, idx })}
                  disabled={loading}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          {loading && <div className="text-center text-blue-400 mt-2 animate-pulse">Sincronizando...</div>}
        </div>
      ))}

      <AlertDialog open={removeDialog.open} onOpenChange={open => !open && setRemoveDialog({ open: false, col: null, idx: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tarefa</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover esta tarefa? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveDialog({ open: false, col: null, idx: null })}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (removeDialog.col !== null && removeDialog.idx !== null) {
                await removeTask(removeDialog.col, removeDialog.idx);
              }
              setRemoveDialog({ open: false, col: null, idx: null });
            }}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KanbanAtividades;

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  type: 'Diário' | 'Semanal' | 'Mensal';
}

const Checklist: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [input, setInput] = useState('');
  const [type, setType] = useState<'Diário' | 'Semanal' | 'Mensal'>('Diário');
  const [loading, setLoading] = useState(false);
  // Novo: estado para edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  // Novo: controle de exibição de concluídos por tipo
  const [showCompleted, setShowCompleted] = useState<{ [key: string]: boolean }>({
    'Diário': false,
    'Semanal': false,
    'Mensal': false,
  });
  // Novo: estado para drag and drop
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Buscar rotinas do Supabase ao carregar
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from('checklists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setItems(data.map((item: any) => ({
            id: item.id,
            text: item.text,
            done: item.done,
            type: item.type,
          })));
        }
        setLoading(false);
      });
  }, [user?.id]);

  // Adicionar rotina
  const addItem = async () => {
    if (!input.trim() || !user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('checklists')
      .insert([{ user_id: user.id, text: input.trim(), done: false, type }])
      .select();
    if (!error && data && data[0]) {
      setItems(prev => [...prev, {
        id: data[0].id,
        text: data[0].text,
        done: data[0].done,
        type: data[0].type,
      }]);
      setInput('');
    }
    setLoading(false);
  };

  // Marcar como feito/não feito
  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setLoading(true);
    const { error } = await supabase
      .from('checklists')
      .update({ done: !item.done })
      .eq('id', id);
    if (!error) {
      setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
    }
    setLoading(false);
  };

  // Remover rotina com opção de desfazer
  const removeItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setLoading(true);
    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id);
    if (!error) {
      setItems(items.filter(i => i.id !== id));
      // Toast de desfazer
      toast({
        title: 'Item removido',
        description: 'Clique em desfazer para restaurar.',
        action: (
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded ml-2"
            onClick={async () => {
              setLoading(true);
              const { error: restoreError } = await supabase
                .from('checklists')
                .insert([{ ...item }]);
              if (!restoreError) {
                setItems(prev => [...prev, item]);
              }
              setLoading(false);
            }}
          >Desfazer</button>
        ),
      });
    }
    setLoading(false);
  };

  // Salvar edição inline
  const saveEdit = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || !editingText.trim()) {
      setEditingId(null);
      setEditingText('');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('checklists')
      .update({ text: editingText.trim() })
      .eq('id', id);
    if (!error) {
      setItems(items.map(i => i.id === id ? { ...i, text: editingText.trim() } : i));
    }
    setEditingId(null);
    setEditingText('');
    setLoading(false);
  };

  // Função para reordenar localmente e no Supabase
  const moveItem = async (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIdx = items.findIndex(i => i.id === fromId);
    const toIdx = items.findIndex(i => i.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...items];
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    setItems(reordered);
    // Atualizar ordem no Supabase (opcional: pode ser só local se não quiser persistir)
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].id !== items[i]?.id) {
        await supabase.from('checklists').update({ created_at: new Date(Date.now() + i) }).eq('id', reordered[i].id);
      }
    }
  };

  // Função de filtro: sempre mostra todos se showCompleted[t] for true, senão só pendentes
  const filtered = (t: 'Diário' | 'Semanal' | 'Mensal') =>
    showCompleted[t] ? items.filter(item => item.type === t) : items.filter(item => item.type === t && !item.done);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)] w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-0 md:p-8">
      <div className="sticky top-0 z-10 bg-white rounded-t-lg border-b px-4 py-4 md:px-0 md:py-6 flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4">
          <input
            className="border rounded px-3 py-2 flex-1 text-base focus:ring-2 focus:ring-blue-200"
            placeholder="Nova rotina..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            disabled={loading}
          />
          <select
            className="border rounded px-3 py-2 text-base"
            value={type}
            onChange={e => setType(e.target.value as any)}
            disabled={loading}
          >
            <option value="Diário">Diário</option>
            <option value="Semanal">Semanal</option>
            <option value="Mensal">Mensal</option>
          </select>
        </div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
          onClick={addItem}
          disabled={loading}
        >Adicionar</button>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-2 md:p-4 mt-2 md:mt-4 min-h-[400px]">
        {(['Diário', 'Semanal', 'Mensal'] as const).map(t => (
          <div key={t} className="bg-gray-50 rounded-lg shadow-sm p-4 flex flex-col min-h-[350px] h-full">
            <h3 className="font-semibold text-lg mb-3 text-blue-700 border-b pb-2 flex items-center gap-2">
              {t === 'Diário' && <span className="text-blue-400">📅</span>}
              {t === 'Semanal' && <span className="text-green-400">🗓️</span>}
              {t === 'Mensal' && <span className="text-purple-400">📆</span>}
              {t}
              <button
                className={`ml-auto text-xs px-2 py-1 rounded ${showCompleted[t] ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'} hover:bg-blue-200 transition`}
                onClick={() => setShowCompleted(prev => ({ ...prev, [t]: !prev[t] }))}
              >{showCompleted[t] ? 'Ocultar concluídos' : 'Mostrar concluídos'}</button>
            </h3>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-blue-400 animate-pulse">Carregando...</div>
            ) : filtered(t).length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Nenhuma rotina {t.toLowerCase()} cadastrada.</p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1">
                {filtered(t).map((item, idx, arr) => (
                  <li
                    key={item.id}
                    className={`flex items-center gap-2 group cursor-move rounded px-1 transition-all duration-200 select-none
                      ${draggedId === item.id ? 'bg-blue-100 shadow-lg scale-105 z-10' : ''}
                      ${draggedId && draggedId !== item.id ? 'ring-2 ring-blue-200' : ''}
                      hover:bg-blue-50`}
                    draggable
                    style={{
                      opacity: draggedId === item.id ? 0.7 : 1,
                      boxShadow: draggedId === item.id ? '0 8px 24px 0 rgba(37, 99, 235, 0.15)' : undefined,
                    }}
                    onDragStart={() => setDraggedId(item.id)}
                    onDragOver={e => { e.preventDefault(); if (draggedId && draggedId !== item.id) moveItem(draggedId, item.id); }}
                    onDragEnd={() => setDraggedId(null)}
                    onClick={e => {
                      // Não marcar/desmarcar se clicar no botão Remover ou input de edição
                      if (
                        (e.target as HTMLElement).tagName === 'BUTTON' ||
                        (e.target as HTMLElement).tagName === 'INPUT' && editingId === item.id
                      ) return;
                      toggleItem(item.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      readOnly
                      tabIndex={-1}
                      className="accent-blue-600 w-6 h-6 pointer-events-none"
                      style={{ minWidth: 24, minHeight: 24 }}
                    />
                    {editingId === item.id ? (
                      <input
                        className="flex-1 border rounded px-2 py-1"
                        value={editingText}
                        autoFocus
                        onChange={e => setEditingText(e.target.value)}
                        onBlur={() => saveEdit(item.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(item.id);
                          if (e.key === 'Escape') { setEditingId(null); setEditingText(''); }
                        }}
                        disabled={loading}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className={item.done ? 'line-through text-gray-400 flex-1 cursor-pointer opacity-60' : 'flex-1 cursor-pointer'}
                        onClick={e => { e.stopPropagation(); setEditingId(item.id); setEditingText(item.text); }}
                      >{item.text}</span>
                    )}
                    <button
                      className="ml-auto text-xs text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition"
                      onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                      disabled={loading}
                    >Remover</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Checklist; 
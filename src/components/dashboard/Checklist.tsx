import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  type: 'Diário' | 'Semanal' | 'Mensal';
}

const Checklist: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [input, setInput] = useState('');
  const [type, setType] = useState<'Diário' | 'Semanal' | 'Mensal'>('Diário');
  const [loading, setLoading] = useState(false);

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

  // Remover rotina
  const removeItem = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('checklists')
      .delete()
      .eq('id', id);
    if (!error) {
      setItems(items.filter(i => i.id !== id));
    }
    setLoading(false);
  };

  const filtered = (t: 'Diário' | 'Semanal' | 'Mensal') => items.filter(item => item.type === t);

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
            </h3>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-blue-400 animate-pulse">Carregando...</div>
            ) : filtered(t).length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Nenhuma rotina {t.toLowerCase()} cadastrada.</p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1">
                {filtered(t).map(item => (
                  <li key={item.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleItem(item.id)}
                      className="accent-blue-600 w-5 h-5"
                      disabled={loading}
                    />
                    <span className={item.done ? 'line-through text-gray-400 flex-1' : 'flex-1'}>{item.text}</span>
                    <button
                      className="ml-auto text-xs text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition"
                      onClick={() => removeItem(item.id)}
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
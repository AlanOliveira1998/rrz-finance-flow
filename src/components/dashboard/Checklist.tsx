import React, { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  type: 'Diário' | 'Semanal' | 'Mensal';
}

const CHECKLIST_KEY = 'rrz_checklist';

const Checklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [input, setInput] = useState('');
  const [type, setType] = useState<'Diário' | 'Semanal' | 'Mensal'>('Diário');

  useEffect(() => {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!input.trim()) return;
    setItems([
      ...items,
      { id: Date.now().toString(), text: input.trim(), done: false, type },
    ]);
    setInput('');
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const filtered = (t: 'Diário' | 'Semanal' | 'Mensal') => items.filter(item => item.type === t);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Checklist de Rotinas</h2>
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Nova rotina..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <select
          className="border rounded px-2 py-1"
          value={type}
          onChange={e => setType(e.target.value as any)}
        >
          <option value="Diário">Diário</option>
          <option value="Semanal">Semanal</option>
          <option value="Mensal">Mensal</option>
        </select>
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          onClick={addItem}
        >Adicionar</button>
      </div>
      {(['Diário', 'Semanal', 'Mensal'] as const).map(t => (
        <div key={t} className="mb-6">
          <h3 className="font-semibold text-lg mb-2">{t}</h3>
          {filtered(t).length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhuma rotina {t.toLowerCase()} cadastrada.</p>
          ) : (
            <ul className="space-y-2">
              {filtered(t).map(item => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span className={item.done ? 'line-through text-gray-400' : ''}>{item.text}</span>
                  <button
                    className="ml-auto text-xs text-red-500 hover:underline"
                    onClick={() => removeItem(item.id)}
                  >Remover</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default Checklist; 
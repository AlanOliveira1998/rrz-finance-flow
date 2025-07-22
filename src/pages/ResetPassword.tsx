import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // O usuário só estará autenticado via token do link de redefinição
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setMessage('Token inválido ou expirado. Solicite um novo e-mail de redefinição.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage('Erro ao redefinir senha: ' + error.message);
    } else {
      setMessage('Senha redefinida com sucesso! Redirecionando para login...');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded shadow p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Definir nova senha</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
      </div>
    </div>
  );
} 
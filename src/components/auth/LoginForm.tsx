
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const LoginForm = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(!!localStorage.getItem('remembered_email'));
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (rememberEmail) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }

    try {
      const success = await login(email, password);
      if (!success) {
        toast({
          title: "Erro na autenticação",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-36 h-36 flex items-center justify-center">
            <img src="/logo.png" alt="Logo RRZ" className="w-36 h-36 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Sistema Financeiro RRZ</CardTitle>
          <CardDescription>RRZ Consultoria - Acesse sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu e-mail corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-colors duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 transition-colors duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="rememberEmail"
                type="checkbox"
                checked={rememberEmail}
                onChange={() => setRememberEmail((v) => !v)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <Label htmlFor="rememberEmail" className="text-sm">Lembrar meu email</Label>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

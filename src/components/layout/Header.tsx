
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { invoices } = useInvoices();

  // Filtra boletos (notas) que vencem hoje
  const today = new Date().toISOString().slice(0, 10);
  const boletosHoje = invoices.filter(inv => inv.dataVencimento === today);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema Financeiro RRZ</h1>
          <p className="text-sm text-gray-600">Bem-vindo, {user?.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none">
                <Bell className="h-6 w-6 text-gray-700" />
                {boletosHoje.length > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {boletosHoje.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="font-semibold text-lg mb-2">Boletos vencendo hoje</div>
              {boletosHoje.length === 0 ? (
                <div className="text-gray-500 text-sm">Nenhum boleto vence hoje.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {boletosHoje.map((inv) => (
                    <li key={inv.id} className="py-2">
                      <div className="font-medium text-gray-900">{inv.cliente || 'Cliente não informado'}</div>
                      <div className="text-xs text-gray-600">Nota: {inv.numero} | Valor: R$ {inv.valorBruto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs text-gray-500">Vencimento: {inv.dataVencimento}</div>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <Button variant="outline" onClick={async () => { await logout(); navigate('/'); }}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

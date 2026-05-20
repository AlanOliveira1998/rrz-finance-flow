import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';

export const Header = () => {
  const { invoices } = useInvoices();

  const today = new Date().toISOString().slice(0, 10);
  const boletosHoje = invoices.filter(inv => inv.dataVencimento === today);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end flex-shrink-0">
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none">
            <Bell className="h-5 w-5 text-gray-600" />
            {boletosHoje.length > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {boletosHoje.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="font-semibold text-base mb-2">Boletos vencendo hoje</div>
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
    </header>
  );
};

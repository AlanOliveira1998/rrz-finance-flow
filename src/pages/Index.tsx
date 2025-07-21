
import React from 'react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sistema de Gestão Financeira
        </h1>
        <p className="text-gray-600 mb-4">
          Sistema funcionando sem providers para teste.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            • Página carregou com sucesso
          </p>
          <p className="text-sm text-gray-500">
            • Sem erros de toLowerCase
          </p>
          <p className="text-sm text-gray-500">
            • Providers removidos temporariamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

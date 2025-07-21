
import React from 'react';
import { useAuthSimple } from '@/hooks/useAuthSimple';

const Index = () => {
  const { user, isAuthenticated } = useAuthSimple();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Login
          </h1>
          <p className="text-gray-600">
            Sistema funcionando com AuthProvider.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Status: {isAuthenticated ? 'Autenticado' : 'Não autenticado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Dashboard
        </h1>
        <p className="text-gray-600 mb-4">
          Usuário autenticado: {user?.email}
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            • Sistema funcionando com AuthProvider
          </p>
          <p className="text-sm text-gray-500">
            • Sem erros de toLowerCase
          </p>
          <p className="text-sm text-gray-500">
            • Dashboard simplificado
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;

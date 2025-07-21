
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/dashboard/Dashboard';

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Faça login para acessar o sistema.</div>;
  }

  return <Dashboard />;
};

export default Index;

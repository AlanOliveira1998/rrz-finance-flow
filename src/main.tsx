import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logger } from '@/lib/logger';
import React from 'react';

class ErrorBoundary extends React.Component<object, { hasError: boolean; error: unknown | null }> {
  state: { hasError: boolean; error: unknown | null } = { hasError: false, error: null };
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo | null) {
    // Você pode logar o erro aqui
    logger.error('ErrorBoundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 32 }}><h1>Erro na aplicação</h1><pre>{String(this.state.error)}</pre></div>;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AuthDebug = () => {
  const { user, isAuthenticated, refreshSession } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    setSessionInfo({ session, error });
  };

  const testClientInsert = async () => {
    setTestResult('Testando inserção...');
    
    try {
      const testClient = {
        cnpj: '12345678000199',
        razao_social: 'EMPRESA TESTE DEBUG',
        nome_fantasia: 'DEBUG',
        email: 'debug@teste.com',
        telefone: '(11) 99999-9999',
        endereco: {
          logradouro: 'Rua Debug',
          numero: '123',
          complemento: '',
          bairro: 'Centro',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01001-000'
        },
        ativo: true
      };

      logger.debug('Teste - Dados sendo enviados:', testClient);
      logger.debug('Teste - JSON dos dados:', JSON.stringify(testClient, null, 2));

      const { data, error } = await supabase
        .from('clients')
        .insert([testClient])
        .select();

      if (error) {
        logger.error('Teste - Erro detalhado:', error);
        setTestResult(`ERRO: ${error.message}`);
      } else {
        logger.debug('Teste - Sucesso:', data);
        setTestResult(`SUCESSO: Cliente inserido com ID ${data?.[0]?.id}`);
      }
    } catch (error) {
      logger.error('Teste - Exceção:', error);
      setTestResult(`EXCEÇÃO: ${error}`);
    }
  };

  const handleRefreshSession = async () => {
    setTestResult('Recarregando sessão...');
    const success = await refreshSession();
    setTestResult(success ? 'Sessão recarregada com sucesso' : 'Falha ao recarregar sessão');
    checkSession();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug de Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Status de Autenticação:</strong>
              <Badge variant={isAuthenticated ? "default" : "destructive"} className="ml-2">
                {isAuthenticated ? 'Autenticado' : 'Não Autenticado'}
              </Badge>
            </div>
            <div>
              <strong>Usuário:</strong>
              <span className="ml-2">{user?.email || 'N/A'}</span>
            </div>
          </div>

          <div>
            <strong>Sessão Ativa:</strong>
            <Badge variant={sessionInfo?.session ? "default" : "destructive"} className="ml-2">
              {sessionInfo?.session ? 'Sim' : 'Não'}
            </Badge>
          </div>

          {sessionInfo?.error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded">
              <strong>Erro de Sessão:</strong> {sessionInfo.error.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={checkSession} variant="outline">
              Verificar Sessão
            </Button>
            <Button onClick={handleRefreshSession} variant="outline">
              Recarregar Sessão
            </Button>
            <Button onClick={testClientInsert} variant="outline">
              Testar Inserção
            </Button>
          </div>

          {testResult && (
            <div className="p-3 bg-gray-100 border border-gray-300 rounded">
              <strong>Resultado do Teste:</strong> {testResult}
            </div>
          )}

          {sessionInfo?.session && (
            <div className="p-3 bg-blue-100 border border-blue-300 rounded">
              <strong>Detalhes da Sessão:</strong>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(sessionInfo.session, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 
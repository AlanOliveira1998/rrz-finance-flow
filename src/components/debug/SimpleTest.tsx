import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SimpleTest = () => {
  const [result, setResult] = useState<string>('');

  const testSimpleInsert = async () => {
    setResult('Testando inserção simples...');
    
    try {
      // Teste 1: Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sessão:', session);
      
      if (!session) {
        setResult('ERRO: Não há sessão ativa');
        return;
      }
      
      // Teste 2: Inserção simples
      const testData = {
        cnpj: '99999999000199',
        razao_social: 'TESTE SIMPLES LTDA',
        ativo: true
      };
      
      console.log('Enviando dados:', testData);
      
      const { data, error } = await supabase
        .from('clients')
        .insert(testData)
        .select();
      
      if (error) {
        console.error('Erro:', error);
        setResult(`ERRO: ${error.message}`);
      } else {
        console.log('Sucesso:', data);
        setResult(`SUCESSO: ID ${data?.[0]?.id}`);
      }
      
    } catch (error) {
      console.error('Exceção:', error);
      setResult(`EXCEÇÃO: ${error}`);
    }
  };

  const testConnection = async () => {
    setResult('Testando conexão...');
    
    try {
      const { data, error } = await supabase.from('clients').select('count').limit(1);
      
      if (error) {
        setResult(`ERRO DE CONEXÃO: ${error.message}`);
      } else {
        setResult(`CONEXÃO OK: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setResult(`EXCEÇÃO DE CONEXÃO: ${error}`);
    }
  };

  const clearTest = async () => {
    try {
      await supabase.from('clients').delete().eq('cnpj', '99999999000199');
      setResult('Teste limpo');
    } catch (error) {
      setResult(`Erro ao limpar: ${error}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teste Simples</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testConnection} variant="outline">
            Testar Conexão
          </Button>
          <Button onClick={testSimpleInsert} variant="outline">
            Testar Inserção
          </Button>
          <Button onClick={clearTest} variant="outline">
            Limpar Teste
          </Button>
        </div>
        
        {result && (
          <div className="p-3 bg-gray-100 border border-gray-300 rounded">
            <strong>Resultado:</strong> {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
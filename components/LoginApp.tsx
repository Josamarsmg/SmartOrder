import React, { useState, useEffect } from 'react';
import { MockService } from '../services/mockService';

export const LoginApp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'CHECKING' | 'OK' | 'ERROR'>('CHECKING');
  const [configErrorType, setConfigErrorType] = useState<string | null>(null);

  const isDemoMode = !MockService.isConfigured;

  useEffect(() => {
    // Perform a connection check on mount
    const check = async () => {
        const result = await MockService.checkConnection();
        if (result.success) {
            setConnectionStatus('OK');
        } else {
            setConnectionStatus('ERROR');
            setConfigErrorType(result.errorType || 'UNKNOWN');
        }
    };
    check();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await MockService.login(email, password);
      if (user) {
        // Success
        window.location.hash = '#/landing';
      } else {
        setError('Usuário ou senha inválidos.');
      }
    } catch (err: any) {
      console.error(err);
      // Check for specific Firestore activation error
      const msg = err.message || '';
      if (msg.includes('Cloud Firestore API has not been used') || msg.includes('disabled')) {
         setConfigErrorType('API_NOT_ENABLED');
         setConnectionStatus('ERROR');
      } else {
         setError('Erro de conexão com o servidor. Verifique sua internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">
      
      {/* Configuration Status Indicator */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 
        ${connectionStatus === 'ERROR' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 
          (isDemoMode ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-green-500/20 text-green-500 border border-green-500/50')}`}>
        <span className={`w-2 h-2 rounded-full 
            ${connectionStatus === 'ERROR' ? 'bg-red-500' : (isDemoMode ? 'bg-yellow-500' : 'bg-green-500')}`}></span>
        {connectionStatus === 'ERROR' ? 'Erro de Configuração' : (isDemoMode ? 'MODO DEMO' : 'ONLINE (Firebase)')}
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header Branding */}
        <div className="bg-brand-600 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">SmartOrder</h1>
          <p className="text-brand-100 opacity-90">Gestão Inteligente para seu Restaurante</p>
        </div>

        {/* CRITICAL CONFIG ERROR ALERT */}
        {connectionStatus === 'ERROR' && configErrorType === 'API_NOT_ENABLED' && (
            <div className="bg-red-50 p-6 border-b border-red-100">
                <h3 className="text-red-800 font-bold text-lg mb-2 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Ação Necessária no Firebase
                </h3>
                <p className="text-sm text-red-700 mb-4">
                    O projeto foi criado, mas o <strong>Banco de Dados (Firestore)</strong> ainda não foi ativado no painel do Google.
                </p>
                <div className="bg-white p-4 rounded border border-red-200 text-sm">
                    <ol className="list-decimal pl-4 space-y-2 text-gray-800">
                        <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 underline font-bold">Console do Firebase</a>.</li>
                        <li>Selecione o projeto <strong>smartorder-8de4e</strong>.</li>
                        <li>No menu lateral, clique em <strong>Criação (Build)</strong> e depois em <strong>Firestore Database</strong>.</li>
                        <li>Clique no botão <strong>Criar banco de dados</strong>.</li>
                        <li>Escolha o local e selecione <strong>Iniciar no modo de teste</strong>.</li>
                    </ol>
                </div>
                <button 
                   onClick={() => window.location.reload()}
                   className="w-full mt-4 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700"
                >
                    Já ativei, tentar novamente
                </button>
            </div>
        )}

        {/* Login Form (Only show if no critical config error) */}
        {!(connectionStatus === 'ERROR' && configErrorType === 'API_NOT_ENABLED') && (
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usuário de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-lg border-gray-300 bg-gray-50 border focus:bg-white focus:ring-brand-500 focus:border-brand-500 py-3 transition-colors"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-lg border-gray-300 bg-gray-50 border focus:bg-white focus:ring-brand-500 focus:border-brand-500 py-3 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Entrando...
                </span>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
        </div>
        )}
        
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
             {connectionStatus === 'OK' 
               ? "Sistema conectado e sincronizado com a nuvem." 
               : "Verificando conexão..."}
          </p>
        </div>
      </div>
    </div>
  );
};
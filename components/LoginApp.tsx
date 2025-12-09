
import React, { useState } from 'react';
import { MockService } from '../services/mockService';

export const LoginApp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfigured = MockService.isConfigured;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isConfigured) {
      setError('ERRO: Configure as chaves do Supabase no arquivo mockService.ts');
      setIsLoading(false);
      return;
    }

    try {
      const user = await MockService.login(email, password);
      if (user) {
        // Salva o usuário na sessão para controle de permissão
        localStorage.setItem('smartOrder_user', JSON.stringify(user));
        
        // Success
        window.location.hash = '#/landing';
      } else {
        setError('Usuário ou senha inválidos.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">
      
      {/* Configuration Status Indicator */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border shadow-lg backdrop-blur-sm 
        ${isConfigured 
          ? 'bg-green-500/20 text-green-500 border-green-500/50' 
          : 'bg-red-500/20 text-red-500 border-red-500/50'}`}>
        <span className={`w-2 h-2 rounded-full animate-pulse ${isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {isConfigured ? 'SUPABASE CONECTADO' : 'SUPABASE DESCONECTADO'}
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header Branding */}
        <div className="bg-brand-600 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">SmartOrder</h1>
          <p className="text-brand-100 opacity-90">Gestão Inteligente para seu Restaurante</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {!isConfigured && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <strong>Configuração Necessária:</strong><br/>
                Abra o arquivo <code>services/mockService.ts</code> e adicione sua <code>SUPABASE_URL</code> e <code>SUPABASE_ANON_KEY</code>.
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
              disabled={isLoading || !isConfigured}
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
      </div>
    </div>
  );
};

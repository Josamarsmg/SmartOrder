
import React, { useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { MockService } from '../services/mockService';

interface CompanySettingsAppProps {
  embedded?: boolean;
}

export const CompanySettingsApp: React.FC<CompanySettingsAppProps> = ({ embedded = false }) => {
  const [settings, setSettings] = useState<CompanySettings>({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    ie: '',
    logradouro: '',
    numero: '',
    bairro: '',
    municipio: '',
    uf: ''
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const data = MockService.getCompanySettings();
    setSettings(data);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    MockService.saveCompanySettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans ${embedded ? '' : 'p-6'}`}>
      <div className="flex justify-between items-start mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dados da Empresa</h1>
          <p className="text-gray-400 mt-1">Configure os dados fiscais para emissão do NFC-e (Nota Fiscal).</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-4xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Identificação do Emitente
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Nome Fantasia</label>
              <input 
                type="text" 
                name="nomeFantasia"
                value={settings.nomeFantasia}
                onChange={handleChange}
                placeholder="Ex: Restaurante Sabor Bom"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Razão Social</label>
              <input 
                type="text" 
                name="razaoSocial"
                value={settings.razaoSocial}
                onChange={handleChange}
                placeholder="Ex: Sabor Bom Alimentos LTDA"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">CNPJ</label>
              <input 
                type="text" 
                name="cnpj"
                value={settings.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0001-00"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Inscrição Estadual (IE)</label>
              <input 
                type="text" 
                name="ie"
                value={settings.ie}
                onChange={handleChange}
                placeholder="Ex: 123456789 or ISENTO"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all uppercase"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Endereço</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Logradouro (Rua, Av.)</label>
                  <input 
                    type="text" 
                    name="logradouro"
                    value={settings.logradouro}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Número</label>
                  <input 
                    type="text" 
                    name="numero"
                    value={settings.numero}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Bairro</label>
                  <input 
                    type="text" 
                    name="bairro"
                    value={settings.bairro}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Município</label>
                  <input 
                    type="text" 
                    name="municipio"
                    value={settings.municipio}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">UF (Estado)</label>
                  <input 
                    type="text" 
                    name="uf"
                    maxLength={2}
                    value={settings.uf}
                    onChange={handleChange}
                    placeholder="SP"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all uppercase"
                  />
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
             <button 
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all flex items-center gap-2"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               Salvar Dados
             </button>
             {isSaved && (
               <span className="text-green-600 font-medium flex items-center gap-1 animate-fade-in">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                 Salvo com sucesso!
               </span>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

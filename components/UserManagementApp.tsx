import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { MockService } from '../services/mockService';

interface UserManagementAppProps {
  embedded?: boolean;
}

export const UserManagementApp: React.FC<UserManagementAppProps> = ({ embedded = false }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null); // Track open menu
  const menuRef = useRef<HTMLDivElement>(null); // Ref to close menu on click outside

  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'Garçom',
    status: 'Ativo',
    password: ''
  });

  useEffect(() => {
    loadUsers();
    
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setActiveMenuUserId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    const data = await MockService.getUsers();
    setUsers(data);
  };

  const handleAddNew = () => {
    setCurrentUser({
      name: '',
      email: '',
      role: undefined,
      status: undefined,
      password: ''
    });
    setIsModalOpen(true);
    setActiveMenuUserId(null);
  };

  const handleEdit = (user: User) => {
    setCurrentUser({
      ...user,
      password: '' // Don't show existing password, leave blank to keep
    });
    setIsModalOpen(true);
    setActiveMenuUserId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.name || !currentUser.email || !currentUser.role || !currentUser.status) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Require password for new users
    if (!currentUser.id && !currentUser.password) {
        alert('A senha é obrigatória para novos usuários.');
        return;
    }

    if (currentUser.id) {
      await MockService.updateUser(currentUser as User);
    } else {
      await MockService.addUser(currentUser as User);
    }
    
    setIsModalOpen(false);
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      await MockService.deleteUser(id);
      loadUsers();
    }
    setActiveMenuUserId(null);
  };

  const toggleMenu = (userId: string) => {
    if (activeMenuUserId === userId) {
        setActiveMenuUserId(null);
    } else {
        setActiveMenuUserId(userId);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans ${embedded ? '' : 'p-6'}`}>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-400 mt-1">Adicione, edite e gerencie os usuários do sistema.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Adicionar Usuário
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible animate-fade-in pb-24">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Usuários Cadastrados</h2>
          <p className="text-sm text-gray-400 mt-1">Lista de todos os usuários com acesso ao sistema.</p>
        </div>

        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-sm">
                <th className="p-6 font-medium">Nome</th>
                <th className="p-6 font-medium">Função</th>
                <th className="p-6 font-medium">Status</th>
                <th className="p-6 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-base">{user.name}</span>
                      <span className="text-sm text-gray-400">{user.email}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-gray-700 font-medium">{user.role}</span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                      ${user.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-6 text-right relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleMenu(user.id); }}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeMenuUserId === user.id && (
                        <div ref={menuRef} className="absolute right-6 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 animate-fade-in overflow-hidden">
                            <button 
                                onClick={() => handleEdit(user)}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Editar
                            </button>
                            <button 
                                onClick={() => handleDelete(user.id)}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Excluir
                            </button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{currentUser.id ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h3>
                <p className="text-gray-400 text-sm mt-1">Preencha os detalhes para {currentUser.id ? 'atualizar o' : 'criar um novo'} acesso.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              
              {/* Nome Field */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Nome</label>
                <input 
                  type="text" 
                  required
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <input 
                  type="email" 
                  required
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Password Field (New) */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">
                    Senha
                    {currentUser.id && <span className="text-gray-400 font-normal ml-2 text-xs">(Deixe em branco para manter a atual)</span>}
                </label>
                <input 
                  type="password" 
                  required={!currentUser.id} // Required only for new users
                  placeholder={currentUser.id ? "••••••••" : ""}
                  value={currentUser.password}
                  onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Função Field */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Função</label>
                <div className="relative">
                  <select 
                    required
                    value={currentUser.role || ''}
                    onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as UserRole})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 appearance-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all text-gray-700"
                  >
                    <option value="" disabled>Selecione uma função</option>
                    <option value="Admin">Admin</option>
                    <option value="Cozinha">Cozinha</option>
                    <option value="Garçom">Garçom</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Status Field */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Status</label>
                <div className="relative">
                  <select 
                    required
                    value={currentUser.status || ''}
                    onChange={(e) => setCurrentUser({...currentUser, status: e.target.value as UserStatus})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 appearance-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all text-gray-700"
                  >
                    <option value="" disabled>Selecione um status</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-700 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md transition-colors"
                >
                  {currentUser.id ? 'Salvar Alterações' : 'Adicionar Usuário'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
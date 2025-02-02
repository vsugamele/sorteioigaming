import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, ArrowLeft, UserPlus, Users } from 'lucide-react';
import { ViewSetter } from '../App';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  setView: ViewSetter;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  platform: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  receipt_url?: string;
  users?: {
    raw_user_meta_data: {
      name: string;
      phone: string;
    };
  };
}

export function AdminPanel({ setView }: AdminPanelProps) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(false);

    try {
      // Primeiro, verificar se o usuário existe
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', newAdminEmail)
        .single();

      if (userError) {
        throw new Error('Usuário não encontrado. Certifique-se que o e-mail está correto.');
      }

      // Atualizar o status de admin do usuário
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      setAdminSuccess(true);
      setNewAdminEmail('');
      setTimeout(() => {
        setShowAdminModal(false);
        setAdminSuccess(false);
      }, 2000);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Erro ao adicionar administrador');
    }
  };

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          *,
          users!deposits_user_id_fkey (
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error('Erro ao buscar depósitos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (depositId: string, status: 'approved' | 'rejected') => {
    try {
      const updateData = {
        status,
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        ...(status === 'rejected' ? { rejection_reason: rejectionReason } : {})
      };

      const { error } = await supabase
        .from('deposits')
        .update(updateData)
        .eq('id', depositId);

      if (error) throw error;

      setDeposits(deposits.map(deposit => 
        deposit.id === depositId 
          ? { ...deposit, ...updateData }
          : deposit
      ));

      setShowModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Recusado'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pt-32">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('receipt')}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar</span>
          </button>
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors group"
          >
            <Users className="w-5 h-5" />
            <span>Gerenciar Administradores</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gerenciamento de Comprovantes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plataforma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {deposit.users?.raw_user_meta_data?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {deposit.users?.raw_user_meta_data?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {deposit.platform}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      R$ {deposit.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(deposit.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(deposit.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => {
                          setSelectedImage(deposit.receipt_url || null);
                          setShowImageModal(true);
                        }}
                        className={`text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 ${!deposit.receipt_url ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!deposit.receipt_url}
                        title={deposit.receipt_url ? 'Ver comprovante' : 'Sem comprovante'}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {deposit.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(deposit.id, 'approved')}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDeposit(deposit);
                              setShowModal(true);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Visualização do Comprovante
              </h3>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                  setImageError(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Comprovante"
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                  onError={(e) => {
                    console.error('Erro ao carregar imagem');
                    setImageError(true);
                  }}
                />
              ) : imageError ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <p className="text-red-500 font-medium mb-2">Erro ao carregar imagem</p>
                  <p className="text-gray-500 text-sm">O comprovante pode não estar mais disponível</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Nenhum comprovante disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejeição */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Recusar Comprovante
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Motivo da Recusa
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Digite o motivo da recusa..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedDeposit.id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors"
                >
                  Recusar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Administrador */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                Gerenciar Administradores
              </h3>
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setNewAdminEmail('');
                  setAdminError(null);
                  setAdminSuccess(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  E-mail do Novo Administrador
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md text-sm">
                  {adminError}
                </div>
              )}

              {adminSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-md text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Administrador adicionado com sucesso!
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setNewAdminEmail('');
                    setAdminError(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Adicionar Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
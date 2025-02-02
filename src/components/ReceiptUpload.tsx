import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FileWithPreview extends File {
  preview?: string;
}

export function ReceiptUpload() {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [platform, setPlatform] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileWithPreview = selectedFile as FileWithPreview;
      if (selectedFile.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(selectedFile);
      }
      setFile(fileWithPreview);
      setStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !platform || !amount) {
      setStatus('error');
      return;
    }

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      // Upload do arquivo para o Storage do Supabase
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública do arquivo
      const { data: urlData } = await supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao gerar URL do comprovante');
      }

      // Garantir que a URL seja acessível
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('URL do comprovante não está acessível');
      }

      // Inserir o depósito na tabela
      const { error: depositError } = await supabase
        .from('deposits')
        .insert([
          {
            amount: parseFloat(amount),
            platform,
            receipt_url: urlData.publicUrl,
            status: 'pending'
          }
        ]);

      if (depositError) throw depositError;

      setStatus('success');
      console.log('Comprovante enviado com sucesso:', urlData.publicUrl);

      // Limpar formulário após sucesso
      setFile(null);
      setAmount('');
      setPlatform('');
    } catch (error) {
      console.error('Erro ao enviar comprovante:', error instanceof Error ? error.message : error);
      setStatus('error');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
        Registre sua Participação
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Plataforma
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">Selecione a plataforma</option>
            <option value="BR4BET">BR4BET</option>
            <option value="LOTOGREEN">LOTOGREEN</option>
            <option value="MCGAMES">MCGAMES</option>
            <option value="GOLDEBET">GOLDEBET</option>
            <option value="ONABET">ONABET</option>
            <option value="HANZBET">HANZBET</option>
            <option value="SEGUROBET">SEGUROBET</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Valor do Depósito
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Digite o valor do depósito"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Arquivo
          </label>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full px-3 sm:px-4 py-4 sm:py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              {file ? (
                <div className="space-y-2 text-center">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="mx-auto h-24 sm:h-32 w-auto object-cover rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 dark:text-green-400" />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{file.name}</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Clique para fazer upload
                  </p>
                  <p className="text-xs hidden sm:block text-gray-500 dark:text-gray-400">
                    PDF ou imagens (máx. 10MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              Ocorreu um erro. Tente novamente.
            </span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">
              Comprovante enviado com sucesso!
            </span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Registre sua Participação
        </button>
      </form>
    </div>
  );
}
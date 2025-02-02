import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Gift, AlertCircle, Coins, Ticket, ArrowLeft, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { View, ViewSetter } from '../App';

interface RouletteProps {
  setView: ViewSetter;
}

interface Prize {
  id: number;
  name: string;
  icon: JSX.Element;
  color: string;
  gradient: string;
  probability: number;
}

const prizes: Prize[] = [
  {
    id: 1,
    name: 'Tente Novamente',
    icon: <AlertCircle className="w-8 h-8" />,
    color: 'bg-gray-500',
    gradient: 'from-gray-500 via-gray-600 to-gray-700',
    probability: 70
  },
  {
    id: 2,
    name: 'R$ 20,00',
    icon: <Coins className="w-8 h-8" />,
    color: 'bg-emerald-500',
    gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
    probability: 15
  },
  {
    id: 3,
    name: 'Ticket R$ 1.000',
    icon: <Ticket className="w-8 h-8" />,
    color: 'bg-blue-500',
    gradient: 'from-blue-400 via-blue-500 to-indigo-600',
    probability: 12
  },
  {
    id: 4,
    name: 'R$ 100,00',
    icon: <Gift className="w-8 h-8" />,
    color: 'bg-amber-500',
    gradient: 'from-yellow-400 via-amber-500 to-amber-600',
    probability: 3
  }
];

const TOTAL_SEGMENTS = 36; // Aumentado para mais suavidade
const ROTATION_TIME = 6000; // 6 segundos de rotação
const MIN_SPINS = 5; // Número mínimo de voltas completas

export function Roulette({ setView }: RouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [points, setPoints] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    fetchPoints();
  }, []);

  // Manipular tentativa de sair durante o giro
  const handleBack = () => {
    if (isSpinning) {
      setShowConfirmation(true);
    } else {
      setView('receipt');
    }
  };

  const fetchPoints = async () => {
    try {
      const { data: deposits, error } = await supabase
        .from('deposits')
        .select('points')
        .eq('status', 'approved');

      if (error) throw error;

      const totalPoints = deposits?.reduce((sum, deposit) => sum + (deposit.points || 0), 0) || 0;
      setPoints(totalPoints);
    } catch (err) {
      console.error('Erro ao buscar pontos:', err);
    }
  };

  const distributeSegments = () => {
    const segments: Prize[] = [];
    const segmentsPerPrize = {
      1: Math.floor(TOTAL_SEGMENTS * 0.7), // 70% Tente Novamente
      2: Math.floor(TOTAL_SEGMENTS * 0.15), // 15% R$ 20,00
      3: Math.floor(TOTAL_SEGMENTS * 0.12), // 12% Ticket
      4: Math.floor(TOTAL_SEGMENTS * 0.03), // 3% R$ 100,00
    };

    prizes.forEach(prize => {
      for (let i = 0; i < segmentsPerPrize[prize.id as keyof typeof segmentsPerPrize]; i++) {
        segments.push(prize);
      }
    });

    // Preencher segmentos restantes se necessário
    while (segments.length < TOTAL_SEGMENTS) {
      segments.push(prizes[0]); // Adicionar "Tente Novamente" para completar
    }

    return segments;
  };

  const segments = distributeSegments();
  const segmentAngle = 360 / TOTAL_SEGMENTS;

  const spinWheel = async () => {
    if (isSpinning || points < 50) return;

    try {
      setIsSpinning(true);
      setSelectedPrize(null);
      setError(null);

      // Calcular rotação final
      const minRotation = MIN_SPINS * 360;
      const randomSegment = Math.floor(Math.random() * TOTAL_SEGMENTS);
      const segmentRotation = randomSegment * segmentAngle;
      const finalRotation = minRotation + segmentRotation;
      
      // Aplicar rotação com easing
      setRotation(prev => prev + finalRotation);

      // Aguardar fim da animação
      setTimeout(() => {
        const prize = segments[randomSegment];
        setSelectedPrize(prize);
        setShowModal(true);
        setIsSpinning(false);
        
        // Atualizar pontos
        setPoints(prev => prev - 50);
      }, ROTATION_TIME);

    } catch (error) {
      console.error('Erro ao girar a roleta:', error);
      setError('Ocorreu um erro ao girar a roleta. Tente novamente.');
      setIsSpinning(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 relative overflow-hidden">
      {/* Botão Voltar com Confirmação */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Voltar</span>
      </button>

      {/* Modal de Confirmação para Sair */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Deseja mesmo sair?
              </h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              A roleta ainda está girando. Se sair agora, perderá os pontos gastos.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setView('receipt')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sair assim mesmo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Patterns */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Roleta da Sorte
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Gaste 50 pontos para girar a roleta e ganhar prêmios incríveis!
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-full">
            <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
              {points} pontos
            </span>
          </div>
        </div>

        <div className="relative w-full aspect-square max-w-md mx-auto mb-8">
          {/* Indicador */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[36px] border-t-red-500 z-10 filter drop-shadow-lg animate-bounce-subtle" />
          
          {/* Roleta */}
          <div 
            className={`w-full h-full rounded-full border-[12px] border-gray-200 dark:border-gray-700 relative overflow-hidden transform transition-all duration-[6000ms] cubic-bezier(0.3, 0, 0.2, 1) shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.3)] ${isSpinning ? 'scale-105' : ''}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {segments.map((prize, index) => (
              <div
                key={index}
                className={`absolute w-1/2 h-1/2 origin-bottom-right bg-gradient-to-r ${prize.gradient} flex items-center justify-center transform -translate-y-1/2 transition-opacity duration-300 ${isSpinning ? 'opacity-90' : 'hover:opacity-90'}`}
                style={{
                  transform: `rotate(${index * segmentAngle}deg) skewY(-${90 - segmentAngle}deg)`,
                  transformOrigin: '0 100%'
                }}
              >
                <div
                  className="text-white flex flex-col items-center gap-2 absolute"
                  style={{ 
                    transform: `
                      rotate(${-index * segmentAngle}deg)
                      skewY(${90 - segmentAngle}deg)
                      translateY(-50%)
                      rotate(90deg)
                    `,
                    transformOrigin: 'center center',
                    left: '50%',
                    top: '50%'
                  }}
                >
                  {prize.icon}
                  <span className="text-sm font-bold whitespace-nowrap drop-shadow-md text-center">
                    {prize.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={spinWheel}
          disabled={isSpinning || points < 50}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-300 transform
            ${isSpinning || points < 50
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:-translate-y-1 active:scale-95'
            }`}
        >
          {isSpinning 
            ? 'Girando...' 
            : points < 50 
              ? 'Pontos insuficientes' 
              : 'Girar Roleta (50 pontos)'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Modal de Prêmio */}
      {showModal && selectedPrize && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-fade-in relative overflow-hidden shadow-2xl transform hover:scale-105 transition-transform">
            {/* Confetti */}
            {selectedPrize.id !== 1 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F87171'][Math.floor(Math.random() * 4)],
                      width: '8px',
                      height: '8px',
                      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`
                    }}
                  />
                ))}
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedPrize.gradient} flex items-center justify-center animate-success shadow-lg`}>
                  <div className="transform hover:scale-110 transition-transform">
                    {selectedPrize.icon}
                  </div>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {selectedPrize.id === 1 ? 'Não foi dessa vez...' : 'Parabéns!'}
              </h3>
              
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {selectedPrize.id === 1 
                  ? 'Continue tentando para ganhar prêmios incríveis!'
                  : `Você ganhou ${selectedPrize.name}!`}
              </p>
              
              <button
                onClick={() => setShowModal(false)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { Sparkles, Gift, Star } from 'lucide-react';

export function PromoMessage() {
  return (
    <div className="text-center mb-8 relative group perspective-1000">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/5 dark:from-blue-400/10 dark:via-indigo-400/10 dark:to-blue-400/10 rounded-2xl transform group-hover:scale-105 transition-all duration-500 ease-out" />
      
      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-blue-100/50 dark:border-blue-900/50 rounded-2xl p-8 shadow-xl space-y-6 group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-500">
        <div className="absolute -top-3 -right-3 animate-spin-slow">
          <div className="relative">
            <Star className="w-10 h-10 text-yellow-400 absolute transform rotate-45" />
            <Star className="w-10 h-10 text-yellow-500 animate-pulse" />
          </div>
        </div>
        
        <div className="relative space-y-6">
          <div className="flex justify-center items-center gap-4">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse transform -rotate-12" />
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse delay-150 transform rotate-12" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent leading-tight transform hover:scale-[1.01] transition-transform duration-300">
            VOCÊ ESTÁ CONCORRENDO A SORTEIOS QUE PODEM COLOCAR ATÉ R$2.000 NO BOLSO!
          </h1>
        </div>
      
        <div className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100/50 shadow-inner">
          <Gift className="w-5 h-5 sm:w-7 sm:h-7 text-red-500 animate-bounce" />
          <p className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
            10 BANCAS de R$100 e 1 SUPER BANCA de R$1.000 você espera!
          </p>
        </div>
      </div>
    </div>
  );
}
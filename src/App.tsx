import React from 'react';
import { SignUp } from './components/SignUp';
import { Login } from './components/Login';
import { ReceiptUpload } from './components/ReceiptUpload';
import { AdminPanel } from './components/AdminPanel';
import { PromoMessage } from './components/PromoMessage';
import { Navigation } from './components/Navigation';
import { Trophy } from 'lucide-react';
import { Roulette } from './components/Roulette';

export type View = 'login' | 'signup' | 'receipt' | 'admin' | 'roulette';
export type ViewSetter = (view: View) => void;

function App() {
  const [view, setView] = React.useState<View>('login');

  return (
    <>
      {view === 'login' && (
        <Login 
          onLoginSuccess={() => setView('receipt')}
          onSignUpClick={() => setView('signup')}
        />
      )}
      {view === 'signup' && <SignUp onLoginClick={() => setView('login')} />}
      {view === 'receipt' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <Navigation setView={setView} />
          <div className="max-w-2xl mx-auto p-4 pt-32 sm:pt-40">
            <PromoMessage />
            <div className="mb-8">
              <button
                onClick={() => setView('roulette')}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <Trophy className="w-6 h-6" />
                Roleta da Sorte
              </button>
            </div>
            <ReceiptUpload />
          </div>
        </div>
      )}
      {view === 'roulette' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <Navigation setView={setView} />
          <div className="max-w-4xl mx-auto p-4 pt-24 sm:pt-32">
            <Roulette setView={setView} />
          </div>
        </div>
      )}
      {view === 'admin' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <Navigation setView={setView} />
          <div className="pt-24 sm:pt-32">
            <AdminPanel setView={setView} />
          </div>
        </div>
      )}
    </>
  );
}

export default App;

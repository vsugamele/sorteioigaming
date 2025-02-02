import React from 'react';
import { Layout, Gamepad2, Zap, HeadphonesIcon, ChevronDown, Trophy, User, LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { View, ViewSetter } from '../App';

interface NavigationProps {
  setView: ViewSetter;
}

interface UserProfile {
  name: string;
  phone: string;
  isAdmin: boolean;
}

export function Navigation({ setView }: NavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [points, setPoints] = useState({ pending: 0, approved: 0 });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Verificar preferência inicial
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!isDark).toString());
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Buscar dados do usuário incluindo status de admin
        const { data: userData, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!error && userData) {
          setIsAdmin(userData.is_admin || false);
        }

        // Definir dados do perfil
        setUserProfile({
          name: user.user_metadata.name || 'Usuário',
          phone: user.user_metadata.phone || 'Telefone não cadastrado',
          isAdmin: userData?.is_admin || false
        });
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchDeposits = async () => {
      const { data: deposits, error } = await supabase
        .from('deposits')
        .select('amount, status, points');
      
      if (error) {
        console.error('Erro ao buscar depósitos:', error);
        return;
      }

      const pending = deposits
        .filter(d => d.status === 'pending')
        .reduce((sum, d) => sum + Math.floor(parseFloat(d.amount)), 0);

      const approved = deposits
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + (d.points || 0), 0);

      setPoints({ pending, approved });
    };

    fetchDeposits();

    // Inscrever para atualizações em tempo real
    const channel = supabase
      .channel('deposits_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deposits'
        },
        () => {
          fetchDeposits();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Referência para o menu dropdown
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const timeoutRef = React.useRef<number>();

  const handleMouseEnter = (menu: string) => {
    if (menu === 'platforms') {
      clearTimeout(timeoutRef.current);
      setIsHovering(true);
      setIsDropdownOpen(true);
      setActiveMenu(menu);
    } else {
      setActiveMenu(menu);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    timeoutRef.current = window.setTimeout(() => {
      if (!isHovering) {
        setIsDropdownOpen(false);
        setActiveMenu('');
      }
    }, 150);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleMenuClick = (menu: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (menu === 'platforms') {
      setIsDropdownOpen(!isDropdownOpen);
      setActiveMenu(isDropdownOpen ? '' : menu);
    } else {
      setActiveMenu(menu);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setActiveMenu('');
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fecha o dropdown ao pressionar ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
        setActiveMenu('');
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isDropdownOpen]);

  const platforms = [
    {
      name: 'BR4BET',
      url: 'https://go.aff.br4-partners.com/uwatp51w'
    },
    {
      name: 'Segurobet',
      url: 'https://www.seguro.bet.br/affiliates/?btag=1486959'
    },
    {
      name: 'Onabet',
      url: 'https://onabet.cxclick.com/visit/?bta=40879&brand=onabet'
    },
    {
      name: 'Goldbet',
      url: 'https://go.aff.goldebet.com/j5w6jyft'
    },
    {
      name: 'Lotogreen',
      url: 'https://go.aff.lotogreen.com/8dtgqwgq'
    },
    {
      name: 'Hanzbet',
      url: 'https://go.aff.hanz.bet.br/u1myigez'
    },
    {
      name: 'McGames',
      url: 'https://go.aff.mcgames.bet/r20yo6uf'
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950 text-white px-4 sm:px-6 py-2 sm:py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm sm:text-base">Sorteio da Laise</span>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-expanded={isMobileMenuOpen}
            aria-label="Menu principal"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-white transform transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-full h-0.5 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-full h-0.5 bg-white transform transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
          
          <div className="relative flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:text-blue-100 transition-colors group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-400 transition-colors">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-medium text-sm sm:text-base hidden sm:inline">{userProfile?.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-3 text-gray-700 dark:text-gray-200 transform origin-top-right transition-all duration-200 ease-out border border-gray-200 dark:border-gray-700 backdrop-blur-sm z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-medium">{userProfile?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{userProfile?.phone}</div>
                </div>
                <div className="space-y-2 p-2">
                  <div className="px-4 py-3 flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {points.pending.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm ml-1">pontos em análise</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <Trophy className="w-4 h-4 text-green-500" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {points.approved.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm ml-1">pontos aprovados</span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <a
                    onClick={() => {
                      setView('admin');
                      setIsUserMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:pl-6"
                  >
                    <Layout className="w-4 h-4" />
                    <span>Painel Administrativo</span>
                  </a>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="max-w-6xl mx-auto">
          <ul className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:space-x-8 px-4 py-2 lg:py-4 space-y-2 lg:space-y-0">
            <li className="relative platforms-menu">
              <button
                ref={buttonRef}
                onClick={(e) => handleMenuClick('platforms', e)}
                onMouseEnter={() => handleMouseEnter('platforms')}
                onMouseLeave={handleMouseLeave}
                className={`w-full lg:w-auto min-h-[44px] flex items-center gap-2 px-4 py-3 lg:py-2 rounded-lg transition-all duration-200 select-none ${
                  activeMenu === 'platforms' 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <Layout className="w-5 h-5" />
                <span className="font-medium text-base flex-1 text-left">Plataformas</span>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            
              {isDropdownOpen && (
                <div 
                  ref={dropdownRef}
                  onMouseEnter={() => handleMouseEnter('platforms')}
                  onMouseLeave={handleMouseLeave}
                  className={`lg:absolute lg:top-full lg:left-0 mt-1 w-full lg:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 py-2 z-[60] transform transition-all duration-200 platforms-dropdown ${isMobileMenuOpen ? '' : 'lg:origin-top-left'} backdrop-blur-sm`}
                  style={{
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto'
                  }}
                  role="menu"
                  aria-orientation="vertical"
                >
                  {platforms.map((platform, index) => (
                    <a
                      key={platform.name}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block min-h-[44px] px-4 py-3 lg:py-2 text-base lg:text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:pl-6"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setActiveMenu('');
                      }}
                      role="menuitem"
                      tabIndex={0}
                    >
                      {platform.name}
                    </a>
                  ))}
                </div>
              )}
            </li>
            <li>
              <a
                onClick={() => setActiveMenu('laise')}
                href="https://www.laisebet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full lg:w-auto min-h-[44px] flex items-center gap-2 px-4 py-3 lg:py-2 rounded-lg transition-all duration-200 ${
                  activeMenu === 'laise' 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <Gamepad2 className="w-5 h-5" />
                <span className="font-medium text-base">LaiseBet</span>
              </a>
            </li>
            <li>
              <a
                onClick={() => setActiveMenu('sinais')}
                href="https://www.sinaisdalaise.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full lg:w-auto min-h-[44px] flex items-center gap-2 px-4 py-3 lg:py-2 rounded-lg transition-all duration-200 ${
                  activeMenu === 'sinais' 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span className="font-medium text-base">Sinais</span>
              </a>
            </li>
            <li>
              <a
                onClick={() => setActiveMenu('suporte')}
                href="#"
                className={`w-full lg:w-auto min-h-[44px] flex items-center gap-2 px-4 py-3 lg:py-2 rounded-lg transition-all duration-200 ${
                  activeMenu === 'suporte' 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <HeadphonesIcon className="w-5 h-5" />
                <span className="font-medium text-base">Suporte</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
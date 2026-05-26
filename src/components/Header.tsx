import { useState, useEffect } from 'react';
import { dbSim } from '../supabaseClient';
import { SiteSettings } from '../types';
import { Menu, X, User, LogOut } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  customerUser?: { email: string; full_name: string } | null;
  logoutCustomer?: () => void;
}

export default function Header({ 
  currentPage, setCurrentPage, customerUser, logoutCustomer 
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    dbSim.settings.get().then(setSettings).catch(console.error);
  }, [currentPage]);

  const navItems = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'catalog', label: 'Cửa hàng phôi' },
    { id: 'custom-print', label: 'Tự thiết kế & In' },
    { id: 'lookbook', label: 'Lookbook' }
  ];

  const handleNavClick = (id: string) => {
    setCurrentPage(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {settings?.topbar_text && (
        <div className="bg-brand-gold text-brand-charcoal text-[10px] sm:text-xs font-bold uppercase tracking-widest py-2 px-4 text-center overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-[marquee_15s_linear_infinite]">
            {settings.topbar_text} <span className="mx-8">•</span> {settings.topbar_text}
          </div>
        </div>
      )}

      <header className="bg-brand-ivory border-b border-brand-charcoal sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleNavClick('home')}>
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name} className="h-10 object-contain" />
              ) : (
                <div className="flex flex-col">
                  <span className="font-serif text-3xl font-bold tracking-widest text-brand-charcoal uppercase leading-none">
                    {settings?.site_name || 'PRINTEE'}
                  </span>
                  <span className="text-[8px] tracking-[0.3em] text-brand-muted uppercase mt-1">
                    {settings?.site_slogan || 'LUXURY STUDIO'}
                  </span>
                </div>
              )}
            </div>

            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-300 ${
                    currentPage === item.id 
                      ? 'text-brand-charcoal border-b-2 border-brand-charcoal pb-1' 
                      : 'text-brand-muted hover:text-brand-gold'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {customerUser ? (
                <>
                  <button 
                    onClick={() => handleNavClick('account')}
                    className="text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 transition-colors duration-300 flex items-center gap-2 border bg-brand-charcoal text-brand-ivory border-brand-charcoal hover:bg-black"
                  >
                    <User size={14} /> TÀI KHOẢN
                  </button>
                  {logoutCustomer && (
                    <button 
                      onClick={() => { logoutCustomer(); handleNavClick('home'); }}
                      className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal hover:text-red-600 transition flex items-center gap-1"
                      title="Đăng xuất"
                    >
                      <LogOut size={14} />
                    </button>
                  )}
                </>
              ) : (
                <button 
                  onClick={() => handleNavClick('account')}
                  className="text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 transition-colors duration-300 flex items-center gap-2 border bg-transparent text-brand-charcoal border-brand-charcoal hover:bg-brand-charcoal hover:text-brand-ivory"
                >
                  <User size={14} /> ĐĂNG NHẬP
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-brand-charcoal">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-brand-ivory border-t border-brand-charcoal/10 absolute w-full shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="block w-full text-left px-3 py-4 text-sm font-semibold uppercase tracking-widest text-brand-charcoal border-b border-brand-charcoal/5"
                >
                  {item.label}
                </button>
              ))}
              
              {customerUser ? (
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => handleNavClick('account')}
                    className="flex-1 text-left px-3 py-4 text-sm font-semibold uppercase tracking-widest text-brand-ivory bg-brand-charcoal rounded"
                  >
                    TÀI KHOẢN CỦA TÔI
                  </button>
                  {logoutCustomer && (
                    <button 
                      onClick={() => { logoutCustomer(); handleNavClick('home'); }}
                      className="px-4 py-4 text-sm font-semibold uppercase bg-red-100 text-red-600 rounded"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => handleNavClick('account')}
                  className="block w-full text-left px-3 py-4 text-sm font-semibold uppercase tracking-widest text-brand-gold mt-4"
                >
                  ĐĂNG NHẬP / ĐĂNG KÝ
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  );
}

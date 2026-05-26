import { useState, useEffect } from 'react';
import { dbSim } from '../supabaseClient';
import { SiteSettings } from '../types';
import { Menu, X, User } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isAdminLoggedIn: boolean;
}

export default function Header({ currentPage, setCurrentPage, isAdminLoggedIn }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    // Tải cài đặt website từ Supabase để lấy Logo và Topbar
    dbSim.settings.get().then(setSettings).catch(console.error);
  }, [currentPage]); // Tải lại khi chuyển trang để cập nhật nhanh nhất

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
      {/* 1. THANH TOPBAR KHUYẾN MÃI CHẠY CHỮ */}
      {settings?.topbar_text && (
        <div className="bg-brand-gold text-brand-charcoal text-[10px] sm:text-xs font-bold uppercase tracking-widest py-2 px-4 text-center overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-[marquee_15s_linear_infinite]">
            {settings.topbar_text} <span className="mx-8">•</span> {settings.topbar_text}
          </div>
        </div>
      )}

      {/* 2. MENU ĐIỀU HƯỚNG CHÍNH */}
      <header className="bg-brand-ivory border-b border-brand-charcoal sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO ĐỘNG */}
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

            {/* Desktop Navigation */}
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

            {/* Admin / Login Button */}
            <div className="hidden md:flex items-center">
              <button 
                onClick={() => handleNavClick('admin')}
                className={`text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 transition-colors duration-300 flex items-center gap-2 border ${
                  isAdminLoggedIn 
                    ? 'bg-brand-charcoal text-brand-ivory border-brand-charcoal hover:bg-black' 
                    : 'bg-transparent text-brand-charcoal border-brand-charcoal hover:bg-brand-charcoal hover:text-brand-ivory'
                }`}
              >
                <User size={14} />
                {isAdminLoggedIn ? 'TRANG QUẢN TRỊ' : 'ĐĂNG NHẬP'}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-brand-charcoal">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
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
              <button 
                onClick={() => handleNavClick('admin')}
                className="block w-full text-left px-3 py-4 text-sm font-semibold uppercase tracking-widest text-brand-gold mt-4"
              >
                {isAdminLoggedIn ? 'VÀO TRANG QUẢN TRỊ' : 'ĐĂNG NHẬP ADMIN'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Tailwind Style cho hiệu ứng chữ chạy */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  );
}

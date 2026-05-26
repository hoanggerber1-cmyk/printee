import { useState, useEffect } from 'react';
import { User, ShieldCheck, Edit, Eye, Menu, X } from 'lucide-react';
import { dbSim } from '../supabaseClient';
import { SiteSettings } from '../types';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isAdmin: boolean;
  cmsEditable: boolean;
  setCmsEditable: (editable: boolean) => void;
  customerUser: { email: string; full_name: string } | null;
  adminUser: { email: string; role: string; full_name: string } | null;
  logoutCustomer: () => void;
  logoutAdmin: () => void;
}

export default function Header({
  currentPage,
  setCurrentPage,
  isAdmin,
  cmsEditable,
  setCmsEditable,
  customerUser,
  adminUser,
  logoutCustomer,
  logoutAdmin
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Tự động kéo cấu hình website từ DB (Phase 3)
  useEffect(() => {
    dbSim.settings.get().then(setSettings).catch(console.error);
  }, []);

  const navItems = [
    { id: 'home', label: 'TRANG CHỦ' },
    { id: 'catalog', label: 'CỬA HÀNG PHÔI' },
    { id: 'custom-print', label: 'TỰ THIẾT KẾ & IN' },
    { id: 'lookbook', label: 'LOOKBOOK' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-ivory border-b border-brand-charcoal/5 backdrop-blur-md">
      {/* Super Admin Status Strip */}
      {(adminUser || customerUser) && (
        <div className="bg-brand-charcoal text-brand-ivory text-xs px-4 py-2 flex justify-between items-center tracking-widest uppercase font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-gold rounded-none animate-pulse"></span>
            {adminUser ? (
              <span>ADMIN: <strong className="text-brand-gold font-semibold">{adminUser.full_name} ({adminUser.role === 'super_admin' ? 'Super_Admin' : 'Admin'})</strong></span>
            ) : (
              <span>WELCOME: <strong className="text-brand-gold font-semibold">{customerUser?.full_name}</strong></span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-sans">
            {adminUser && (
              <button
                onClick={() => setCmsEditable(!cmsEditable)}
                className={`flex items-center gap-1.5 px-3 py-1 font-semibold transition tracking-widest text-[10px] uppercase cursor-pointer ${
                  cmsEditable ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-ivory/10 text-brand-ivory hover:bg-brand-ivory/20'
                }`}
                title="Cho phép sửa đổi trực tiếp văn bản, hình ảnh trên trang chủ"
              >
                {cmsEditable ? <Edit size={11} /> : <Eye size={11} />}
                {cmsEditable ? 'CMS ACTIVE' : 'EDIT MODE'}
              </button>
            )}
            <button onClick={adminUser ? logoutAdmin : logoutCustomer} className="text-[10px] underline hover:text-brand-gold-light uppercase tracking-widest font-semibold cursor-pointer">
              LOGOUT
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand Động */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <h1 className="text-[28px] sm:text-3xl tracking-[0.2em] text-brand-charcoal font-bold mt-1 uppercase">
              {settings?.site_name || 'PRINTEE'}
            </h1>
            <p className="text-[8px] sm:text-[9px] tracking-[0.35em] font-sans text-brand-muted uppercase font-medium">
              {settings?.topbar_text || 'EST. 2026 // Luxury Studio'}
            </p>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 lg:space-x-12">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false); }}
                className={`relative py-2 text-xs font-semibold tracking-[0.25em] transition-colors duration-200 uppercase ${
                  currentPage === item.id ? 'text-brand-charcoal font-bold' : 'text-brand-charcoal/60 hover:text-brand-charcoal'
                }`}
              >
                {item.label}
                {currentPage === item.id && <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-brand-charcoal"></span>}
              </button>
            ))}
          </nav>

          {/* Action Tools */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setCurrentPage(adminUser ? 'admin' : 'account')}
              className={`p-2.5 rounded-none border transition flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase ${
                currentPage === 'admin' || currentPage === 'account' ? 'border-brand-charcoal bg-brand-charcoal text-brand-ivory' : 'border-brand-charcoal/20 text-brand-charcoal hover:border-brand-charcoal bg-transparent'
              }`}
            >
              {adminUser ? <><ShieldCheck size={14} /><span>TRANG QUẢN TRỊ</span></> : <><User size={13} /><span>{customerUser ? 'PARK / ACCOUNT' : 'ĐĂNG NHẬP'}</span></>}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button onClick={() => setCurrentPage(adminUser ? 'admin' : 'account')} className="p-1 px-3 py-1.5 border border-brand-charcoal/20 text-brand-charcoal rounded-none text-xs font-semibold flex items-center gap-1 bg-transparent">
              {adminUser ? <ShieldCheck size={14} className="text-brand-gold" /> : <User size={14} />}
              <span>{adminUser ? 'Admin' : customerUser ? 'Mở' : 'Login'}</span>
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-brand-charcoal hover:bg-brand-cream/50">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-ivory border-t border-brand-charcoal/5 py-4 px-6 space-y-3 animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2 text-xs font-semibold tracking-widest uppercase ${
                currentPage === item.id ? 'text-brand-charcoal border-l-2 border-brand-charcoal pl-2' : 'text-brand-charcoal/60 pl-2'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-brand-charcoal/5 flex flex-col gap-2">
            {!adminUser && !customerUser && (
              <button onClick={() => { setCurrentPage('account'); setMobileMenuOpen(false); }} className="w-full text-center py-3 bg-brand-charcoal text-brand-ivory text-xs tracking-widest uppercase font-semibold rounded-none cursor-pointer">
                Đăng Nhập Khách Hàng
              </button>
            )}
            <button onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }} className="w-full text-center py-3 border border-brand-charcoal text-brand-charcoal text-xs tracking-widest uppercase font-semibold rounded-none cursor-pointer">
              Quyền quản trị viên
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
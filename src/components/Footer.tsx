import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, CheckCircle2, Facebook, Instagram, Youtube, ShoppingBag, MessageCircle } from 'lucide-react';
import { dbSim } from '../supabaseClient';
import { SiteSettings } from '../types';

interface FooterProps {
  setCurrentPage: (page: string) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    dbSim.settings.get().then(setSettings).catch(console.error);
  }, []);

  // Hàm chuyển đổi số điện thoại thành định dạng link (bỏ khoảng trắng, dấu chấm)
  const formatPhoneForLink = (phone: string | undefined) => {
    if (!phone) return '';
    return phone.replace(/\D/g, ''); 
  };

  return (
    <>
      {/* --- CÁC NÚT LIÊN HỆ NỔI (FLOATING BUTTONS) --- */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50 animate-fadeIn">
        {/* Nút Zalo */}
        {settings?.zalo && (
          <a 
            href={`https://zalo.me/${formatPhoneForLink(settings.zalo)}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition hover:scale-110 cursor-pointer animate-pulse"
          >
            <MessageCircle size={24} />
            <span className="hidden sm:block font-bold text-sm pr-2 tracking-wider">ZALO NGAY</span>
          </a>
        )}
        
        {/* Nút Gọi Hotline */}
        {settings?.hotline && (
          <a 
            href={`tel:${formatPhoneForLink(settings.hotline)}`}
            className="flex items-center gap-2 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition hover:scale-110 cursor-pointer animate-bounce"
          >
            <Phone size={24} />
            <span className="hidden sm:block font-bold text-sm pr-2 tracking-wider">{settings.hotline}</span>
          </a>
        )}
      </div>

      {/* --- FOOTER CHÍNH --- */}
      <footer className="bg-brand-dark-grey text-brand-ivory border-t border-brand-charcoal pt-16 pb-8 relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Cột 1: Brand details */}
          <div className="md:col-span-1.5 space-y-4">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name} className="h-10 object-contain mb-2 bg-white/5 p-1 rounded" />
            ) : (
              <h2 className="text-2xl font-bold tracking-[0.2em] text-brand-ivory uppercase">
                {settings?.site_name || 'PRINTEE'}
              </h2>
            )}
            <p className="text-xs text-brand-muted leading-relaxed font-light">
              {settings?.company_description || 'Studio chuyên cung cấp phôi và in ấn chất lượng cao.'}
            </p>
            <div className="space-y-2 pt-2 text-xs text-brand-muted">
              <div className="flex items-center gap-2"><Mail size={14} className="text-brand-gold" /><span>{settings?.support_email || 'Email liên hệ'}</span></div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-brand-gold" /><span>{settings?.hotline || 'Hotline'}</span></div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-brand-gold" /><span>{settings?.address || 'Địa chỉ công ty'}</span></div>
            </div>
            {/* Mạng xã hội */}
            <div className="flex items-center gap-4 pt-4">
              {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-gold transition"><Facebook size={18} /></a>}
              {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-gold transition"><Instagram size={18} /></a>}
              {settings?.tiktok_url && <a href={settings.tiktok_url} target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-gold transition font-bold">TikTok</a>}
              {settings?.youtube_url && <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-gold transition"><Youtube size={18} /></a>}
              {settings?.shopee_url && <a href={settings.shopee_url} target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-gold transition"><ShoppingBag size={18} /></a>}
            </div>
          </div>

          {/* Cột 2: Quality Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-widest text-brand-gold uppercase">{settings?.footer_quality_title || 'Chất Lượng Studio'}</h3>
            <ul className="space-y-3 text-xs text-brand-muted font-light">
              <li className="flex gap-2 items-start"><CheckCircle2 size={14} className="text-brand-gold flex-shrink-0" /><span>{settings?.footer_quality_text_1 || 'Đang cập nhật...'}</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 size={14} className="text-brand-gold flex-shrink-0" /><span>{settings?.footer_quality_text_2 || 'Đang cập nhật...'}</span></li>
              <li className="flex gap-2 items-start"><CheckCircle2 size={14} className="text-brand-gold flex-shrink-0" /><span>{settings?.footer_quality_text_3 || 'Đang cập nhật...'}</span></li>
            </ul>
          </div>

          {/* Cột 3: Quick Navigate */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-widest text-brand-gold uppercase">{settings?.footer_quicklinks_title || 'Liên Kết Nhanh'}</h3>
            <ul className="space-y-2 text-xs text-brand-muted">
              <li><button onClick={() => setCurrentPage('home')} className="hover:text-brand-gold transition">Trang chủ</button></li>
              <li><button onClick={() => setCurrentPage('catalog')} className="hover:text-brand-gold transition">Cửa hàng phôi</button></li>
              <li><button onClick={() => setCurrentPage('custom-print')} className="hover:text-brand-gold transition">Đặt in tự thiết kế</button></li>
              <li><button onClick={() => setCurrentPage('lookbook')} className="hover:text-brand-gold transition">Lookbook</button></li>
              <li className="pt-2 mt-2 border-t border-brand-charcoal">
                 <button onClick={() => setCurrentPage('admin')} className="text-[10px] uppercase tracking-widest text-brand-gold font-bold hover:text-white transition">CỔNG QUẢN TRỊ VIÊN</button>
              </li>
            </ul>
          </div>

          {/* Cột 4: Newsletter */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-widest text-brand-gold uppercase">{settings?.newsletter_title || 'Bản Tin'}</h3>
            <p className="text-xs text-brand-muted leading-relaxed font-light">{settings?.newsletter_text || 'Đăng ký nhận thông tin mới nhất.'}</p>
            <div className="flex border border-brand-muted/25 bg-brand-charcoal focus-within:border-brand-gold">
              <input type="email" placeholder="Email của bạn..." className="px-3 py-2.5 text-xs bg-transparent border-none text-brand-ivory focus:outline-none w-full" />
              <button className="bg-brand-gold text-brand-charcoal px-4 hover:bg-brand-gold-light transition"><span className="text-xs font-semibold uppercase tracking-wider">Gửi</span></button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-brand-charcoal-light mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-brand-muted">
          <p>© {new Date().getFullYear()} {settings?.copyright_text || 'PRINTEE. All rights reserved.'}</p>
          <p className="mt-2 sm:mt-0 tracking-wider font-semibold text-brand-gold">{settings?.site_slogan || 'Slogan hiển thị ở đây'}</p>
        </div>
      </footer>
    </>
  );
}

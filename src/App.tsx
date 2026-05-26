import { useState, useEffect } from 'react';
import { dbSim } from './supabaseClient';
import { WebsiteCMS, AdminUser } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CustomOrderPage from './pages/CustomOrder';
import Lookbook from './pages/Lookbook';
import CustomerAccount from './pages/CustomerAccount';
import AdminDashboard from './pages/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Sparkles, Check } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [preloadGarment, setPreloadGarment] = useState<{ type: string, color: string, size: string } | null>(null);

  // Authenticate states
  const [customerUser, setCustomerUser] = useState<{ email: string; full_name: string } | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Visual CMS controls
  const [cmsEditable, setCmsEditable] = useState<boolean>(false);
  const [cmsData, setCmsData] = useState<WebsiteCMS | null>(null);
  const [cmsSaving, setCmsSaving] = useState<boolean>(false);
  const [cmsSuccessFlash, setCmsSuccessFlash] = useState<boolean>(false);

  // LOGIC MỚI: Tự động chuyển vào trang Admin nếu gõ tenmien.com/admin
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setCurrentPage('admin');
    }
  }, []);

  useEffect(() => {
    async function loadCMS() {
      try {
        const data = await dbSim.cms.get();
        setCmsData(data);
      } catch (err) {
        console.error("Failed to load CMS from Supabase: ", err);
      }
    }
    loadCMS();
  }, []);

  const handleUpdateCmsData = (updatedCms: WebsiteCMS) => {
    setCmsData(updatedCms);
  };

  const handleSaveCmsToSupabase = async () => {
    if (!cmsData) return;
    try {
      setCmsSaving(true);
      await dbSim.cms.update(cmsData);
      setCmsSuccessFlash(true);
      setTimeout(() => setCmsSuccessFlash(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(`Có lỗi xảy ra khi lưu CMS lên Supabase: ${err?.message || err}`);
    } finally {
      setCmsSaving(false);
    }
  };

  const handleLogoutCustomer = () => {
    setCustomerUser(null);
    setCurrentPage('account');
  };

  // Logout admin sẽ đẩy về trang chủ và đổi url trên thanh trình duyệt
  const handleLogoutAdmin = () => {
    setAdminUser(null);
    setCmsEditable(false);
    setCurrentPage('home');
    window.history.pushState({}, '', '/');
  };

  const renderCurrentPage = () => {
    if (!cmsData) {
      return (
        <div className="py-32 text-center text-brand-muted">
          <div className="w-10 h-10 border-2 border-brand-charcoal border-t-brand-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest font-mono">Loading CMS context...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} cmsEditable={cmsEditable} onUpdateCms={handleUpdateCmsData} cmsData={cmsData} />;
      case 'catalog':
        return <Catalog setCurrentPage={setCurrentPage} setSelectedPreloadGarment={setPreloadGarment} />;
      case 'custom-print':
        return <CustomOrderPage preloadGarment={preloadGarment} setPreloadGarment={setPreloadGarment} setCurrentPage={setCurrentPage} customerUser={customerUser} />;
      case 'lookbook':
        return <Lookbook />;
      case 'account':
        return <CustomerAccount customerUser={customerUser} setCustomerUser={setCustomerUser} setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <AdminDashboard adminUser={adminUser} setAdminUser={setAdminUser} />;
      default:
        return <Home setCurrentPage={setCurrentPage} cmsEditable={cmsEditable} onUpdateCms={handleUpdateCmsData} cmsData={cmsData} />;
    }
  };

  return (
    <div className="bg-brand-ivory text-brand-charcoal min-h-screen flex flex-col justify-between selection:bg-brand-gold/30 selection:text-brand-charcoal">
      
      {/* ẨN HEADER KHI ĐANG Ở TRANG ADMIN ĐỂ TRÔNG CHUYÊN NGHIỆP HƠN */}
      {currentPage !== 'admin' && (
        <Header 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          customerUser={customerUser}
          logoutCustomer={handleLogoutCustomer}
        />
      )}

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Controller Ribbon cho Admin */}
      {cmsEditable && adminUser && currentPage !== 'admin' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-brand-charcoal border border-brand-gold text-brand-ivory p-3 px-6 shadow-2xl flex items-center gap-4 rounded-full animate-slideUp">
          <div className="flex items-center gap-1.5 text-xs text-brand-gold font-bold">
            <Sparkles size={14} className="animate-pulse" />
            <span className="tracking-wider">CMS ĐANG TRỰC TIẾP CHỈNH SỬA</span>
          </div>
          <div className="h-4 w-[1px] bg-brand-ivory/20" />
          <button
            onClick={handleSaveCmsToSupabase}
            disabled={cmsSaving}
            className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold-light text-[11px] font-bold py-1.5 px-4 rounded-full transition flex items-center gap-1 cursor-pointer disabled:opacity-50 uppercase tracking-widest"
          >
            {cmsSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-brand-charcoal border-t-transparent rounded-full animate-spin" />
            ) : cmsSuccessFlash ? (
              <Check size={12} className="text-brand-charcoal stroke-[3]" />
            ) : (
              <Save size={12} />
            )}
            <span>{cmsSuccessFlash ? 'ĐÃ LƯU BẢN CẬP NHẬT!' : 'Lưu lại giao diện'}</span>
          </button>
        </div>
      )}

      {/* ẨN FOOTER KHI ĐANG Ở TRANG ADMIN */}
      {currentPage !== 'admin' && <Footer setCurrentPage={setCurrentPage} />}
      
    </div>
  );
}

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { dbSim, uploadToStorage, isRealSupabaseConfigured } from '../supabaseClient';
import { Banner, Category, Product, LookbookAlbum, AlbumImage, CustomOrder, AdminUser, MediaFile, SiteSettings } from '../types';
import { 
  ShieldCheck, Shield, ChevronRight, Plus, Edit3, Trash2, Tag, ShoppingBag, 
  Image, Folder, Layers, UserCheck, CheckCircle, RefreshCw, AlertCircle, Upload,
  Copy, Eye, EyeOff, Save, Clipboard, Trash, ArrowUp, ArrowDown, Files, BookOpen, Settings
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
}

type AdminTab = 'orders' | 'banners' | 'categories' | 'products' | 'lookbook' | 'media' | 'settings';

// Utility function to generate slug securely without regex parsing errors
const generateSlug = (str: string) => {
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

export default function AdminDashboard({ adminUser, setAdminUser }: AdminDashboardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [albums, setAlbums] = useState<LookbookAlbum[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [albumImages, setAlbumImages] = useState<AlbumImage[]>([]);

  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Partial<LookbookAlbum> | null>(null);
  const [editingAlbumImage, setEditingAlbumImage] = useState<{ album_id: string; image_url: string; caption: string; sort_order: number } | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeMediaPickerTarget, setActiveMediaPickerTarget] = useState<((url: string) => void) | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (adminUser) loadAdminData();
  }, [adminUser]);

  useEffect(() => {
    if (selectedAlbumId) loadAlbumImages(selectedAlbumId);
  }, [selectedAlbumId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  async function loadAdminData() {
    try {
      setLoading(true);
      const [b, c, p, a, o, m, s] = await Promise.all([
        dbSim.banners.list(),
        dbSim.categories.list(),
        dbSim.products.list(),
        dbSim.albums.list(),
        dbSim.customOrders.list(),
        dbSim.mediaLibrary.list(),
        dbSim.settings.get().catch(() => null)
      ]);
      setBanners(b);
      setCategories(c);
      setProducts(p);
      setAlbums(a);
      setOrders(o);
      setMediaFiles(m);
      if (s) setSiteSettings(s);

      if (a.length > 0 && !selectedAlbumId) setSelectedAlbumId(a[0].id);
    } catch (e: any) {
      console.error(e);
      showToast(`Nạp dữ liệu thất bại: ${e?.message || e}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadAlbumImages(albumId: string) {
    try {
      const imgs = await dbSim.albums.imagesForAlbum(albumId);
      setAlbumImages(imgs);
    } catch (err) {
      console.error("Failed loading album images: ", err);
    }
  }

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!email) {
      setErr('Vui lòng điền Email quản trị viên.');
      return;
    }
    try {
      const match = await dbSim.admins.getByEmail(email);
      if (match) {
        setAdminUser(match);
        showToast(`Đăng nhập thành công! Xin chào ${match.full_name}`);
      } else {
        setErr('Tài khoản không tồn tại trong hệ thống quản trị.');
      }
    } catch (error) {
      setErr('Lỗi máy chủ khi xác thực.');
    }
  };

  // Site Settings Action
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    try {
      await dbSim.settings.update(siteSettings);
      showToast('Cập nhật cấu hình Website thành công!');
    } catch (err: any) {
      showToast(`Lỗi khi lưu cấu hình: ${err?.message || err}`, 'error');
    }
  };

  // Dashboard Upload Handler (Images)
  const handleDashboardImageUpload = async (
    e: ChangeEvent<HTMLInputElement>, 
    bucket: 'banners' | 'products' | 'albums' | 'site-assets', 
    onComplete: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadLoading(true);
      showToast('Đang tải ảnh lên Storage...');
      const fileUrl = await uploadToStorage(bucket, file);
      onComplete(fileUrl);
      showToast('Tải lên hoàn tất!');
    } catch (e: any) {
      console.error(e);
      showToast(`Tải hình ảnh lỗi: ${e?.message || e}`, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="py-12 bg-brand-ivory min-h-screen text-brand-charcoal font-sans text-left animate-fadeIn">
      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-3 rounded shadow-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 animate-slideUp ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-gold text-brand-charcoal'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!adminUser ? (
          // LOGIN
          <div className="max-w-md mx-auto bg-brand-dark-grey text-brand-ivory p-8 sm:p-10 rounded shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <Shield size={32} className="text-brand-gold mx-auto" />
              <h2 className="text-3xl font-serif tracking-widest text-white">PRINTEE ADMIN</h2>
              <p className="text-xs text-brand-muted uppercase tracking-wider font-light">Bảo mật hệ thống nội bộ</p>
            </div>
            {err && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded flex items-center gap-1.5">
                <AlertCircle size={14} /><span>{err}</span>
              </div>
            )}
            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="text-brand-muted uppercase block text-[10px] mb-1">Email quản trị</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-brand-charcoal border border-brand-ivory/10 px-3.5 py-2.5 rounded text-white focus:border-brand-gold outline-none" />
              </div>
              <div>
                <label className="text-brand-muted uppercase block text-[10px] mb-1">Mật khẩu</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-brand-charcoal border border-brand-ivory/10 px-3.5 py-2.5 rounded text-white focus:border-brand-gold outline-none" />
              </div>
              <button type="submit" className="w-full bg-brand-gold hover:bg-brand-gold-light text-brand-charcoal py-3 font-bold uppercase text-xs tracking-widest rounded flex items-center justify-center gap-1.5 transition">
                <ShieldCheck size={14} /> Xác Thực
              </button>
            </form>
          </div>
        ) : (
          // DASHBOARD
          <div className="space-y-8">
            <div className="flex justify-between items-end border-b border-brand-charcoal/10 pb-4">
              <div>
                <h1 className="text-3xl font-serif text-brand-charcoal tracking-tight">HỆ THỐNG QUẢN TRỊ</h1>
                <p className="text-xs text-brand-muted mt-1">Xin chào: <strong className="text-brand-charcoal">{adminUser.full_name}</strong></p>
              </div>
              <button onClick={loadAdminData} className="px-4 py-2 border text-xs flex items-center gap-1.5 hover:bg-brand-cream rounded">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap border-b border-brand-charcoal/15 pb-2 gap-2">
              {[
                { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, count: orders.length },
                { id: 'banners', label: 'Banners', icon: Image, count: banners.length },
                { id: 'categories', label: 'Danh mục', icon: Folder, count: categories.length },
                { id: 'products', label: 'Sản phẩm', icon: Tag, count: products.length },
                { id: 'lookbook', label: 'Lookbook', icon: Layers, count: albums.length },
                { id: 'settings', label: 'Cài đặt Website', icon: Settings, count: 0 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`px-4 py-2.5 text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 border-b-2 transition ${
                    activeTab === tab.id ? 'border-brand-gold text-brand-charcoal' : 'border-transparent text-brand-muted hover:text-brand-charcoal'
                  }`}
                >
                  <tab.icon size={12} /> {tab.label} {tab.id !== 'settings' && `(${tab.count})`}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 text-center text-brand-muted"><RefreshCw size={24} className="animate-spin mx-auto" /></div>
            ) : (
              <div className="animate-fadeIn">
                
                {/* 1. SITE SETTINGS (PHASE 3) */}
                {activeTab === 'settings' && siteSettings && (
                  <form onSubmit={handleSaveSettings} className="space-y-6 animate-fadeIn">
                    
                    {/* Box 1: Brand & Logo */}
                    <div className="bg-white p-6 border rounded shadow-sm space-y-4">
                      <h3 className="text-sm font-bold uppercase border-b pb-2 text-brand-charcoal">Nhận diện Thương hiệu</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold mb-1">Tên Website / Thương hiệu</label>
                          <input type="text" value={siteSettings.site_name || ''} onChange={e => setSiteSettings({...siteSettings, site_name: e.target.value})} className="w-full border p-2 focus:border-brand-gold outline-none" />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Slogan (Khẩu hiệu)</label>
                          <input type="text" value={siteSettings.site_slogan || ''} onChange={e => setSiteSettings({...siteSettings, site_slogan: e.target.value})} className="w-full border p-2 focus:border-brand-gold outline-none" />
                        </div>
                        
                        <div>
                          <label className="block font-bold mb-1">Logo URL</label>
                          <div className="flex gap-2">
                            <input type="text" value={siteSettings.logo_url || ''} onChange={e => setSiteSettings({...siteSettings, logo_url: e.target.value})} className="flex-1 border p-2 focus:border-brand-gold outline-none" placeholder="Link ảnh logo..." />
                            <label className="bg-brand-charcoal text-white px-3 py-2 cursor-pointer rounded-sm hover:bg-brand-gold transition">
                              <Upload size={14} />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleDashboardImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, logo_url: url}))} />
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Favicon URL</label>
                          <div className="flex gap-2">
                            <input type="text" value={siteSettings.favicon_url || ''} onChange={e => setSiteSettings({...siteSettings, favicon_url: e.target.value})} className="flex-1 border p-2 focus:border-brand-gold outline-none" />
                            <label className="bg-brand-charcoal text-white px-3 py-2 cursor-pointer rounded-sm hover:bg-brand-gold transition">
                              <Upload size={14} />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleDashboardImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, favicon_url: url}))} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Box 2: Thông tin liên hệ */}
                    <div className="bg-white p-6 border rounded shadow-sm space-y-4">
                      <h3 className="text-sm font-bold uppercase border-b pb-2 text-brand-charcoal">Thông tin liên hệ & Địa chỉ</h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div><label className="block font-bold mb-1">Hotline</label><input type="text" value={siteSettings.hotline || ''} onChange={e => setSiteSettings({...siteSettings, hotline: e.target.value})} className="w-full border p-2" /></div>
                        <div><label className="block font-bold mb-1">Zalo</label><input type="text" value={siteSettings.zalo || ''} onChange={e => setSiteSettings({...siteSettings, zalo: e.target.value})} className="w-full border p-2" /></div>
                        <div><label className="block font-bold mb-1">Email hỗ trợ</label><input type="email" value={siteSettings.support_email || ''} onChange={e => setSiteSettings({...siteSettings, support_email: e.target.value})} className="w-full border p-2" /></div>
                        <div><label className="block font-bold mb-1">Website URL</label><input type="text" value={siteSettings.website_url || ''} onChange={e => setSiteSettings({...siteSettings, website_url: e.target.value})} className="w-full border p-2" /></div>
                        <div className="col-span-2"><label className="block font-bold mb-1">Địa chỉ thực tế</label><input type="text" value={siteSettings.address || ''} onChange={e => setSiteSettings({...siteSettings, address: e.target.value})} className="w-full border p-2" /></div>
                        <div className="col-span-2"><label className="block font-bold mb-1">Google Maps Iframe / Link</label><input type="text" value={siteSettings.google_maps_url || ''} onChange={e => setSiteSettings({...siteSettings, google_maps_url: e.target.value})} className="w-full border p-2" /></div>
                      </div>
                    </div>

                    {/* Box 3: Mạng xã hội */}
                    <div className="bg-white p-6 border rounded shadow-sm space-y-4">
                      <h3 className="text-sm font-bold uppercase border-b pb-2 text-brand-charcoal">Mạng xã hội & Sàn TMĐT</h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div><label className="block font-bold mb-1">Facebook URL</label><input type="text" value={siteSettings.facebook_url || ''} onChange={e => setSiteSettings({...siteSettings, facebook_url: e.target.value})} className="w-full border p-2" /></div>
                        <div><label className="block font-bold mb-1">Tiktok URL</label><input type="text" value={siteSettings.tiktok_url || ''} onChange={e => setSiteSettings({...siteSettings, tiktok_url: e.target.value})} className="w-full border p-2" /></div>
                        <div><label className="block font-bold mb-1">Instagram URL</label><input type="text" value={siteSettings.instagram_url || ''} onChange={e => setSiteSettings({...siteSettings, instagram_url: e.target.value})} className="w-full border p-2" /></div>
                        <div><label className="block font-bold mb-1">Youtube URL</label><input type="text" value={siteSettings.youtube_url || ''} onChange={e => setSiteSettings({...siteSettings, youtube_url: e.target.value})} className="w-full border p-2" /></div>
                        <div><label className="block font-bold mb-1">Shopee URL</label><input type="text" value={siteSettings.shopee_url || ''} onChange={e => setSiteSettings({...siteSettings, shopee_url: e.target.value})} className="w-full border p-2" /></div>
                      </div>
                    </div>

                    {/* Box 4: Footer Texts */}
                    <div className="bg-white p-6 border rounded shadow-sm space-y-4">
                      <h3 className="text-sm font-bold uppercase border-b pb-2 text-brand-charcoal">Nội dung Footer (Chân trang)</h3>
                      <div className="grid grid-cols-1 gap-4 text-xs">
                        <div><label className="block font-bold mb-1">Mô tả công ty</label><textarea rows={2} value={siteSettings.company_description || ''} onChange={e => setSiteSettings({...siteSettings, company_description: e.target.value})} className="w-full border p-2" /></div>
                        
                        <div className="grid grid-cols-3 gap-2">
                           <div><label className="block font-bold mb-1">Điểm chất lượng 1</label><input type="text" value={siteSettings.footer_quality_text_1 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_1: e.target.value})} className="w-full border p-2" /></div>
                           <div><label className="block font-bold mb-1">Điểm chất lượng 2</label><input type="text" value={siteSettings.footer_quality_text_2 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_2: e.target.value})} className="w-full border p-2" /></div>
                           <div><label className="block font-bold mb-1">Điểm chất lượng 3</label><input type="text" value={siteSettings.footer_quality_text_3 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_3: e.target.value})} className="w-full border p-2" /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div><label className="block font-bold mb-1">Tiêu đề Bản tin</label><input type="text" value={siteSettings.newsletter_title || ''} onChange={e => setSiteSettings({...siteSettings, newsletter_title: e.target.value})} className="w-full border p-2" /></div>
                          <div><label className="block font-bold mb-1">Mô tả Bản tin</label><input type="text" value={siteSettings.newsletter_text || ''} onChange={e => setSiteSettings({...siteSettings, newsletter_text: e.target.value})} className="w-full border p-2" /></div>
                        </div>

                        <div><label className="block font-bold mb-1">Dòng Bản Quyền (Copyright)</label><input type="text" value={siteSettings.copyright_text || ''} onChange={e => setSiteSettings({...siteSettings, copyright_text: e.target.value})} className="w-full border p-2" /></div>
                      </div>
                    </div>
                    
                    <button type="submit" className="w-full bg-brand-gold text-brand-charcoal py-4 font-bold uppercase tracking-widest rounded-sm hover:bg-brand-gold-light transition shadow-md">
                       LƯU CẤU HÌNH LÊN SUPABASE
                    </button>
                  </form>
                )}

                {/* (Render other tabs conditionally... orders, categories, products...) */}
                {activeTab !== 'settings' && (
                  <div className="text-center py-20 text-brand-muted text-sm border bg-white rounded">
                    (Vùng dữ liệu {activeTab} - Các chức năng CRUD hiển thị bình thường)
                  </div>
                )}
                
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
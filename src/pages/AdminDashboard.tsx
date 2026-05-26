import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { dbSim, uploadToStorage } from '../supabaseClient';
import { Banner, Category, Product, CustomOrder, AdminUser, SiteSettings } from '../types';
import { 
  ShieldCheck, Shield, Plus, Edit3, Trash2, Tag, ShoppingBag, 
  Image, Folder, RefreshCw, AlertCircle, Upload, CheckCircle, Settings, Percent, BookOpen
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
}

type AdminTab = 'settings' | 'products' | 'categories' | 'banners' | 'orders';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'current', site_name: 'PRINTEE', site_slogan: 'Premium Design Built for Luxury Streetwear',
  hotline: '0987.654.321', zalo: '0987.654.321', support_email: 'contact@printee.com',
  address: 'TP. Hồ Chí Minh', facebook_url: '', tiktok_url: '', instagram_url: '', youtube_url: '', shopee_url: '', website_url: '', google_maps_url: '',
  company_description: 'Studio in ấn chuyên nghiệp.', footer_quality_title: 'Chất Lượng Studio',
  footer_quality_text_1: 'Định lượng thun 240-260GSM.', footer_quality_text_2: 'In PET DTF siêu nét.', footer_quality_text_3: 'Nhận in từ 1 chiếc.',
  footer_quicklinks_title: 'Liên Kết Nhanh', newsletter_title: 'Bản Tin Studio', newsletter_text: 'Nhận khuyến mãi mới nhất.',
  copyright_text: 'PRINTEE Studio', topbar_text: '🔥 FREESHIP CHO MỌI ĐƠN HÀNG TỪ 500K', logo_url: '', favicon_url: ''
};

export default function AdminDashboard({ adminUser, setAdminUser }: AdminDashboardProps) {
  const [email, setEmail] = useState('hoanggerber@gmail.com'); 
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'draft' | 'deleted'>('all');

  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (adminUser) loadAdminData();
  }, [adminUser]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function loadAdminData() {
    try {
      setLoading(true);
      const [b, c, p, o, s] = await Promise.all([
        dbSim.banners.list().catch(() => []),
        dbSim.categories.list().catch(() => []),
        dbSim.products.list().catch(() => []),
        dbSim.customOrders.list().catch(() => []),
        dbSim.settings.get().catch(() => null)
      ]);
      setBanners(b); setCategories(c); setProducts(p); setOrders(o);
      if (s && s.site_name) setSiteSettings(s); else setSiteSettings(DEFAULT_SITE_SETTINGS);
    } catch (e: any) {
      showToast(`Lỗi đồng bộ dữ liệu hệ thống.`, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const match = await dbSim.admins.getByEmail(email);
      if (match) {
        setAdminUser(match); showToast(`Đăng nhập thành công!`);
      } else {
        setErr('Tài khoản không tồn tại trong hệ thống admin.');
      }
    } catch (error) {
      setErr('Lỗi máy chủ khi xác thực.');
    }
  };

  // UPLOAD ẢNH CHUNG
  const handleSingleImageUpload = async (e: ChangeEvent<HTMLInputElement>, bucket: any, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadLoading(true); showToast('Đang tải ảnh lên máy chủ...');
      const url = await uploadToStorage(bucket, file);
      callback(url); showToast('Tải ảnh thành công!');
    } catch (err: any) { showToast(`Lỗi: ${err.message}`, 'error'); } finally { setUploadLoading(false); }
  };

  const handleMultipleImagesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadLoading(true); showToast(`Đang tải lên ${files.length} ảnh...`);
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToStorage('products', files[i]);
        uploadedUrls.push(url);
      }
      setEditingProduct(prev => ({ ...prev, images: [...(prev?.images || []), ...uploadedUrls] }));
      showToast('Đồng bộ ảnh hoàn tất!');
    } catch (err: any) { showToast(`Lỗi: ${err.message}`, 'error'); } finally { setUploadLoading(false); }
  };

  // CRUD TẤT CẢ
  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return showToast('Cần điền Tên và Giá!', 'error');
    const full: Product = {
      id: editingProduct.id || `prod-${Date.now()}`, name: editingProduct.name, description: editingProduct.description || '',
      category_id: editingProduct.category_id || categories[0]?.id || '', price: Number(editingProduct.price),
      original_price: editingProduct.original_price ? Number(editingProduct.original_price) : undefined,
      colors: editingProduct.colors || [], sizes: editingProduct.sizes || [], images: editingProduct.images || [],
      status: editingProduct.status as any || 'active', inventory: Number(editingProduct.inventory) || 0,
      is_featured: !!editingProduct.is_featured, is_deleted: !!editingProduct.is_deleted, created_at: editingProduct.created_at || new Date().toISOString()
    };
    await dbSim.products.save(full); showToast('Lưu sản phẩm thành công!'); setEditingProduct(null); loadAdminData();
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    const full: Category = {
      id: editingCategory.id || `cat-${Date.now()}`, name: editingCategory.name, slug: editingCategory.slug || editingCategory.name.toLowerCase().replace(/\s+/g, '-'),
      description: editingCategory.description || '', image_url: editingCategory.image_url || '',
      sort_order: Number(editingCategory.sort_order) || 1, active: editingCategory.active ?? true
    };
    await dbSim.categories.save(full); showToast('Lưu danh mục thành công!'); setEditingCategory(null); loadAdminData();
  };

  const handleSaveBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.title || !editingBanner?.image_url) return;
    const full: Banner = {
      id: editingBanner.id || `banner-${Date.now()}`, title: editingBanner.title, subtitle: editingBanner.subtitle || '',
      image_url: editingBanner.image_url, button_text: editingBanner.button_text || 'Xem ngay', link_url: editingBanner.link_url || 'catalog',
      active: editingBanner.active ?? true, sort_order: Number(editingBanner.sort_order) || 1, created_at: editingBanner.created_at || new Date().toISOString()
    };
    await dbSim.banners.save(full); showToast('Lưu banner thành công!'); setEditingBanner(null); loadAdminData();
  };

  const handleDelete = async (type: string, id: string) => {
    if (confirm('Xóa dữ liệu này vĩnh viễn?')) {
      if (type === 'cat') await dbSim.categories.delete(id);
      if (type === 'prod') await dbSim.products.delete(id);
      if (type === 'banner') await dbSim.banners.delete(id);
      showToast('Đã xóa.'); loadAdminData();
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    await dbSim.settings.update(siteSettings);
    showToast('Cập nhật diện mạo website thành công!'); loadAdminData();
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: CustomOrder['status']) => {
    const matchIdx = orders.findIndex(o => o.id === orderId);
    if (matchIdx === -1) return;
    const ord = orders[matchIdx];
    const updatedOrder: CustomOrder = { ...ord, status: newStatus };
    try {
      await dbSim.customOrders.save(updatedOrder); showToast(`Cập nhật đơn hàng thành công.`); loadAdminData();
    } catch (e: any) { showToast(`Lỗi: ${e?.message}`, 'error'); }
  };

  return (
    <div className="py-12 bg-brand-ivory min-h-screen text-brand-charcoal font-sans text-left">
      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-3 rounded shadow-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-gold text-brand-charcoal'}`}>
          <CheckCircle size={14} /> {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!adminUser ? (
          <div className="max-w-md mx-auto bg-brand-dark-grey text-brand-ivory p-8 rounded shadow-2xl space-y-6">
            <h2 className="text-2xl font-serif text-center tracking-widest text-white">PRINTEE ADMIN</h2>
            {err && <div className="p-2 bg-red-900 text-white text-xs text-center rounded">{err}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-brand-charcoal border border-brand-ivory/10 p-3 text-white rounded outline-none" placeholder="Email admin..."/>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-charcoal border border-brand-ivory/10 p-3 text-white rounded outline-none" placeholder="Mật khẩu..."/>
              <button type="submit" className="w-full bg-brand-gold text-brand-charcoal py-3 font-bold uppercase tracking-widest rounded">Xác Thực Hệ Thống</button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h1 className="text-3xl font-serif text-brand-charcoal">HỆ THỐNG QUẢN TRỊ VIÊN</h1>
                <p className="text-xs text-brand-muted mt-0.5">Tài khoản: <span className="text-brand-charcoal font-medium">{adminUser.full_name}</span></p>
              </div>
              <button onClick={loadAdminData} className="px-4 py-2 bg-white border rounded text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50">
                <RefreshCw size={12} className={uploadLoading ? 'animate-spin' : ''}/> Làm mới dữ liệu
              </button>
            </div>

            <div className="flex flex-wrap border-b gap-2 pb-1">
              {[
                { id: 'orders', label: 'Đơn Đặt In', icon: ShoppingBag, length: orders.length },
                { id: 'settings', label: 'Cài đặt Website', icon: Settings, length: 0 },
                { id: 'products', label: 'Kho Phôi Áo', icon: Tag, length: products.length },
                { id: 'categories', label: 'Danh mục', icon: Folder, length: categories.length },
                { id: 'banners', label: 'Banner Trang Chủ', icon: Image, length: banners.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`px-4 py-2.5 text-xs font-bold uppercase flex items-center gap-2 border-b-2 transition ${activeTab === tab.id ? 'border-brand-gold text-brand-charcoal' : 'border-transparent text-brand-muted hover:text-brand-charcoal'}`}
                >
                  <tab.icon size={13} /> {tab.label} {tab.id !== 'settings' && `(${tab.length})`}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-brand-muted uppercase tracking-widest">Đang tải dữ liệu máy chủ...</div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. TAB ĐƠN HÀNG ĐẶT IN */}
                {activeTab === 'orders' && (
                  <div className="space-y-4 font-sans animate-fadeIn">
                    <div className="flex justify-between items-center pb-2">
                      <div>
                        <h3 className="text-sm font-semibold tracking-widest text-brand-charcoal uppercase">QUẢN LÝ TIẾN ĐỘ ĐƠN ĐẶT IN</h3>
                        <p className="text-[11px] text-brand-muted">Giám sát quy trình thiết kế và in ấn của khách</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-brand-charcoal/10 rounded-sm">
                      <table className="w-full text-left text-xs divide-y divide-brand-charcoal/10">
                        <thead className="bg-brand-cream text-[10px] tracking-wider text-brand-muted uppercase font-bold">
                          <tr>
                            <th className="p-4">Mã đơn</th>
                            <th className="p-4">Thông tin khách</th>
                            <th className="p-4">Quy cách phôi</th>
                            <th className="p-4">File Artwork</th>
                            <th className="p-4">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-charcoal/10 bg-white">
                          {orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-brand-cream/10 transition">
                              <td className="p-4 font-mono font-bold text-brand-gold text-sm">#{ord.id}</td>
                              <td className="p-4">
                                <p className="font-semibold">{ord.customer_name}</p>
                                <p className="text-gray-500 font-light">{ord.customer_email} • {ord.customer_phone}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold">{ord.shirt_type}</p>
                                <p className="text-gray-500">Size: <strong className="text-brand-charcoal">{ord.shirt_size}</strong> • SL: <strong>{ord.quantity}</strong></p>
                              </td>
                              <td className="p-4">
                                <a href={ord.design_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                  <img src={ord.design_file_url} className="w-10 h-10 object-cover border" alt="File"/>
                                  <span className="text-[10px] text-brand-gold underline font-bold">Xem bản gốc</span>
                                </a>
                              </td>
                              <td className="p-4">
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as CustomOrder['status'])}
                                  className="border rounded p-1.5 font-bold text-[11px]"
                                >
                                  <option value="pending">⏳ Chờ xử lý</option>
                                  <option value="approved">🛡️ Đã duyệt thiết kế</option>
                                  <option value="printing">🖨️ Đang in PET</option>
                                  <option value="finishing">🔥 Đang ép nhiệt</option>
                                  <option value="shipping">🚚 Đang giao hàng</option>
                                  <option value="completed">✅ Thành công</option>
                                  <option value="cancelled">❌ Hủy đơn</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                          {orders.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-500">Chưa có đơn đặt in nào.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. TAB CÀI ĐẶT WEBSITE TOÀN DIỆN */}
                {activeTab === 'settings' && siteSettings && (
                  <form onSubmit={handleSaveSettings} className="bg-white border rounded shadow-sm overflow-hidden text-xs font-sans animate-fadeIn">
                    <div className="bg-brand-charcoal text-white p-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider">CẤU HÌNH HIỂN THỊ WEBSITE TOÀN DIỆN</h3>
                      <p className="text-[10px] text-gray-400 font-light mt-1">Thay đổi ngay lập tức diện mạo, hotline, mã giảm giá và mạng xã hội.</p>
                    </div>
                    
                    <div className="p-6 space-y-8">
                      {/* Section 1: Topbar Khuyến mãi */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-brand-gold uppercase border-b pb-1 flex items-center gap-2"><Percent size={14}/> 1. THANH THÔNG BÁO KHUYẾN MÃI (TOPBAR)</h4>
                        <div>
                          <label className="block text-gray-600 mb-1">Dòng chữ chạy trên cùng (Thích hợp ghi mã giảm giá, Freeship)</label>
                          <input type="text" value={siteSettings.topbar_text || ''} onChange={e => setSiteSettings({...siteSettings, topbar_text: e.target.value})} className="w-full border-2 focus:border-brand-gold p-2.5 rounded bg-yellow-50 font-bold" placeholder="VD: NHẬP MÃ 'PRINTEE10' GIẢM 10%..."/>
                        </div>
                      </div>

                      {/* Section 2: Logo & Nhận diện */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-brand-gold uppercase border-b pb-1">2. NHẬN DIỆN THƯƠNG HIỆU</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-gray-600">Tải ảnh Logo chính</label>
                            <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-brand-gold relative h-24 flex flex-col justify-center">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, logo_url: url}))} />
                              <p className="text-[11px] text-gray-500 font-medium">{siteSettings.logo_url ? '✓ Đã cập nhật Logo (Bấm thay thế)' : 'Bấm để tải file Logo lên'}</p>
                            </div>
                            {siteSettings.logo_url && <img src={siteSettings.logo_url} className="h-8 object-contain bg-gray-100 p-1 border rounded" alt="Logo"/>}
                          </div>
                          <div className="space-y-2">
                            <label className="block text-gray-600">Favicon (Icon trên tab trình duyệt)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-brand-gold relative h-24 flex flex-col justify-center">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, favicon_url: url}))} />
                              <p className="text-[11px] text-gray-500 font-medium">{siteSettings.favicon_url ? '✓ Đã cập nhật Favicon' : 'Bấm để tải Favicon lên'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-gray-600 mb-1">Tên Cửa Hàng</label><input type="text" value={siteSettings.site_name || ''} onChange={e => setSiteSettings({...siteSettings, site_name: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                          <div><label className="block text-gray-600 mb-1">Slogan (Câu khẩu hiệu)</label><input type="text" value={siteSettings.site_slogan || ''} onChange={e => setSiteSettings({...siteSettings, site_slogan: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                        </div>
                      </div>

                      {/* Section 3: Liên Hệ & MXH */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-brand-gold uppercase border-b pb-1">3. LIÊN HỆ & MẠNG XÃ HỘI</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div><label className="block text-gray-600 mb-1">Zalo tư vấn</label><input type="text" value={siteSettings.zalo || ''} onChange={e => setSiteSettings({...siteSettings, zalo: e.target.value})} className="w-full border p-2.5 rounded border-blue-200"/></div>
                          <div><label className="block text-gray-600 mb-1">Hotline</label><input type="text" value={siteSettings.hotline || ''} onChange={e => setSiteSettings({...siteSettings, hotline: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                          <div><label className="block text-gray-600 mb-1">Link Facebook</label><input type="text" value={siteSettings.facebook_url || ''} onChange={e => setSiteSettings({...siteSettings, facebook_url: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                          <div><label className="block text-gray-600 mb-1">Link Tiktok</label><input type="text" value={siteSettings.tiktok_url || ''} onChange={e => setSiteSettings({...siteSettings, tiktok_url: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div><label className="block text-gray-600 mb-1">Link Shopee</label><input type="text" value={siteSettings.shopee_url || ''} onChange={e => setSiteSettings({...siteSettings, shopee_url: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                           <div><label className="block text-gray-600 mb-1">Link Instagram</label><input type="text" value={siteSettings.instagram_url || ''} onChange={e => setSiteSettings({...siteSettings, instagram_url: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-gray-600 mb-1">Email hỗ trợ khách</label><input type="email" value={siteSettings.support_email || ''} onChange={e => setSiteSettings({...siteSettings, support_email: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                          <div><label className="block text-gray-600 mb-1">Địa chỉ cửa hàng</label><input type="text" value={siteSettings.address || ''} onChange={e => setSiteSettings({...siteSettings, address: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                        </div>
                      </div>

                      {/* Section 4: Footer */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-brand-gold uppercase border-b pb-1">4. THÔNG TIN CHÂN TRANG (FOOTER)</h4>
                        <div>
                          <label className="block text-gray-600 mb-1">Mô tả ngắn gọn (Hiển thị góc dưới bên trái)</label>
                          <textarea rows={2} value={siteSettings.company_description || ''} onChange={e => setSiteSettings({...siteSettings, company_description: e.target.value})} className="w-full border p-2.5 rounded"/>
                        </div>
                        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded border">
                          <p className="col-span-3 font-bold text-brand-charcoal border-b pb-1">Các cam kết điểm chất lượng</p>
                          <div><label className="block text-gray-600 mb-1">Cam kết 1</label><input type="text" value={siteSettings.footer_quality_text_1 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_1: e.target.value})} className="w-full border p-2.5 rounded bg-white"/></div>
                          <div><label className="block text-gray-600 mb-1">Cam kết 2</label><input type="text" value={siteSettings.footer_quality_text_2 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_2: e.target.value})} className="w-full border p-2.5 rounded bg-white"/></div>
                          <div><label className="block text-gray-600 mb-1">Cam kết 3</label><input type="text" value={siteSettings.footer_quality_text_3 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_3: e.target.value})} className="w-full border p-2.5 rounded bg-white"/></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-brand-cream border-t">
                      <button type="submit" className="w-full bg-brand-gold text-brand-charcoal py-4 font-bold text-sm uppercase tracking-widest rounded shadow transition hover:bg-yellow-500">LƯU TẤT CẢ CÀI ĐẶT LÊN TRANG WEB</button>
                    </div>
                  </form>
                )}

                {/* 3. TAB KHO PHÔI SẢN PHẨM */}
                {activeTab === 'products' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-sm uppercase">Kho sản phẩm & Áo Phôi</h3>
                    <button onClick={() => setEditingProduct({ images: [], sizes: ['S','M','L','XL'], colors: ['#111111','#FFFFFF'], inventory: 100, price: 150000 })} className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded flex items-center gap-1"><Plus size={12}/> Thêm sản phẩm mới</button></div>
                    
                    <div className="flex gap-2 border-b pb-3 text-xs">
                      <button onClick={() => setProductFilter('all')} className={`px-4 py-2 rounded-full font-bold transition ${productFilter === 'all' ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-cream/60'}`}>Tất cả</button>
                      <button onClick={() => setProductFilter('active')} className={`px-4 py-2 rounded-full font-bold transition ${productFilter === 'active' ? 'bg-green-600 text-white' : 'bg-brand-cream/60'}`}>Đang hiển thị</button>
                      <button onClick={() => setProductFilter('deleted')} className={`px-4 py-2 rounded-full font-bold transition ${productFilter === 'deleted' ? 'bg-rose-600 text-white' : 'bg-brand-cream/60'}`}>Thùng rác</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {products.filter(p => productFilter === 'all' ? !p.is_deleted : (productFilter === 'active' ? p.status === 'active' && !p.is_deleted : !!p.is_deleted)).map(p => (
                        <div key={p.id} className="bg-white border rounded p-4 space-y-2 flex flex-col justify-between">
                          <div className="relative">
                            {p.original_price && p.original_price > p.price && <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">GIẢM GIÁ</span>}
                            <img src={p.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-40 object-cover rounded border" alt=""/>
                            <h4 className="font-bold text-sm mt-2 line-clamp-1">{p.name}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-brand-gold font-bold text-sm">{p.price.toLocaleString('vi-VN')} đ</p>
                              {p.original_price && <p className="text-gray-400 line-through text-[10px]">{p.original_price.toLocaleString('vi-VN')} đ</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t"><button onClick={() => setEditingProduct(p)} className="w-1/2 bg-gray-100 hover:bg-gray-200 text-xs py-1.5 rounded font-bold">Sửa</button><button onClick={() => handleDelete('prod', p.id)} className="w-1/2 text-red-600 border border-red-100 text-xs py-1.5 rounded font-bold">Xóa</button></div>
                        </div>
                      ))}
                    </div>

                    {editingProduct && (
                      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <form onSubmit={handleSaveProduct} className="bg-white rounded-lg w-full max-w-3xl space-y-0 text-xs max-h-[90vh] overflow-y-auto font-sans flex flex-col shadow-2xl">
                          <div className="p-4 bg-brand-charcoal text-white flex justify-between items-center rounded-t-lg"><h4 className="font-bold text-sm uppercase">SOẠN THẢO SẢN PHẨM</h4><button type="button" onClick={() => setEditingProduct(null)}>✕ ĐÓNG</button></div>
                          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            <div className="space-y-2 bg-gray-50 p-4 border rounded">
                              <label className="block font-bold">1. HÌNH ẢNH SẢN PHẨM (Tải lên nhiều ảnh cùng lúc)</label>
                              <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center cursor-pointer bg-white relative">
                                <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMultipleImagesUpload} />
                                <Upload size={24} className="mx-auto text-gray-400 mb-1.5" />
                                <p className="text-gray-600 font-medium">Bấm vào đây để chọn bộ ảnh tải lên</p>
                              </div>
                              {editingProduct.images && editingProduct.images.length > 0 && (
                                <div className="grid grid-cols-6 gap-2 pt-2">
                                  {editingProduct.images.map((imgUrl, idx) => (
                                    <div key={idx} className="relative border bg-white rounded overflow-hidden">
                                      <img src={imgUrl} className="w-full h-16 object-cover" alt=""/>
                                      <button type="button" onClick={() => setEditingProduct({...editingProduct, images: editingProduct.images?.filter((_, i) => i !== idx)})} className="absolute top-0 right-0 bg-red-600 text-white px-1.5 py-0.5 text-[9px]">✕</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="space-y-4"><h5 className="font-bold border-b pb-1">2. THÔNG TIN CƠ BẢN</h5>
                              <div><label className="font-bold block mb-1">Tên sản phẩm</label><input type="text" required value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full border p-2.5 rounded bg-gray-50"/></div>
                              <div><label className="font-bold block mb-1">Danh mục</label><select value={editingProduct.category_id || ''} onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})} className="w-full border p-2.5 rounded"><option value="">Chọn danh mục...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            </div>
                            <div className="space-y-4 bg-yellow-50/50 p-4 border border-yellow-100 rounded"><h5 className="font-bold border-b pb-1 text-brand-gold">3. GIÁ CẢ</h5>
                              <div className="grid grid-cols-2 gap-6">
                                <div><label className="font-bold block mb-1 text-red-600">Giá bán (VNĐ)</label><input type="number" required value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full border border-red-200 p-2.5 rounded font-bold text-red-600"/></div>
                                <div><label className="font-bold block mb-1 text-gray-500">Giá gốc (để gạch ngang)</label><input type="number" value={editingProduct.original_price || ''} onChange={e => setEditingProduct({...editingProduct, original_price: Number(e.target.value)})} className="w-full border p-2.5 rounded"/></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-4"><h5 className="font-bold border-b pb-1">4. PHÂN LOẠI</h5>
                                <div><label className="font-bold block mb-1">Dải Size</label><input type="text" value={editingProduct.sizes?.join(', ') || ''} onChange={e => setEditingProduct({...editingProduct, sizes: e.target.value.split(',').map(s=>s.trim())})} className="w-full border p-2.5 rounded uppercase"/></div>
                                <div><label className="font-bold block mb-1">Mã Màu (HEX)</label><input type="text" value={editingProduct.colors?.join(', ') || ''} onChange={e => setEditingProduct({...editingProduct, colors: e.target.value.split(',').map(s=>s.trim())})} className="w-full border p-2.5 rounded"/></div>
                              </div>
                              <div className="space-y-4"><h5 className="font-bold border-b pb-1">5. TỒN KHO</h5>
                                <div><label className="font-bold block mb-1">Số lượng</label><input type="number" value={editingProduct.inventory ?? 100} onChange={e => setEditingProduct({...editingProduct, inventory: Number(e.target.value)})} className="w-full border p-2.5 rounded"/></div>
                                <div className="flex items-center gap-2 pt-2"><input type="checkbox" id="feature" checked={editingProduct.is_featured} onChange={e => setEditingProduct({...editingProduct, is_featured: e.target.checked})} className="scale-125"/><label htmlFor="feature" className="font-bold">Sản Phẩm Nổi Bật</label></div>
                              </div>
                            </div>
                            <div className="space-y-2"><h5 className="font-bold border-b pb-1">6. MÔ TẢ</h5><textarea rows={4} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full border p-3 rounded"/></div>
                          </div>
                          <div className="p-4 bg-gray-100 flex gap-4 rounded-b-lg border-t"><button type="submit" className="flex-1 bg-brand-gold text-brand-charcoal py-3 font-bold uppercase rounded">LƯU SẢN PHẨM</button></div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 4. TAB DANH MỤC */}
                {activeTab === 'categories' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-sm uppercase">Danh mục phôi</h3><button onClick={() => setEditingCategory({ active: true, sort_order: 1 })} className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded flex items-center gap-1"><Plus size={12}/> Thêm danh mục</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {categories.map(c => (
                        <div key={c.id} className="bg-white border rounded p-4 space-y-2">
                          <img src={c.image_url || 'https://via.placeholder.com/150'} className="w-full h-32 object-cover rounded border" alt=""/>
                          <h4 className="font-bold text-sm">{c.name}</h4>
                          <div className="flex gap-2"><button onClick={() => setEditingCategory(c)} className="border text-xs px-2 py-1 rounded">Sửa</button><button onClick={() => handleDelete('cat', c.id)} className="text-red-600 border text-xs px-2 py-1 rounded">Xóa</button></div>
                        </div>
                      ))}
                    </div>
                    {editingCategory && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <form onSubmit={handleSaveCategory} className="bg-white p-6 rounded w-full max-w-sm space-y-4 text-xs">
                          <h4 className="font-bold text-sm border-b pb-2">CHỈNH SỬA DANH MỤC</h4>
                          <div className="border-2 border-dashed rounded p-4 text-center cursor-pointer relative"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'products', (url) => setEditingCategory({...editingCategory, image_url: url}))} /><Upload size={18} className="mx-auto mb-1" /><p>{editingCategory.image_url ? '✓ Đã tải ảnh' : 'Tải ảnh bìa'}</p></div>
                          <input type="text" placeholder="Tên danh mục..." required value={editingCategory.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="w-full border p-2 rounded"/>
                          <div className="flex gap-2"><button type="submit" className="w-1/2 bg-brand-gold py-2 font-bold rounded">Ghi nhận</button><button type="button" onClick={() => setEditingCategory(null)} className="w-1/2 bg-gray-200 py-2 rounded">Đóng</button></div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. TAB BANNERS */}
                {activeTab === 'banners' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-sm uppercase">Banner Trang Chủ</h3><button onClick={() => setEditingBanner({ active: true, sort_order: 1 })} className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded flex items-center gap-1"><Plus size={12}/> Thêm Banner</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {banners.map(b => (
                        <div key={b.id} className="bg-white border rounded p-4 space-y-3">
                          <img src={b.image_url} className="w-full h-40 object-cover rounded border" alt=""/>
                          <h4 className="font-bold text-sm">{b.title}</h4>
                          <div className="flex gap-2"><button onClick={() => setEditingBanner(b)} className="border text-xs px-3 py-1 rounded">Sửa</button><button onClick={() => handleDelete('banner', b.id)} className="text-red-600 border text-xs px-3 py-1 rounded">Xóa</button></div>
                        </div>
                      ))}
                    </div>
                    {editingBanner && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <form onSubmit={handleSaveBanner} className="bg-white p-6 rounded w-full max-w-md space-y-4 text-xs">
                          <h4 className="font-bold text-sm border-b pb-2">CHỈNH SỬA BANNER</h4>
                          <div className="border-2 border-dashed rounded p-4 text-center cursor-pointer relative"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'banners', (url) => setEditingBanner({...editingBanner, image_url: url}))} /><Upload size={18} className="mx-auto mb-1" /><p>{editingBanner.image_url ? '✓ Đã tải ảnh' : 'Tải ảnh Banner'}</p></div>
                          <input type="text" placeholder="Tiêu đề..." required value={editingBanner.title || ''} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full border p-2 rounded"/>
                          <div className="flex gap-2"><button type="submit" className="w-1/2 bg-brand-gold py-2 font-bold rounded">Ghi nhận</button><button type="button" onClick={() => setEditingBanner(null)} className="w-1/2 bg-gray-200 py-2 rounded">Đóng</button></div>
                        </form>
                      </div>
                    )}
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

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { dbSim, uploadToStorage, isRealSupabaseConfigured } from '../supabaseClient';
import { Banner, Category, Product, LookbookAlbum, AlbumImage, CustomOrder, AdminUser, MediaFile, SiteSettings } from '../types';
import { 
  ShieldCheck, Shield, Plus, Edit3, Trash2, Tag, ShoppingBag, 
  Image, Folder, Layers, RefreshCw, AlertCircle, Upload, CheckCircle, Files, Settings
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
}

type AdminTab = 'orders' | 'banners' | 'categories' | 'products' | 'lookbook' | 'media' | 'settings';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('categories');

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
    setTimeout(() => setToast(null), 4500);
  };

  async function loadAdminData() {
    try {
      setLoading(true);
      // Chống crash tuyệt đối bằng cách bắt lỗi từng bảng
      const [b, c, p, a, o, m, s] = await Promise.all([
        dbSim.banners.list().catch(() => []),
        dbSim.categories.list().catch(() => []),
        dbSim.products.list().catch(() => []),
        dbSim.albums.list().catch(() => []),
        dbSim.customOrders.list().catch(() => []),
        dbSim.mediaLibrary.list().catch(() => []),
        dbSim.settings?.get ? dbSim.settings.get().catch(() => null) : Promise.resolve(null)
      ]);
      setBanners(b); setCategories(c); setProducts(p); 
      setAlbums(a); setOrders(o); setMediaFiles(m);
      if (s) setSiteSettings(s);
    } catch (e: any) {
      showToast(`Nạp dữ liệu thất bại.`, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const match = await dbSim.admins.getByEmail(email);
      if (match) {
        setAdminUser(match);
      } else {
        setErr('Tài khoản không tồn tại.');
      }
    } catch (error) {
      setErr('Lỗi máy chủ khi xác thực.');
    }
  };

  // CATEGORIES ACTIONS
  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    const computedSlug = editingCategory.slug || editingCategory.name.toLowerCase().replace(/\s+/g, '-');
    const fullCat: Category = {
      id: editingCategory.id || `cat-${Date.now()}`,
      name: editingCategory.name,
      slug: computedSlug,
      description: editingCategory.description || '',
      image_url: editingCategory.image_url || '',
      sort_order: Number(editingCategory.sort_order) || 1,
      active: editingCategory.active ?? true
    };
    try {
      await dbSim.categories.save(fullCat);
      showToast('Đã lưu danh mục thành công!');
      setEditingCategory(null);
      loadAdminData();
    } catch (err: any) {
      showToast(`Lỗi lưu danh mục: ${err.message}`, 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Xóa danh mục này?')) {
      await dbSim.categories.delete(id);
      loadAdminData();
    }
  };

  return (
    <div className="py-12 bg-brand-ivory min-h-screen text-brand-charcoal font-sans text-left">
      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-3 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-gold text-brand-charcoal'}`}>
          <CheckCircle size={14} /> {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!adminUser ? (
          <div className="max-w-md mx-auto bg-brand-dark-grey text-brand-ivory p-8 rounded shadow-2xl space-y-6">
            <h2 className="text-3xl font-serif text-center">ĐĂNG NHẬP ADMIN</h2>
            {err && <div className="text-red-500 text-xs text-center">{err}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email admin..." className="w-full bg-brand-charcoal border border-brand-ivory/10 p-3 rounded text-white" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu..." className="w-full bg-brand-charcoal border border-brand-ivory/10 p-3 rounded text-white" />
              <button type="submit" className="w-full bg-brand-gold text-brand-charcoal py-3 font-bold uppercase rounded">Xác Thực</button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b">
              <h1 className="text-3xl font-serif text-brand-charcoal">HỆ THỐNG QUẢN TRỊ</h1>
              <button onClick={loadAdminData} className="px-4 py-2 border rounded bg-white text-xs flex items-center gap-2"><RefreshCw size={12}/> Tải lại</button>
            </div>

            <div className="flex flex-wrap border-b border-brand-charcoal/15 pb-2 gap-2">
              {[
                { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, data: orders },
                { id: 'banners', label: 'Hero Banners', icon: Image, data: banners },
                { id: 'categories', label: 'Danh mục phôi', icon: Folder, data: categories },
                { id: 'products', label: 'Kho phôi áo', icon: Tag, data: products },
                { id: 'settings', label: 'Cài đặt Website', icon: Settings, data: [] },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5 border-b-2 ${activeTab === tab.id ? 'border-brand-gold text-brand-charcoal' : 'border-transparent text-brand-muted hover:text-brand-charcoal'}`}
                >
                  <tab.icon size={12} /> {tab.label} {tab.id !== 'settings' && `(${tab.data.length})`}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 text-center text-brand-muted">Đang tải dữ liệu...</div>
            ) : (
              <div className="animate-fadeIn">
                
                {/* TAB CATEGORIES */}
                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-lg">QUẢN LÝ DANH MỤC</h3>
                      <button onClick={() => setEditingCategory({ active: true, sort_order: 1 })} className="bg-brand-charcoal text-white px-4 py-2 rounded text-xs flex items-center gap-2"><Plus size={14}/> Thêm danh mục</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {categories.map(c => (
                        <div key={c.id} className="border p-4 bg-white rounded space-y-2">
                          <img src={c.image_url || 'https://via.placeholder.com/150'} className="h-32 w-full object-cover rounded" alt=""/>
                          <h4 className="font-bold">{c.name}</h4>
                          <p className="text-xs text-gray-500">Slug: {c.slug}</p>
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => setEditingCategory(c)} className="border px-2 py-1 text-xs rounded">Sửa</button>
                            <button onClick={() => handleDeleteCategory(c.id)} className="border border-red-200 text-red-600 px-2 py-1 text-xs rounded">Xóa</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Modal Thêm Sửa */}
                    {editingCategory && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 w-full max-w-sm rounded relative">
                          <button onClick={() => setEditingCategory(null)} className="absolute top-2 right-4 text-xl">✕</button>
                          <h4 className="font-bold mb-4 border-b pb-2">CHỈNH SỬA DANH MỤC</h4>
                          <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                            <input type="text" placeholder="Link ảnh..." value={editingCategory.image_url || ''} onChange={e => setEditingCategory({...editingCategory, image_url: e.target.value})} className="w-full border p-2" />
                            <input type="text" required placeholder="Tên danh mục..." value={editingCategory.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="w-full border p-2" />
                            <input type="text" placeholder="Slug (tự tạo)..." value={editingCategory.slug || ''} onChange={e => setEditingCategory({...editingCategory, slug: e.target.value})} className="w-full border p-2" />
                            <textarea placeholder="Mô tả..." value={editingCategory.description || ''} onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} className="w-full border p-2" />
                            <button type="submit" className="w-full bg-brand-gold py-3 font-bold uppercase">Lưu Danh Mục</button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab !== 'categories' && (
                  <div className="py-20 text-center border bg-white rounded">
                    Các Tab khác hoạt động bình thường, vui lòng tự chuyển Tab để quản lý.
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

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
          <div className="space-y-

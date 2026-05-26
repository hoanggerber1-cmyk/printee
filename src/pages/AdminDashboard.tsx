import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { dbSim, uploadToStorage } from '../supabaseClient';
import { Banner, Category, Product, LookbookAlbum, CustomOrder, AdminUser, SiteSettings } from '../types';
import { 
  ShieldCheck, Shield, Plus, Edit3, Trash2, Tag, ShoppingBag, 
  Image, Folder, Layers, RefreshCw, AlertCircle, Upload, CheckCircle, Settings, X, Eye
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
}

type AdminTab = 'orders' | 'banners' | 'categories' | 'products' | 'settings';

export default function AdminDashboard({ adminUser, setAdminUser }: AdminDashboardProps) {
  const [email, setEmail] = useState('hoanggerber@gmail.com'); 
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('categories');

  // Form State Modals
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  
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
      setBanners(b);
      setCategories(c);
      setProducts(p);
      setOrders(o);
      if (s) setSiteSettings(s);
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
        setAdminUser(match);
        showToast(`Đăng nhập thành công!`);
      } else {
        setErr('Tài khoản không tồn tại trong hệ thống admin.');
      }
    } catch (error) {
      setErr('Lỗi máy chủ khi xác thực.');
    }
  };

  // --- UPLOAD SINGLE HỖ TRỢ (BANNER, CATEGORY, LOGO) ---
  const handleSingleImageUpload = async (e: ChangeEvent<HTMLInputElement>, bucket: any, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadLoading(true);
      showToast('Đang tải ảnh lên Supabase Storage...');
      const url = await uploadToStorage(bucket, file);
      callback(url);
      showToast('Tải lên ảnh thành công!');
    } catch (err: any) {
      showToast(`Lỗi tải ảnh: ${err.message}`, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  // --- UPLOAD NHIỀU ẢNH CÙNG LÚC (PRODUCTS) ---
  const handleMultipleImagesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadLoading(true);
      showToast(`Đang tải lên đồng loạt ${files.length} tập tin ảnh...`);
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToStorage('products', files[i]);
        uploadedUrls.push(url);
      }
      setEditingProduct(prev => ({
        ...prev,
        images: [...(prev?.images || []), ...uploadedUrls]
      }));
      showToast('Đã đồng bộ toàn bộ ảnh lên Supabase thành công!');
    } catch (err: any) {
      showToast(`Lỗi tải cụm tập tin: ${err.message}`, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  // --- CRUD ACTIONS BANNERS ---
  const handleSaveBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.title || !editingBanner?.image_url) {
      showToast('Vui lòng nhập tiêu đề và tải ảnh banner lên!', 'error');
      return;
    }
    const full: Banner = {
      id: editingBanner.id || `banner-${Date.now()}`,
      title: editingBanner.title,
      subtitle: editingBanner.subtitle || '',
      image_url: editingBanner.image_url,
      button_text: editingBanner.button_text || 'Xem ngay',
      link_url: editingBanner.link_url || 'catalog',
      active: editingBanner.active ?? true,
      sort_order: Number(editingBanner.sort_order) || 1,
      created_at: editingBanner.created_at || new Date().toISOString()
    };
    await dbSim.banners.save(full);
    showToast('Lưu banner lên Supabase thành công!');
    setEditingBanner(null); loadAdminData();
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm('Xóa banner này vĩnh viễn?')) {
      await dbSim.banners.delete(id); showToast('Đã xóa.'); loadAdminData();
    }
  };

  // --- CRUD ACTIONS CATEGORIES ---
  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    const slug = editingCategory.slug || editingCategory.name.toLowerCase().replace(/\s+/g, '-');
    const full: Category = {
      id: editingCategory.id || `cat-${Date.now()}`,
      name: editingCategory.name,
      slug: slug,
      description: editingCategory.description || '',
      image_url: editingCategory.image_url || '',
      sort_order: Number(editingCategory.sort_order) || 1,
      active: editingCategory.active ?? true
    };
    await dbSim.categories.save(full);
    showToast('Lưu danh mục thành công!');
    setEditingCategory(null); loadAdminData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Xóa danh mục này?')) {
      await dbSim.categories.delete(id); showToast('Đã xóa.'); loadAdminData();
    }
  };

  // --- CRUD ACTIONS PRODUCTS ---
  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) {
      showToast('Vui lòng điền tên và giá phôi áo!', 'error');
      return;
    }
    const full: Product = {
      id: editingProduct.id || `prod-${Date.now()}`,
      name: editingProduct.name,
      description: editingProduct.description || '',
      category_id: editingProduct.category_id || categories[0]?.id || '',
      price: Number(editingProduct.price),
      original_price: editingProduct.original_price ? Number(editingProduct.original_price) : undefined,
      colors: editingProduct.colors || ['#111111'],
      sizes: editingProduct.sizes || ['S', 'M', 'L', 'XL'],
      images: editingProduct.images || [],
      status: editingProduct.status as any || 'active',
      inventory: Number(editingProduct.inventory) || 100,
      is_featured: !!editingProduct.is_featured,
      is_deleted: !!editingProduct.is_deleted,
      created_at: editingProduct.created_at || new Date().toISOString()
    };
    await dbSim.products.save(full);
    showToast('Cập nhật kho phôi sản phẩm thành công!');
    setEditingProduct(null); loadAdminData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Xóa sản phẩm này vĩnh viễn khỏi hệ thống?')) {
      await dbSim.products.delete(id); showToast('Đã hủy mẫu phôi.'); loadAdminData();
    }
  };

  // --- SAVE SITE SETTINGS ---
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    await dbSim.settings.update(siteSettings);
    showToast('Đã ghi nhận cấu hình website động thành công!');
    loadAdminData();
  };

  const handleUpdateOrderStatus = async (id: string, stat: any) => {
    const match = orders.find(o => o.id === id);
    if (!match) return;
    await dbSim.customOrders.save({ ...match, status: stat });
    showToast('Cập nhật trạng thái vận đơn thành công.');
    loadAdminData();
  };

  return (
    <div className="py-12 bg-brand-ivory min-h-screen text-brand-charcoal font-sans text-left select-none">
      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-3 rounded shadow-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-gold text-brand-charcoal'}`}>
          <CheckCircle size={14} /> {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!adminUser ? (
          /* MÀN HÌNH ĐĂNG NHẬP */
          <div className="max-w-md mx-auto bg-brand-dark-grey text-brand-ivory p-8 rounded shadow-2xl space-y-6">
            <h2 className="text-2xl font-serif text-center tracking-widest text-white">PRINTEE CONTROL PANEL</h2>
            {err && <div className="p-2 bg-red-900 text-white text-xs text-center rounded">{err}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-brand-charcoal border border-brand-ivory/10 p-3 text-white rounded outline-none" placeholder="Email admin..."/>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-charcoal border border-brand-ivory/10 p-3 text-white rounded outline-none" placeholder="Mật khẩu..."/>
              <button type="submit" className="w-full bg-brand-gold text-brand-charcoal py-3 font-bold uppercase tracking-widest rounded">Xác Thực Hệ Thống</button>
            </form>
          </div>
        ) : (
          /* GIAO DIỆN QUẢN TRỊ CHÍNH */
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h1 className="text-3xl font-serif text-brand-charcoal">HỆ THỐNG QUẢN TRỊ TRỰC TUYẾN</h1>
                <p className="text-xs text-brand-muted mt-0.5">Tài khoản: <span className="text-brand-charcoal font-medium">{adminUser.full_name}</span></p>
              </div>
              <button onClick={loadAdminData} className="px-4 py-2 bg-white border rounded text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50"><RefreshCw size={12} className={uploadLoading ? 'animate-spin' : ''}/> Đồng bộ Supabase</button>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="flex flex-wrap border-b gap-2 pb-1">
              {[
                { id: 'orders', label: 'Đơn hàng đặt in', icon: ShoppingBag, length: orders.length },
                { id: 'banners', label: 'Hero Banners', icon: Image, length: banners.length },
                { id: 'categories', label: 'Danh mục phôi', icon: Folder, length: categories.length },
                { id: 'products', label: 'Kho phôi quần áo', icon: Tag, length: products.length },
                { id: 'settings', label: 'Cài đặt Website', icon: Settings, length: 0 },
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
              <div className="py-20 text-center text-xs text-brand-muted uppercase tracking-widest">Đang kết xuất luồng dữ liệu...</div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. TAB ĐƠN HÀNG */}
                {activeTab === 'orders' && (
                  <div className="bg-white border rounded overflow-hidden">
                    <table className="w-full text-xs text-left divide-y">
                      <thead className="bg-brand-cream text-brand-muted uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-4">Mã đơn</th>
                          <th className="p-4">Thông tin khách</th>
                          <th className="p-4">Quy cách phôi áo</th>
                          <th className="p-4">File in Artwork</th>
                          <th className="p-4">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map(o => (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="p-4 font-mono font-bold text-brand-gold">#{o.id}</td>
                            <td className="p-4">
                              <p className="font-bold">{o.customer_name}</p>
                              <p className="text-gray-500 font-light">{o.customer_email} • {o.customer_phone}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium">{o.shirt_type}</p>
                              <p className="text-gray-500">Size: {o.shirt_size} • Số lượng: {o.quantity} cái</p>
                            </td>
                            <td className="p-4">
                              <a href={o.design_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-gold underline font-mono text-[11px]">
                                <img src={o.design_file_url} className="w-8 h-8 object-cover border" alt=""/> Xem file gốc
                              </a>
                            </td>
                            <td className="p-4">
                              <select value={o.status} onChange={e => handleUpdateOrderStatus(o.id, e.target.value)} className="border p-1.5 text-[11px] rounded bg-white">
                                <option value="pending">⏳ Chờ xử lý</option>
                                <option value="printing">🖨️ Đang in PET</option>
                                <option value="completed">✅ Thành công</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. TAB HERO BANNERS */}
                {activeTab === 'banners' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-sm uppercase">Quản lý Slider</h3><button onClick={() => setEditingBanner({ active: true, sort_order: 1 })} className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded flex items-center gap-1"><Plus size={12}/> Thêm Banner</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {banners.map(b => (
                        <div key={b.id} className="bg-white border rounded p-4 space-y-3">
                          <img src={b.image_url} className="w-full h-40 object-cover rounded border" alt=""/>
                          <h4 className="font-bold text-sm">{b.title}</h4>
                          <div className="flex gap-2"><button onClick={() => setEditingBanner(b)} className="border text-xs px-3 py-1 rounded">Sửa</button><button onClick={() => handleDeleteBanner(b.id)} className="text-red-600 border text-xs px-3 py-1 rounded">Xóa</button></div>
                        </div>
                      ))}
                    </div>
                    {editingBanner && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <form onSubmit={handleSaveBanner} className="bg-white p-6 rounded w-full max-w-md space-y-4 text-xs">
                          <h4 className="font-bold text-sm border-b pb-2">CHỈNH SỬA HERO BANNER</h4>
                          <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Tải ảnh mẫu lên Supabase Storage</label>
                            <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer bg-gray-50 hover:border-brand-gold relative">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'banners', (url) => setEditingBanner({...editingBanner, image_url: url}))} />
                              <Upload size={18} className="mx-auto text-gray-400 mb-1" />
                              <p className="text-gray-500 text-[11px]">{editingBanner.image_url ? '✓ Đã đồng bộ ảnh lên hệ thống' : 'Nhấp chọn tệp ảnh để tải lên trực tiếp'}</p>
                            </div>
                          </div>
                          <input type="text" placeholder="Tiêu đề chính banner..." required value={editingBanner.title || ''} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full border p-2 rounded"/>
                          <input type="text" placeholder="Mô tả phụ..." value={editingBanner.subtitle || ''} onChange={e => setEditingBanner({...editingBanner, subtitle: e.target.value})} className="w-full border p-2 rounded"/>
                          <div className="flex gap-2">
                             <button type="submit" className="w-1/2 bg-brand-gold text-brand-charcoal py-2 font-bold rounded">Lưu trữ</button>
                             <button type="button" onClick={() => setEditingBanner(null)} className="w-1/2 bg-gray-200 py-2 rounded">Hủy</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TAB DANH MỤC PHÔI */}
                {activeTab === 'categories' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-sm uppercase">Nhóm vải và phôi in</h3><button onClick={() => setEditingCategory({ active: true, sort_order: 1 })} className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded flex items-center gap-1"><Plus size={12}/> Thêm danh mục</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {categories.map(c => (
                        <div key={c.id} className="bg-white border rounded p-4 space-y-2">
                          <img src={c.image_url || 'https://via.placeholder.com/150'} className="w-full h-32 object-cover rounded border" alt=""/>
                          <h4 className="font-bold text-sm">{c.name}</h4>
                          <div className="flex gap-2"><button onClick={() => setEditingCategory(c)} className="border text-xs px-2 py-1 rounded">Sửa</button><button onClick={() => handleDeleteCategory(c.id)} className="text-red-600 border text-xs px-2 py-1 rounded">Xóa</button></div>
                        </div>
                      ))}
                    </div>
                    {editingCategory && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <form onSubmit={handleSaveCategory} className="bg-white p-6 rounded w-full max-w-sm space-y-4 text-xs">
                          <h4 className="font-bold text-sm border-b pb-2">CHỈNH SỬA DANH MỤC</h4>
                          <div className="space-y-1">
                            <label className="block font-bold text-gray-700">Hình đại diện danh mục</label>
                            <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer bg-gray-50 hover:border-brand-gold relative">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'products', (url) => setEditingCategory({...editingCategory, image_url: url}))} />
                              <Upload size={18} className="mx-auto text-gray-400 mb-1" />
                              <p className="text-gray-500 text-[11px]">{editingCategory.image_url ? '✓ Đã tải lên ảnh đại diện' : 'Bấm để tải ảnh bìa'}</p>
                            </div>
                          </div>
                          <input type="text" placeholder="Tên danh mục phôi..." required value={editingCategory.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="w-full border p-2 rounded"/>
                          <div className="flex gap-2">
                             <button type="submit" className="w-1/2 bg-brand-gold py-2 font-bold rounded">Ghi nhận</button>
                             <button type="button" onClick={() => setEditingCategory(null)} className="w-1/2 bg-gray-200 py-2 rounded">Đóng</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TAB KHO PHÔI SẢN PHẨM (HỖ TRỢ MULTI-UPLOAD TRỰC TIẾP) */}
                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-sm uppercase">Dải phôi áo thun & hoodies sỉ</h3><button onClick={() => setEditingProduct({ images: [], sizes: ['S','M','L','XL'], colors: ['#111111'], inventory: 100 })} className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded flex items-center gap-1"><Plus size={12}/> Thêm sản phẩm phôi</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {products.map(p => (
                        <div key={p.id} className="bg-white border rounded p-4 space-y-2 flex flex-col justify-between">
                          <div>
                            <img src={p.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-36 object-cover rounded border" alt=""/>
                            <h4 className="font-bold text-sm mt-2 line-clamp-1">{p.name}</h4>
                            <p className="text-brand-gold font-bold text-xs">{p.price.toLocaleString('vi-VN')} đ</p>
                          </div>
                          <div className="flex gap-2 pt-2 border-t"><button onClick={() => setEditingProduct(p)} className="w-1/2 border text-xs py-1 rounded">Sửa</button><button onClick={() => handleDeleteProduct(p.id)} className="w-1/2 text-red-600 border text-xs py-1 rounded">Hủy vĩnh viễn</button></div>
                        </div>
                      ))}
                    </div>
                    {editingProduct && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded w-full max-w-lg space-y-4 text-xs max-h-[85vh] overflow-y-auto font-sans">
                          <h4 className="font-bold text-sm border-b pb-2 uppercase tracking-wide">Chỉnh sửa thông số phôi áo</h4>
                          
                          {/* KHU VỰC MULTIPLE UPLOAD CHỌN NHIỀU ẢNH CÙNG LÚC */}
                          <div className="space-y-2">
                            <label className="block font-bold text-brand-charcoal">Tải lên bộ ảnh sản phẩm (Có thể chọn nhiều tệp cùng lúc)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:border-brand-gold relative">
                              <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMultipleImagesUpload} />
                              <Upload size={24} className="mx-auto text-gray-400 mb-1.5" />
                              <p className="text-gray-600 font-medium">Nhấp hoặc kéo thả nhiều ảnh thời trang vào đây</p>
                              <p className="text-gray-400 text-[10px] mt-0.5">Hệ thống tự động đồng bộ hóa lên Supabase Storage</p>
                            </div>
                            
                            {/* Bảng xem trước mảng bộ ảnh hiện tại */}
                            {editingProduct.images && editingProduct.images.length > 0 && (
                              <div className="grid grid-cols-5 gap-2 pt-2 bg-gray-50 p-2 border rounded">
                                {editingProduct.images.map((imgUrl, idx) => (
                                  <div key={idx} className="relative group border bg-white rounded-sm overflow-hidden">
                                    <img src={imgUrl} className="w-full h-12 object-cover" alt=""/>
                                    <button type="button" onClick={() => setEditingProduct({...editingProduct, images: editingProduct.images?.filter((_, i) => i !== idx)})} className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl text-[9px]">✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <input type="text" placeholder="Tên phôi áo..." required value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full border p-2 rounded"/>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="font-bold block mb-1">Giá bán phôi (đ)</label><input type="number" required value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full border p-2 rounded"/></div>
                            <div><label className="font-bold block mb-1">Số lượng trong kho</label><input type="number" value={editingProduct.inventory ?? 100} onChange={e => setEditingProduct({...editingProduct, inventory: Number(e.target.value)})} className="w-full border p-2 rounded"/></div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="font-bold block mb-1">Dải Size (cách nhau bằng dấu phẩy)</label><input type="text" value={editingProduct.sizes?.join(', ') || ''} onChange={e => setEditingProduct({...editingProduct, sizes: e.target.value.split(',').map(s=>s.trim())})} className="w-full border p-2 rounded font-mono"/></div>
                            <div><label className="font-bold block mb-1">Mục Danh mục thuộc về</label>
                              <select value={editingProduct.category_id || ''} onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})} className="w-full border p-2 rounded bg-white">
                                <option value="">Chọn danh mục...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          </div>

                          <textarea placeholder="Mô tả chất vải thun, thông số định lượng GSM..." rows={3} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full border p-2 rounded font-sans"/>

                          <div className="flex gap-2 pt-2 border-t">
                             <button type="submit" className="w-1/2 bg-brand-gold text-brand-charcoal py-2.5 font-bold uppercase rounded-sm shadow">LƯU TRỮ KHO HÀNG</button>
                             <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 bg-gray-200 py-2.5 rounded-sm">HỦY THAO TÁC</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. TAB CÀI ĐẶT WEBSITE TOÀN CỤC */}
                {activeTab === 'settings' && siteSettings && (
                  <form onSubmit={handleSaveSettings} className="bg-white p-6 border rounded shadow-sm space-y-6 text-xs font-sans animate-fadeIn">
                    <h3 className="text-sm font-bold uppercase tracking-wider border-b pb-2 text-brand-charcoal">Cấu hình thông tin hệ thống động</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Upload nhận diện */}
                      <div className="space-y-1.5">
                        <label className="block font-bold">Hình ảnh Logo chính</label>
                        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer bg-gray-50 hover:border-brand-gold relative">
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, logo_url: url}))} />
                          <p className="text-[11px] text-gray-500">{siteSettings.logo_url ? '✓ Đã cập nhật Logo trên mây' : 'Nhấp để upload file Logo mới'}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-bold">Biểu tượng Favicon URL</label>
                        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer bg-gray-50 hover:border-brand-gold relative">
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, favicon_url: url}))} />
                          <p className="text-[11px] text-gray-500">{siteSettings.favicon_url ? '✓ Đã cập nhật Favicon' : 'Nhấp để tải lên Favicon tab'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div><label className="block font-bold mb-1">Tên Thương Hiệu</label><input type="text" value={siteSettings.site_name || ''} onChange={e => setSiteSettings({...siteSettings, site_name: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Dòng Khẩu Hiệu Slogan</label><input type="text" value={siteSettings.site_slogan || ''} onChange={e => setSiteSettings({...siteSettings, site_slogan: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Thông báo Topbar</label><input type="text" value={siteSettings.topbar_text || ''} onChange={e => setSiteSettings({...siteSettings, topbar_text: e.target.value})} className="w-full border p-2 rounded"/></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><label className="block font-bold mb-1">Số điện thoại Hotline</label><input type="text" value={siteSettings.hotline || ''} onChange={e => setSiteSettings({...siteSettings, hotline: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Số điện thoại Zalo</label><input type="text" value={siteSettings.zalo || ''} onChange={e => setSiteSettings({...siteSettings, zalo: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Email hỗ trợ</label><input type="email" value={siteSettings.support_email || ''} onChange={e => setSiteSettings({...siteSettings, support_email: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Địa chỉ xưởng in chính</label><input type="text" value={siteSettings.address || ''} onChange={e => setSiteSettings({...siteSettings, address: e.target.value})} className="w-full border p-2 rounded"/></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                      <div><label className="block font-bold mb-1">Link Facebook</label><input type="text" value={siteSettings.facebook_url || ''} onChange={e => setSiteSettings({...siteSettings, facebook_url: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Link TikTok</label><input type="text" value={siteSettings.tiktok_url || ''} onChange={e => setSiteSettings({...siteSettings, tiktok_url: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Link Instagram</label><input type="text" value={siteSettings.instagram_url || ''} onChange={e => setSiteSettings({...siteSettings, instagram_url: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Link Shopee</label><input type="text" value={siteSettings.shopee_url || ''} onChange={e => setSiteSettings({...siteSettings, shopee_url: e.target.value})} className="w-full border p-2 rounded"/></div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <label className="block font-bold">Mô tả tóm tắt Studio (Dành cho chân trang Footer)</label>
                      <textarea value={siteSettings.company_description || ''} onChange={e => setSiteSettings({...siteSettings, company_description: e.target.value})} rows={2} className="w-full border p-2 rounded font-sans"/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div><label className="block font-bold mb-1">Điểm chất lượng 1</label><input type="text" value={siteSettings.footer_quality_text_1 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_1: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Điểm chất lượng 2</label><input type="text" value={siteSettings.footer_quality_text_2 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_2: e.target.value})} className="w-full border p-2 rounded"/></div>
                      <div><label className="block font-bold mb-1">Điểm chất lượng 3</label><input type="text" value={siteSettings.footer_quality_text_3 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_3: e.target.value})} className="w-full border p-2 rounded"/></div>
                    </div>

                    <button type="submit" className="w-full bg-brand-charcoal text-white py-3.5 font-bold uppercase tracking-widest rounded shadow-md hover:bg-brand-gold hover:text-brand-charcoal transition">ĐỒNG BỘ TOÀN BỘ CẤU HÌNH WEBSITE ĐỘNG LÊN SUPABASE</button>
                  </form>
                )}

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

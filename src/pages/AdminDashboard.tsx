import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { dbSim, uploadToStorage } from '../supabaseClient';
import { Banner, Category, Product, CustomOrder, AdminUser, SiteSettings } from '../types';
import { 
  Plus, Edit3, Trash2, Tag, ShoppingBag, Image, Folder, RefreshCw, 
  Upload, CheckCircle, Settings, Percent
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
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  
  const [orderFilter, setOrderFilter] = useState<'all' | 'custom' | 'blank'>('all');
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'draft' | 'deleted'>('all');

  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingOrder, setEditingOrder] = useState<Partial<CustomOrder> | null>(null);
  
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
    setErr(''); 
    try {
      const match = await dbSim.admins.getByEmail(email) as any;
      if (match) {
        if (match.password === password) {
          setAdminUser(match); 
          showToast(`Đăng nhập thành công!`);
        } else {
          setErr('Mật khẩu không chính xác. Vui lòng nhập lại!');
        }
      } else {
        setErr('Tài khoản không tồn tại trong hệ thống admin.');
      }
    } catch (error) {
      setErr('Lỗi máy chủ khi xác thực.');
    }
  };

  const handleSingleImageUpload = async (e: ChangeEvent<HTMLInputElement>, bucket: any, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadLoading(true); showToast('Đang tải ảnh lên máy chủ...');
      const url = await uploadToStorage(bucket, file);
      callback(url); showToast('Tải ảnh thành công!');
    } catch (err: any) { showToast(`Lỗi: ${err.message}`, 'error'); } finally { setUploadLoading(false); }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return showToast('Cần điền Tên và Giá!', 'error');
    
    // Lọc lại những màu sắc chưa up ảnh hoặc ảnh chưa có màu
    const finalColors: string[] = [];
    const finalImages: string[] = [];
    
    (editingProduct.colors || []).forEach((color, i) => {
      const img = (editingProduct.images || [])[i];
      if (color && img) {
        finalColors.push(color);
        finalImages.push(img);
      }
    });

    if (finalColors.length === 0) {
      return showToast('Vui lòng thêm ít nhất 1 màu và tải lên 1 ảnh cho màu đó!', 'error');
    }
    
    const finalCategoryId = editingProduct.category_id || (categories.length > 0 ? categories[0].id : '');
    
    const full: Product = {
      id: editingProduct.id || `prod-${Date.now()}`, 
      name: editingProduct.name, 
      description: editingProduct.description || '',
      category_id: finalCategoryId, 
      price: Number(editingProduct.price),
      original_price: editingProduct.original_price ? Number(editingProduct.original_price) : undefined,
      colors: finalColors, // Lưu mảng màu đã làm sạch
      sizes: editingProduct.sizes || ['S', 'M', 'L', 'XL'], 
      images: finalImages, // Lưu mảng ảnh đã làm sạch
      status: editingProduct.status as any || 'active', 
      inventory: Number(editingProduct.inventory) || 0,
      is_featured: !!editingProduct.is_featured, 
      is_deleted: !!editingProduct.is_deleted, 
      created_at: editingProduct.created_at || new Date().toISOString()
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
      showToast('Đã xóa dữ liệu.'); loadAdminData();
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    await dbSim.settings.update(siteSettings);
    showToast('Cập nhật diện mạo website thành công!'); loadAdminData();
  };

  const isBlankOrder = (o: CustomOrder) => o.customer_email === 'khachvanglai@printee.com' || o.design_file_name?.includes('Mua phôi trơn');
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: CustomOrder['status']) => {
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;
    try {
      await dbSim.customOrders.save({ ...ord, status: newStatus }); 
      showToast(`Cập nhật trạng thái đơn thành công.`); loadAdminData();
    } catch (e: any) { showToast(`Lỗi: ${e?.message}`, 'error'); }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA ĐƠN HÀNG NÀY? Thao tác này không thể hoàn tác!')) {
      try {
        await dbSim.customOrders.delete(orderId);
        showToast('Đã xóa đơn hàng vĩnh viễn!'); loadAdminData();
      } catch (e: any) { showToast(`Lỗi xóa: ${e.message}`, 'error'); }
    }
  };

  const handleSaveEditedOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingOrder?.id) return;
    try {
      await dbSim.customOrders.save(editingOrder as CustomOrder);
      showToast('Đã cập nhật thông tin đơn hàng thành công!');
      setEditingOrder(null);
      loadAdminData();
    } catch (err: any) { showToast(`Lỗi: ${err.message}`, 'error'); }
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
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-charcoal border border-brand-ivory/10 p-3 text-white rounded outline-none" placeholder="Mật khẩu (ví dụ: admin123)"/>
              <button type="submit" className="w-full bg-brand-gold text-brand-charcoal py-3 font-bold uppercase tracking-widest rounded hover:bg-yellow-500 transition">Xác Thực Hệ Thống</button>
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
                
                {/* TAB ĐƠN HÀNG */}
                {activeTab === 'orders' && (
                  <div className="space-y-4 font-sans animate-fadeIn">
                    
                    <div className="flex justify-between items-center pb-2">
                      <div>
                        <h3 className="text-sm font-semibold tracking-widest text-brand-charcoal uppercase">QUẢN LÝ TIẾN ĐỘ ĐƠN HÀNG</h3>
                        <p className="text-[11px] text-brand-muted">Giám sát quy trình thiết kế, in ấn và giao hàng</p>
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs">
                      <button onClick={() => setOrderFilter('all')} className={`px-4 py-2 rounded-full font-bold transition ${orderFilter === 'all' ? 'bg-brand-charcoal text-white' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>Tất cả Đơn ({orders.length})</button>
                      <button onClick={() => setOrderFilter('custom')} className={`px-4 py-2 rounded-full font-bold transition ${orderFilter === 'custom' ? 'bg-brand-gold text-brand-charcoal shadow-sm' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>Đơn Có Hình In ({orders.filter(o => !isBlankOrder(o)).length})</button>
                      <button onClick={() => setOrderFilter('blank')} className={`px-4 py-2 rounded-full font-bold transition ${orderFilter === 'blank' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>Đơn Mua Phôi Trơn ({orders.filter(o => isBlankOrder(o)).length})</button>
                    </div>

                    <div className="overflow-x-auto border border-brand-charcoal/10 rounded-sm">
                      <table className="w-full text-left text-xs divide-y divide-brand-charcoal/10">
                        <thead className="bg-brand-cream text-[10px] tracking-wider text-brand-muted uppercase font-bold">
                          <tr>
                            <th className="p-4">Mã Đơn / Phân Loại</th>
                            <th className="p-4">Thông tin khách</th>
                            <th className="p-4">Sản Phẩm & Size</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-charcoal/10 bg-white">
                          {orders.filter(o => {
                            if (orderFilter === 'custom') return !isBlankOrder(o);
                            if (orderFilter === 'blank') return isBlankOrder(o);
                            return true;
                          }).map((ord) => (
                            <tr key={ord.id} className="hover:bg-brand-cream/10 transition">
                              <td className="p-4">
                                <span className="font-mono font-bold text-brand-charcoal block mb-1">#{ord.id}</span>
                                {isBlankOrder(ord) ? (
                                   <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase">MUA PHÔI TRƠN</span>
                                ) : (
                                   <span className="bg-brand-gold/30 text-brand-charcoal px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase">IN THEO YÊU CẦU</span>
                                )}
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-sm">{ord.customer_name}</p>
                                <p className="text-gray-500 font-mono mt-0.5">{ord.customer_phone}</p>
                                <p className="text-gray-400 font-light mt-0.5 line-clamp-1" title={ord.customer_address}>{ord.customer_address}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-bold">{ord.shirt_type}</p>
                                <p className="text-gray-500 mt-0.5">Size: <strong className="text-black">{ord.shirt_size}</strong> • SL: <strong>{ord.quantity}</strong></p>
                                {!isBlankOrder(ord) && (
                                  <a href={ord.design_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 underline font-bold mt-1 hover:text-blue-800">
                                    <Image size={10}/> Xem Hình In
                                  </a>
                                )}
                              </td>
                              <td className="p-4">
                                <select value={ord.status} onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as CustomOrder['status'])} className="border rounded p-1.5 font-bold text-[10px] bg-gray-50 cursor-pointer">
                                  <option value="pending">⏳ Chờ xử lý</option>
                                  <option value="approved">🛡️ Đã duyệt thiết kế</option>
                                  <option value="printing">🖨️ Đang in / Ép</option>
                                  <option value="shipping">🚚 Đang giao hàng</option>
                                  <option value="completed">✅ Đã hoàn thành</option>
                                  <option value="cancelled">❌ Hủy đơn</option>
                                </select>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => setEditingOrder(ord)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded" title="Sửa chi tiết"><Edit3 size={14} /></button>
                                  <button onClick={() => handleDeleteOrder(ord.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded" title="Xóa vĩnh viễn"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {orders.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-500">Chưa có dữ liệu đơn hàng.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* MODAL SỬA ĐƠN HÀNG */}
                {editingOrder && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn">
                    <form onSubmit={handleSaveEditedOrder} className="bg-white rounded-lg w-full max-w-xl text-xs overflow-hidden shadow-2xl">
                      <div className="p-4 bg-brand-charcoal text-white flex justify-between items-center">
                        <h4 className="font-bold text-sm uppercase tracking-wide">CHỈNH SỬA CHI TIẾT ĐƠN HÀNG</h4>
                        <button type="button" onClick={() => setEditingOrder(null)} className="text-gray-300 hover:text-white">✕ ĐÓNG</button>
                      </div>
                      <div className="p-6 space-y-4 font-sans">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="font-bold block mb-1">Tên khách hàng</label><input type="text" value={editingOrder.customer_name || ''} onChange={e => setEditingOrder({...editingOrder, customer_name: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                          <div><label className="font-bold block mb-1">Số điện thoại</label><input type="text" value={editingOrder.customer_phone || ''} onChange={e => setEditingOrder({...editingOrder, customer_phone: e.target.value})} className="w-full border p-2.5 rounded font-mono"/></div>
                        </div>
                        <div><label className="font-bold block mb-1">Địa chỉ giao hàng</label><input type="text" value={editingOrder.customer_address || ''} onChange={e => setEditingOrder({...editingOrder, customer_address: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="font-bold block mb-1">Trạng thái đơn</label>
                            <select value={editingOrder.status} onChange={e => setEditingOrder({...editingOrder, status: e.target.value as any})} className="w-full border p-2.5 rounded font-bold">
                               <option value="pending">⏳ Chờ xử lý</option>
                               <option value="approved">🛡️ Đã duyệt thiết kế</option>
                               <option value="printing">🖨️ Đang in / Ép nhiệt</option>
                               <option value="shipping">🚚 Đang giao hàng</option>
                               <option value="completed">✅ Đã hoàn thành</option>
                               <option value="cancelled">❌ Đã hủy đơn</option>
                            </select>
                          </div>
                          <div><label className="font-bold block mb-1">Tổng Tiền (VNĐ)</label><input type="number" value={editingOrder.price_calc || 0} onChange={e => setEditingOrder({...editingOrder, price_calc: Number(e.target.value)})} className="w-full border p-2.5 rounded text-red-600 font-bold"/></div>
                        </div>
                        
                        <div><label className="font-bold block mb-1">Ghi chú của đơn hàng</label><textarea rows={3} value={editingOrder.notes || ''} onChange={e => setEditingOrder({...editingOrder, notes: e.target.value})} className="w-full border p-2.5 rounded"/></div>
                      </div>
                      <div className="p-4 bg-gray-100 flex gap-4">
                        <button type="submit" className="flex-1 bg-brand-gold text-brand-charcoal py-3 font-bold uppercase rounded hover:bg-yellow-500 shadow">LƯU THAY ĐỔI</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB CÀI ĐẶT WEBSITE */}
                {activeTab === 'settings' && siteSettings && (
                  <form onSubmit={handleSaveSettings} className="bg-white border rounded shadow-sm overflow-hidden text-xs font-sans animate-fadeIn">
                    <div className="bg-brand-charcoal text-white p-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider">CẤU HÌNH HIỂN THỊ WEBSITE TOÀN DIỆN</h3>
                    </div>
                    <div className="p-6 space-y-8">
                      <div className="space-y-4"><h4 className="font-bold text-brand-gold uppercase border-b pb-1 flex items-center gap-2"><Percent size={14}/> 1. THANH THÔNG BÁO KHUYẾN MÃI (TOPBAR)</h4><div><label className="block text-gray-600 mb-1">Dòng chữ chạy trên cùng</label><input type="text" value={siteSettings.topbar_text || ''} onChange={e => setSiteSettings({...siteSettings, topbar_text: e.target.value})} className="w-full border-2 focus:border-brand-gold p-2.5 rounded bg-yellow-50 font-bold"/></div></div>
                      <div className="space-y-4"><h4 className="font-bold text-brand-gold uppercase border-b pb-1">2. NHẬN DIỆN THƯƠNG HIỆU</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="block text-gray-600">Tải ảnh Logo chính</label><div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-brand-gold relative h-24 flex flex-col justify-center"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, logo_url: url}))} /><p className="text-[11px] text-gray-500 font-medium">{siteSettings.logo_url ? '✓ Đã cập nhật Logo (Bấm thay thế)' : 'Bấm để tải file Logo lên'}</p></div>{siteSettings.logo_url && <img src={siteSettings.logo_url} className="h-8 object-contain bg-gray-100 p-1 border rounded" alt="Logo"/>}</div><div className="space-y-2"><label className="block text-gray-600">Favicon</label><div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-brand-gold relative h-24 flex flex-col justify-center"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleSingleImageUpload(e, 'site-assets', (url) => setSiteSettings({...siteSettings, favicon_url: url}))} /><p className="text-[11px] text-gray-500 font-medium">{siteSettings.favicon_url ? '✓ Đã cập nhật Favicon' : 'Bấm để tải Favicon lên'}</p></div></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-gray-600 mb-1">Tên Cửa Hàng</label><input type="text" value={siteSettings.site_name || ''} onChange={e => setSiteSettings({...siteSettings, site_name: e.target.value})} className="w-full border p-2.5 rounded"/></div><div><label className="block text-gray-600 mb-1">Slogan</label><input type="text" value={siteSettings.site_slogan || ''} onChange={e => setSiteSettings({...siteSettings, site_slogan: e.target.value})} className="w-full border p-2.5 rounded"/></div></div></div>
                      <div className="space-y-4"><h4 className="font-bold text-brand-gold uppercase border-b pb-1">3. LIÊN HỆ & MẠNG XÃ HỘI</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="block text-gray-600 mb-1">Zalo tư vấn</label><input type="text" value={siteSettings.zalo || ''} onChange={e => setSiteSettings({...siteSettings, zalo: e.target.value})} className="w-full border p-2.5 rounded border-blue-200"/></div><div><label className="block text-gray-600 mb-1">Hotline</label><input type="text" value={siteSettings.hotline || ''} onChange={e => setSiteSettings({...siteSettings, hotline: e.target.value})} className="w-full border p-2.5 rounded"/></div><div><label className="block text-gray-600 mb-1">Link Facebook</label><input type="text" value={siteSettings.facebook_url || ''} onChange={e => setSiteSettings({...siteSettings, facebook_url: e.target.value})} className="w-full border p-2.5 rounded"/></div><div><label className="block text-gray-600 mb-1">Link Tiktok</label><input type="text" value={siteSettings.tiktok_url || ''} onChange={e => setSiteSettings({...siteSettings, tiktok_url: e.target.value})} className="w-full border p-2.5 rounded"/></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-gray-600 mb-1">Link Shopee</label><input type="text" value={siteSettings.shopee_url || ''} onChange={e => setSiteSettings({...siteSettings, shopee_url: e.target.value})} className="w-full border p-2.5 rounded"/></div><div><label className="block text-gray-600 mb-1">Link Instagram</label><input type="text" value={siteSettings.instagram_url || ''} onChange={e => setSiteSettings({...siteSettings, instagram_url: e.target.value})} className="w-full border p-2.5 rounded"/></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-gray-600 mb-1">Email hỗ trợ khách</label><input type="email" value={siteSettings.support_email || ''} onChange={e => setSiteSettings({...siteSettings, support_email: e.target.value})} className="w-full border p-2.5 rounded"/></div><div><label className="block text-gray-600 mb-1">Địa chỉ cửa hàng</label><input type="text" value={siteSettings.address || ''} onChange={e => setSiteSettings({...siteSettings, address: e.target.value})} className="w-full border p-2.5 rounded"/></div></div></div>
                      <div className="space-y-4"><h4 className="font-bold text-brand-gold uppercase border-b pb-1">4. THÔNG TIN CHÂN TRANG (FOOTER)</h4><div><label className="block text-gray-600 mb-1">Mô tả ngắn gọn</label><textarea rows={2} value={siteSettings.company_description || ''} onChange={e => setSiteSettings({...siteSettings, company_description: e.target.value})} className="w-full border p-2.5 rounded"/></div><div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded border"><p className="col-span-3 font-bold text-brand-charcoal border-b pb-1">Các cam kết điểm chất lượng</p><div><label className="block text-gray-600 mb-1">Cam kết 1</label><input type="text" value={siteSettings.footer_quality_text_1 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_1: e.target.value})} className="w-full border p-2.5 rounded bg-white"/></div><div><label className="block text-gray-600 mb-1">Cam kết 2</label><input type="text" value={siteSettings.footer_quality_text_2 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_2: e.target.value})} className="w-full border p-2.5 rounded bg-white"/></div><div><label className="block text-gray-600 mb-1">Cam kết 3</label><input type="text" value={siteSettings.footer_quality_text_3 || ''} onChange={e => setSiteSettings({...siteSettings, footer_quality_text_3: e.target.value})} className="w-full border p-2.5 rounded bg-white"/></div></div></div>
                    </div>
                    <div className="p-6 bg-brand-cream border-t"><button type="submit" className="w-full bg-brand-gold text-brand-charcoal py-4 font-bold text-sm uppercase tracking-widest rounded shadow transition hover:bg-yellow-500">LƯU TẤT CẢ CÀI ĐẶT LÊN TRANG WEB</button></div>
                  </form>
                )}

                {/* TAB SẢN PHẨM */}
                {activeTab === 'products' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm uppercase">Kho sản phẩm & Áo Phôi</h3>
                      <button onClick={() => setEditingProduct({ images: [], sizes: ['S','M','L','XL'], colors: [], inventory: 100, price: 150000 })} className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded flex items-center gap-1">
                        <Plus size={12}/> Thêm sản phẩm
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {products.map(p => (
                        <div key={p.id} className="bg-white border rounded p-4 space-y-2 flex flex-col justify-between hover:shadow-lg transition">
                          <img src={p.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-40 object-cover rounded border" alt=""/>
                          <h4 className="font-bold text-sm mt-2 line-clamp-1">{p.name}</h4>
                          <div className="flex gap-2 pt-2 border-t">
                            <button onClick={() => setEditingProduct(p)} className="w-1/2 bg-gray-100 hover:bg-gray-200 text-xs py-1.5 rounded font-bold">Sửa</button>
                            <button onClick={() => handleDelete('prod', p.id)} className="w-1/2 text-red-600 border border-red-100 text-xs py-1.5 rounded font-bold hover:bg-red-50">Xóa</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* MODAL SOẠN SẢN PHẨM (ĐÃ NÂNG CẤP TÍNH NĂNG NHÓM MÀU & ẢNH) */}
                    {editingProduct && (
                      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <form onSubmit={handleSaveProduct} className="bg-white rounded-lg w-full max-w-3xl space-y-0 text-xs max-h-[90vh] overflow-y-auto font-sans flex flex-col shadow-2xl">
                          <div className="p-4 bg-brand-charcoal text-white flex justify-between items-center sticky top-0 z-10">
                            <h4 className="font-bold text-sm uppercase tracking-wider">Cấu Hình Thông Tin Sản Phẩm</h4>
                            <button type="button" onClick={() => setEditingProduct(null)} className="hover:text-gray-300 font-bold">✕ ĐÓNG</button>
                          </div>
                          
                          <div className="p-6 space-y-6 flex-1 text-left bg-gray-50/50">
                            
                            {/* 1. Tên và Danh mục liên kết */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold block mb-1 text-gray-700">Tên sản phẩm / Phôi áo</label>
                                <input type="text" required value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded bg-white outline-none focus:border-brand-gold"/>
                              </div>
                              <div>
                                <label className="font-bold block mb-1 text-gray-700">Thuộc danh mục phôi</label>
                                <select 
                                  value={editingProduct.category_id || (categories.length > 0 ? categories[0].id : '')} 
                                  onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})} 
                                  className="w-full border border-gray-300 p-2.5 rounded bg-white font-medium outline-none focus:border-brand-gold"
                                >
                                  {categories.length === 0 && <option value="">-- Chưa có danh mục nào --</option>}
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* 2. Giá cả và Kho số lượng */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="font-bold block mb-1 text-gray-700">Giá bán gốc (VNĐ)</label>
                                <input type="number" required value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded bg-white outline-none focus:border-brand-gold font-mono"/>
                              </div>
                              <div>
                                <label className="font-bold block mb-1 text-gray-700">Số lượng tồn kho ban đầu</label>
                                <input type="number" value={editingProduct.inventory ?? 100} onChange={e => setEditingProduct({...editingProduct, inventory: Number(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded bg-white outline-none focus:border-brand-gold font-mono"/>
                              </div>
                            </div>

                            {/* 3. DANH SÁCH BIẾN THỂ (GẮN MÀU VỚI ẢNH) */}
                            <div className="space-y-3 bg-white p-4 border border-gray-200 rounded shadow-sm">
                              <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-300">
                                <label className="font-bold text-brand-charcoal uppercase tracking-wider text-[11px]">
                                  Danh Sách Màu & Ảnh Sản Phẩm
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct({
                                      ...editingProduct,
                                      colors: [...(editingProduct.colors || []), '#111111'],
                                      images: [...(editingProduct.images || []), '']
                                    });
                                  }}
                                  className="bg-brand-gold text-brand-charcoal font-bold text-[10px] px-3 py-1.5 rounded flex items-center gap-1 hover:bg-yellow-500 shadow-sm transition"
                                >
                                  <Plus size={12}/> THÊM MÀU MỚI
                                </button>
                              </div>

                              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                {(editingProduct.colors || []).map((color, idx) => {
                                  const image = (editingProduct.images || [])[idx] || '';
                                  return (
                                    <div key={idx} className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded relative group">
                                      {/* Nút xóa Block này */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newColors = [...(editingProduct.colors || [])];
                                          newColors.splice(idx, 1);
                                          const newImages = [...(editingProduct.images || [])];
                                          newImages.splice(idx, 1);
                                          setEditingProduct({...editingProduct, colors: newColors, images: newImages});
                                        }}
                                        className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-white hover:bg-red-500 border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center transition shadow-sm z-10"
                                        title="Xóa biến thể này"
                                      >
                                        <Trash2 size={12} />
                                      </button>

                                      {/* Cột 1: Bảng Chọn Màu */}
                                      <div className="w-full sm:w-5/12 space-y-2 sm:border-r border-gray-200 sm:pr-4">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">1. Chọn màu sắc</label>
                                        <div className="flex flex-wrap gap-2 items-center">
                                          {/* Màu có sẵn */}
                                          {['#111111', '#FFFFFF', '#7E7C77', '#1B2C3F', '#3B4C3A', '#F4EFEB', '#E36414', '#591A2A'].map(preset => (
                                            <div
                                                key={preset}
                                                onClick={() => {
                                                  const newColors = [...(editingProduct.colors || [])];
                                                  newColors[idx] = preset;
                                                  setEditingProduct({...editingProduct, colors: newColors});
                                                }}
                                                className={`w-6 h-6 rounded border cursor-pointer transition-transform hover:scale-110 ${color === preset ? 'ring-2 ring-brand-gold ring-offset-1 border-transparent' : 'border-gray-300 shadow-sm'}`}
                                                style={{ backgroundColor: preset }}
                                                title={preset}
                                            />
                                          ))}
                                          
                                          <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                          
                                          {/* Bảng pha màu tuỳ chỉnh OS Native */}
                                          <label className="flex items-center justify-center w-6 h-6 rounded border border-dashed border-gray-500 cursor-pointer hover:border-brand-gold hover:bg-yellow-50 relative bg-white transition" title="Pha màu tuỳ chỉnh">
                                            <span className="text-sm font-bold text-gray-600 pb-0.5">+</span>
                                            <input
                                              type="color"
                                              value={color}
                                              onChange={(e) => {
                                                  const newColors = [...(editingProduct.colors || [])];
                                                  newColors[idx] = e.target.value;
                                                  setEditingProduct({...editingProduct, colors: newColors});
                                              }}
                                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                            />
                                          </label>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono pt-1">
                                          Mã đang chọn: <span className="font-bold text-brand-charcoal bg-gray-200 px-1.5 py-0.5 rounded">{color.toUpperCase()}</span>
                                        </div>
                                      </div>

                                      {/* Cột 2: Upload Ảnh */}
                                      <div className="w-full sm:w-7/12 space-y-2 sm:pl-2">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">2. Tải ảnh cho màu này</label>
                                        <div className="flex items-center gap-3">
                                          {image ? (
                                            <img src={image} className="w-16 h-16 object-cover rounded border border-gray-300 shadow-sm bg-white" alt="preview" />
                                          ) : (
                                            <div className="w-16 h-16 rounded border border-dashed border-gray-300 flex items-center justify-center bg-white text-gray-300">
                                              <Image size={20} />
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => handleSingleImageUpload(e, 'products', (url) => {
                                                const newImages = [...(editingProduct.images || [])];
                                                newImages[idx] = url;
                                                setEditingProduct({...editingProduct, images: newImages});
                                              })}
                                              className="w-full border border-gray-300 p-1 text-[10px] bg-white rounded cursor-pointer outline-none focus:border-brand-gold 
                                                         file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                    </div>
                                  )
                                })}

                                {(!editingProduct.colors || editingProduct.colors.length === 0) && (
                                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded bg-white text-gray-500 text-xs">
                                    Sản phẩm chưa có màu sắc. Bấm nút <strong className="text-brand-charcoal px-1">THÊM MÀU MỚI</strong> ở góc phải để bắt đầu thiết lập màu và ảnh đại diện!
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 4. Mô tả chi tiết */}
                            <div>
                              <label className="font-bold block mb-1 text-gray-700">Mô tả thông số chi tiết sản phẩm</label>
                              <textarea rows={4} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded bg-white outline-none focus:border-brand-gold" placeholder="Nhập chất liệu vải, định lượng GSM, cách bảo quản hoặc hướng dẫn chọn size..."/>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-white border-t sticky bottom-0 flex gap-4">
                            <button type="submit" className="flex-1 bg-brand-gold py-3.5 font-bold uppercase rounded shadow-lg hover:bg-yellow-500 transition text-brand-charcoal tracking-widest text-xs">
                              LƯU TOÀN BỘ THÔNG TIN SẢN PHẨM
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
                
                {/* TAB DANH MỤC */}
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
                          <input type="file" accept="image/*" onChange={e => handleSingleImageUpload(e, 'products', (url) => setEditingCategory({...editingCategory, image_url: url}))} className="w-full border p-2" />
                          <input type="text" placeholder="Tên danh mục..." required value={editingCategory.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="w-full border p-2 rounded"/>
                          <div className="flex gap-2"><button type="submit" className="w-1/2 bg-brand-gold py-2 font-bold rounded">Lưu</button><button type="button" onClick={() => setEditingCategory(null)} className="w-1/2 bg-gray-200 py-2 rounded">Đóng</button></div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB BANNERS */}
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
                          <input type="file" accept="image/*" onChange={e => handleSingleImageUpload(e, 'banners', (url) => setEditingBanner({...editingBanner, image_url: url}))} className="w-full border p-2" />
                          <input type="text" placeholder="Tiêu đề..." required value={editingBanner.title || ''} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full border p-2 rounded"/>
                          <div className="flex gap-2"><button type="submit" className="w-1/2 bg-brand-gold py-2 font-bold rounded">Lưu</button><button type="button" onClick={() => setEditingBanner(null)} className="w-1/2 bg-gray-200 py-2 rounded">Đóng</button></div>
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

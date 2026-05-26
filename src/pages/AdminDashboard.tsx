import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { dbSim, uploadToStorage } from '../supabaseClient';
import { Banner, Category, Product, CustomOrder, AdminUser, SiteSettings } from '../types';
import { Plus, Tag, ShoppingBag, Image, Folder, RefreshCw, Upload, Settings, Percent, Trash2, Edit3, X } from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
}

type AdminTab = 'settings' | 'products' | 'categories' | 'banners' | 'orders';

export default function AdminDashboard({ adminUser, setAdminUser }: AdminDashboardProps) {
  // Các state cũ đã quen thuộc
  const [email, setEmail] = useState('hoanggerber@gmail.com');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [loading, setLoading] = useState(true);
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [tempColor, setTempColor] = useState('#000000'); // Màu tạm thời để chọn

  useEffect(() => { if (adminUser) loadAdminData(); }, [adminUser]);

  async function loadAdminData() {
    setLoading(true);
    const [b, c, p, o] = await Promise.all([
      dbSim.banners.list().catch(() => []),
      dbSim.categories.list().catch(() => []),
      dbSim.products.list().catch(() => []),
      dbSim.customOrders.list().catch(() => [])
    ]);
    setBanners(b); setCategories(c); setProducts(p); setOrders(o);
    setLoading(false);
  }

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await dbSim.products.save(editingProduct as Product);
    setEditingProduct(null); 
    loadAdminData();
    alert('Đã lưu sản phẩm thành công!');
  };

  const handleMultipleImagesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map(f => uploadToStorage('products', f)));
    setEditingProduct(prev => ({ ...prev, images: [...(prev?.images || []), ...urls] }));
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-sm">
      {!adminUser ? (
        // ... (Phần đăng nhập giữ nguyên)
        <div className="max-w-sm mx-auto bg-white p-8 rounded shadow">
          <h2 className="text-xl font-bold mb-4">ĐĂNG NHẬP ADMIN</h2>
          <input className="w-full border p-2 mb-2" placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input className="w-full border p-2 mb-4" type="password" placeholder="Mật khẩu" onChange={e => setPassword(e.target.value)} />
          <button onClick={async() => { const u = await dbSim.admins.getByEmail(email); if(u && u.password === password) setAdminUser(u); else alert('Sai thông tin!'); }} className="w-full bg-black text-white py-2">Đăng nhập</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-6 mb-8 border-b pb-4">
             {(['orders', 'products', 'categories', 'banners', 'settings'] as AdminTab[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`uppercase font-bold ${activeTab === t ? 'text-blue-600' : 'text-gray-500'}`}>{t}</button>
            ))}
          </div>

          {/* TAB SẢN PHẨM */}
          {activeTab === 'products' && (
            <div>
              <button onClick={() => setEditingProduct({ images: [], colors: [], sizes: [] })} className="bg-blue-600 text-white px-4 py-2 mb-4">+ Thêm sản phẩm</button>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-4 shadow rounded border">
                    <img src={p.images?.[0]} className="h-40 w-full object-cover mb-2" />
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-gray-500">{p.price?.toLocaleString()} đ</p>
                    <button onClick={() => setEditingProduct(p)} className="text-blue-500 font-bold mt-2">Sửa thông tin</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORM CHI TIẾT SẢN PHẨM ĐẦY ĐỦ (DÙNG ĐỂ CHỌN DANH MỤC & MÀU) */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <form onSubmit={handleSaveProduct} className="bg-white p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-lg font-bold">SOẠN THẢO SẢN PHẨM</h2>
                  <button type="button" onClick={() => setEditingProduct(null)}><X /></button>
                </div>
                
                <div className="space-y-6">
                  {/* Thông tin cơ bản */}
                  <input className="w-full border p-2" placeholder="Tên sản phẩm" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                  <input className="w-full border p-2" type="number" placeholder="Giá tiền" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                  
                  {/* CHỌN DANH MỤC */}
                  <div>
                    <label className="font-bold block mb-1">Thuộc danh mục:</label>
                    <select className="w-full border p-2.5 rounded" value={editingProduct.category_id || ''} onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* CHỌN MÀU (TRỰC QUAN) */}
                  <div className="border p-4 rounded bg-gray-50">
                    <label className="font-bold block mb-2">Chọn màu sắc (Tích chọn):</label>
                    <div className="flex items-center gap-4 mb-3">
                      <input type="color" value={tempColor} onChange={e => setTempColor(e.target.value)} className="w-12 h-12 cursor-pointer" />
                      <button type="button" onClick={() => setEditingProduct({...editingProduct, colors: [...(editingProduct.colors || []), tempColor]})} className="bg-black text-white px-4 py-2 hover:bg-gray-800">Thêm màu này</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingProduct.colors?.map((c, i) => (
                        <div key={i} className="relative w-8 h-8 rounded-full border shadow cursor-pointer" style={{backgroundColor: c}}>
                          <button type="button" onClick={() => setEditingProduct({...editingProduct, colors: editingProduct.colors?.filter((_,idx) => idx !== i)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Ảnh */}
                  <input type="file" multiple onChange={handleMultipleImagesUpload} className="border p-2 w-full" />
                  
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="flex-1 bg-green-600 text-white py-3 font-bold hover:bg-green-700">LƯU SẢN PHẨM</button>
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-200 py-3 hover:bg-gray-300">HỦY</button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

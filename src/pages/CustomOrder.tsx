import React, { useState, useEffect } from 'react';
import { dbSim, uploadToStorage } from '../supabaseClient';
import { CustomOrder, Product } from '../types';
import { Upload, FileCode, Check, AlertCircle, ShoppingBag, ShieldCheck, Mail, Phone, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

interface CustomOrderProps {
  preloadGarment: { type: string, color: string, size: string } | null;
  setPreloadGarment: (val: null) => void;
  setCurrentPage: (page: string) => void;
  customerUser: { email: string; full_name: string } | null;
}

export default function CustomOrderPage({
  preloadGarment,
  setPreloadGarment,
  setCurrentPage,
  customerUser
}: CustomOrderProps) {
  // Products listing for shirt select list
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customProductText, setCustomProductText] = useState<string>('Heavyweight Classic Tee');
  const [shirtColor, setShirtColor] = useState<string>('#111111');
  const [shirtSize, setShirtSize] = useState<string>('L');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Design file uploader states
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Delivery states
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Submit states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<CustomOrder | null>(null);

  // Load products list
  useEffect(() => {
    async function initPage() {
      try {
        const prodList = await dbSim.products.list();
        const activeProds = prodList.filter(p => p.status === 'active');
        setProducts(activeProds);

        // Preload fields if routed from Catalog detail buy trigger
        if (preloadGarment) {
          const match = activeProds.find(p => `${p.name} (Phôi ${p.category_id})` === preloadGarment.type || p.name === preloadGarment.type);
          if (match) {
            setSelectedProduct(match);
            setShirtColor(preloadGarment.color);
            setShirtSize(preloadGarment.size);
          } else {
            setCustomProductText(preloadGarment.type);
            setShirtColor(preloadGarment.color);
            setShirtSize(preloadGarment.size);
          }
          // Clear preloads
          setPreloadGarment(null);
        } else if (activeProds.length > 0) {
          setSelectedProduct(activeProds[0]);
          setShirtColor(activeProds[0].colors[0] || '#111111');
          setShirtSize(activeProds[0].sizes[0] || 'L');
        }

        // Fill pre-logged user credentials
        if (customerUser) {
          setCustomerName(customerUser.full_name);
          setCustomerEmail(customerUser.email);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initPage();
  }, [preloadGarment, customerUser]);

  // Standard color choices simulation if no products are matching
  const BASE_COLORS = [
    { name: 'Trắng Ngà (Ivory)', hex: '#FDFCF7' },
    { name: 'Đen Thâm (Charcoal)', hex: '#111111' },
    { name: 'Xám Wash Thô', hex: '#555555' },
    { name: 'Xanh Lam Sâu', hex: '#1B2C3F' },
    { name: 'Rêu Mờ Vintage', hex: '#3B4C3A' }
  ];

  // Upload handler with validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf', 'svg', 'ai', 'psd'];
    
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setUploadError('Tệp không đúng định dạng. Studio hỗ trợ: PNG, JPG, PDF, SVG, AI, PSD.');
      return;
    }

    setUploadError('');
    setUploadProgress(true);

    try {
      // Direct stream uploading to Supabase Storage or Local Base64 Backup fallback!
      const cloudUrl = await uploadToStorage('design-files', file);
      setUploadedFileUrl(cloudUrl);
      setUploadedFileName(file.name);
    } catch (err: any) {
      setUploadError('Tải lên thất bại. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setUploadProgress(false);
    }
  };

  // Instant Cost Evaluation
  // Base cost = item price or base 350.000 + printing cost (100.000)
  const getItemPrice = () => {
    return selectedProduct ? selectedProduct.price : 350000;
  };
  const printCostBase = 120000;
  const singleItemTotal = getItemPrice() + printCostBase;
  const rawSubtotal = singleItemTotal * quantity;
  
  // Volume Discount: 5-9: 5% discount, 10+: 10% discount
  const discountMultiplier = quantity >= 10 ? 0.9 : quantity >= 5 ? 0.95 : 1.0;
  const costCalculated = Math.round(rawSubtotal * discountMultiplier);

  // Dispatch custom order
  const handleOrderSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFileUrl) {
      setUploadError('Vui lòng tải lên FILE THIẾT KẾ của bạn trước khi gửi đơn.');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
      alert('Vui lòng nhập đầy đủ THÔNG TIN NHẬN HÀNG.');
      return;
    }

    setSubmitting(true);

    try {
      const orderRecord: CustomOrder = {
        id: `PRT-${Math.floor(100000 + Math.random() * 900000)}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        design_file_url: uploadedFileUrl,
        design_file_name: uploadedFileName,
        shirt_type: selectedProduct ? selectedProduct.name : customProductText,
        shirt_color: shirtColor,
        shirt_size: shirtSize,
        quantity: quantity,
        notes: notes,
        status: 'pending',
        price_calc: costCalculated,
        created_at: new Date().toISOString()
      };

      // Persistence call
      await dbSim.customOrders.save(orderRecord);

      // Create a customer user automatically if not exists
      await dbSim.customers.save({
        id: `cust-${Date.now()}`,
        email: customerEmail,
        full_name: customerName,
        phone: customerPhone,
        address: customerAddress,
        created_at: new Date().toISOString()
      });

      setOrderSuccess(orderRecord);
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo đơn hàng. Vui lòng báo quản trị viên.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    setOrderSuccess(null);
    setUploadedFileUrl('');
    setUploadedFileName('');
    setNotes('');
    setQuantity(1);
  };

  return (
    <div className="py-12 bg-brand-ivory animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success screen card */}
        {orderSuccess ? (
          <div className="max-w-2xl mx-auto bg-brand-cream/40 border border-brand-charcoal/10 p-8 sm:p-12 text-center rounded-none space-y-6">
            <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-none flex items-center justify-center mx-auto border border-brand-gold/20">
              <CheckCircle2 size={36} className="stroke-[1.5]" />
            </div>

            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Đặt in thành công</span>
              <h2 className="text-3xl font-serif text-brand-charcoal uppercase tracking-wide">ĐƠN ĐẶT IN SỐ {orderSuccess.id} ĐÃ ĐƯỢC TIẾP NHẬN</h2>
              <p className="text-xs text-brand-muted leading-relaxed font-light max-w-md mx-auto">
                Cám ơn <strong className="text-brand-charcoal">{orderSuccess.customer_name}</strong>. File thiết kế <span className="font-mono text-[11px] underline text-brand-gold">{orderSuccess.design_file_name}</span> đã được tải lên trực tiếp lưu trữ an toàn trên Supabase Storage.
              </p>
            </div>

            {/* Quick Invoice detail summary */}
            <div className="bg-brand-ivory p-6 border border-brand-charcoal/10 text-left divide-y border-t border-b text-xs text-brand-charcoal space-y-3 rounded-none">
              <div className="pb-3 flex justify-between">
                <span>Mẫu áo đặt in:</span>
                <strong className="font-semibold">{orderSuccess.shirt_type}</strong>
              </div>
              <div className="py-3 flex justify-between">
                <span>Màu áo / Kích cỡ:</span>
                <span className="font-medium flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-none border border-brand-charcoal/30" style={{ backgroundColor: orderSuccess.shirt_color }} />
                  <span>Size {orderSuccess.shirt_size}</span>
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span>Số lượng đặt:</span>
                <strong className="font-semibold">{orderSuccess.quantity} chiếc</strong>
              </div>
              <div className="pt-3 flex justify-between text-brand-gold text-sm font-bold">
                <span>Tổng chi phí (gồm màng in & phôi):</span>
                <span>{orderSuccess.price_calc.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row shadow-sm justify-center items-center gap-3">
              <button
                onClick={() => {
                  setCurrentPage('account');
                }}
                className="w-full sm:w-auto bg-brand-charcoal text-brand-ivory text-xs px-6 py-4 uppercase tracking-widest font-semibold hover:bg-brand-gold hover:text-brand-charcoal transition rounded-none cursor-pointer"
                id="success-track-orders-btn"
              >
                Nhập Email xem lịch sử đơn
              </button>
              <button
                onClick={handleCreateNew}
                className="w-full sm:w-auto border border-brand-charcoal text-brand-charcoal text-xs px-6 py-4 uppercase tracking-widest font-semibold hover:bg-brand-cream transition rounded-none cursor-pointer"
                id="success-new-order-btn"
              >
                In thêm t-shirt khác
              </button>
            </div>
          </div>
        ) : (
          /* Core Booking Form */
          <div className="space-y-12">
            
            {/* Header branding block */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs tracking-widest text-brand-gold uppercase font-semibold">Tự tải thiết kế & Đặt in</span>
              <h1 className="text-4xl font-serif text-brand-charcoal tracking-tight font-medium">BẢNG KHỞI TẠO ĐƠN IN</h1>
              <p className="text-xs text-brand-muted leading-relaxed font-light">
                Hãy lựa chọn phôi vải cao cấp cùng tệp hình ảnh để chuẩn hoá kĩ thuật in cao tần PET chất lượng xuất khẩu tại xưởng.
              </p>
            </div>

            <form onSubmit={handleOrderSubmission} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start" id="custom-order-form">
              
              {/* Left Form: Layout File and Apparel properties specs */}
              <div className="lg:col-span-7 bg-brand-cream/30 border border-brand-charcoal/5 p-6 sm:p-8 space-y-8 rounded-none">
                
                {/* 1. File Upload zone */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold tracking-wider text-brand-charcoal uppercase block">
                      1. TẢI FILE THIẾT KẾ BAN ĐẦU <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-brand-muted uppercase">Hỗ trợ tối đa 50MB</span>
                  </div>
 
                  <div className="border-2 border-dashed border-brand-charcoal/25 hover:border-brand-gold hover:bg-brand-cream/60 transition duration-300 p-8 text-center rounded-none relative min-h-[160px] flex flex-col justify-center items-center">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,.svg,.ai,.psd"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="design-file-picker"
                    />
                    
                    {uploadProgress ? (
                      <div className="space-y-2">
                        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-none animate-spin mx-auto" />
                        <p className="text-xs text-brand-gold font-semibold uppercase tracking-wider">Đang lưu file lên hệ thống Supabase Storage...</p>
                      </div>
                    ) : uploadedFileUrl ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-green-50 text-green-600 border border-green-200 rounded-none flex items-center justify-center mx-auto">
                          <Check size={18} className="stroke-[3]" />
                        </div>
                        <p className="text-xs font-medium text-brand-charcoal">Tải lên hoàn thành!</p>
                        <p className="text-[11px] font-mono select-all bg-brand-cream/90 px-3 py-1 rounded-none max-w-xs mx-auto truncate text-brand-gold font-bold">
                          {uploadedFileName}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload size={32} className="text-brand-muted mx-auto mb-2" />
                        <p className="text-xs font-semibold text-brand-charcoal">Kéo và thả tệp hoặc nhấp để chọn</p>
                        <p className="text-[10px] text-brand-muted font-light leading-relaxed">
                          Chấp nhận định dạng: PNG, JPG, PDF, SVG, AI, PSD. Để hình in có chất lượng sắc nét cao nhất, quý khách vui lòng cung cấp file PNG trong suốt hoặc vector gốc (SVG/AI).
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={13} />
                      <span>{uploadError}</span>
                    </p>
                  )}
                </div>

                {/* 2. Select Apparel garment style */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-wider text-brand-charcoal uppercase block">
                    2. CHỌN MẪU PHÔI STUDIO <span className="text-red-500">*</span>
                  </label>
                  
                  {loading ? (
                    <div className="h-10 bg-brand-cream animate-pulse rounded-none" />
                  ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedProduct(prod);
                            setShirtColor(prod.colors[0] || '#111111');
                          }}
                          className={`p-4 border rounded-none cursor-pointer transition flex items-center gap-3 bg-brand-ivory ${
                            selectedProduct?.id === prod.id
                              ? 'border-brand-charcoal bg-brand-cream border-2'
                              : 'border-brand-charcoal/10 hover:border-brand-charcoal'
                          }`}
                        >
                          <img 
                            src={prod.images[0]} 
                            alt={prod.name} 
                            className="w-12 h-12 object-cover rounded-none border border-brand-charcoal/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left">
                            <h4 className="text-xs font-semibold truncate max-w-[140px] uppercase tracking-wide">{prod.name}</h4>
                            <p className="text-[10px] text-brand-gold font-semibold">{prod.price.toLocaleString('vi-VN')} đ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={customProductText}
                      onChange={(e) => setCustomProductText(e.target.value)}
                      placeholder="VD: Áo thun Premium Heaveyweight 260GSM"
                      className="w-full bg-brand-ivory border border-brand-charcoal/20 px-4 py-3 text-xs text-brand-charcoal rounded-none focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  )}
                </div>

                {/* 3. Color swatches picker */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-wider text-brand-charcoal uppercase block">
                    3. CHỌN MÀU PHÔI <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedProduct ? (
                      selectedProduct.colors.map((color, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setShirtColor(color)}
                          className={`w-10 h-10 border-2 transition relative rounded-none cursor-pointer ${
                            shirtColor === color ? 'border-brand-charcoal scale-102 bg-white' : 'border-transparent hover:border-brand-charcoal'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {shirtColor === color && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs drop-shadow">
                              <Check size={14} className="stroke-[3]" />
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      BASE_COLORS.map((c) => (
                        <button
                          type="button"
                          key={c.hex}
                          onClick={() => setShirtColor(c.hex)}
                          className={`w-10 h-10 border-2 transition relative rounded-none cursor-pointer ${
                            shirtColor === c.hex ? 'border-brand-charcoal scale-102 bg-white' : 'border-transparent hover:border-brand-charcoal'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {shirtColor === c.hex && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs drop-shadow">
                              <Check size={14} className="stroke-[3]" />
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Sizes & Amounts row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider text-brand-charcoal uppercase block">
                      4. CHỌN SIZE <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={shirtSize}
                      onChange={(e) => setShirtSize(e.target.value)}
                      className="w-full bg-brand-ivory border border-brand-charcoal/20 px-4 py-3 text-xs text-brand-charcoal rounded-none focus:ring-1 focus:ring-brand-gold focus:outline-none cursor-pointer"
                      id="custom-size-select"
                    >
                      {selectedProduct ? (
                        selectedProduct.sizes.map(s => <option key={s} value={s}>Size {s}</option>)
                      ) : (
                        ['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(s => <option key={s} value={s}>Size {s}</option>)
                      )}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider text-brand-charcoal uppercase block">
                      5. SỐ LƯỢNG <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-brand-ivory border border-brand-charcoal/20 px-4 py-3 text-xs text-brand-charcoal rounded-none focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* 5. Ghi chú specs */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-wider text-brand-charcoal uppercase block">
                    6. QUY CÁCH / GHI CHÚ IN ẤN (Kích thước hình in, vị trí)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Hình in kích thước 30x40cm mặt sau lưng áo, căn chỉnh căn giữa cách cổ 10cm. Mặt trước in logo nhỏ 6x6cm ở ngực trái."
                    rows={3}
                    className="w-full bg-brand-ivory border border-brand-charcoal/20 px-4 py-3 text-xs text-brand-charcoal rounded-none focus:ring-1 focus:ring-brand-gold focus:outline-none font-sans"
                  />
                </div>

              </div>

              {/* Right Form: Checkout summary & delivery info list */}
              <div className="lg:col-span-5 space-y-8">
                
                {/* Delivery details */}
                <div className="bg-brand-cream/30 border border-brand-charcoal/5 p-6 sm:p-8 space-y-4 rounded-none text-left">
                  <h3 className="text-xs font-semibold tracking-widest text-brand-charcoal uppercase border-b border-brand-charcoal/10 pb-3.5 mb-2 flex items-center gap-1.5 label-checkout">
                    <span>THÔNG TIN NHẬN HÀNG</span>
                  </h3>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="space-y-1.5">
                      <label className="text-brand-muted uppercase block text-[10px]">Họ và tên khách hàng <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nhập họ và tên..."
                        className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans"
                        id="checkout-name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-muted uppercase block text-[10px]">Email liên hệ <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Quý khách dùng email này để theo dõi đơn..."
                        className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans"
                        id="checkout-email"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-muted uppercase block text-[10px]">Số điện thoại nhận hàng <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Nhập SĐT..."
                        className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans"
                        id="checkout-phone"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-muted uppercase block text-[10px]">Địa chỉ giao nhận hàng toàn quốc <span className="text-red-500">*</span></label>
                      <textarea
                        required
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Nhập chi tiết số nhà, phố, quận, thành phố..."
                        rows={2}
                        className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans"
                        id="checkout-address"
                      />
                    </div>
                  </div>
                </div>

                {/* Estimate fee calculation Summary Card */}
                <div className="bg-brand-charcoal text-brand-ivory p-6 sm:p-8 space-y-6 rounded-none shadow-lg text-left border border-brand-charcoal">
                  <div className="border-b border-brand-ivory/10 pb-4">
                    <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold block">Phiếu Tổng Đoán Hóa Đơn</span>
                    <h3 className="text-xl font-serif text-white tracking-widest mt-1">HÓA ĐƠN ĐƠN HÀNG</h3>
                  </div>

                  <div className="text-xs divide-y divide-brand-ivory/10 space-y-3.5 font-sans">
                    <div className="flex justify-between items-center text-brand-cream/80">
                      <span>Mẫu áo x Số lượng:</span>
                      <span className="font-semibold">{selectedProduct ? selectedProduct.name : customProductText} (x{quantity})</span>
                    </div>

                    <div className="flex justify-between items-center pt-3 text-brand-cream/80">
                      <span>Đơn giá phôi thô:</span>
                      <span>{getItemPrice().toLocaleString('vi-VN')} đ / chiếc</span>
                    </div>

                    <div className="flex justify-between items-center pt-3 text-brand-cream/80">
                      <span>Phí làm phim in & gia nhiệt PET:</span>
                      <span>{printCostBase.toLocaleString('vi-VN')} đ / chiếc</span>
                    </div>

                    <div className="flex justify-between items-center pt-3 text-brand-cream/80">
                      <span>Mức giảm chiết khấu số lượng:</span>
                      {quantity >= 10 ? (
                        <span className="text-green-400 font-semibold">-10% (Số lượng lớn)</span>
                      ) : quantity >= 5 ? (
                        <span className="text-green-400 font-semibold">-5% (Đơn gom)</span>
                      ) : (
                        <span>0%</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3.5 text-white font-bold text-sm">
                      <span className="text-brand-gold flex items-center gap-1 uppercase tracking-wider"><Sparkles size={13} /> SƠ BỘ TỔNG CHI PHÍ:</span>
                      <span className="text-brand-gold text-lg">{costCalculated.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-gold text-brand-charcoal py-4.5 text-xs font-semibold tracking-widest uppercase hover:bg-brand-gold-light transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-sans rounded-none mt-4 cursor-pointer border border-brand-gold"
                    id="order-submit-btn"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-brand-charcoal border-t-transparent rounded-none animate-spin" />
                        <span>ĐANG GỬI ĐƠN VÀO SUPABASE...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} />
                        <span>XÁC NHẬN GỬI ĐƠN ĐẶT IN</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-brand-muted text-center leading-relaxed font-light font-sans">
                    Sau khi quý khách gửi đơn in, chuyên viên kỹ thuật của PRINTEE Studio sẽ liên lạc trực tiếp qua điện thoại trong vòng 15 phút để tư vấn tỷ lệ co dãn hạt màng và độ chuẩn phủ màu thực tế.
                  </p>
                </div>

              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}

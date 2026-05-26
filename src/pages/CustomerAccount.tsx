import React, { useState, useEffect, FormEvent } from 'react';
import { dbSim } from '../supabaseClient';
import { CustomOrder } from '../types';
import { User, Key, Mail, Calendar, MapPin, Truck, CheckCircle, Package, AlertCircle, ShoppingBag, Eye, RefreshCw } from 'lucide-react';

interface CustomerAccountProps {
  customerUser: { email: string; full_name: string } | null;
  setCustomerUser: (user: { email: string; full_name: string } | null) => void;
  setCurrentPage: (page: string) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export default function CustomerAccount({ customerUser, setCustomerUser, setCurrentPage }: CustomerAccountProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Error / Message states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Orders History
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedTrackOrder, setSelectedTrackOrder] = useState<CustomOrder | null>(null);

  // Load orders if logged in
  useEffect(() => {
    async function fetchOrders() {
      if (!customerUser) return;
      try {
        setLoadingOrders(true);
        const list = await dbSim.customOrders.getByEmail(customerUser.email);
        setOrders(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [customerUser]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'login') {
      if (!email || !password) {
        setErrorMsg('Vui lòng nhập Email và Mật khẩu.');
        return;
      }
      
      // Look up customer list
      const customers = await dbSim.customers.list();
      const existing = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
      
      if (existing) {
        // Successful mock-login
        setCustomerUser({ email: existing.email, full_name: existing.full_name });
        setSuccessMsg('Đăng nhập thành công!');
      } else {
        // Create dynamic customer if password matches some criteria or let them sign up
        // For a seamless UX in preview iframe, if the account doesn't exist, we can register them instantly
        // or notify clearly
        setErrorMsg('Tài khoản chưa tồn tại hoặc Email chưa đặt đơn. Quý khách vui lòng chọn ĐĂNG KÝ ở bên dưới.');
      }
    } 
    
    else if (authMode === 'signup') {
      if (!email || !fullName || !password) {
        setErrorMsg('Vui lòng điền đủ Họ tên, Email, Mật khẩu.');
        return;
      }

      try {
        await dbSim.customers.save({
          id: `cust-${Date.now()}`,
          email,
          full_name: fullName,
          phone,
          address,
          created_at: new Date().toISOString()
        });
        
        setCustomerUser({ email, full_name: fullName });
        setSuccessMsg('Đăng ký và đăng nhập thành công!');
        setAuthMode('login');
      } catch (err) {
        setErrorMsg('Có lỗi xảy ra trong quá trình thiết lập tài khoản.');
      }
    } 
    
    else if (authMode === 'forgot') {
      if (!email) {
        setErrorMsg('Vui lòng nhập Email để đặt lại mật khẩu.');
        return;
      }
      
      setSuccessMsg('Một liên kết phục hồi đã được gửi đến email của bạn qua dịch vụ Supabase Auth.');
      // Keep mode so they can see success
    }
  };

  // Status mapping to standard design badges
  const getStatusBadge = (status: CustomOrder['status']) => {
    switch (status) {
      case 'pending': 
        return <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 text-[10px] font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">Chờ duyệt file</span>;
      case 'approved': 
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">Đã duyệt kỹ thuật</span>;
      case 'printing': 
        return <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">Đang in ấn</span>;
      case 'finishing': 
        return <span className="bg-pink-50 text-pink-800 border border-pink-200 text-[10px] font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">Đang hoàn thành</span>;
      case 'shipping': 
        return <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">Đang giao nhận</span>;
      case 'completed': 
        return <span className="bg-green-50 text-green-800 border border-green-200 text-[10px] font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">Hoàn thành</span>;
      case 'cancelled': 
        return <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">Đã hủy đơn</span>;
    }
  };

  // Human state detail logs helper
  const getStatusDetailMessage = (status: CustomOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Chuyên viên kỹ thuật đang kiểm nghiệm cấu trúc phân giải hình ảnh, kiểm tra viền màng in PET và chuẩn bị màng keo ép cao tần chống bong rách.';
      case 'approved':
        return 'Hình in của bạn đã vượt qua khâu rà soát độ phân giải và đã được thông qua phê duyệt kỹ thuật in ấn.';
      case 'printing':
        return 'Sản phẩm đang được ép màng khí nén nhiệt sâu trực tiếp lên sợi bông dệt thô thông qua thợ in lành nghề.';
      case 'finishing':
        return 'Sản phẩm đang được xử lý sấy khử mùi, nhặt chỉ thừa và ép nhiệt phẳng chất diện thô dệt.';
      case 'shipping':
        return 'Sản phẩm hoàn thành đóng hộp kraft cao cấp cùng gói hút ẩm và đang được trung chuyển đi giao toàn quốc.';
      case 'completed':
        return 'Sản phẩm in ấn chất lượng cao đã cập bến nhận thành công. Chân thành cám ơn bạn đã đồng hành cùng PRINTEE Studio!';
      case 'cancelled':
        return 'Đơn hàng in ấn đã bị huỷ bỏ theo nguyện vọng của quý khách hoặc lỗi cấu trúc file thiết kế gốc quá mờ.';
    }
  };

  return (
    <div className="py-20 bg-brand-ivory min-h-[80vh] animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {!customerUser ? (
          /* ==========================================
             AUTH FORM INTERFACES
             ========================================== */
          <div className="max-w-md mx-auto bg-brand-cream/30 border border-brand-charcoal/5 p-8 sm:p-10 rounded-none">
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-serif text-brand-charcoal uppercase tracking-widest">
                {authMode === 'login' && 'CỔNG KHÁCH HÀNG'}
                {authMode === 'signup' && 'ĐĂNG KÝ TÌNH TRẠNG'}
                {authMode === 'forgot' && 'MẬT KHẨU STUDIO'}
              </h2>
              <p className="text-xs text-brand-muted font-light leading-relaxed uppercase tracking-widest">
                {authMode === 'login' && 'Đăng nhập để xem lịch trình nén keo và vận chuyển đơn in.'}
                {authMode === 'signup' && 'Tạo thẻ tài khoản cá nhân cập nhật tin tức phôi áo.'}
                {authMode === 'forgot' && 'Khôi phục tài khoản in ấn thông qua hộp thư điện tử.'}
              </p>
            </div>

            {/* Error & Message displays */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 rounded-none">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2 rounded-none">
                <CheckCircle size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-sans text-left">
              
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-brand-muted uppercase block text-[10px]">Họ tên khách hàng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 bg-white rounded-none focus:outline-none focus:border-brand-gold font-sans"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-brand-muted uppercase block text-[10px]">Email của bạn <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@design.com"
                  className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 bg-white rounded-none focus:outline-none focus:border-brand-gold font-sans"
                  id="auth-email"
                />
              </div>

              {authMode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-brand-muted uppercase block text-[10px]">Mật khẩu <span className="text-red-500">*</span></label>
                    {authMode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('forgot')}
                        className="text-[10px] text-brand-gold hover:underline font-semibold"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 bg-white rounded-none focus:outline-none focus:border-brand-gold font-sans"
                    id="auth-password"
                  />
                </div>
              )}

              {authMode === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-brand-muted uppercase block text-[10px]">Số điện thoại</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Số điện thoại của bạn..."
                      className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 bg-white rounded-none focus:outline-none focus:border-brand-gold font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-brand-muted uppercase block text-[10px]">Địa chỉ giao hàng mặc định</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, đường, quận, thành phố..."
                      className="w-full bg-brand-ivory border border-brand-charcoal/10 px-3.5 py-2.5 bg-white rounded-none focus:outline-none focus:border-brand-gold font-sans"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-brand-charcoal hover:bg-brand-gold hover:text-brand-charcoal text-brand-ivory font-sans py-4 uppercase font-semibold tracking-widest transition rounded-none mt-2 cursor-pointer border border-brand-charcoal"
                id="auth-submit-btn"
              >
                {authMode === 'login' && 'Xác Nhận Đăng Nhập'}
                {authMode === 'signup' && 'Xác Nhận Đăng Ký'}
                {authMode === 'forgot' && 'Gửi Yêu Cầu Thay Đổi'}
              </button>

            </form>

            {/* Mode switch */}
            <div className="mt-6 pt-6 border-t border-brand-charcoal/10 text-center text-[11px] text-brand-muted">
              {authMode === 'login' ? (
                <p>
                  Chưa có tài khoản studio?{' '}
                  <button 
                    onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }} 
                    className="text-brand-gold font-semibold hover:underline"
                    id="switch-to-signup"
                  >
                    ĐĂNG KÝ NGAY
                  </button>
                </p>
              ) : (
                <p>
                  Đã có tài khoản studio?{' '}
                  <button 
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }} 
                    className="text-brand-gold font-semibold hover:underline"
                    id="switch-to-login"
                  >
                    ĐĂNG NHẬP NGAY
                  </button>
                </p>
              )}
            </div>

          </div>
        ) : (
          /* ==========================================
             CUSTOMER PORTAL VIEW
             ========================================== */
          <div className="space-y-10 text-left" id="customer-orders-portal">
            
            {/* Direct user bar */}
            <div className="border-b border-brand-charcoal/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">Thành viên PRINTEE Studio</span>
                <h1 className="text-3xl font-serif text-brand-charcoal tracking-tight mt-1">LỊCH SỬ ĐƠN ĐẶT IN</h1>
                <p className="text-xs text-brand-muted font-light mt-0.5">Tài khoản kết nối: <strong className="text-brand-charcoal font-medium">{customerUser.email}</strong></p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setLoadingOrders(true);
                    const list = await dbSim.customOrders.getByEmail(customerUser.email);
                    setOrders(list);
                    setLoadingOrders(false);
                  }}
                  className="p-2 border border-brand-charcoal/20 hover:border-brand-charcoal text-brand-charcoal rounded-none text-xs flex items-center gap-1.5 px-3.5 cursor-pointer"
                  title="Tải lại đơn mới nhất"
                  id="refresh-orders-btn"
                >
                  <RefreshCw size={13} className={loadingOrders ? 'animate-spin' : ''} /> Làm mới đơn
                </button>
              </div>
            </div>

            {loadingOrders ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-none animate-spin mx-auto mb-2" />
                <p className="text-xs text-brand-muted font-light uppercase tracking-widest">Đang kết xuất danh hàng từ Database...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center bg-brand-cream/20 border border-dashed rounded-none space-y-4">
                <Package size={48} className="text-brand-muted mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-serif uppercase tracking-wider">Bạn chưa gửi thiết kế đặt in nào</h3>
                  <p className="text-xs text-brand-muted font-light max-w-sm mx-auto">
                    Mọi đơn đặt in bạn khởi tạo với email này sẽ xuất hiện tự động ngay tại đây.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('custom-print')}
                  className="bg-brand-gold text-brand-charcoal px-6 py-3.5 text-xs uppercase font-semibold tracking-wider rounded-none inline-block cursor-pointer border border-brand-gold"
                  id="portal-order-first-btn"
                >
                  Tải Thiết Kế IN Ngay
                </button>
              </div>
            ) : (
              /* Split Screen: Order list left, detailed layout status tracking right */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left: Orders summary stack list */}
                <div className="lg:col-span-6 space-y-4" id="orders-stack-list">
                  <h3 className="text-xs font-semibold tracking-widest text-brand-charcoal uppercase mb-2">DANH SÁCH {orders.length} ĐƠN IN CỦA BẠN</h3>
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedTrackOrder(ord)}
                      className={`p-5 border transition cursor-pointer flex justify-between items-start ${
                        selectedTrackOrder?.id === ord.id 
                          ? 'border-brand-charcoal bg-brand-cream/35 border-2' 
                          : 'border-brand-charcoal/10 hover:border-brand-charcoal bg-brand-cream/5'
                      } rounded-none`}
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-mono text-brand-gold font-bold">#{ord.id}</strong>
                          {getStatusBadge(ord.status)}
                        </div>
                        <p className="font-semibold text-brand-charcoal mt-1 text-sm uppercase tracking-wide">{ord.shirt_type}</p>
                        <p className="text-[11px] text-brand-muted font-light">
                          Giao nhận: {ord.customer_name} • SĐT: {ord.customer_phone}
                        </p>
                        <p className="text-[10px] text-brand-muted font-light flex items-center gap-1.5">
                          <Calendar size={11} /> {new Date(ord.created_at).toLocaleDateString('vi-VN')} {new Date(ord.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                      </div>

                      <div className="text-right space-y-2">
                        <strong className="text-sm font-bold text-brand-charcoal block">{ord.price_calc.toLocaleString('vi-VN')} đ</strong>
                        <span className="text-[10px] text-brand-gold border border-brand-gold/30 px-2 py-1 rounded-none inline-block bg-brand-cream uppercase font-semibold tracking-widest">
                          x{ord.quantity} Áo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Dynamic details track view */}
                <div className="lg:col-span-6" id="order-details-tracker-panel">
                  {selectedTrackOrder ? (
                    <div className="bg-brand-cream/30 border border-brand-charcoal/5 p-6 sm:p-8 space-y-6 rounded text-xs text-left">
                      
                      {/* Tracking panel header */}
                      <div className="border-b border-brand-charcoal/10 pb-4 flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">Theo Dõi Trực Tiếp Supabase</span>
                          <h3 className="text-2xl font-serif text-brand-charcoal tracking-tight mt-1">ĐƠN IN #{selectedTrackOrder.id}</h3>
                        </div>
                        {getStatusBadge(selectedTrackOrder.status)}
                      </div>

                      {/* Technical visual flow indicators */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-brand-charcoal">TIẾN ĐỘ THỰC HIỆN CAO TẦN:</h4>
                        
                        <div className="relative">
                          {/* Progress bar line back */}
                          <div className="absolute top-4 left-3 right-3 h-0.5 bg-brand-charcoal/10 -z-0" />
                          
                          <div className="grid grid-cols-4 relative z-10 text-center">
                            {/* PENDING STEP */}
                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold leading-none ${
                                selectedTrackOrder.status !== 'cancelled' ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>1</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Kiểm file</span>
                            </div>

                            {/* PROCESSING STEP */}
                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold leading-none ${
                                ['processing', 'shipping', 'completed'].includes(selectedTrackOrder.status) 
                                  ? 'bg-brand-gold text-brand-charcoal' 
                                  : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>2</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Nén nhiệt</span>
                            </div>

                            {/* SHIPPING STEP */}
                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold leading-none ${
                                ['shipping', 'completed'].includes(selectedTrackOrder.status) 
                                  ? 'bg-brand-gold text-brand-charcoal' 
                                  : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>3</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Trung chuyển</span>
                            </div>

                            {/* COMPLETED STEP */}
                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold leading-none ${
                                selectedTrackOrder.status === 'completed' 
                                  ? 'bg-brand-gold text-brand-charcoal' 
                                  : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>4</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Bàn giao</span>
                            </div>
                          </div>
                        </div>

                        {/* Status message log */}
                        <div className="p-4 bg-brand-ivory border text-brand-muted rounded leading-relaxed italic text-[11px]">
                          {getStatusDetailMessage(selectedTrackOrder.status)}
                        </div>
                      </div>

                      {/* Details rows layout */}
                      <div className="divide-y divide-brand-charcoal/10 space-y-3.5">
                        
                        {/* File preview box */}
                        <div className="pt-3.5">
                          <span className="text-brand-muted block font-light uppercase text-[9px] mb-2">FILE THIẾT KẾ ĐÃ UPLOAD LÊN SUPABASE:</span>
                          <div className="p-3 bg-brand-ivory border rounded flex items-center justify-between gap-3 overflow-hidden text-ellipsis">
                            <div className="flex items-center gap-2 w-2/3">
                              <img src={selectedTrackOrder.design_file_url} className="w-8 h-8 object-cover rounded border" alt="decal file design" />
                              <div className="truncate text-[11px]">
                                <p className="font-mono font-medium truncate text-brand-charcoal">{selectedTrackOrder.design_file_name}</p>
                                <p className="text-[9px] text-brand-muted">Decal in gốc chuẩn studio</p>
                              </div>
                            </div>
                            <a
                              href={selectedTrackOrder.design_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-brand-gold hover:underline font-semibold flex-shrink-0"
                            >
                              TẢI FILE GỐC
                            </a>
                          </div>
                        </div>

                        <div className="pt-3.5 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-brand-muted block font-light">MÔ ĐÊL PHÔI:</span>
                            <strong className="text-brand-charcoal font-semibold">{selectedTrackOrder.shirt_type}</strong>
                          </div>
                          <div>
                            <span className="text-brand-muted block font-light">KÍCH CỠ ĐẶT:</span>
                            <strong className="text-brand-charcoal font-semibold">Size {selectedTrackOrder.shirt_size}</strong>
                          </div>
                        </div>

                        <div className="pt-3.5 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-brand-muted block font-light">SỐ LƯỢNG IN:</span>
                            <strong className="text-brand-charcoal font-semibold">{selectedTrackOrder.quantity} chiếc t-shirt</strong>
                          </div>
                          <div>
                            <span className="text-brand-muted block font-light">MÀU SẮC ĐÃ CHỌN:</span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-full border border-brand-charcoal/20" style={{ backgroundColor: selectedTrackOrder.shirt_color }} />
                              <span className="font-mono text-[11px] text-brand-muted">{selectedTrackOrder.shirt_color}</span>
                            </span>
                          </div>
                        </div>

                        {selectedTrackOrder.notes && (
                          <div className="pt-3.5">
                            <span className="text-brand-muted block font-light">YÊU CẦU / GHI CHÚ KỸ THUẬT:</span>
                            <p className="text-brand-charcoal mt-1 whitespace-pre-line leading-relaxed font-light">{selectedTrackOrder.notes}</p>
                          </div>
                        )}

                        <div className="pt-3.5">
                          <span className="text-brand-muted block font-light">ĐỊA CHỈ & THÔNG TIN GHIM GIAO:</span>
                          <div className="mt-1 space-y-1 font-light leading-relaxed">
                            <p><strong className="font-medium text-brand-charcoal">Khách nhận:</strong> {selectedTrackOrder.customer_name}</p>
                            <p><strong className="font-medium text-brand-charcoal">Số điện thoại:</strong> {selectedTrackOrder.customer_phone}</p>
                            <p><strong className="font-medium text-brand-charcoal">Địa chỉ cụ thể:</strong> {selectedTrackOrder.customer_address}</p>
                          </div>
                        </div>

                        <div className="pt-3.5 flex justify-between items-center text-sm font-bold text-brand-gold bg-brand-cream/40 p-4 rounded mt-4">
                          <span>TỔNG THƯƠNG VỤ SƠ BỘ:</span>
                          <span className="text-base">{selectedTrackOrder.price_calc.toLocaleString('vi-VN')} đ</span>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="bg-brand-cream/10 border border-brand-charcoal/10 border-dashed p-16 text-center rounded space-y-3">
                      <Eye size={36} className="text-brand-muted mx-auto" />
                      <h4 className="text-sm font-serif">Chọn một đơn đặt in bất kỳ</h4>
                      <p className="text-xs text-brand-muted font-light max-w-xs mx-auto">
                        Nhấp vào thẻ hóa đơn bên trái để tra cứu tiến độ in dập mực của màng in PET dẻo nhiệt và thông tin trung chuyển từ Supabase.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

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

  // Logic xử lý Đăng nhập / Đăng ký
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'login') {
      if (!email || !password) {
        setErrorMsg('Vui lòng nhập Email và Mật khẩu.');
        return;
      }
      
      try {
        const existing = await dbSim.customers.getByEmail(email);
        
        if (existing) {
          if (existing.password === password) {
            setCustomerUser({ email: existing.email, full_name: existing.full_name });
            setSuccessMsg('Đăng nhập thành công!');
          } else {
            setErrorMsg('Mật khẩu không chính xác. Vui lòng thử lại.');
          }
        } else {
          setErrorMsg('Tài khoản không tồn tại. Vui lòng chọn ĐĂNG KÝ THÀNH VIÊN.');
        }
      } catch (err) {
        setErrorMsg('Lỗi kết nối máy chủ khi đăng nhập.');
      }
    } 
    
    else if (authMode === 'signup') {
      if (!email || !fullName || !password) {
        setErrorMsg('Vui lòng điền đủ Họ tên, Email và Mật khẩu.');
        return;
      }

      try {
        const existing = await dbSim.customers.getByEmail(email);
        if (existing) {
          setErrorMsg('Email này đã được sử dụng. Vui lòng chuyển sang Đăng nhập.');
          return;
        }

        await dbSim.customers.save({
          id: `cust-${Date.now()}`,
          email,
          password: password,
          full_name: fullName,
          phone,
          address,
          created_at: new Date().toISOString()
        } as any);
        
        setCustomerUser({ email, full_name: fullName });
        setSuccessMsg('Đăng ký tài khoản thành công!');
        setAuthMode('login');
      } catch (err) {
        setErrorMsg('Có lỗi xảy ra trong quá trình khởi tạo tài khoản.');
      }
    } 
    
    else if (authMode === 'forgot') {
      if (!email) {
        setErrorMsg('Vui lòng nhập Email để khôi phục mật khẩu.');
        return;
      }
      setSuccessMsg('Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.');
    }
  };

  const getStatusBadge = (status: CustomOrder['status']) => {
    switch (status) {
      case 'pending': 
        return <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 text-[10px] font-bold px-2.5 py-0.5 tracking-widest uppercase">Chờ duyệt file</span>;
      case 'approved': 
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 tracking-widest uppercase">Đã duyệt kỹ thuật</span>;
      case 'printing': 
        return <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold px-2.5 py-0.5 tracking-widest uppercase">Đang in ấn</span>;
      case 'finishing': 
        return <span className="bg-pink-50 text-pink-800 border border-pink-200 text-[10px] font-bold px-2.5 py-0.5 tracking-widest uppercase">Đang hoàn thiện</span>;
      case 'shipping': 
        return <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 tracking-widest uppercase">Đang giao hàng</span>;
      case 'completed': 
        return <span className="bg-green-50 text-green-800 border border-green-200 text-[10px] font-bold px-2.5 py-0.5 tracking-widest uppercase">Hoàn thành</span>;
      case 'cancelled': 
        return <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2.5 py-0.5 tracking-widest uppercase">Đã hủy đơn</span>;
    }
  };

  const getStatusDetailMessage = (status: CustomOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Đơn hàng đang chờ tiếp nhận. Đội ngũ kỹ thuật của PRINTEE sẽ kiểm tra độ phân giải file in và viền màng PET trước khi chuyển xuống xưởng ép.';
      case 'approved':
        return 'File thiết kế của bạn đã đạt tiêu chuẩn kỹ thuật in ấn cao tần và đã được phê duyệt xuống lệnh sản xuất.';
      case 'printing':
        return 'Sản phẩm đang trong quy trình ép nhiệt nén khí sâu trực tiếp phim PET lên thớ sợi phôi áo bởi thợ in lành nghề.';
      case 'finishing':
        return 'Áo đang được xử lý sấy khử mùi, nhặt chỉ thừa, kiểm định bề mặt hình in (QC) và là phẳng chuẩn đóng gói.';
      case 'shipping':
        return 'Sản phẩm đã được đóng gói kỹ càng trong hộp Kraft cao cấp, đi kèm gói hút ẩm và bàn giao cho đơn vị vận chuyển liên tỉnh.';
      case 'completed':
        return 'Đơn hàng in ấn chất lượng cao đã được giao tới bạn thành công. Chân thành cảm ơn bạn đã đồng hành cùng PRINTEE Studio!';
      case 'cancelled':
        return 'Đơn hàng đã bị hủy theo nguyện vọng của quý khách hoặc do file thiết kế gốc gửi lên quá mờ, không đủ tiêu chuẩn in xuất xưởng.';
    }
  };

  return (
    <div className="py-20 bg-brand-ivory min-h-[80vh] animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {!customerUser ? (
          /* GIAO DIỆN FORM ĐĂNG NHẬP / ĐĂNG KÝ MỚI */
          <div className="max-w-md mx-auto bg-brand-cream/30 border border-brand-charcoal/5 p-8 sm:p-10 rounded-none shadow-sm relative">
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-serif text-brand-charcoal uppercase tracking-widest">
                {authMode === 'login' && 'ĐĂNG NHẬP'}
                {authMode === 'signup' && 'ĐĂNG KÝ THÀNH VIÊN'}
                {authMode === 'forgot' && 'KHÔI PHỤC MẬT KHẨU'}
              </h2>
              <p className="text-xs text-brand-muted font-light leading-relaxed uppercase tracking-widest">
                {authMode === 'login' && 'Đăng nhập để theo dõi tiến độ sản xuất và hành trình giao nhận đơn in.'}
                {authMode === 'signup' && 'Khởi tạo tài khoản để quản lý file thiết kế và lưu thông tin nhận hàng.'}
                {authMode === 'forgot' && 'Nhập email để nhận liên kết khôi phục mật khẩu tài khoản của bạn.'}
              </p>
            </div>

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
                  <label className="text-brand-muted uppercase block text-[10px] font-bold">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập đầy đủ họ tên..."
                    className="w-full bg-white border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-brand-muted uppercase block text-[10px] font-bold">Địa chỉ Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vi_du@gmail.com"
                  className="w-full bg-white border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans text-xs"
                />
              </div>

              {authMode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-brand-muted uppercase block text-[10px] font-bold">Mật khẩu <span className="text-red-500">*</span></label>
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
                    className="w-full bg-white border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans text-xs"
                  />
                </div>
              )}

              {authMode === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-brand-muted uppercase block text-[10px] font-bold">Số điện thoại</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại..."
                      className="w-full bg-white border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-brand-muted uppercase block text-[10px] font-bold">Địa chỉ giao hàng</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, quận/huyện, thành phố..."
                      className="w-full bg-white border border-brand-charcoal/10 px-3.5 py-2.5 rounded-none focus:outline-none focus:border-brand-gold font-sans text-xs"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-brand-charcoal hover:bg-brand-gold hover:text-brand-charcoal text-brand-ivory font-sans py-4 uppercase font-semibold tracking-widest transition rounded-none mt-2 cursor-pointer border border-brand-charcoal text-[11px]"
              >
                {authMode === 'login' && 'ĐĂNG NHẬP'}
                {authMode === 'signup' && 'ĐĂNG KÝ TÀI KHOẢN'}
                {authMode === 'forgot' && 'GỬI YÊU CẦU'}
              </button>

            </form>

            <div className="mt-6 pt-6 border-t border-brand-charcoal/10 text-center text-[11px] text-brand-muted">
              {authMode === 'login' ? (
                <p>
                  Chưa có tài khoản thành viên?{' '}
                  <button 
                    onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }} 
                    className="text-brand-gold font-bold hover:underline uppercase ml-1"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              ) : (
                <p>
                  Đã có tài khoản thành viên?{' '}
                  <button 
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }} 
                    className="text-brand-gold font-bold hover:underline uppercase ml-1"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              )}
            </div>

          </div>
        ) : (
          /* GIAO DIỆN QUẢN LÝ LỊCH SỬ ĐƠN HÀNG */
          <div className="space-y-10 text-left" id="customer-orders-portal">
            
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
                >
                  <RefreshCw size={13} className={loadingOrders ? 'animate-spin' : ''} /> Làm mới đơn
                </button>
              </div>
            </div>

            {loadingOrders ? (
              <div className="py-24 text-center">
                <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-none animate-spin mx-auto mb-2" />
                <p className="text-xs text-brand-muted font-light uppercase tracking-widest">Đang tải danh sách đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center bg-brand-cream/20 border border-dashed rounded-none space-y-4">
                <Package size={48} className="text-brand-muted mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-serif uppercase tracking-wider">Bạn chưa gửi thiết kế đặt in nào</h3>
                  <p className="text-xs text-brand-muted font-light max-w-sm mx-auto">
                    Mọi đơn hàng được tạo bằng email này sẽ tự động xuất hiện tại đây để bạn kiểm soát tiến độ.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('custom-print')}
                  className="bg-brand-gold text-brand-charcoal px-6 py-3.5 text-xs uppercase font-semibold tracking-wider rounded-none inline-block cursor-pointer border border-brand-gold"
                >
                  Tải Thiết Kế IN Ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Danh sách đơn hàng bên trái */}
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest text-brand-charcoal uppercase mb-2">DANH SÁCH ĐƠN IN CỦA BẠN ({orders.length})</h3>
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
                          Người nhận: {ord.customer_name} • SĐT: {ord.customer_phone}
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

                {/* Khung theo dõi chi tiết bên phải */}
                <div className="lg:col-span-6">
                  {selectedTrackOrder ? (
                    <div className="bg-brand-cream/30 border border-brand-charcoal/5 p-6 sm:p-8 space-y-6 rounded text-xs text-left">
                      
                      <div className="border-b border-brand-charcoal/10 pb-4 flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">Hệ thống sản xuất</span>
                          <h3 className="text-2xl font-serif text-brand-charcoal tracking-tight mt-1">ĐƠN IN #{selectedTrackOrder.id}</h3>
                        </div>
                        {getStatusBadge(selectedTrackOrder.status)}
                      </div>

                      {/* Tiến trình trực quan */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-brand-charcoal">TIẾN ĐỘ THỰC HIỆN XƯỞNG IN:</h4>
                        
                        <div className="relative">
                          <div className="absolute top-4 left-3 right-3 h-0.5 bg-brand-charcoal/10 -z-0" />
                          
                          <div className="grid grid-cols-4 relative z-10 text-center">
                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                selectedTrackOrder.status !== 'cancelled' ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>1</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Kiểm file</span>
                            </div>

                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                ['printing', 'finishing', 'shipping', 'completed'].includes(selectedTrackOrder.status) 
                                  ? 'bg-brand-gold text-brand-charcoal' 
                                  : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>2</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Ép nhiệt</span>
                            </div>

                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                ['shipping', 'completed'].includes(selectedTrackOrder.status) 
                                  ? 'bg-brand-gold text-brand-charcoal' 
                                  : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>3</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Đang giao</span>
                            </div>

                            <div className="space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                selectedTrackOrder.status === 'completed' 
                                  ? 'bg-brand-gold text-brand-charcoal' 
                                  : 'bg-brand-charcoal/10 text-brand-muted'
                              }`}>4</div>
                              <span className="text-[9px] block uppercase font-semibold text-brand-charcoal">Bàn giao</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-brand-ivory border text-brand-muted rounded leading-relaxed italic text-[11px]">
                          {getStatusDetailMessage(selectedTrackOrder.status)}
                        </div>
                      </div>

                      <div className="divide-y divide-brand-charcoal/10 space-y-3.5">
                        
                        {/* File preview */}
                        <div className="pt-3.5">
                          <span className="text-brand-muted block font-light uppercase text-[9px] mb-2">FILE THIẾT KẾ ĐÃ GỬI IN:</span>
                          <div className="p-3 bg-brand-ivory border rounded flex items-center justify-between gap-3 overflow-hidden text-ellipsis">
                            <div className="flex items-center gap-2 w-2/3">
                              <img src={selectedTrackOrder.design_file_url} className="w-8 h-8 object-cover rounded border" alt="design preview" />
                              <div className="truncate text-[11px]">
                                <p className="font-mono font-medium truncate text-brand-charcoal">{selectedTrackOrder.design_file_name}</p>
                                <p className="text-[9px] text-brand-muted">Decal in gốc độ phân giải cao</p>
                              </div>
                            </div>
                            <a
                              href={selectedTrackOrder.design_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-brand-gold hover:underline font-semibold flex-shrink-0"
                            >
                              XEM FILE GỐC
                            </a>
                          </div>
                        </div>

                        <div className="pt-3.5 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-brand-muted block font-light">MÔ ĐÊL PHÔI ÁO:</span>
                            <strong className="text-brand-charcoal font-semibold">{selectedTrackOrder.shirt_type}</strong>
                          </div>
                          <div>
                            <span className="text-brand-muted block font-light">KÍCH THƯỚC:</span>
                            <strong className="text-brand-charcoal font-semibold">Size {selectedTrackOrder.shirt_size}</strong>
                          </div>
                        </div>

                        <div className="pt-3.5 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-brand-muted block font-light">SỐ LƯỢNG ĐẶT:</span>
                            <strong className="text-brand-charcoal font-semibold">{selectedTrackOrder.quantity} chiếc</strong>
                          </div>
                          <div>
                            <span className="text-brand-muted block font-light">MÀU ÁO ÁP DỤNG:</span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-full border border-brand-charcoal/20" style={{ backgroundColor: selectedTrackOrder.shirt_color }} />
                              <span className="font-mono text-[11px] text-brand-muted">{selectedTrackOrder.shirt_color}</span>
                            </span>
                          </div>
                        </div>

                        {selectedTrackOrder.notes && (
                          <div className="pt-3.5">
                            <span className="text-brand-muted block font-light">GHI CHÚ KỸ THUẬT:</span>
                            <p className="text-brand-charcoal mt-1 whitespace-pre-line leading-relaxed font-light">{selectedTrackOrder.notes}</p>
                          </div>
                        )}

                        <div className="pt-3.5">
                          <span className="text-brand-muted block font-light">THÔNG TIN GIAO NHẬN:</span>
                          <div className="mt-1 space-y-1 font-light leading-relaxed">
                            <p><strong className="font-medium text-brand-charcoal">Người nhận:</strong> {selectedTrackOrder.customer_name}</p>
                            <p><strong className="font-medium text-brand-charcoal">Số điện thoại:</strong> {selectedTrackOrder.customer_phone}</p>
                            <p><strong className="font-medium text-brand-charcoal">Địa chỉ nhận hàng:</strong> {selectedTrackOrder.customer_address}</p>
                          </div>
                        </div>

                        <div className="pt-3.5 flex justify-between items-center text-sm font-bold text-brand-gold bg-brand-cream/40 p-4 rounded mt-4">
                          <span>TỔNG CHI PHÍ TẠM TÍNH:</span>
                          <span className="text-base">{selectedTrackOrder.price_calc.toLocaleString('vi-VN')} đ</span>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="bg-brand-cream/10 border border-brand-charcoal/10 border-dashed p-16 text-center rounded space-y-3">
                      <Eye size={36} className="text-brand-muted mx-auto" />
                      <h4 className="text-sm font-serif">Chọn một hóa đơn bất kỳ</h4>
                      <p className="text-xs text-brand-muted font-light max-w-xs mx-auto">
                        Bấm vào thẻ hóa đơn bên danh sách trái để tra cứu chi tiết tiến độ nén keo phim PET và luồng trung chuyển đơn hàng.
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

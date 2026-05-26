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

  // ==========================================
  // LOGIC XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ (ĐÃ BẢO MẬT)
  // ==========================================
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
        // BẢO MẬT: Chỉ truy vấn đúng 1 user từ Database, không tải toàn bộ danh sách
        const existing = await dbSim.customers.getByEmail(email);
        
        if (existing) {
          // BẢO MẬT: Bắt buộc kiểm tra khớp mật khẩu
          if (existing.password === password) {
            setCustomerUser({ email: existing.email, full_name: existing.full_name });
            setSuccessMsg('Đăng nhập thành công!');
          } else {
            setErrorMsg('Mật khẩu không chính xác. Vui lòng thử lại.');
          }
        } else {
          setErrorMsg('Tài khoản chưa tồn tại. Quý khách vui lòng chọn ĐĂNG KÝ THÀNH VIÊN.');
        }
      } catch (err) {
        setErrorMsg('Lỗi kết nối máy chủ khi đăng nhập.');
      }
    } 
    
    else if (authMode === 'signup') {
      if (!email || !fullName || !password) {
        setErrorMsg('Vui lòng điền đủ Họ tên, Email, Mật khẩu.');
        return;
      }

      try {
        // Kiểm tra xem email đã bị đăng ký chưa
        const existing = await dbSim.customers.getByEmail(email);
        if (existing) {
          setErrorMsg('Email này đã được sử dụng. Vui lòng đăng nhập.');
          return;
        }

        // BẢO MẬT: Đã bổ sung lưu trường password vào Database
        await dbSim.customers.save({
          id: `cust-${Date.now()}`,
          email,
          password: password, // <-- Bắt buộc lưu mật khẩu
          full_name: fullName,
          phone,
          address,
          created_at: new Date().toISOString()
        } as any);
        
        setCustomerUser({ email, full_name: fullName });
        setSuccessMsg('Đăng ký và đăng nhập thành công!');
        // Đặt lại state
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
      setSuccessMsg('Một liên kết phục hồi đã được gửi đến email của bạn.');
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
        return <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold px-2.5 py-0.5 rounded

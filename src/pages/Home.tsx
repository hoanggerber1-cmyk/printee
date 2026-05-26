import { useState, useEffect } from 'react';
import { dbSim } from '../supabaseClient';
import { WebsiteCMS, Banner, Product, Category } from '../types';
import CmsEditableText from '../components/CmsEditableText';
import { ArrowRight, Sparkles, Upload, ChevronRight } from 'lucide-react';

interface HomeProps {
  setCurrentPage: (page: string) => void;
  cmsEditable: boolean;
  onUpdateCms: (newCms: WebsiteCMS) => void;
  cmsData: WebsiteCMS;
}

// COMPONENT CARD SẢN PHẨM CÓ CHỨC NĂNG ĐỔI MÀU ĐỔI ẢNH NGAY LẬP TỨC
const ProductCardHome = ({ product, onClick }: { product: Product, onClick: () => void }) => {
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  
  // Lấy ảnh tương ứng với vị trí màu sắc (nếu không có thì lấy ảnh đầu tiên mặc định)
  const displayImg = product.images[activeColorIdx] || product.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="bg-brand-cream/30 border border-brand-charcoal/5 rounded hover:border-brand-gold/50 transition flex flex-col justify-between h-full group">
      <div className="aspect-[4/5] relative cursor-pointer overflow-hidden bg-brand-cream" onClick={onClick}>
         {product.original_price && product.original_price > product.price && (
           <span className="absolute top-3 right-3 bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 z-20 shadow">SALE</span>
         )}
         <img src={displayImg} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={product.name}/>
      </div>
      <div className="p-5 flex-grow flex flex-col justify-between">
         <div>
           <h4 onClick={onClick} className="font-serif text-lg font-bold text-brand-charcoal line-clamp-2 cursor-pointer hover:text-brand-gold">{product.name}</h4>
           <div className="flex items-center gap-2 mt-2">
             <p className="text-brand-gold font-bold text-sm">{product.price.toLocaleString('vi-VN')} đ</p>
             {product.original_price && <p className="text-xs text-gray-400 line-through">{product.original_price.toLocaleString('vi-VN')} đ</p>}
           </div>
         </div>
         <div className="flex gap-2 mt-4 pt-3 border-t border-brand-charcoal/10">
           {product.colors.map((color, idx) => (
             <button
               key={idx}
               onMouseEnter={() => setActiveColorIdx(idx)} // Rê chuột tự đổi ảnh
               onClick={(e) => { e.stopPropagation(); setActiveColorIdx(idx); }} // Bấm cũng tự đổi ảnh
               className={`w-6 h-6 rounded-full border-2 transition shadow-sm ${activeColorIdx === idx ? 'border-brand-gold scale-110' : 'border-transparent hover:border-brand-charcoal/30'}`}
               style={{ backgroundColor: color }}
               title="Chọn màu này để xem ảnh"
             />
           ))}
         </div>
      </div>
    </div>
  );
};

export default function Home({ setCurrentPage, cmsEditable, onUpdateCms, cmsData }: HomeProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  // Tải dữ liệu Banners, Danh mục và Sản phẩm để trưng bày
  useEffect(() => {
    async function loadData() {
      try {
        const [bList, cList, pList] = await Promise.all([
          dbSim.banners.list(),
          dbSim.categories.list(),
          dbSim.products.list()
        ]);
        setBanners(bList.filter(b => b.active));
        setCategories(cList.filter(c => c.active).sort((a, b) => a.sort_order - b.sort_order));
        setProducts(pList.filter(p => p.status === 'active' && !p.is_deleted));
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [cmsData]);

  // Tính năng tự động chạy Banner (Auto-slide)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prevIdx) => (prevIdx + 1) % banners.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleCmsFieldUpdate = (field: string, value: string) => {
    const updated = { ...cmsData, [field]: value };
    onUpdateCms(updated);
  };

  const activeBanner = banners[currentBannerIdx] || {
    title: cmsData.hero_title, subtitle: cmsData.hero_description,
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1200',
    button_text: cmsData.hero_cta_primary, link_url: 'custom-print'
  };

  return (
    <div className="relative bg-brand-ivory animate-fadeIn">
      
      {/* Editorial Hero Banner */}
      <section className="relative h-[85vh] sm:h-[90vh] flex items-center justify-center bg-black overflow-hidden border-b border-brand-charcoal">
        <div className="absolute inset-0 z-0">
          <img src={activeBanner.image_url} alt="Hero Garment" className="w-full h-full object-cover opacity-65 transition-transform duration-1000 transform hover:scale-105" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/30 to-brand-charcoal/40" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-brand-ivory space-y-6">
          <div className="inline-flex items-center gap-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 px-3 py-1 rounded text-[11px] uppercase tracking-widest font-sans font-semibold">
            <Sparkles size={11} /> Studio Thiết Kế & In Áo Thun Cao Cấp
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-normal leading-tight">
            {cmsEditable ? (
              <CmsEditableText cmsEditable={cmsEditable} field="hero_title" value={cmsData.hero_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-ivory bg-transparent text-center border-none font-serif text-4xl sm:text-6xl md:text-7xl leading-tight" />
            ) : activeBanner.title}
          </h1>

          <p className="font-display text-base sm:text-lg md:text-xl tracking-widest text-brand-cream/90 max-w-2xl mx-auto font-light uppercase">
            {cmsEditable ? (
              <CmsEditableText cmsEditable={cmsEditable} field="hero_description" value={cmsData.hero_description} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-cream text-center font-display text-base sm:text-lg tracking-widest uppercase font-light" />
            ) : activeBanner.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
            <button onClick={() => setCurrentPage(activeBanner.link_url || 'custom-print')} className="w-full sm:w-auto bg-brand-gold text-brand-charcoal font-sans hover:bg-brand-gold-light text-xs font-semibold uppercase tracking-[0.2em] px-8 py-4.5 transition duration-300 flex items-center justify-center gap-2 rounded-none border border-brand-gold">
              <span>{cmsEditable ? cmsData.hero_cta_primary : activeBanner.button_text}</span><ArrowRight size={14} />
            </button>
            <button onClick={() => setCurrentPage('catalog')} className="w-full sm:w-auto border border-brand-ivory text-brand-ivory hover:text-brand-charcoal hover:bg-brand-ivory text-xs font-semibold uppercase tracking-[0.2em] px-8 py-4.5 transition duration-300 rounded-none">
              <span>{cmsData.hero_cta_secondary}</span>
            </button>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrentBannerIdx(i)} className={`w-12 h-[2px] transition ${i === currentBannerIdx ? 'bg-brand-gold' : 'bg-brand-ivory/30'}`} />
            ))}
          </div>
        )}
      </section>

      {/* KHU VỰC SẢN PHẨM TRƯNG BÀY THEO TỪNG DANH MỤC LÊN TRANG CHỦ */}
      {categories.map(cat => {
        // Lọc lấy các sản phẩm thuộc danh mục này
        const catProducts = products.filter(p => p.category_id === cat.id);
        
        // Nếu danh mục không có sản phẩm nào đang bán thì ẩn đi
        if (catProducts.length === 0) return null;

        return (
          <section key={cat.id} className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-brand-charcoal/10 bg-brand-ivory">
            <div className="flex flex-col sm:flex-row justify-between items-end mb-10 gap-4">
              <div>
                <span className="text-xs tracking-widest text-brand-gold font-sans font-semibold uppercase">BỘ SƯU TẬP PHÔI</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-brand-charcoal tracking-tight mt-2 uppercase">{cat.name}</h2>
              </div>
              <button 
                onClick={() => setCurrentPage('catalog')} 
                className="text-xs font-semibold uppercase tracking-widest text-brand-charcoal hover:text-brand-gold flex items-center gap-1 border-b border-brand-charcoal pb-1"
              >
                Xem tất cả mẫu <ChevronRight size={14} />
              </button>
            </div>
            
            {/* Lưới sản phẩm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Lấy tối đa 8 sản phẩm cho trang chủ đỡ dài */}
              {catProducts.slice(0, 8).map(prod => (
                <ProductCardHome 
                  key={prod.id} 
                  product={prod} 
                  onClick={() => setCurrentPage('catalog')} 
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Intro Section - Giới thiệu Studio */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-brand-charcoal/10" id="intro-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs tracking-widest text-brand-gold font-sans font-semibold uppercase">{cmsData.about_subtitle}</span>
            <h2 className="text-4xl sm:text-5xl font-serif text-brand-charcoal tracking-tight">
              {cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="about_title" value={cmsData.about_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-charcoal font-serif text-4xl sm:text-5xl leading-tight" /> : cmsData.about_title}
            </h2>
            <div className="text-sm text-brand-muted leading-relaxed font-light space-y-4">
              {cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="about_content" value={cmsData.about_content} onUpdate={handleCmsFieldUpdate} multiline={true} elementClass="text-brand-muted text-sm leading-relaxed" /> : <p className="whitespace-pre-line">{cmsData.about_content}</p>}
            </div>
            <div className="pt-6 grid grid-cols-2 gap-6 border-t border-brand-charcoal/10">
              <div><p className="text-2xl font-serif font-bold text-brand-gold">100% Cotton</p><p className="text-xs text-brand-muted font-light mt-1">Định lượng dệt 260GSM siêu bền chắc.</p></div>
              <div><p className="text-2xl font-serif font-bold text-brand-gold">PET DTF 12 Colors</p><p className="text-xs text-brand-muted font-light mt-1">Mực dẻo Hàn Quốc siêu đàn hồi.</p></div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 border border-brand-gold/30 translate-x-4 translate-y-4 z-0"></div>
            <img src={cmsData.about_image} alt="Premium Blank Garment" className="relative z-10 w-full h-[500px] object-cover grayscale-20 hover:grayscale-0 transition duration-500" referrerPolicy="no-referrer" />
          </div>
        </div>
      </section>

      {/* Quy trình đặt hàng */}
      <section className="py-24 bg-brand-dark-grey text-brand-ivory border-b border-black" id="workflow-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
            <span className="text-xs tracking-widest text-brand-gold uppercase font-semibold">Cực Kỳ Đơn Giản & Minh Bạch</span>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-white">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_title" value={cmsData.process_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-ivory font-serif text-3xl sm:text-4xl text-center" /> : cmsData.process_title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <div className="space-y-4 md:border-r border-brand-ivory/10 pr-4">
              <h3 className="text-sm font-semibold tracking-widest text-brand-gold uppercase">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step1_title" value={cmsData.process_step1_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-gold uppercase font-semibold text-sm" /> : cmsData.process_step1_title}</h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step1_desc" value={cmsData.process_step1_desc} onUpdate={handleCmsFieldUpdate} multiline={true} elementClass="text-brand-muted text-xs leading-relaxed" /> : cmsData.process_step1_desc}</p>
            </div>
            <div className="space-y-4 md:border-r border-brand-ivory/10 pr-4">
              <h3 className="text-sm font-semibold tracking-widest text-brand-gold uppercase">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step2_title" value={cmsData.process_step2_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-gold uppercase font-semibold text-sm" /> : cmsData.process_step2_title}</h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step2_desc" value={cmsData.process_step2_desc} onUpdate={handleCmsFieldUpdate} multiline={true} elementClass="text-brand-muted text-xs leading-relaxed" /> : cmsData.process_step2_desc}</p>
            </div>
            <div className="space-y-4 md:border-r border-brand-ivory/10 pr-4">
              <h3 className="text-sm font-semibold tracking-widest text-brand-gold uppercase">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step3_title" value={cmsData.process_step3_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-gold uppercase font-semibold text-sm" /> : cmsData.process_step3_title}</h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step3_desc" value={cmsData.process_step3_desc} onUpdate={handleCmsFieldUpdate} multiline={true} elementClass="text-brand-muted text-xs leading-relaxed" /> : cmsData.process_step3_desc}</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-widest text-brand-gold uppercase">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step4_title" value={cmsData.process_step4_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-gold uppercase font-semibold text-sm" /> : cmsData.process_step4_title}</h3>
              <p className="text-xs text-brand-muted font-light leading-relaxed">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="process_step4_desc" value={cmsData.process_step4_desc} onUpdate={handleCmsFieldUpdate} multiline={true} elementClass="text-brand-muted text-xs leading-relaxed" /> : cmsData.process_step4_desc}</p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <button onClick={() => setCurrentPage('custom-print')} className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold-light hover:text-black font-sans text-xs font-semibold tracking-[0.2em] px-10 py-5 uppercase transition duration-300 rounded-none flex items-center gap-2 mx-auto cursor-pointer border border-brand-gold">
              <Upload size={14} /><span>GỬI THIẾT KẾ VÀ ĐẶT HÀNG NGAY</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feedback khách hàng */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="testimonials-section">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs tracking-widest text-brand-gold uppercase font-semibold">Phản Hồi Thực Tế</span>
          <h2 className="text-3xl sm:text-4xl font-serif tracking-tight">{cmsEditable ? <CmsEditableText cmsEditable={cmsEditable} field="feedback_title" value={cmsData.feedback_title} onUpdate={handleCmsFieldUpdate} elementClass="text-brand-charcoal font-serif text-3xl sm:text-4xl text-center" /> : cmsData.feedback_title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-brand-cream/30 p-8 border border-brand-charcoal/5 space-y-4">
            <p className="text-base font-serif italic text-brand-charcoal">"Hạt mực cực mịn, co giãn dẻo dai."</p>
            <p className="text-xs text-brand-muted leading-relaxed font-light">"Tôi đặt in áo thun 260GSM phôi thô bên studio PRINTEE cho đợt mở bán. Nhận hàng thực tế màng PET bám siêu chắc, giặt máy không nứt vỡ hay sần sùi chút nào."</p>
            <div className="pt-4 border-t border-brand-charcoal/5"><strong className="text-xs font-semibold text-brand-charcoal uppercase block">Kiên Trần (KienArt)</strong><span className="text-[10px] text-brand-muted uppercase tracking-wider font-light">Lead Graphic Designer</span></div>
          </div>
          <div className="bg-brand-cream/30 p-8 border border-brand-charcoal/5 space-y-4">
            <p className="text-base font-serif italic text-brand-charcoal">"Phôi áo thun streetwear tốt nhất Việt Nam"</p>
            <p className="text-xs text-brand-muted leading-relaxed font-light">"Rất hiếm nơi làm cổ áo bo thun thô rib dệt dầy khít 3cm như ở PRINTEE. Form boxy chuẩn mực làm nổi bật cả artwork thiết kế."</p>
            <div className="pt-4 border-t border-brand-charcoal/5"><strong className="text-xs font-semibold text-brand-charcoal uppercase block">Huyền Trang (Z-Studio)</strong><span className="text-[10px] text-brand-muted uppercase tracking-wider font-light">Founder & Creative Director</span></div>
          </div>
          <div className="bg-brand-cream/30 p-8 border border-brand-charcoal/5 space-y-4">
            <p className="text-base font-serif italic text-brand-charcoal">"Tuyệt vời giải pháp in cho local brand ít vốn"</p>
            <p className="text-xs text-brand-muted leading-relaxed font-light">"Chính sách cho phép đặt lẻ từ 1 sản phẩm đã giúp thương hiệu của tôi quay vòng vốn cực tốt mà không lo tồn kho. Chất lượng in ấn giữ chuẩn studio cao cấp!"</p>
            <div className="pt-4 border-t border-brand-charcoal/5"><strong className="text-xs font-semibold text-brand-charcoal uppercase block">Minh Hoàng (Aether Club)</strong><span className="text-[10px] text-brand-muted uppercase tracking-wider font-light">Independent Fashion Designer</span></div>
          </div>
        </div>
      </section>

    </div>
  );
}

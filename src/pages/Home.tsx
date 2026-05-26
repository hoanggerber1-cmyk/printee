import { useState, useEffect } from 'react';
import { dbSim, uploadToStorage } from '../supabaseClient';
import { WebsiteCMS, Banner } from '../types';
import CmsEditableText from '../components/CmsEditableText';
import { ArrowRight, Sparkles, Upload, ShoppingCart, CheckCircle2, ChevronRight, RefreshCw, Layers } from 'lucide-react';

interface HomeProps {
  setCurrentPage: (page: string) => void;
  cmsEditable: boolean;
  onUpdateCms: (newCms: WebsiteCMS) => void;
  cmsData: WebsiteCMS;
}

export default function Home({ setCurrentPage, cmsEditable, onUpdateCms, cmsData }: HomeProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Load active banners
  useEffect(() => {
    async function loadData() {
      try {
        const list = await dbSim.banners.list();
        setBanners(list.filter(b => b.active));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBanners(false);
      }
    }
    loadData();
  }, [cmsData]); // Reload if CMS or database changes

  // Tính năng tự động chạy Banner (Auto-slide)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prevIdx) => (prevIdx + 1) % banners.length);
    }, 4000); // 4000ms = 4 giây tự động đổi slide
    
    return () => clearInterval(interval);
  }, [banners.length]);

  // Swatches for garment color showcase section
  const SWATCHES = [
    { name: 'Ivory Soft', hex: '#FDFCF7', desc: 'Sợi bông chưa tảy thô tự nhiên' },
    { name: 'Pitch Black', hex: '#111111', desc: 'Đen Carbon bụi sâu lắng dầy dặn' },
    { name: 'Charcoal Grey', hex: '#555555', desc: 'Xám khói wash đá thô ráp' },
    { name: 'Navy Studio', hex: '#1B2C3F', desc: 'Sắc lam đêm sang trọng thâm trầm' },
    { name: 'Forest Moss', hex: '#3B4C3A', desc: 'Xanh rêu mờ râm mát vintage' },
    { name: 'Hermes Orange', hex: '#E36414', desc: 'Cam Neon streetwear rực rỡ' },
    { name: 'Burgundy Crimson', hex: '#591A2A', desc: 'Đỏ mận chín vương giả quyến rũ' }
  ];

  // Actual printed garments photos Showcase
  const ACTUAL_SAMPLES = [
    {
      title: 'T-shirt Graphic in màng PET DTF 12 màu',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=500',
      tag: 'Classic Boxy'
    },
    {
      title: 'Hoodie Oversized họa tiết Cyberpunk ép nổi',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=500',
      tag: 'Heavy Cotton'
    },
    {
      title: 'Sweater Streetwear in lụa phối nhũ vàng',
      image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=500',
      tag: 'French Terry'
    },
    {
      title: 'Polo Pique thêu nổi mật độ chỉ cao',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=500',
      tag: 'Oversized Polo'
    }
  ];

  // Admin CMS text save adapter
  const handleCmsFieldUpdate = (field: string, value: string) => {
    const updated = { ...cmsData, [field]: value };
    onUpdateCms(updated);
  };

  const activeBanner = banners[currentBannerIdx] || {
    title: cmsData.hero_title,
    subtitle: cmsData.hero_description,
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1200',
    button_text: cmsData.hero_cta_primary,
    link_url: 'custom-print'
  };

  return (
    <div className="relative bg-brand-ivory animate-fadeIn">
      
      {/* Editorial Hero Banner */}
      <section className="relative h-[85vh] sm:h-[90vh] flex items-center justify-center bg-black overflow-hidden border-b border-brand-charcoal">
        {/* Banner Image with darkened overlay for high typography contrast */}
        <div className="absolute inset-0 z-0">
          <img 
            src={activeBanner.image_url} 
            alt="Hero Garment" 
            className="w-full h-full object-cover opacity-65 transition-transform duration-1000 transform hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/30 to-brand-charcoal/40" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-brand-ivory space-y-6">
          <div className="inline-flex items-center gap-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 px-3 py-1 rounded text-[11px] uppercase tracking-widest font-sans font-semibold">
            <Sparkles size={11} /> Studio Thiết Kế & In Áo Thun Cao Cấp
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-normal leading-tight">
            {cmsEditable ? (
              <CmsEditableText
                cmsEditable={cmsEditable}
                field="hero_title"
                value={cmsData.hero_title}
                onUpdate={handleCmsFieldUpdate}
                elementClass="text-brand-ivory bg-transparent text-center border-none font-serif text-4xl sm:text-6xl md:text-7xl leading-tight"
              />
            ) : (
              activeBanner.title
            )}
          </h1>

          <p className="font-display text-base sm:text-lg md:text-xl tracking-widest text-brand-cream/90 max-w-2xl mx-auto font-light uppercase">
            {cmsEditable ? (
              <CmsEditableText
                cmsEditable={cmsEditable}
                field="hero_description"
                value={cmsData.hero_description}
                onUpdate={handleCmsFieldUpdate}
                elementClass="text-brand-cream text-center font-display text-base sm:text-lg tracking-widest uppercase font-light"
              />
            ) : (
              activeBanner.subtitle
            )}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
            <button
              onClick={() => setCurrentPage(activeBanner.link_url || 'custom-print')}
              className="w-full sm:w-auto bg-brand-gold text-brand-charcoal font-sans hover:bg-brand-gold-light text-xs font-semibold uppercase tracking-[0.2em] px-8 py-4.5 transition duration-300 flex items-center justify-center gap-2 rounded-none cursor-pointer border border-brand-gold"
              id="hero-cta-primary"
            >
              <span>{cmsEditable ? cmsData.hero_cta_primary : activeBanner.button_text}</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setCurrentPage('catalog')}
              className="w-full sm:w-auto border border-brand-ivory text-brand-ivory hover:text-brand-charcoal hover:bg-brand-ivory text-xs font-semibold uppercase tracking-[0.2em] px-8 py-4.5 transition duration-300 rounded-none cursor-pointer"
              id="hero-cta-secondary"
            >
              <span>{cmsData.hero_cta_secondary}</span>
            </button>
          </div>
        </div>

        {/* Carousel indicators if multiple banners */}
        {banners.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBannerIdx(i)}
                className={`w-12 h-[2px] transition ${i === currentBannerIdx ? 'bg-brand-gold' : 'bg-brand-ivory/30'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Intro Section - Giới thiệu */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-brand-charcoal/10" id="intro-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs tracking-widest text-brand-gold font-sans font-semibold uppercase">
              {cmsData.about_subtitle}
            </span>
            <h2 className="text-4xl sm:text-5xl font-serif text-brand-charcoal tracking-tight">
              {cmsEditable ? (
                <CmsEditableText
                  cmsEditable={cmsEditable}
                  field="about_title"
                  value={cmsData.about_title}
                  onUpdate={handleCmsFieldUpdate}
                  elementClass="text-brand-charcoal font-serif text-4xl sm:text-5xl leading-tight"
                />
              ) : (
                cmsData.about_title
              )}
            </h2>
            <div className="text-sm text-brand-muted leading-relaxed font-light space-y-4">
              {cmsEditable ? (
                <CmsEditableText
                  cmsEditable={cmsEditable}
                  field="about_content"
                  value={cmsData.about_content}
                  onUpdate={handleCmsFieldUpdate}
                  multiline={true}
                  elementClass="text-brand-muted text-sm leading-relaxed"
                />
              ) : (
                <p className="whitespace-pre-line">{cmsData.about_content}</p>
              )}
            </div>
            
            <div className="pt-6 grid grid-cols-2 gap-6 border-t border-brand-charcoal/10">
              <div>
                <p className="text-2xl font-serif font-bold text-brand-gold">100% Cotton</p>
                <p className="text-xs text-brand-muted font-light mt-1">Định lượng dệt 260GSM siêu bền chắc.</p>
              </div>
              <div>
                <p className="text-2xl font-serif font-bold text-brand-gold">PET DTF 12 Colors</p>
                <p className="text-xs text-brand-muted font-light mt-1">Mực dẻo Hàn Quốc siêu đàn hồi.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 border border-brand-gold/30 translate-x-4 translate-y-4 z-0"></div>
            <img 
              src={cmsData.about_image} 
              alt="Premium Blank Garment" 
              className="relative z-10 w-full h-[500px] object-cover grayscale-20 hover:grayscale-0 transition duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Colors Swatches Section - Bảng màu áo */}
      <section className="py-24 bg-brand-cream/40 border-b border-brand-charcoal/10" id="colors-palette-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs tracking-widest text-brand-gold uppercase font-semibold">Tự do thể hiện cá tính</span>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight">
              {cmsEditable ? (
                <CmsEditableText
                  cmsEditable={cmsEditable}
                  field="color_palette_title"
                  value={cmsData.color_palette_title}
                  onUpdate={handleCmsFieldUpdate}
                  elementClass="text-brand-charcoal font-serif text-3xl sm:text-4xl text-center"
                />
              ) : (
                cmsData.color_palette_title
              )}
            </h2>
            <p className="text-xs text-brand-muted font-light leading-relaxed">
              {cmsEditable ? (
                <CmsEditableText
                  cmsEditable={cmsEditable}
                  field="color_palette_description"
                  value={cmsData.color_palette_description}
                  onUpdate={handleCmsFieldUpdate}
                  elementClass="text-brand-muted text-xs text-center"
                />
              ) : (
                cmsData.color_palette_description
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {SWATCHES.map((swatch, idx) => (
              <div 
                key={idx} 
                className="bg-brand-ivory p-4 border border-brand-charcoal/10 group hover:border-brand-gold/60 transition duration-300 rounded-none"
              >
                <div 
                  className="w-full h-24 rounded-none border border-brand-charcoal/10"
                  style={{ backgroundColor: swatch.hex }}
                />
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-brand-charcoal uppercase tracking-wider">{swatch.name}</p>
                  <p className="text-[10px] text-brand-muted font-light mt-1 leading-snug">{swatch.desc}</p>
                  <p className="text-[9px] text-brand-gold font-mono uppercase mt-2 tracking-widest">{swatch.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Actual printed sample Showcase - Thành phẩm thực tế */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-brand-charcoal/10" id="actual-samples-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
          <div className="space-y-4">
            <span className="text-xs tracking-widest text-brand-gold uppercase font-semibold">Tác Phẩm Thực Tế</span>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight">KẾT QUẢ IN ẤN CAO CẤP</h2>
            <p className="text-xs text-brand-muted font-light">Hình ảnh thực tế áo thun được gửi từ các khách hàng sở hữu local brand lớn.</p>
          </div>
          <div>
            <button 
              onClick={() => setCurrentPage('lookbook')}
              className="text-xs font-semibold uppercase tracking-widest text-brand-charcoal hover:text-brand-gold flex items-center gap-1 py-2 border-b border-brand-charcoal"
              id="view-all-lookbook-btn"
            >
              <span>Xem Album Lookbook</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {ACTUAL_SAMPLES.map((sample, idx) => (
            <div key={idx} className="group relative overflow-hidden bg-brand-cream/20 border border-brand-charcoal/5">
              <div className="aspect-[3/4] overflow-hidden">
                <img 
                  src={sample.image} 
                  alt={sample.title} 
                  className="w-full h-full object-cover transition duration-500 transform group-hover:scale-105 filter grayscale-10 group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 bg-brand-ivory border-t border-brand-charcoal/5">
                <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">{sample.tag}</span>
                <h3 className="text-sm font-medium text-brand-charcoal mt-1 line-clamp-1">{sample.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step workflow graph - Quy trình đặt hàng */}
      <section className="py-24 bg-brand-dark-grey text-brand-ivory border-b border-black" id="workflow-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">

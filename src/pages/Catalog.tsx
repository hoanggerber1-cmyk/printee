import { useState, useEffect } from 'react';
import { dbSim } from '../supabaseClient';
import { Product, Category } from '../types';
import { Search, SlidersHorizontal, Info, Shirt, ArrowUpRight, ArrowLeftRight, Check, CheckCircle2 } from 'lucide-react';

interface CatalogProps {
  setCurrentPage: (page: string) => void;
  setSelectedPreloadGarment: (garment: { type: string, color: string, size: string }) => void;
}

export default function Catalog({ setCurrentPage, setSelectedPreloadGarment }: CatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Selected product detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chosenColor, setChosenColor] = useState<string>('');
  const [chosenSize, setChosenSize] = useState<string>('XL');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pList, cList] = await Promise.all([
          dbSim.products.list(),
          dbSim.categories.list()
        ]);
        setProducts(pList.filter(p => p.status === 'active'));
        setCategories(cList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter & Sort math
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newest/Featured
  });

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
  };

  const handleCreateCustomOrderSim = (product: Product) => {
    setSelectedPreloadGarment({
      type: `${product.name} (Phôi ${getCategoryName(product.category_id)})`,
      color: chosenColor || product.colors[0] || '#111111',
      size: chosenSize
    });
    setSelectedProduct(null);
    setCurrentPage('custom-print');
  };

  return (
    <div className="py-12 bg-brand-ivory animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Editorial Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs tracking-widest text-brand-gold uppercase font-semibold">Cửa hàng phôi cao cấp</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-brand-charcoal tracking-tight font-medium">BỘ SƯU TẬP PHÔI CHUẨN STUDIO</h1>
          <p className="text-xs text-brand-muted leading-relaxed font-light">
            Sợi bông dệt chải kỹ hữu cơ cao cấp, đường kim tăm sọc kép, đứng dáng chuẩn form. Cam kết phôi áo tuyệt vời nhất làm bệ phóng cho các siêu phẩm nghệ thuật của bạn.
          </p>
        </div>

        {/* Search, Filter, Sort Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-12 border-b border-brand-charcoal/10" id="filter-container">
          {/* Categories Tab list */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-3 text-xs tracking-widest font-semibold transition uppercase rounded-none cursor-pointer ${
                selectedCategory === 'all' 
                  ? 'bg-brand-charcoal text-white' 
                  : 'bg-brand-cream hover:bg-brand-gold/10 text-brand-charcoal'
              }`}
              id="cat-tab-all"
            >
              TẤT CẢ PHÔI
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-3 text-xs tracking-widest font-semibold transition uppercase rounded-none cursor-pointer ${
                  selectedCategory === cat.id 
                    ? 'bg-brand-charcoal text-white' 
                    : 'bg-brand-cream hover:bg-brand-gold/10 text-brand-charcoal'
                }`}
                id={`cat-tab-${cat.slug}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Search & Sort UI */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex items-center bg-brand-cream border border-brand-charcoal/10 focus-within:border-brand-gold rounded-none overflow-hidden">
              <span className="pl-3 text-brand-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Tìm mã phôi, chất liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2.5 text-xs bg-transparent border-none text-brand-charcoal focus:ring-0 focus:outline-none w-full sm:w-48 rounded-none"
                id="catalog-search-input"
              />
            </div>

            <div className="relative flex items-center bg-brand-cream border border-brand-charcoal/10 rounded-none overflow-hidden">
              <span className="pl-3 text-brand-muted text-xs font-semibold uppercase tracking-wider">Xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 text-xs bg-transparent border-none text-brand-charcoal font-semibold focus:ring-0 focus:outline-none cursor-pointer rounded-none"
                id="catalog-sort-select"
              >
                <option value="featured">NỔI BẬT</option>
                <option value="price-asc">GIÁ: THẤP ĐẾN CAO</option>
                <option value="price-desc">GIÁ: CAO ĐẾN THẤP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-brand-muted font-light uppercase tracking-widest">Đang tải phôi thời trang chuẩn studio...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-brand-cream/20 border border-brand-charcoal/5 rounded">
            <Shirt size={48} className="text-brand-muted mx-auto mb-4" />
            <h3 className="text-lg font-serif">Không tìm thấy phôi áo phù hợp</h3>
            <p className="text-xs text-brand-muted font-light mt-1">Hãy thử đổi danh mục hoặc thu hẹp từ khoá tìm kiếm.</p>
          </div>
        ) : (
          /* Products Grid system */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="products-grid">
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                className="group bg-brand-cream/30 border border-brand-charcoal/5 rounded-sm hover:border-brand-gold/50 transition duration-300 flex flex-col justify-between"
              >
                {/* Product preview graphic with high aesthetics */}
                <div 
                  className="aspect-[4/5] bg-brand-cream overflow-hidden cursor-pointer relative"
                  onClick={() => {
                    setSelectedProduct(p);
                    setChosenColor(p.colors[0] || '#111111');
                    setChosenSize('XL');
                  }}
                >
                  <img 
                    src={p.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600'} 
                    alt={p.name} 
                    className="w-full h-full object-cover grayscale-10 group-hover:grayscale-0 transition duration-700 transform group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4 bg-brand-ivory/95 border border-brand-charcoal/10 text-brand-charcoal text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 z-10 rounded-none">
                    {getCategoryName(p.category_id)}
                  </div>
                  
                  {/* Overlay for hovering selection */}
                  <div className="absolute inset-0 bg-brand-charcoal/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <span className="bg-brand-ivory text-brand-charcoal px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase flex items-center gap-1">
                      Chi tiết phôi áo <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>

                {/* Card labels */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-2.5">
                  <div>
                    <h3 className="font-serif text-lg leading-snug text-brand-charcoal hover:text-brand-gold cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(p);
                        setChosenColor(p.colors[0] || '#111111');
                        setChosenSize('XL');
                      }}
                    >
                      {p.name}
                    </h3>
                    <p className="text-xs text-brand-muted font-light line-clamp-2 mt-1.5 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="flex justify-between items-end pt-3 border-t border-brand-charcoal/5">
                    <div>
                      {p.original_price && (
                        <p className="text-[10px] text-brand-muted line-through font-light">{p.original_price.toLocaleString('vi-VN')} đ</p>
                      )}
                      <p className="text-sm font-sans font-semibold text-brand-gold">{p.price.toLocaleString('vi-VN')} vnđ</p>
                    </div>
                    {/* Tiny colors dots display */}
                    <div className="flex gap-1">
                      {p.colors.slice(0, 4).map((c, idx) => (
                        <span 
                          key={idx} 
                          className="w-3 h-3 rounded-full border border-brand-charcoal/25" 
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                      {p.colors.length > 4 && (
                        <span className="text-[9px] text-brand-muted font-bold font-mono pl-0.5">+{p.colors.length - 4}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gorgeous Drawer/Modal for selected product details */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-charcoal/75 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn" id="product-detail-modal">
            <div className="bg-brand-ivory w-full max-w-4xl border border-brand-charcoal rounded overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-2">
              
              {/* Close Button absolute */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-brand-charcoal text-brand-ivory flex items-center justify-center hover:bg-brand-gold transition duration-200"
                id="close-detail-modal"
              >
                ✕
              </button>

              {/* Slider image left */}
              <div className="aspect-[4/5] bg-brand-cream relative">
                <img 
                  src={selectedProduct.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Product specifications content */}
              <div className="p-8 flex flex-col justify-between bg-brand-ivory overflow-y-auto max-h-[500px] md:max-h-[600px] gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">
                        Dòng: {getCategoryName(selectedProduct.category_id)}
                      </span>
                      <h2 className="text-2xl font-serif text-brand-charcoal tracking-tight mt-1">{selectedProduct.name}</h2>
                    </div>
                  </div>

                  <p className="text-xs text-brand-muted leading-relaxed font-light whitespace-pre-line">{selectedProduct.description}</p>
                  
                  {/* Textile specs tag list */}
                  <div className="grid grid-cols-2 gap-4 pt-3 pb-3 border-t border-b border-brand-charcoal/10 text-xs">
                    <div>
                      <span className="text-brand-muted block font-light">Vải dệt:</span>
                      <strong className="text-brand-charcoal font-semibold">100% Cotton Organic</strong>
                    </div>
                    <div>
                      <span className="text-brand-muted block font-light">Định lượng:</span>
                      <strong className="text-brand-charcoal font-semibold">240 - 260 GSM</strong>
                    </div>
                    <div>
                      <span className="text-brand-muted block font-light">Độ co giãn:</span>
                      <strong className="text-brand-charcoal font-semibold">Bo thun rib đàn hồi 4 chiều</strong>
                    </div>
                    <div>
                      <span className="text-brand-muted block font-light">Phù hợp in:</span>
                      <strong className="text-brand-charcoal font-semibold">PET DTF cao cấp & in DTG</strong>
                    </div>
                  </div>

                  {/* Colors pick */}
                  <div className="space-y-2">
                    <span className="text-xs tracking-wider text-brand-charcoal font-semibold">CHỌN MÀU PHÔI ÁO:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.colors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => setChosenColor(color)}
                          className={`w-9 h-9 rounded-full border-2 transition relative ${
                            chosenColor === color ? 'border-brand-gold scale-110 shadow' : 'border-transparent hover:border-brand-charcoal'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {chosenColor === color && (
                            <span className="absolute inset-0 flex items-center justify-center text-brand-gold text-white drop-shadow-md">
                              <Check size={14} className="stroke-[3]" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizes pick */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs text-brand-charcoal font-semibold">
                      <span>CHỌN SIZE ÁO (CHUẨN CHÂU ÂU):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setChosenSize(size)}
                          className={`w-10 h-10 rounded-none text-xs font-bold transition flex items-center justify-center border cursor-pointer ${
                            chosenSize === size 
                              ? 'bg-brand-charcoal border-brand-charcoal text-white' 
                              : 'bg-brand-cream border-brand-charcoal/15 hover:border-brand-charcoal text-brand-charcoal'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-charcoal/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-brand-muted">Đơn giá phôi thô:</span>
                    <strong className="text-xl font-sans font-bold text-brand-gold">
                      {selectedProduct.price.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>

                  <button
                    onClick={() => handleCreateCustomOrderSim(selectedProduct)}
                    className="w-full bg-brand-gold hover:bg-brand-gold-light text-brand-charcoal py-4.5 text-xs font-semibold tracking-widest uppercase transition rounded-none cursor-pointer border border-brand-gold flex items-center justify-center gap-2"
                  >
                    <span>TIẾP TỤC THIẾT KẾ & ĐẶT IN</span>
                    <ArrowForwardSim />
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Micro icon drawing helper
function ArrowForwardSim() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

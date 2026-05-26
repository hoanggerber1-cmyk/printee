import { useState, useEffect } from 'react';
import { dbSim } from '../supabaseClient';
import { LookbookAlbum, AlbumImage } from '../types';
import { Sparkles, Calendar, BookOpen, Layers, ArrowLeft } from 'lucide-react';

export default function Lookbook() {
  const [albums, setAlbums] = useState<LookbookAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<LookbookAlbum | null>(null);
  const [albumImages, setAlbumImages] = useState<AlbumImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    async function loadAlbums() {
      try {
        setLoading(true);
        const list = await dbSim.albums.list();
        setAlbums(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAlbums();
  }, []);

  // Fetch photos if an album is selected
  const handleSelectAlbum = async (album: LookbookAlbum) => {
    setSelectedAlbum(album);
    try {
      setLoadingImages(true);
      const images = await dbSim.albums.imagesForAlbum(album.id);
      setAlbumImages(images);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImages(false);
    }
  };

  return (
    <div className="py-20 bg-brand-ivory min-h-screen animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Subtitle block */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-20 animate-slideUp">
          <div className="inline-flex items-center gap-1 bg-brand-gold/10 text-brand-gold px-3.5 py-1.5 text-[10px] tracking-widest uppercase font-semibold border border-brand-gold/20 rounded-none">
            <Sparkles size={11} /> High Fashion Editorial Portfolio
          </div>
          <h1 className="text-5xl font-serif tracking-normal text-brand-charcoal">STUDIO LOOKBOOK</h1>
          <p className="text-xs text-brand-muted leading-relaxed font-light uppercase tracking-wider">
            Sắc thái tự đo phóng khoáng hòa quyện cùng form dáng streetwear đương đại. Tìm nguồn cảm hứng thiết kế thêu in từ các dự án thành phẩm xuất sắc nhất tại PRINTEE.
          </p>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto animate-fadeIn" />
            <p className="text-xs text-brand-muted uppercase tracking-widest">Đang tải lookbook cao cấp...</p>
          </div>
        ) : !selectedAlbum ? (
          /* Album grid list view */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12" id="lookbook-albums-grid">
            {albums.map((album) => (
              <div 
                key={album.id}
                onClick={() => handleSelectAlbum(album)}
                className="group cursor-pointer bg-brand-cream/20 border border-brand-charcoal/5 hover:border-brand-gold/40 transition duration-500 overflow-hidden rounded-none"
              >
                <div className="aspect-[16/10] overflow-hidden bg-brand-cream relative">
                  <img 
                    src={album.cover_image} 
                    alt={album.title}
                    className="w-full h-full object-cover grayscale transition duration-700 transform group-hover:scale-103 group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  {/* Overlay text styling */}
                  <div className="absolute inset-0 bg-brand-charcoal/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <span className="bg-brand-ivory text-brand-charcoal px-6 py-3 text-xs tracking-widest font-semibold uppercase flex items-center gap-1">
                      Mở Album <BookOpen size={13} />
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-brand-ivory transition-colors duration-300">
                  <div className="flex justify-between items-center text-[10px] text-brand-muted mb-2 tracking-wider">
                    <span className="flex items-center gap-1 uppercase font-semibold">
                      <Layers size={11} className="text-brand-gold" /> Album Lookbook
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {new Date(album.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-2xl font-serif text-brand-charcoal tracking-tight group-hover:text-brand-gold">{album.title}</h3>
                  <p className="text-xs text-brand-muted font-light mt-2 leading-relaxed">{album.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Inside selected lookbook album view - Magazine collage style */
          <div className="space-y-12 animate-fadeIn" id="album-images-detail">
            
            {/* Return row */}
            <div className="border-b border-brand-charcoal/10 pb-6 flex items-center justify-between">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="text-xs font-semibold uppercase tracking-widest text-brand-charcoal hover:text-brand-gold flex items-center gap-2"
                id="back-to-albums"
              >
                <ArrowLeft size={16} />
                <span>Trở lại Lookbooks</span>
              </button>
              <span className="text-[10px] text-brand-muted uppercase tracking-widest">
                Đang xem: <strong className="text-brand-charcoal font-semibold">{selectedAlbum.title}</strong>
              </span>
            </div>

            {/* Album intro caption */}
            <div className="max-w-3xl space-y-3">
              <h2 className="text-3xl sm:text-4xl font-serif tracking-normal text-brand-charcoal">{selectedAlbum.title}</h2>
              <p className="text-xs text-brand-muted font-light leading-relaxed whitespace-pre-line">{selectedAlbum.description}</p>
            </div>

            {loadingImages ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-none animate-spin mx-auto mb-2" />
                <p className="text-xs text-brand-muted uppercase font-light">Đang tải từng khung hình nghệ thuật...</p>
              </div>
            ) : albumImages.length === 0 ? (
              <div className="py-16 text-center text-brand-muted bg-brand-cream/30 border rounded-none">
                <p className="text-xs font-light">Chưa có khung hình nào được tải lên cho lookbook này.</p>
              </div>
            ) : (
              /* Collage grid spacing */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {albumImages.map((image) => (
                  <div key={image.id} className="space-y-3 bg-brand-cream/10 p-3 border border-brand-charcoal/5 rounded-none hover:border-brand-gold/40 transition">
                    <div className="overflow-hidden bg-brand-cream aspect-[3/4] relative">
                      <img 
                        src={image.image_url} 
                        alt={image.caption || "Lookbook style print"}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.015]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {image.caption && (
                      <p className="text-[11px] font-sans text-brand-muted tracking-wide font-light italic text-center">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

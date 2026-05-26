-- ========================================================
-- PRINTEE - SUPABASE SQL SCHEMA SETUP & MIGRATION SCRIPT
-- ========================================================
-- This file configures the complete relational schema, foreign key relations,
-- default constraint columns, security roles, Row-Level Security (RLS), and seeds
-- initial data so everything installs smoothly on your Supabase Database editor.

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- AUTO-PROVISION STORAGE BUCKETS & POLICIES
-- ========================================================

-- Set up storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('banners', 'banners', true),
  ('products', 'products', true),
  ('albums', 'albums', true),
  ('design-files', 'design-files', true)
ON CONFLICT (id) DO NOTHING;

-- Safely create policies for public access to the storage objects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access for Everyone'
    ) THEN
        CREATE POLICY "Public Access for Everyone" ON storage.objects FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Upload for Everyone'
    ) THEN
        CREATE POLICY "Public Upload for Everyone" ON storage.objects FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Update for Everyone'
    ) THEN
        CREATE POLICY "Public Update for Everyone" ON storage.objects FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Delete for Everyone'
    ) THEN
        CREATE POLICY "Public Delete for Everyone" ON storage.objects FOR DELETE USING (true);
    END IF;
END
$$;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT 'cat-' || uuid_generate_v4()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true
);

-- 2. PRODUCTS (APPARELS) TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT 'prod-' || uuid_generate_v4()::text,
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    price INT NOT NULL DEFAULT 350000,
    original_price INT,
    colors TEXT[] NOT NULL DEFAULT '{}',
    sizes TEXT[] NOT NULL DEFAULT '{}',
    images TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft')),
    inventory INT NOT NULL DEFAULT 100,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BANNERS TABLE
CREATE TABLE IF NOT EXISTS banners (
    id TEXT PRIMARY KEY DEFAULT 'banner-' || uuid_generate_v4()::text,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    button_text TEXT NOT NULL DEFAULT 'Xem ngay',
    link_url TEXT NOT NULL DEFAULT 'catalog',
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. LOOKBOOK ALBUMS TABLE
CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY DEFAULT 'album-' || uuid_generate_v4()::text,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. LOOKBOOK ALBUM IMAGES TABLE
CREATE TABLE IF NOT EXISTS album_images (
    id TEXT PRIMARY KEY DEFAULT 'img-' || uuid_generate_v4()::text,
    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INT NOT NULL DEFAULT 1
);

-- 6. CUSTOM CUSTOMER ORDERS TABLE
CREATE TABLE IF NOT EXISTS custom_orders (
    id TEXT PRIMARY KEY, -- will come in as PRT-XXXXXX format
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    design_file_url TEXT NOT NULL,
    design_file_name TEXT NOT NULL,
    shirt_type TEXT NOT NULL,
    shirt_color TEXT NOT NULL,
    shirt_size TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'printing', 'finishing', 'shipping', 'completed', 'cancelled')),
    price_calc INT NOT NULL,
    internal_notes TEXT,
    history_logs TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY DEFAULT 'adm-' || uuid_generate_v4()::text,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    full_name TEXT NOT NULL
);

-- 9. WEBSITE CMS DYNAMIC CONTENT TABLE
CREATE TABLE IF NOT EXISTS web_cms (
    id TEXT PRIMARY KEY DEFAULT 'current',
    hero_title TEXT NOT NULL,
    hero_description TEXT NOT NULL,
    hero_cta_primary TEXT NOT NULL,
    hero_cta_secondary TEXT NOT NULL,
    about_title TEXT NOT NULL,
    about_subtitle TEXT NOT NULL,
    about_content TEXT NOT NULL,
    about_image TEXT NOT NULL,
    color_palette_title TEXT NOT NULL,
    color_palette_description TEXT NOT NULL,
    process_title TEXT NOT NULL,
    process_step1_title TEXT NOT NULL,
    process_step1_desc TEXT NOT NULL,
    process_step2_title TEXT NOT NULL,
    process_step2_desc TEXT NOT NULL,
    process_step3_title TEXT NOT NULL,
    process_step3_desc TEXT NOT NULL,
    process_step4_title TEXT NOT NULL,
    process_step4_desc TEXT NOT NULL,
    feedback_title TEXT NOT NULL
);

-- 10. MEDIA LIBRARY TABLE
CREATE TABLE IF NOT EXISTS media_library (
    id TEXT PRIMARY KEY DEFAULT 'media-' || uuid_generate_v4()::text,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable RLS across structures
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_cms ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Anonymous public select/insert/update/delete access for general display and transactional tables
DROP POLICY IF EXISTS "Public select categories" ON categories;
DROP POLICY IF EXISTS "Public write categories" ON categories;
CREATE POLICY "Public select categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public write categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select products" ON products;
DROP POLICY IF EXISTS "Public write products" ON products;
CREATE POLICY "Public select products" ON products FOR SELECT USING (true);
CREATE POLICY "Public write products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select banners" ON banners;
DROP POLICY IF EXISTS "Public write banners" ON banners;
CREATE POLICY "Public select banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public write banners" ON banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select albums" ON albums;
DROP POLICY IF EXISTS "Public write albums" ON albums;
CREATE POLICY "Public select albums" ON albums FOR SELECT USING (true);
CREATE POLICY "Public write albums" ON albums FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select album_images" ON album_images;
DROP POLICY IF EXISTS "Public write album_images" ON album_images;
CREATE POLICY "Public select album_images" ON album_images FOR SELECT USING (true);
CREATE POLICY "Public write album_images" ON album_images FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select web_cms" ON web_cms;
DROP POLICY IF EXISTS "Public write web_cms" ON web_cms;
DROP POLICY IF EXISTS "Public insert web_cms" ON web_cms;
DROP POLICY IF EXISTS "Public update web_cms" ON web_cms;
DROP POLICY IF EXISTS "Public delete web_cms" ON web_cms;
CREATE POLICY "Public select web_cms" ON web_cms FOR SELECT USING (true);
CREATE POLICY "Public insert web_cms" ON web_cms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update web_cms" ON web_cms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete web_cms" ON web_cms FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select admin_users" ON admin_users;
DROP POLICY IF EXISTS "Public write admin_users" ON admin_users;
CREATE POLICY "Public select admin_users" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Public write admin_users" ON admin_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select media_library" ON media_library;
DROP POLICY IF EXISTS "Public insert media_library" ON media_library;
DROP POLICY IF EXISTS "Public update media_library" ON media_library;
DROP POLICY IF EXISTS "Public delete media_library" ON media_library;
CREATE POLICY "Public select media_library" ON media_library FOR SELECT USING (true);
CREATE POLICY "Public insert media_library" ON media_library FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update media_library" ON media_library FOR UPDATE USING (true);
CREATE POLICY "Public delete media_library" ON media_library FOR DELETE USING (true);

-- Customers and orders full permissions
DROP POLICY IF EXISTS "Public select custom orders" ON custom_orders;
DROP POLICY IF EXISTS "Public write custom orders" ON custom_orders;
DROP POLICY IF EXISTS "Select own custom orders" ON custom_orders;
DROP POLICY IF EXISTS "Insert public custom orders" ON custom_orders;
CREATE POLICY "Public select custom orders" ON custom_orders FOR SELECT USING (true);
CREATE POLICY "Public write custom orders" ON custom_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public select customers" ON customers;
DROP POLICY IF EXISTS "Public write customers" ON customers;
DROP POLICY IF EXISTS "Insert public customers" ON customers;
CREATE POLICY "Public select customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Public write customers" ON customers FOR ALL USING (true) WITH CHECK (true);


-- ========================================================
-- INITIAL SEED RECORDS INSERTION
-- ========================================================

-- Seed Categories
INSERT INTO categories (id, name, slug, description, image_url) VALUES
('cat-1', 'Áo thun Premium', 'ao-thun-premium', 'Cotton 100% nguyên bản, 240-260GSM, chuẩn form streetwear cứng cáp, bền màu.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600'),
('cat-2', 'Áo Polo', 'polo', 'Thun cá sấu mắt nhỏ nhập khẩu, thanh lịch hiện đại, bo dệt co giãn tỉ mỉ.', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=600'),
('cat-3', 'Áo Hoodie', 'hoodie', 'Nỉ bông cao cấp định lượng 380GSM cực dày dặn, nón 2 lớp may giấu chỉ chuẩn studio.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600'),
('cat-4', 'Áo Sweater', 'sweater', 'Chất nỉ chân cua xuất dư, thoáng khí mềm mại, bo cổ và tay dệt Rib dày dặn.', 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=600')
ON CONFLICT (id) DO NOTHING;

-- Seed Products
INSERT INTO products (id, name, description, category_id, price, original_price, colors, sizes, images, status) VALUES
('prod-1', 'Luxury Heavyweight Blank Tee', 'Chất liệu 100% Cotton Organic định lượng 260GSM siêu dày.', 'cat-1', 350000, 450000, ARRAY['#FDFCF7', '#111111', '#555555', '#1B2C3F', '#3B4C3A'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800'], 'active'),
('prod-2', 'Oversized Streetwear Tee', 'Kiểu dáng vai trễ (drop shoulder) đặc trưng streetwear châu Âu. Cổ áo bo rib thun dày 3cm.', 'cat-1', 390000, 500000, ARRAY['#111111', '#F4EFEB', '#E36414', '#591A2A'], ARRAY['M', 'L', 'XL', 'XXL'], ARRAY['https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800'], 'active'),
('prod-3', 'Premium Studio Polo Shirt', 'Chất vải thun cá sấu dệt tổ ong tinh xảo, cổ áo đan cứng cáp lịch lãm.', 'cat-2', 490000, NULL, ARRAY['#111111', '#FDFCF7', '#7E7C77'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800'], 'active'),
('prod-4', 'Heavy Fleece Minimal Hoodie', 'Nỉ bông lót chải mịn, bo tay dệt chun dày ôm form tốt.', 'cat-3', 750000, 950000, ARRAY['#111111', '#7E7C77', '#F5EFEB'], ARRAY['M', 'L', 'XL', 'XXL'], ARRAY['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&q=80&w=800'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Banners
INSERT INTO banners (id, title, subtitle, image_url, button_text, link_url, active) VALUES
('banner-1', 'IN ÁO THEO THIẾT KẾ RIÊNG', 'Từ 1 chiếc • PET DTF cao cấp • Giao hàng toàn quốc', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=1200', 'Tải thiết kế ngay', 'custom-print', true),
('banner-2', 'COLLECTION AW/26', 'Nét tối giản giao thoa cùng chất bụi bặm đường phố', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200', 'Xem Lookbook', 'lookbook', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Lookbook Album
INSERT INTO albums (id, title, description, cover_image) VALUES
('album-1', 'GENESIS VOL. I', 'Phối trộn giữa kiến trúc tối giản và t-shirt form cứng cáp đương đại.', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800'),
('album-2', 'ESSENTIALS LABS 2026', 'Bản sắc tối giản định danh thế hệ thiết kế mới từ phôi áo chất lượng cao.', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800')
ON CONFLICT (id) DO NOTHING;

-- Seed Lookbook Album Images
INSERT INTO album_images (id, album_id, image_url, caption, sort_order) VALUES
('img-1', 'album-1', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=600', 'Editorial street styling 01', 1),
('img-2', 'album-1', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600', 'Loose shoulders & typography', 2),
('img-3', 'album-2', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=600', 'Pristine off-white studio look', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Admin users (seed user hoanggerber@gmail.com instantly as Super Admin)
INSERT INTO admin_users (id, email, role, full_name) VALUES
('adm-1', 'hoanggerber@gmail.com', 'super_admin', 'PRINTEE Super Admin'),
('adm-2', 'admin@printee.com', 'admin', 'Lê Minh Anh (Manager)')
ON CONFLICT (id) DO NOTHING;

-- Seed CMS dynamic defaults
INSERT INTO web_cms (
    id, hero_title, hero_description, hero_cta_primary, hero_cta_secondary,
    about_title, about_subtitle, about_content, about_image,
    color_palette_title, color_palette_description, process_title,
    process_step1_title, process_step1_desc, process_step2_title, process_step2_desc,
    process_step3_title, process_step3_desc, process_step4_title, process_step4_desc,
    feedback_title
) VALUES (
    'current',
    'IN ÁO THEO THIẾT KẾ RIÊNG',
    'Từ 1 chiếc • PET DTF cao cấp • Giao hàng toàn quốc',
    'TẢI THIẾT KẾ NGAY',
    'XEM CỬA HÀNG PHÔI',
    'FASHION PRINTING HOUSE',
    'CÔNG NGHỆ CHUẨN STUDIO CHUYÊN NGHIỆP',
    'PRINTEE ra đời với sứ mệnh mang đến tiêu chuẩn in ấn thời trang cao cấp nhất cho cộng đồng streetwear. Khác với công nghệ in ấn đại trà giá rẻ, chúng tôi sử dụng kỹ thuật PET DTF 12 màu hạt mực siêu mịn và keo đàn hồi cao cấp nhập khẩu Hàn Quốc. Từng sớ vải thun 100% Cotton định lượng cao của chúng tôi là phôi áo lý tưởng biến mọi ý tưởng thiết kế phức tạp nhất của bạn thành tác phẩm nghệ thuật có thể mặc được.',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
    'BẢNG MÀU PHÔI STUDIO 2026',
    'Sử dụng công nghệ nhuộm dầy không phai màu dệt riêng cho các dòng thương hiệu thời trang cao cấp.',
    'QUY TRÌNH ĐẶT IN THEO TIÊU CHUẨN',
    '01. Gửi Thiết Kế',
    'Upload file thiết kế dạng PNG, SVG, PDF, PSD hoặc AI cực kỳ đơn giản.',
    '02. Kiểm Tra Kỹ Thuật',
    'Đội ngũ chuyên viên rà soát chất lượng ảnh, độ phân giải hạt mực trước khi bấm máy.',
    '03. In Ấn & Ép Ép Nhiệt',
    'Sử dụng máy ép khí nén lực lớn khóa chặt hạt mực bám dính sâu vào thớ sợi thun.',
    '04. Đóng Gói Cao Cấp',
    'Mỗi sản phẩm đều qua kiểm định thun nhăn, đóng hộp kraft thô cao cấp cùng túi chống ẩm.',
    'TIẾNG NÓI TỪ CÁC GRAPHIC DESIGNERS & STREETWEAR BRANDS'
) ON CONFLICT (id) DO NOTHING;

-- Grant schema and table accessibility explicitly to ensure RLS bypass/public access works perfectly
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


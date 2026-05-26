/**
 * PRINTEE - High-end Custom T-Shirt Studio Schema Types
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  active: boolean;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  original_price?: number;
  colors: string[]; 
  sizes: string[]; 
  images: string[]; 
  status: 'active' | 'draft';
  inventory: number;
  is_featured: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  link_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface LookbookAlbum {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  created_at: string;
}

export interface AlbumImage {
  id: string;
  album_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

export interface CustomOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  design_file_url: string;
  design_file_name: string;
  shirt_type: string; 
  shirt_color: string;
  shirt_size: string;
  quantity: number;
  notes: string;
  status: 'pending' | 'approved' | 'printing' | 'finishing' | 'shipping' | 'completed' | 'cancelled';
  price_calc: number;
  internal_notes?: string;
  history_logs?: string[]; 
  created_at: string;
}

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  full_name: string;
}

export interface WebsiteCMS {
  hero_title: string;
  hero_description: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  about_title: string;
  about_subtitle: string;
  about_content: string;
  about_image: string;
  color_palette_title: string;
  color_palette_description: string;
  process_title: string;
  process_step1_title: string;
  process_step1_desc: string;
  process_step2_title: string;
  process_step2_desc: string;
  process_step3_title: string;
  process_step3_desc: string;
  process_step4_title: string;
  process_step4_desc: string;
  feedback_title: string;
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  site_slogan: string;
  hotline: string;
  zalo: string;
  support_email: string;
  address: string;
  facebook_url: string;
  tiktok_url: string;
  instagram_url: string;
  youtube_url: string;
  shopee_url: string;
  website_url: string;
  google_maps_url: string;
  company_description: string;
  footer_quality_title: string;
  footer_quality_text_1: string;
  footer_quality_text_2: string;
  footer_quality_text_3: string;
  footer_quicklinks_title: string;
  newsletter_title: string;
  newsletter_text: string;
  copyright_text: string;
  topbar_text: string;
  logo_url?: string;
  favicon_url?: string;
}
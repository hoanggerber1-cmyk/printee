/**
 * PRINTEE Supabase Integration Client
 * Kết nối trực tiếp 100% với Supabase Database & Storage.
 * KHÔNG SỬ DỤNG MOCK DATA HAY LOCALSTORAGE.
 */

import { createClient } from '@supabase/supabase-js';
import { Category, Product, Banner, LookbookAlbum, AlbumImage, CustomOrder, Customer, AdminUser, WebsiteCMS, MediaFile, SiteSettings } from './types';

// Read config from Environment
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("LỖI NGHIÊM TRỌNG: Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env.local. Hệ thống không thể hoạt động.");
}

export const isRealSupabaseConfigured = true;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// THAO TÁC CƠ SỞ DỮ LIỆU CHÍNH THỨC
// ==========================================
export const dbSim = {
  // --- Banners ---
  banners: {
    async list(): Promise<Banner[]> {
      const { data, error } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async save(banner: Banner): Promise<void> {
      const { error } = await supabase.from('banners').upsert(banner);
      if (error) throw error;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Categories ---
  categories: {
    async list(): Promise<Category[]> {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      
      // Lấy thêm số lượng sản phẩm đang hoạt động để đếm
      const { data: prods } = await supabase.from('products').select('category_id').eq('is_deleted', false);
      
      return (data || []).map(cat => ({
        ...cat,
        product_count: (prods || []).filter(p => p.category_id === cat.id).length
      }));
    },
    async save(cat: Category): Promise<void> {
      const { product_count, ...cleanCat } = cat as any; // Loại bỏ cột ảo trước khi lưu
      const { error } = await supabase.from('categories').upsert(cleanCat);
      if (error) throw error;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Products ---
  products: {
    async list(): Promise<Product[]> {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async save(prod: Product): Promise<void> {
      const { error } = await supabase.from('products').upsert(prod);
      if (error) throw error;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Lookbooks & Albums ---
  albums: {
    async list(): Promise<LookbookAlbum[]> {
      const { data, error } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async save(album: LookbookAlbum): Promise<void> {
      const { error } = await supabase.from('albums').upsert(album);
      if (error) throw error;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('albums').delete().eq('id', id);
      if (error) throw error;
    },
    async imagesForAlbum(albumId: string): Promise<AlbumImage[]> {
      const { data, error } = await supabase.from('album_images').select('*').eq('album_id', albumId).order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async addImage(img: AlbumImage): Promise<void> {
      const { error } = await supabase.from('album_images').upsert(img);
      if (error) throw error;
    },
    async deleteImage(id: string): Promise<void> {
      const { error } = await supabase.from('album_images').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Custom Orders ---
  customOrders: {
    async list(): Promise<CustomOrder[]> {
      const { data, error } = await supabase.from('custom_orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async save(order: CustomOrder): Promise<void> {
      const { error } = await supabase.from('custom_orders').upsert(order);
      if (error) throw error;
    },
    async getByEmail(email: string): Promise<CustomOrder[]> {
      const { data, error } = await supabase.from('custom_orders').select('*').ilike('customer_email', email);
      if (error) throw error;
      return data || [];
    }
  },

  // --- Customer Management ---
  customers: {
    async list(): Promise<Customer[]> {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data || [];
    },
    async save(customer: Customer): Promise<void> {
      const { error } = await supabase.from('customers').upsert(customer);
      if (error) throw error;
    }
  },

  // --- Admin users config ---
  admins: {
    async list(): Promise<AdminUser[]> {
      const { data, error } = await supabase.from('admin_users').select('*');
      if (error) throw error;
      return data || [];
    },
    async getByEmail(email: string): Promise<AdminUser | null> {
      const { data, error } = await supabase.from('admin_users').select('*').ilike('email', email).maybeSingle();
      if (error) throw error;
      return data;
    }
  },

  // --- Dynamic Visual CMS content ---
  cms: {
    async get(): Promise<WebsiteCMS> {
      const { data, error } = await supabase.from('web_cms').select('*').eq('id', 'current').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Chưa có cấu hình CMS trong database.");
      return data as WebsiteCMS;
    },
    async update(cms: WebsiteCMS): Promise<void> {
      const { error } = await supabase.from('web_cms').upsert({ id: 'current', ...cms });
      if (error) throw error;
    }
  },

  // --- Site Settings (Phase 3) ---
  settings: {
    async get(): Promise<SiteSettings> {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'current').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Chưa có cấu hình Site Settings trong database.");
      return data as SiteSettings;
    },
    async update(settings: Partial<SiteSettings>): Promise<void> {
      const { error } = await supabase.from('site_settings').upsert({ id: 'current', ...settings });
      if (error) throw error;
    }
  },

  // --- Central Media Library ---
  mediaLibrary: {
    async list(): Promise<MediaFile[]> {
      const { data, error } = await supabase.from('media_library').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async save(item: MediaFile): Promise<void> {
      const { error } = await supabase.from('media_library').upsert(item);
      if (error) throw error;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('media_library').delete().eq('id', id);
      if (error) throw error;
    }
  }
};

// ==========================================
// UPLOAD LÊN SUPABASE STORAGE
// ==========================================
export async function uploadToStorage(bucket: 'banners' | 'products' | 'albums' | 'design-files' | 'site-assets', file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
  
  if (error) {
    console.error("Lỗi upload Supabase Storage: ", error);
    throw error;
  }
  
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}
import { createClient } from '@supabase/supabase-js';
import { Category, Product, Banner, LookbookAlbum, AlbumImage, CustomOrder, Customer, AdminUser, WebsiteCMS, MediaFile, SiteSettings } from './types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("LỖI NGHIÊM TRỌNG: Thiếu thông tin kết nối Supabase trong file .env.local");
}

export const isRealSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dbSim = {
  banners: {
    async list(): Promise<Banner[]> {
      const { data } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
      return data || [];
    },
    async save(item: Banner) { await supabase.from('banners').upsert(item); },
    async delete(id: string) { await supabase.from('banners').delete().eq('id', id); }
  },
  categories: {
    async list(): Promise<Category[]> {
      const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      return data || [];
    },
    async save(item: Category) { 
      const { product_count, ...cleanCat } = item as any;
      await supabase.from('categories').upsert(cleanCat); 
    },
    async delete(id: string) { await supabase.from('categories').delete().eq('id', id); }
  },
  products: {
    async list(): Promise<Product[]> {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    async save(item: Product) { await supabase.from('products').upsert(item); },
    async delete(id: string) { await supabase.from('products').delete().eq('id', id); }
  },
  customOrders: {
    async list(): Promise<CustomOrder[]> {
      const { data } = await supabase.from('custom_orders').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    async save(item: CustomOrder) { await supabase.from('custom_orders').upsert(item); },
    // Đã bổ sung hàm xóa đơn hàng dưới đây:
    async delete(id: string) { await supabase.from('custom_orders').delete().eq('id', id); },
    async getByEmail(email: string): Promise<CustomOrder[]> {
      const { data } = await supabase.from('custom_orders').select('*').ilike('customer_email', email);
      return data || [];
    }
  },
  admins: {
    async list(): Promise<AdminUser[]> {
      const { data } = await supabase.from('admin_users').select('*');
      return data || [];
    },
    async getByEmail(email: string): Promise<AdminUser | null> {
      const { data } = await supabase.from('admin_users').select('*').ilike('email', email).maybeSingle();
      return data;
    }
  },
  settings: {
    async get(): Promise<SiteSettings> {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'current').maybeSingle();
      return data as SiteSettings;
    },
    async update(settings: Partial<SiteSettings>) { await supabase.from('site_settings').upsert({ id: 'current', ...settings }); }
  }
};

export async function uploadToStorage(bucket: 'banners' | 'products' | 'albums' | 'design-files' | 'site-assets', file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

import { writable } from 'svelte/store';

// Aktif Supabase auth kullanıcısını ve profil bilgisini tutar.
// (auth)/giris ve (auth)/kayit sayfalarında doldurulacak.
export const user = writable(null);
export const authLoading = writable(true);

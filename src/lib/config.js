// Bu iki değer bilerek açık. Publishable key tarayıcıya inen koda zaten gömülür,
// gizlenmesi mümkün değildir. Güvenliği sağlayan şey supabase/setup.sql içindeki
// kurulum: books tablosunda hiç erişim politikası yok, veriye ancak defter kodunu
// bilerek, book_read / book_write fonksiyonları üzerinden ulaşılabiliyor.
export const SUPABASE_URL = 'https://xqqfnnirwonixscjyfgx.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_pBcCbAug71Bjy7WrybFxTQ_uXgde3Hf';

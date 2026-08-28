# Ortak Birikim Defteri

Gider takibi değil, birikim defteri. "Kahve almadım → +£5" diye yazdığın her kazanç
deftere işlenir, toplam büyür, seri devam eder.

Eşimle ortak kullanmak üzere yapıldı.

## Nasıl çalışır

- Varsayılan olarak kayıtlar yalnızca tarayıcının kendi deposunda tutulur.
- Telefonda tarayıcıda aç → "Ana ekrana ekle" de. İkonu olur, tam ekran açılır.
- Paylaşım hedef bazındadır: tek bir hedefi paylaşırsın, defterin geri kalanı cihazda kalır.
  Kodu bilen herkes o hedefe erişir; şifre yoktur.

## Paylaşılan hedef

Sunucu tarafı `supabase/setup.sql` ile kurulur. `books` tablosunda hiç erişim
politikası yoktur; veriye yalnızca `book_read` ve `book_write` fonksiyonları
üzerinden, defter kodu bilinerek ulaşılır. Publishable key açıktır, olması gerektiği gibi.

Sunucuya giden paket yalnızca o hedefi ve ona yazılmış kayıtları içerir; diğer
hedefler, genel kasa ve cihaza özel alanlar hiç çıkmaz.

Kayıtlar yalnızca eklenir, bu yüzden iki cihaz çakışmaz: birleştirme kimliklerin
birleşimidir. Silinen şeyler `deleted` listesinde tutulur ki karşı cihaz onları
geri diriltmesin.

## Komutlar

```bash
npm install     # bağımlılıklar
npm run dev     # geliştirme sunucusu
npm test        # testler
npm run build   # dist/ üretir
```

## Yapı

```
src/lib/        arayüzden bağımsız hesap katmanı — testler burayı ölçer
  money.js      para birimi, biçimlendirme, metinden tutar okuma
  savings.js    toplam, hedef ilerlemesi, gün serisi, gruplama
  dates.js      gün başlıkları ve saat
  storage.js    durum şeması, doğrulama, kalıcılık
src/components/ defterin görünen parçaları
```

Tutarlar tam sayı olarak kuruş cinsinden saklanır, ondalık hatası olmasın diye.

## Otomatik akış

- `ci.yml` — her push'ta testler ve derleme koşar.
- `deploy.yml` — main dalına her push'ta GitHub Pages'e yayınlar.

Pages'in çalışması için depo ayarlarında **Settings → Pages → Source: GitHub Actions**
seçili olmalıdır.

## Sırada

- Kategori bazlı bütçe limitleri
- Aylık ve haftalık planlama
- Çevrimdışı çalışma (service worker)
- Hedef tamamlandığında kutlama anı

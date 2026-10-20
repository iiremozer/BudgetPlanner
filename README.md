# Ortak Birikim Defteri

Gider takibi değil, birikim defteri. "Kahve almadım → +£5" diye yazdığın her kazanç
deftere işlenir, toplam büyür, seri devam eder.

İki kişinin ortak kullanması için yapıldı.

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

## Native uygulama

iOS ve Android için Capacitor kullanılıyor; aynı kod hem web'de hem mağazalarda.
Mac'te kurulum adımları: `NATIVE.md`.

## Canlı mod

Kurulu uygulamaya her değişiklik için kabloyla yeniden derleme gerekmesin diye
kabuk, web dosyalarını yayından okuyabiliyor:

```bash
npm run live:on   # kabuk yayındaki sürümü okur — günlük geliştirme
npm run sync      # bir kez kabloyla kur; sonrası kablosuz
npm run live:off  # dosyalar yine uygulamanın içinde — mağazaya çıkarken
```

Açıkken her push, uygulamanın bir sonraki açılışında telefona iner. Üç not:

- Açılışta internet gerekiyor; yoksa uygulamanın içindeki `offline.html` açılır.
- Dosyaların kaynağı değiştiği için tarayıcı deposu sıfırdan başlar; defter
  açılışta native kopyadan geri yüklenir. Geçmeden önce yedek al.
- İmza süresi ayrı bir konu: bedava hesapla 7 günde bir Xcode'dan yenilemek
  gerekiyor, bunu canlı mod çözmüyor.
- Mağaza sürümünde kapalı olmalı.

Ayarların en altındaki `Build ...` damgası, o an hangi sürümün açık olduğunu
söyler.

## Komutlar

```bash
npm install     # bağımlılıklar
npm run dev     # geliştirme sunucusu
npm test        # testler
npm run build   # dist/ üretir (GitHub Pages)
npm run sync    # native derleme + iOS/Android projelerine kopyala
npm run ios     # Xcode'u açar
npm run android # Android Studio'yu açar
npm run live:on # kabuk yayını okusun
npm run live:off# dosyalar uygulamanın içinde kalsın
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

## Veri silme

- Paylaşılan bir hedefi sunucudan tamamen silmek: hedefin paylaşım panelinde
  "Delete the shared copy". `book_delete` fonksiyonunu çağırır, satır silinir.
- Cihazdaki her şeyi silmek: Ayarlar → Your data → "Erase everything on this device".
- `supabase/setup.sql` dosyasının sonundaki ek bölüm `book_delete` fonksiyonunu kurar.

## Sırada

- Kategori bazlı bütçe limitleri
- Aylık ve haftalık planlama
- Çevrimdışı çalışma (service worker)
- Gizlilik metni ve kullanım şartları (mağazaya çıkmadan önce zorunlu)
- Destek/iletişim sayfası

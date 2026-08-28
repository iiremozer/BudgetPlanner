# Ortak Birikim Defteri

Gider takibi değil, birikim defteri. "Kahve almadım → +£5" diye yazdığın her kazanç
deftere işlenir, toplam büyür, seri devam eder.

Eşimle ortak kullanmak üzere yapıldı.

## Nasıl çalışır

- Kayıtlar yalnızca tarayıcının kendi deposunda (localStorage) tutulur. Sunucu yok, hesap yok.
- Telefonda tarayıcıda aç → "Ana ekrana ekle" de. İkonu olur, tam ekran açılır.
- Her cihazın defteri kendinedir; şu an cihazlar arası eşitleme yoktur.

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
- Cihazlar arası paylaşım

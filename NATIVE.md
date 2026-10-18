# Mac'te native uygulamayı kurma

Bu adımlar yalnızca bir kez gerekiyor. Terminal'i aç, depoyu klonla:

```bash
git clone <deponun-adresi>
cd BudgetPlanner
npm install
```

## Sıfırdan Mac kurulumu

Yeni bir Mac'te sırayla:

1. **Yer aç.** Xcode indirme sırasında ~40 GB istiyor.
   Apple menüsü → System Settings → General → Storage.

2. **Xcode'u kur.** App Store → "Xcode" ara → Get. İndirme 10 GB'ın
   üstünde, bağlantına göre 30 dakika ile birkaç saat sürebiliyor.
   İlerleme çubuğu uzun süre kıpırdamasa da normal.

3. **Xcode'u bir kez aç.** Lisansı kabul et, ek bileşenleri kurmasına
   izin ver, Mac şifreni ister. Sonra kapatabilirsin.

4. **Terminal'i aç.** Cmd+Space → "Terminal" yaz → Enter.
   Sonraki komutları buraya yapıştırıp Enter'a basacaksın.

5. **Komut satırı araçları:**
   ```bash
   xcode-select --install
   ```
   Zaten kuruluysa "already installed" der, sorun değil.

6. **Homebrew** (paket yöneticisi):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   Şifre ister — yazarken ekranda hiçbir şey görünmez, bu normal, yazıp
   Enter'a bas. Bittiğinde ekrana "Next steps" diye iki satır yazar;
   Apple Silicon Mac'lerde **o iki satırı da çalıştırman gerekiyor**,
   yoksa `brew` komutu bulunamaz. Takılırsan: https://brew.sh

7. **Node ve CocoaPods:**
   ```bash
   brew install node cocoapods
   ```

8. **Kontrol:**
   ```bash
   node -v && pod --version && xcodebuild -version
   ```
   Üçü de sürüm numarası yazdırıyorsa hazırsın.

Android için ayrıca **Android Studio** gerekiyor; iOS'u bitirdikten sonra.

## iOS projesini üret

```bash
npm run build:native
npx cap add ios
npx cap migrate      # UIScene desteği ve hedef sürüm (cap add ios sonrası bir kez)
npm run ios          # derler ve Xcode'u açar
```

Xcode'da: proje ayarları → Signing & Capabilities → Team olarak kendi Apple
Developer hesabını seç. Sonra bir cihaz seçip Run.

## Android

```bash
npx cap add android
npm run android      # derler ve Android Studio'yu açar
```

## Sonraki her değişiklikte

```bash
git pull
npm run sync         # web'i derler, native projelere kopyalar
```

`npm run sync` sonrası Xcode'da tekrar Run demen yeterli.

## Capacitor sürümü

Capacitor 8 kullanılıyor. iOS 27 SDK'sı UIScene yaşam döngüsünü zorunlu
tutuyor ve bu olmadan uygulama açılışta çöküyor. Capacitor'ın ürettiği
şablonda henüz yok; `npx cap migrate` komutu SceneDelegate.swift'i yazıp
Info.plist'e sahne bildirimini ekliyor ve AppDelegate'i yamalıyor.

Yani `npx cap add ios` sonrası **mutlaka** `npx cap migrate` çalıştırılmalı.
`npm run ios:target` artık yalnızca hedef sürümü elle düzeltmek gerekirse
kullanılıyor; migrate zaten onu da yapıyor.

## Bundle ID

`app.oursavingsbook.mobile` — bilerek kimsenin adını içermiyor, çünkü
yayınlayacak hesap henüz belli değil. Bir kez App Store'da uygulama kaydı
açıldıktan sonra değiştirilemiyor, o yüzden ilk yüklemeden önce son hali
verilmeli.

## Neden iki ayrı derleme var

`npm run build` GitHub Pages için, adresler `/BudgetPlanner/` altında.
`npm run build:native` ise göreli yol kullanıyor, çünkü native kabuk
dosyaları uygulamanın kökünden sunuyor. İkisi aynı koddan çıkıyor.

## Native tarafta neler var

- **Titreşim** — kazanç kaydedince
- **Yerel bildirimler** — bekleyen aktarım ve haftalık özet (ayarlardan açılır)
- **Native depolama** — defterin ikinci bir kopyası işletim sistemi deposunda;
  tarayıcı verisi temizlense bile açılışta geri geliyor
- **Native paylaşım sayfası** — hedef tamamlama kutlamasında
- **Uygulama içi tarayıcı** — banka bağlantısı için (Apple harici Safari'ye
  atan uygulamaları reddedebiliyor)

## Henüz olmayan: eşin bildirimi

"Batuhan hedefe £20 ekledi" bildirimi yerel bildirimle yapılamıyor — uygulama
kapalıyken karşı tarafın ne yaptığını bilemiyor. Bunun için push altyapısı
gerekiyor: Supabase Edge Function + APNs/FCM. Ayrı bir iş.

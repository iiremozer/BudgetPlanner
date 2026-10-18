# Mac'te native uygulamayı kurma

Bu adımlar yalnızca bir kez gerekiyor. Terminal'i aç, depoyu klonla:

```bash
git clone https://github.com/iiremozer/BudgetPlanner.git
cd BudgetPlanner
npm install
```

## Gerekenler

- **Xcode** (App Store'dan, ~10 GB) ve bir kez `xcode-select --install`
- **CocoaPods**: `sudo gem install cocoapods`
- Android için: **Android Studio**

## iOS projesini üret

```bash
npm run build:native
npx cap add ios
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

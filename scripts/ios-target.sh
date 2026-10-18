#!/usr/bin/env bash
# Capacitor'ın ürettiği iOS projesi iOS 14'ü hedefliyor; Xcode 27 en az 15
# istiyor. Bu betik Xcode projesini, Podfile'ı ve bağımlılıkların hedefini
# yükseltir, sonra pod'ları yeniden kurar.
#
# Tekrar çalıştırılabilir: daha önce yapılmış değişiklikleri bozmaz.
# `npx cap add ios` projeyi sıfırdan ürettiği için ondan sonra bir kez
# çalıştırmak gerekiyor.

set -euo pipefail

TARGET="${1:-15.0}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/ios/App"
PODFILE="$APP_DIR/Podfile"

if [ ! -d "$APP_DIR" ]; then
  echo "ios/App bulunamadı. Önce: npx cap add ios"
  exit 1
fi

echo "iOS hedef sürümü $TARGET yapılıyor…"

# Eski sürümlerin dosya sonuna eklediği hatalı blok varsa temizle.
perl -0pi -e 's/\n# ios-target\.sh tarafindan eklendi.*\z//s' "$PODFILE"
perl -0pi -e 's/\n# ios-target\.sh tarafından eklendi.*\z//s' "$PODFILE"

# Xcode projesindeki tüm yapılandırmalar
perl -pi -e "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = $TARGET;/g" \
  "$APP_DIR/App.xcodeproj/project.pbxproj"

# Podfile'daki platform satırı
perl -pi -e "s/^platform :ios, '[0-9.]+'/platform :ios, '$TARGET'/" "$PODFILE"

# Bağımlılıkların hedefi. CocoaPods birden fazla post_install kabul etmiyor,
# bu yüzden varsa mevcut bloğun içine giriyoruz.
if grep -q "ios-target" "$PODFILE"; then
  perl -pi -e "s/(IPHONEOS_DEPLOYMENT_TARGET'\] = ')[0-9.]+(')/\${1}$TARGET\${2}/" "$PODFILE"
elif grep -q 'post_install do |installer|' "$PODFILE"; then
  perl -0pi -e "s/(post_install do \|installer\|\n)/\${1}  # ios-target\n  installer.pods_project.targets.each do |t|\n    t.build_configurations.each do |c|\n      c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '$TARGET'\n    end\n  end\n/" "$PODFILE"
else
  cat >> "$PODFILE" <<EOF

post_install do |installer|
  # ios-target
  installer.pods_project.targets.each do |t|
    t.build_configurations.each do |c|
      c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '$TARGET'
    end
  end
end
EOF
fi

if [ "${SKIP_POD_INSTALL:-}" = "1" ]; then
  echo "(pod install atlandı)"
  exit 0
fi

cd "$APP_DIR"
pod install
echo "Tamam. Şimdi: npm run ios"

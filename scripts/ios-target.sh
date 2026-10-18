#!/usr/bin/env bash
# Capacitor'ın ürettiği iOS projesi iOS 14'ü hedefliyor; Xcode 27 en az 15
# istiyor ve altını reddediyor. Bu betik hem Xcode projesini hem Podfile'ı
# günceller, sonra pod'ları yeniden kurar.
#
# `npx cap add ios` her çalıştığında proje sıfırdan üretildiği için bu
# betiği ondan sonra bir kez çalıştırmak gerekiyor.

set -euo pipefail

TARGET="${1:-15.0}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/ios/App"

if [ ! -d "$APP_DIR" ]; then
  echo "ios/App bulunamadı. Önce: npx cap add ios"
  exit 1
fi

echo "iOS hedef sürümü $TARGET yapılıyor…"

# Xcode projesindeki tüm yapılandırmalar
perl -pi -e "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = $TARGET;/g" \
  "$APP_DIR/App.xcodeproj/project.pbxproj"

# Podfile'daki platform satırı
perl -pi -e "s/^platform :ios, '[0-9.]+'/platform :ios, '$TARGET'/" "$APP_DIR/Podfile"

# Pod'ların kendi hedefleri de yükseltilsin
if ! grep -q "ios-target.sh tarafından eklendi" "$APP_DIR/Podfile"; then
  cat >> "$APP_DIR/Podfile" <<EOF

# ios-target.sh tarafından eklendi: bağımlılıkların hedef sürümünü de yükselt.
post_install do |installer|
  installer.pods_project.targets.each do |t|
    t.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '$TARGET'
    end
  end
end
EOF
fi

cd "$APP_DIR"
pod install
echo "Tamam. Şimdi: npm run ios"

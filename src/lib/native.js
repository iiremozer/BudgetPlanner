// Native kabuk ile web arasındaki tek köprü. Buradaki her çağrı
// tarayıcıda da çalışır: eklenti yoksa ya web karşılığına düşer ya da
// sessizce hiçbir şey yapar. Uygulamanın geri kalanı native olup
// olmadığını bilmek zorunda kalmaz.

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';

export const DEVICE_BACKUP_KEY = 'book-backup';

export function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Kaydetme anındaki kısa titreşim. */
export async function tapFeedback() {
  try {
    if (isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
    navigator.vibrate?.(18);
  } catch {
    // Titreşim olmaması bir hata değil.
  }
}

/** Kutlama metnini paylaşır. Başarılıysa true. */
export async function shareText(text) {
  try {
    if (isNative()) {
      await Share.share({ text });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ text });
      return true;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Paylaşımdan vazgeçmek hata değil.
  }
  return false;
}

/**
 * Bankanın adresini açar. Native tarafta uygulama içi tarayıcı kullanılır;
 * Apple, giriş için harici Safari'ye atan uygulamaları reddedebiliyor.
 */
export async function openExternal(url) {
  try {
    if (isNative()) {
      await Browser.open({ url });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    // Açılamadıysa kullanıcı adresi zaten görebiliyor.
  }
}

/**
 * Defterin ikinci bir kopyasını native depoya yazar. Tarayıcı deposu
 * işletim sistemi tarafından temizlenebiliyor; bu kopya ondan etkilenmez.
 */
export async function mirrorToDevice(json) {
  if (!isNative()) return false;
  try {
    await Preferences.set({ key: DEVICE_BACKUP_KEY, value: json });
    return true;
  } catch {
    return false;
  }
}

/** Native depodaki kopyayı okur. Yoksa null. */
export async function readFromDevice() {
  if (!isNative()) return null;
  try {
    const { value } = await Preferences.get({ key: DEVICE_BACKUP_KEY });
    return value ?? null;
  } catch {
    return null;
  }
}

/** Bildirim izni ister. Verildiyse true. */
export async function requestNotificationPermission() {
  if (!isNative()) return false;
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    const asked = await LocalNotifications.requestPermissions();
    return asked.display === 'granted';
  } catch {
    return false;
  }
}

/**
 * Planı uygular: önce kurulu olanları iptal eder, sonra yenilerini kurar.
 * Plan her açılışta baştan hesaplandığı için bu en güvenli yol.
 */
export async function applyNotificationPlan(plan = []) {
  if (!isNative()) return false;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    if (plan.length === 0) return true;

    await LocalNotifications.schedule({
      notifications: plan
        .filter((item) => item.at instanceof Date && item.at.getTime() > Date.now())
        .map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          schedule: { at: item.at, allowWhileIdle: true },
        })),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Durum çubuğundaki saat ve simgelerin rengi. Koyu temada açık, açık temada
 * da açık — çünkü üstteki blok her iki temada da koyu bir yüzey.
 */
export async function setStatusBarStyle() {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Android'de veya eski sürümlerde desteklenmeyebilir.
  }
}

/**
 * Android'in donanım geri tuşu. Dönen fonksiyon dinleyiciyi kaldırır.
 * iOS'ta geri tuşu yok, orada kenardan kaydırma iş görüyor.
 */
export function onBackButton(handler) {
  if (!isNative()) return () => {};
  let remove = () => {};
  CapApp.addListener('backButton', handler)
    .then((listener) => {
      remove = () => listener.remove();
    })
    .catch(() => {});
  return () => remove();
}

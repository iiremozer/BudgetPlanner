#!/usr/bin/env node
// Canlı mod: native kabuk, web dosyalarını kendi içinden değil yayından okur.
// Böylece her push telefondaki uygulamaya kabloya gerek kalmadan iner.
//
//   npm run live:on   → kabuk yayını okur (günlük geliştirme)
//   npm run live:off  → dosyalar yine uygulamanın içinde (mağazaya çıkarken)
//
// Mağaza sürümünde kapalı olmalı: Apple, içeriğini tamamen uzaktan çeken
// uygulamalara sıcak bakmıyor ve çevrimdışı açılış da kayboluyor.

import { readFileSync, writeFileSync } from 'node:fs';

const CONFIG = new URL('../capacitor.config.json', import.meta.url);
const LIVE_URL = process.env.LIVE_URL ?? 'https://iiremozer.github.io/BudgetPlanner/';

const mode = process.argv[2];
if (mode !== 'on' && mode !== 'off') {
  console.error('Kullanım: node scripts/live-mode.mjs on|off');
  process.exit(1);
}

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));

if (mode === 'on') {
  // errorPath: internet yokken boş ekran yerine uygulamanın içindeki
  // yedek sayfa açılır.
  config.server = { url: LIVE_URL, cleartext: false, errorPath: 'offline.html' };
} else {
  delete config.server;
}

writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`);
console.log(
  mode === 'on'
    ? `Canlı mod açık. Kabuk şunu okuyacak: ${LIVE_URL}\nŞimdi: npm run sync, sonra Xcode'da Run. Bu son kablo seansı.`
    : 'Canlı mod kapalı. Dosyalar uygulamanın içinde taşınacak.'
);

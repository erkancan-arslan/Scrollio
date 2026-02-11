# Scrollio Kids — Yerelde Çalıştırma

Uygulamayı bilgisayarında çalıştırmak için aşağıdaki adımları sırayla yap.

---

## 1. Supabase (veritabanı)

Kids modülü Supabase tablolarını kullanıyor. **Supabase projen** zaten var (`backend/.env` içinde URL ve anahtarlar tanımlı).

### Migration’ları çalıştır

Supabase Dashboard’da **SQL Editor**’ü aç ve migration dosyalarını **sırayla** çalıştır. Önce role/pin/child profiller, sonra Kids tabloları:

- `supabase/migrations/20260210000000_add_role_system.sql`
- `supabase/migrations/20260210000100_add_parent_pins.sql`
- `supabase/migrations/20260210000200_add_child_profiles.sql`
- `supabase/migrations/20260210001000_kids_parental_settings.sql`
- `supabase/migrations/20260210001100_kids_content.sql`
- `supabase/migrations/20260210001200_kids_feed_views.sql`
- `supabase/migrations/20260210001300_kids_bookmarks.sql`
- `supabase/migrations/20260210001400_kids_topics.sql`
- `supabase/migrations/20260210001500_kids_quizzes.sql`
- `supabase/migrations/20260210001600_kids_playground.sql`
- `supabase/migrations/20260210001700_kids_progression.sql`
- `supabase/migrations/20260210001800_kids_activity_logs.sql`
- `supabase/migrations/20260210001900_kids_voice.sql`
- `supabase/migrations/20260210002000_kids_notification_settings.sql`
- `supabase/migrations/20260210002100_kids_screen_time_columns.sql`
- `supabase/migrations/20260210003000_seed_kids_topics.sql`

**Alternatif:** Supabase CLI kullanıyorsan proje kökünde:

```bash
supabase db push
```

---

## 2. Backend (NestJS API)

1. **Bağımlılıklar**
   ```bash
   cd code/backend
   npm install
   ```

2. **Ortam değişkenleri**  
   `code/backend/.env` dosyan zaten var. Şunların dolu olduğundan emin ol:
   - `SUPABASE_URL` — Supabase proje URL’in
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (Dashboard → Project Settings → API)
   - `PORT=3000`

3. **Çalıştır**
   ```bash
   npm run start:dev
   ```
   API: `http://localhost:3000`  
   Swagger: `http://localhost:3000/api`

---

## 3. Mobil uygulama (Expo)

1. **Bağımlılıklar**
   ```bash
   cd code/mobile-app
   npm install
   ```

2. **Ortam değişkenleri**  
   `code/mobile-app/.env` dosyasına şunu ekle veya güncelle:

   **Sadece bilgisayarda web/emülatör:**
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
   ```

   **Telefonda Expo Go ile test ediyorsan** aynı WiFi’de olmalısın. Bilgisayarının yerel IP’sini yaz (örn. `ipconfig` ile):
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.5:3000/api/v1
   ```

3. **Çalıştır**
   ```bash
   npm start
   ```
   Açılan menüden:
   - **Web:** `w` → tarayıcıda `http://localhost:8081` (veya gösterilen port)
   - **Android:** `a` (Android emülatör veya USB’li cihaz)
   - **iOS:** `i` (sadece Mac + Xcode)

---

## 3b. Apple (iPhone) üzerinde Expo Go ile denemek

1. **iPhone’da Expo Go kur**  
   App Store’dan “Expo Go” uygulamasını indir.

2. **Backend’i bilgisayarda çalıştır**  
   ```bash
   cd code/backend
   npm run start:dev
   ```
   Port 3000’de dinliyor olmalı.

3. **Aynı WiFi**  
   iPhone ve bilgisayar **aynı Wi‑Fi ağında** olmalı.

4. **API adresini bilgisayar IP’si yap**  
   `code/mobile-app/.env` içinde:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://BILGISAYAR_IP:3000/api/v1
   ```
   Örnek: `http://192.168.1.10:3000/api/v1` veya `http://172.20.10.4:3000/api/v1`  
   Bilgisayar IP’sini öğrenmek için:
   - **Windows:** `ipconfig` → Ethernet veya Wi‑Fi → IPv4
   - **Mac:** Sistem Tercihleri → Ağ veya Terminal’de `ipconfig getifaddr en0`

5. **Expo’yu başlat**  
   ```bash
   cd code/mobile-app
   npm start
   ```
   Terminalde bir **QR kod** çıkar.

6. **iPhone’dan bağlan**  
   - iPhone’da **Kamera** ile QR kodu tara **veya**
   - Expo Go’yu aç → “Scan QR code” → terminaldeki QR’ı tara.

7. **İlk açılış**  
   Bundle indikten sonra uygulama açılır. Ana ekrandan “Scrollio Kids (7–12)”e girip giriş/kayıt akışını deneyebilirsin.

**Sorun çıkarsa (iPhone):**
- **“Network request failed”:** Bilgisayar IP’si doğru mu? `.env`’deki IP ile `ipconfig`/ağ ayarları aynı mı? Backend çalışıyor mu?
- **Firewall:** Windows’ta “Özel ağ” için Node/backend’e izin ver. Mac’te Sistem Tercihleri → Güvenlik → Güvenlik Duvarı’nda gerekirse 3000 portunu aç.

---

## 4. İlk kullanım (Kids akışı)

1. Uygulamayı aç → Kids bölümüne gir.
2. **Kayıt ol** (email + şifre + isim) → Bu hesap “parent” rolüne geçer.
3. **PIN belirle** (4 haneli) → Parental giriş için.
4. **Çocuk profili oluştur** (isim, doğum tarihi, avatar).
5. Sonrasında Feed / Playground / Profile / Settings kullanılabilir.

---

## Sorun çıkarsa

- **“Network request failed” / API’ye ulaşamıyor:**  
  Mobil .env’deki `EXPO_PUBLIC_API_BASE_URL` doğru mu? Telefonda deniyorsan LAN IP ve `http://` kullandığından emin ol. Backend’in çalıştığı port (3000) firewall’da kapalı olmasın.

- **Supabase / 401 / 403:**  
  Backend .env’de `SUPABASE_SERVICE_ROLE_KEY` doğru mu? Migration’ların hepsi Supabase’te çalıştırıldı mı?

- **CORS hatası (web):**  
  Backend dev modda localhost ve 192.168.x.x’e izin veriyor. Hâlâ CORS alıyorsan backend’i yeniden başlat.

- **Kids feed boş:**  
  `kids_content` tablosunda test videoları yoksa feed boş görünür. Supabase’te `kids_content`’e birkaç test satırı ekleyebilir veya ileride bir seed migration yazılabilir.

Bu adımlarla backend + mobil uygulama yerelde çalışır; Supabase cloud’da kalır.

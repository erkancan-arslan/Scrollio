# Scrollio Kids — Haftalık Plan (4 Kişi)

**Hedef:** Bir hafta içinde en acil ve önemli işleri bitirmek.  
**Ekip:** Artun Balta, Arhan Bartu Ergüven, Furkan Komaç, Erkan Can Arslan.

---

## Öncelik Sırası (En Acil → Önemli)

| # | İş | Neden acil/önemli |
|---|----|--------------------|
| 1 | Kids Feed’i gerçek API’ye geçirmek | Şu an main `/feed` kullanılıyor; `kids_content` boş. Ürün demosu ve test için gerçek Kids feed şart. |
| 2 | `kids_content` + quiz seed | Feed’in dolması ve quiz overlay’in test edilebilmesi için veri gerekli. |
| 3 | Core (feed, friends, playground) TS hatalarını gidermek | Build ve CI sağlığı; diğer geliştirmeleri bloke edebilir. |
| 4 | Parental / Profile / Playground backend uyumu ve test | Ekranların API ile çalıştığının doğrulanması ve dokümantasyon. |

---

## Kişi Bazlı Görev Dağılımı (1 Hafta)

### 1. Artun Balta

**Hedef:** Kids Feed’i production path’e almak.

- [ ] **Mobil `feedApi`’yi Kids API’ye geçir**
  - `getFeed`: `GET /api/v1/feed` → `GET /api/v1/kids/feed` (query: `page`, `limit`, isteğe bağlı `topicId`).
  - Backend yanıtı zaten `{ data, meta }` ve item’lar `kids_content` şeklinde; mevcut `FeedItem` tipi uyumlu. Gerekirse alan eşlemesini (snake_case) netleştir.
- [ ] **View tracking’i Kids endpoint’ine taşı**
  - `trackView`: `POST /feed/videos/:id/view` → `POST /api/v1/kids/feed/viewed`; body: `{ contentId, watchedSeconds }` (backend’deki `ViewedEventDto` ile aynı).
- [ ] **Feed’in boş/hatasız çalışmasını test et**
  - Çocuk seçili iken feed’in `kids_content` verisiyle açıldığını, sayfalama ve view event’in doğru gittiğini doğrula (Arhan seed’i ekledikten sonra).

**Çıktı:** Kids Feed ekranı tamamen `/kids/feed` ve `POST kids/feed/viewed` kullanıyor; seed sonrası dolu feed görünüyor.

---

### 2. Arhan Bartu Ergüven

**Hedef:** Kids feed ve quiz’in test edilebilmesi için veri üretmek.

- [ ] **`kids_content` seed migration’ı yaz**
  - Dosya: `supabase/migrations/20260210003100_seed_kids_content.sql` (veya bir sonraki sıradaki migration).
  - En az 5–10 test kaydı: `title`, `description`, `video_url`, `thumbnail_url`, `age_group` (7-9 / 10-12), `difficulty`, `topic_tags` (seed’deki `kids_topics.name` ile uyumlu, örn. `Dinosaurs`, `Space`, `Math Basics`), `duration_seconds`, `is_active = true`.
  - URL’ler için placeholder (örn. YouTube embed veya public test URL) kullanılabilir.
- [ ] **`kids_quizzes` seed’i ekle**
  - En az 1–2 `kids_content` id’si için quiz ekle (`content_id`, `questions` JSON veya ilgili tablo yapısına uygun). Böylece feed’de “hasQuiz” ve quiz overlay test edilebilir.
- [ ] **Migration’ları Supabase’te çalıştır**
  - LOCAL_SETUP_KIDS’deki sıraya uygun şekilde yeni migration’ı listele; gerekirse README/SETUP’a not düş.

**Çıktı:** Supabase’te `kids_content` ve `kids_quizzes` dolu; feed dolu görünüyor ve en az bir videoda quiz çıkıyor.

---

### 3. Furkan Komaç

**Hedef:** Core codebase’teki TypeScript hatalarını kaldırmak ve build’i yeşile almak.

- [ ] **Core feed / friends / playground TS hatalarını tespit et**
  - `mobile-app` (ve varsa `backend`) içinde `npm run build` / `tsc` ve lint çalıştır; hata veren dosyaları listele.
- [ ] **Hataları tek tek gider**
  - Eksik tipler, yanlış import’lar, kaldırılmış API’lere referanslar vb. Düzeltmeler core (Kids dışı) kodda; Kids modülüne gereksiz değişiklik yapma.
- [ ] **Build ve lint’in temiz geçtiğini doğrula**
  - `code/mobile-app`: `npm run build` (veya `npx tsc --noEmit`) ve lint.
  - `code/backend`: `npm run build` ve lint.

**Çıktı:** Proje build’i ve lint’i hatasız; CI yeşil olabilir.

---

### 4. Erkan Can Arslan

**Hedef:** Parental, Profile ve Playground’un backend ile uyumunu doğrulamak ve dokümantasyonu güncellemek.

- [ ] **Parental ekranları**
  - Activity / Screen time / Content safety ekranlarının ilgili Kids API endpoint’leriyle konuştuğunu kontrol et; varsa 401/404/500 ve boş state’leri not et.
- [ ] **Profile ekranı**
  - Profil, topics, history, saved (bookmarks) vb. API’lerin çağrıldığını ve cevaba göre UI’ın davrandığını test et.
- [ ] **Playground**
  - Drawing upload, daily missions, progression/rewards API’lerinin çağrıldığını ve hata durumlarının yönetildiğini kontrol et.
- [ ] **Dokümantasyon**
  - `LOCAL_SETUP_KIDS.md`: Yeni migration’ları (seed_kids_content, seed_kids_quizzes) listele; “Kids feed boş” kısmını “seed sonrası dolar” şeklinde güncelle.
  - Bu haftalık planı kısa bir “Test checklist” ile destekle: Giriş → çocuk seç → feed, bookmark, quiz, profile, playground, parental, logout (isteğe bağlı maddeler).

**Çıktı:** Parental/Profile/Playground backend entegrasyonu gözden geçirilmiş; LOCAL_SETUP_KIDS ve test notları güncel.

---

## Sıra ve Bağımlılıklar

- **Arhan** seed’i (kids_content + quizzes) önce bitirirse **Artun** feed geçişini gerçek veriyle test edebilir.
- **Artun** feedApi değişikliğini seed’den bağımsız yapabilir; seed sonrası birlikte doğrulama yapılabilir.
- **Furkan** ve **Erkan** görevleri diğer ikisinden bağımsız ilerleyebilir.

---

## Özet Tablo

| Kişi | Odak | Özet |
|------|------|------|
| **Artun Balta** | Kids Feed API geçişi | feedApi → `/kids/feed` + `POST kids/feed/viewed`, test |
| **Arhan Bartu Ergüven** | Veri (seed) | kids_content + kids_quizzes migration, Supabase’te çalıştırma |
| **Furkan Komaç** | Core sağlık | TS hatalarını giderme, build + lint |
| **Erkan Can Arslan** | Entegrasyon + dokümantasyon | Parental/Profile/Playground API testi, LOCAL_SETUP_KIDS + test checklist |

Bu plan `KIDS_BLUEPRINT.md` ve mevcut codebase durumuna göre hazırlanmıştır. Hafta sonunda kısa bir sync ile tamamlanan maddeler işaretlenebilir ve bir sonraki sprint öncelikleri belirlenebilir.

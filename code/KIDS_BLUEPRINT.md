# Scrollio Kids — Blueprint

Bu doküman Kids modülünün mimari özeti ve yapı taşlarını içerir.

---

## 1. Genel mimari

```
[Telefon / Web]  →  Expo (React Native)  →  Backend (NestJS :3000)  →  Supabase (PostgreSQL + Auth)
       │                      │                        │
       │                      │                        └── /api/v1/kids/*  (Kids API)
       │                      └── kidsApi (HTTP client, X-Child-Profile-Id header)
       └── Redux (kidsAuth, kidsFeed, kidsProfile, …)
```

- **Core** = mevcut ana uygulama (SignIn, MainTabs, Chat, Playground, vb.).
- **Kids** = Core içinde tek bir ekran (“Kids”) olarak açılır; içinde kendi auth, çocuk seçimi ve tab’ları vardır.

---

## 2. Kullanıcı akışı (UX)

1. Ana uygulama → **“Scrollio Kids (7–12)”** tıklanır.
2. **KidsLogin** → email/şifre ile giriş veya **KidsRegister** ile kayıt.
3. İlk kayıtta **KidsSetPin** → 4 haneli parent PIN belirleme.
4. Her girişte **KidsPinEntry** → PIN ile doğrulama.
5. **KidsChildSelector** → “Kim izliyor?” (Netflix tarzı profil seçimi) veya çocuk yoksa **KidsCreateChild**.
6. **KidsMainTabs**: Feed | Playground | Profile | Settings.
7. **Logout** → session temizlenir, **KidsLogin**’e dönülür.

---

## 3. Backend yapısı (NestJS)

**Base path:** `POST/GET .../api/v1/kids/...`

| Modül | Klasör | Açıklama |
|-------|--------|----------|
| Auth (parent + çocuk) | `backend/src/kids/child-auth/` | register, login, me, pin/set, pin/verify, children CRUD, children/switch |
| Feed | `backend/src/kids/feed/` | feed listesi, viewed event |
| Quiz | `backend/src/kids/quiz/` | quiz getir, cevap gönder |
| Bookmark | `backend/src/kids/bookmark/` | toggle, list |
| Curation | `backend/src/kids/curation/` | öneriler |
| Profile | `backend/src/kids/profile/` | profil, topics, avatar, history, metrics |
| Playground | `backend/src/kids/playground/` | drawing upload, character, animation |
| Progression | `backend/src/kids/progression/` | progress, daily missions, complete, rewards |
| Parental | `backend/src/kids/parental/` | activity, screen-time, content-filters |
| Settings | `backend/src/kids/settings/` | get settings, update notifications |
| Voice | `backend/src/kids/voice/` | voice command |

**Ortak auth/authorization:**

- `AuthGuard` → JWT (Bearer).
- `RolesGuard` + `@Roles('parent','school')` → parent/school rolü.
- `ParentPinGuard` → PIN kayıtlı mı kontrolü (parental ekranları için).
- `X-Child-Profile-Id` header → hangi çocuk adına işlem (CurrentChild decorator, ChildProfileInterceptor).

**Supabase:** `SupabaseService` → `getClient()` (anon), `getAdminClient()` (service_role, RLS bypass).

---

## 4. Frontend yapısı (React Native / Expo)

**Kök:** `mobile-app/src/features/kids/`

| Feature | Klasör | İçerik (kısa) |
|---------|--------|----------------|
| Auth | `kids/auth/` | Login, Register, SetPin, PinEntry, ChildSelector, CreateChild, RoleBlocked; authSlice, authApi, pinApi, childProfileApi, roleApi |
| Feed | `kids/feed/` | KidsFeedScreen, VideoPlayer, QuizOverlay, bookmark, swipe, voice FAB; feedSlice, feedApi, quizApi |
| Profile | `kids/profile/` | KidsProfileScreen, topics, metrics, history, saved, avatar; profileSlice, profileApi, topicApi |
| Playground | `kids/playground/` | Draw, Missions, Rewards; canvasSlice, progressionSlice, drawingApi, progressionApi |
| Parental | `kids/parental/` | Dashboard, Activity, Screen time, Content safety; parentalSlice, parentalApi |
| Settings | `kids/settings/` | KidsSettingsScreen, notifications, menu, LogOutButton; settingsApi |
| Shared | `kids/shared/` | api (kidsApi), constants, components, hooks, types, utils (validators, storage) |

**Navigasyon:**

- `AppNavigator`: “Kids” ekranı → `KidsNavigator` (Stack).
- `KidsNavigator`: KidsLogin, KidsRegister, KidsSetPin, KidsPinEntry, KidsChildSelector, KidsCreateChild, KidsRoleBlocked, **KidsMainTabs**.
- `KidsMainTabNavigator`: KidsFeed, KidsPlayground, KidsProfile, KidsSettings (+ parental stack ekranları).

**State (Redux):**

- `store.ts`: kidsAuth, kidsFeed, kidsCanvas, kidsProgression, kidsProfile, kidsParental.
- `kidsApi` base URL: `EXPO_PUBLIC_API_BASE_URL`; child header için `setStoreRef(() => store.getState().kidsAuth?.activeChildProfileId)`.

---

## 5. Veritabanı (Supabase migrations)

**Sırayla çalıştırılan migration’lar:** `code/supabase/migrations/`

- Rol / PIN / çocuk: `20260210000000_add_role_system.sql`, `...00100_add_parent_pins.sql`, `...00200_add_child_profiles.sql`
- Kids: `...01000_kids_parental_settings` → `...02100_kids_screen_time_columns`, `...03000_seed_kids_topics`

**Önemli tablolar:**  
`user_roles`, `parent_pins`, `kids_child_profiles`, `kids_content`, `kids_feed_views`, `kids_bookmarks`, `kids_topics`, `kids_child_topics`, `kids_quizzes`, `kids_quiz_attempts`, `kids_drawings`, `kids_progress`, `kids_rewards`, `kids_daily_missions`, `kids_activity_logs`, `kids_parental_settings`, `kids_screen_time_rules`, `kids_notification_settings`, `kids_voice_interactions`.

---

## 6. Önemli dosya yolları (özet)

| Ne | Nerede |
|----|--------|
| Kids API client | `mobile-app/src/features/kids/shared/utils/api.ts` |
| Kids auth state | `mobile-app/src/features/kids/auth/store/authSlice.ts` |
| Kids stack navigator | `mobile-app/src/navigation/KidsNavigator.tsx` |
| Kids tab navigator | `mobile-app/src/navigation/KidsMainTabNavigator.tsx` |
| Backend Kids modülü | `backend/src/kids/kids.module.ts` |
| Backend child-auth | `backend/src/kids/child-auth/` |
| Yerel kurulum notları | `code/LOCAL_SETUP_KIDS.md` |

---

## 7. Teknoloji özeti

- **Backend:** NestJS, TypeScript, Supabase (PostgreSQL + Auth), class-validator (DTO), bcrypt (PIN).
- **Frontend:** React Native, Expo, TypeScript, Redux Toolkit, React Navigation (stack + tab).
- **Ağ:** `kidsApi` → `EXPO_PUBLIC_API_BASE_URL` (web: localhost, cihaz: PC LAN IP).

Bu doküman Kids kısmının blueprint’idir; detay için ilgili klasör ve `LOCAL_SETUP_KIDS.md` kullanılabilir.

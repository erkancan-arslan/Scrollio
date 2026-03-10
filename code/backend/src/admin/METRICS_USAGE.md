# Create Job metrikleri – nerede kullanılıyor?

| Metrik | Kullanıldığı yer | Açıklama |
|--------|-------------------|----------|
| **Title, Topic, Subject** | LLM (script) | User prompt’ta konu ve başlık olarak gider; script içeriği buna göre üretilir. |
| **Content Target (Core/Kids)** | LLM (script) | Kids için ayrı system prompt (daha sade, yaş uyumlu); Core için daha yetişkin tonu. |
| **Language** | LLM + TTS | LLM: “Turkish” / “English” ve kelime sayısı (TR 2.2, EN 2.5 kel/sn). TTS: Dil bilgisi ses seçimi için kullanılır (TR için `TURKISH_VOICE_ID` varsa o ses). |
| **Tone** | LLM (script) | System prompt’ta “Tone: formal/friendly/energetic” olarak verilir. |
| **Duration (seconds)** | LLM (script) | Hedef süre → tahmini kelime sayısı (süre × kel/sn) → script uzunluğu buna göre; dolaylı olarak TTS ve final video süresi de etkilenir. |
| **Difficulty** | LLM (script) | System prompt’ta “Difficulty level: …” olarak verilir. |
| **Custom Prompt** | LLM (script) | User prompt’ta “Additional instructions: …” olarak eklenir. |
| **Reference Video** | Lipsync | Yüz + ses birleştirme bu videodan alınan yüz ile yapılır. |

## TTS ve dil

- Varsayılan ses: **Adam** (ElevenLabs, çok dilli).
- Türkçe için: Backend `.env` içinde `TURKISH_VOICE_ID=...` tanımlanırsa bu ses kullanılır (ElevenLabs’tan Türkçe bir voice id alınabilir).
- Metin zaten seçilen dile göre (TR/EN) üretildiği için TTS metni o dilde okur; dil parametresi ses seçimini iyileştirmek için kullanılır.

## Özet

Tüm metrikler (difficulty, language, duration, tone, content target, custom prompt, topic, subject) **script aşamasında** kullanılıyor. Oluşan video, bu script’ten üretilen TTS + referans videoyla lipsync edildiği için **dolaylı olarak hepsine göre** oluşuyor. TTS tarafında dil, ses seçimi için kullanılıyor.

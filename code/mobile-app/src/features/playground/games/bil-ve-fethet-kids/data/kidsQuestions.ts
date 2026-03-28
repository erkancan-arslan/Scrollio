export interface KidsQuestion {
    id: number;
    type: string;
    question: string;
    answer: boolean;
    hint: string;
}

export const KIDS_QUESTIONS: KidsQuestion[] = [
    // Fen & Doğa
    { id: 1, type: 'fen', question: 'Güneş bir yıldızdır.', answer: true, hint: 'Dünyamızı ısıtır ve aydınlatır' },
    { id: 2, type: 'fen', question: 'Balıklar solungaçla nefes alır.', answer: true, hint: 'Suda yaşayan canlıların solunumunu düşün' },
    { id: 3, type: 'fen', question: 'Kelebekler önce tırtıl olur.', answer: true, hint: 'Metamorfoz denir bu değişime' },
    { id: 4, type: 'fen', question: 'Su 100 derecede kaynar.', answer: true, hint: 'Deniz seviyesinde kaynatılan su için düşün' },
    { id: 5, type: 'fen', question: 'Yunus balıkları bir memeli hayvandır.', answer: true, hint: 'Denizde yaşar ama balık değildir' },
    { id: 6, type: 'fen', question: 'Dünya, Güneş\'in etrafında döner.', answer: true, hint: 'Bir tam tur yaklaşık 365 gün sürer' },
    { id: 7, type: 'fen', question: 'Örümcekler 8 bacaklıdır.', answer: true, hint: 'Böceklerden farklı olarak' },
    { id: 8, type: 'fen', question: 'Gökkuşağında 7 renk vardır.', answer: true, hint: 'Kırmızı, turuncu, sarı, yeşil, mavi, lacivert, mor' },
    { id: 9, type: 'fen', question: 'Ay, Dünya\'nın tek doğal uydusudur.', answer: true, hint: 'Her gece gökyüzünde görürüz' },
    { id: 10, type: 'fen', question: 'Arılar bal yapar.', answer: true, hint: 'Kovanlarında çalışırlar' },
    { id: 11, type: 'fen', question: 'Bitkiler fotosentez yapar.', answer: true, hint: 'Güneş ışığını kullanarak besin üretirler' },
    { id: 12, type: 'fen', question: 'Zürafa, karaların en uzun boylu hayvanıdır.', answer: true, hint: 'Çok uzun bir boynu vardır' },
    { id: 13, type: 'fen', question: 'Fil karadaki en büyük hayvandır.', answer: true, hint: 'Afrika ve Asya\'da yaşar' },
    { id: 14, type: 'fen', question: 'Karlar beyazdır çünkü ışığı yansıtır.', answer: true, hint: 'Buz kristalleri ışığı dağıtır' },
    { id: 15, type: 'fen', question: 'Mevsimler yılda 4 tanedir.', answer: true, hint: 'İlkbahar, yaz, sonbahar, kış' },
    { id: 16, type: 'fen', question: 'Balıklar akciğerle nefes alır.', answer: false, hint: 'Balıkların solungaçları vardır' },
    { id: 17, type: 'fen', question: 'Güneş batıdan doğar.', answer: false, hint: 'Sabah güneşin geldiği yönü düşün' },
    { id: 18, type: 'fen', question: 'Ay kendi ışığını üretir.', answer: false, hint: 'Güneşin ışığını yansıtır' },
    { id: 19, type: 'fen', question: 'Köpekler 6 bacaklıdır.', answer: false, hint: 'Memelilerin bacak sayısını düşün' },
    { id: 20, type: 'fen', question: 'Penguenler Kuzey Kutbu\'nda yaşar.', answer: false, hint: 'Kuzey mi, Güney mi? Kutup ayılarıyla karıştırma' },
    { id: 21, type: 'fen', question: 'Yağmur suyu tuzludur.', answer: false, hint: 'Gökyüzünden düşen su hakkında düşün' },
    { id: 22, type: 'fen', question: 'Otçul hayvanlar et yer.', answer: false, hint: 'Otçul kelimesinin anlamını düşün' },
    { id: 23, type: 'fen', question: 'Karıncalar fillere göre daha büyüktür.', answer: false, hint: 'Boyutları karşılaştır' },

    // Matematik
    { id: 24, type: 'matematik', question: '5 + 5 = 10', answer: true, hint: 'Parmaklarını sayabilirsin' },
    { id: 25, type: 'matematik', question: '3 × 4 = 12', answer: true, hint: '3 tane 4\'ü topla' },
    { id: 26, type: 'matematik', question: '20 ÷ 4 = 5', answer: true, hint: '4 × 5 kaç eder?' },
    { id: 27, type: 'matematik', question: '100 - 37 = 63', answer: true, hint: '100\'den 37 çıkar' },
    { id: 28, type: 'matematik', question: 'Bir düzine 12 tanedir.', answer: true, hint: 'Yumurta kutusu düşün' },
    { id: 29, type: 'matematik', question: 'Haftada 7 gün vardır.', answer: true, hint: 'Pazartesiden Pazara kadar say' },
    { id: 30, type: 'matematik', question: 'Yılda 12 ay vardır.', answer: true, hint: 'Ocak\'tan Aralık\'a kadar say' },
    { id: 31, type: 'matematik', question: '2 + 2 = 5', answer: false, hint: 'Parmaklarını sayabilirsin' },
    { id: 32, type: 'matematik', question: '10 × 10 = 110', answer: false, hint: '10 tane 10 düşün' },
    { id: 33, type: 'matematik', question: 'Günde 25 saat vardır.', answer: false, hint: 'Bir gün kaç saattir?' },
    { id: 34, type: 'matematik', question: '50 + 50 = 90', answer: false, hint: '50 ile 50\'yi topla' },

    // Türkiye & Coğrafya
    { id: 35, type: 'cografya', question: 'Türkiye\'nin başkenti Ankara\'dır.', answer: true, hint: 'Orta Anadolu\'da yer alır' },
    { id: 36, type: 'cografya', question: 'Türkiye hem Asya\'da hem Avrupa\'dadır.', answer: true, hint: 'İstanbul iki kıtada yer alır' },
    { id: 37, type: 'cografya', question: 'Karadeniz, Türkiye\'nin kuzeyindedir.', answer: true, hint: 'Haritaya baksan kuzeyinde görürsün' },
    { id: 38, type: 'cografya', question: 'Dünya\'nın en uzun nehri Nil\'dir.', answer: true, hint: 'Afrika\'da uzanan büyük nehir' },
    { id: 39, type: 'cografya', question: 'Türkiye\'nin başkenti İstanbul\'dur.', answer: false, hint: 'Başkent hangi şehir?' },
    { id: 40, type: 'cografya', question: 'Güneş doğudan batar.', answer: false, hint: 'Güneşin sabah göründüğü yönü düşün' },
    { id: 41, type: 'cografya', question: 'Akdeniz, Türkiye\'nin kuzeyindedir.', answer: false, hint: 'Akdeniz hangi yönde?' },

    // Genel Kültür
    { id: 42, type: 'kultur', question: 'Türk bayrağı kırmızı ve beyazdır.', answer: true, hint: 'Hilal ve yıldız hangi renktedir?' },
    { id: 43, type: 'kultur', question: 'Atatürk Türkiye Cumhuriyeti\'nin kurucusudur.', answer: true, hint: '29 Ekim 1923\'ü hatırla' },
    { id: 44, type: 'kultur', question: 'Türk bayrağında güneş sembolü vardır.', answer: false, hint: 'Bayraktaki sembolleri düşün' },
    { id: 45, type: 'kultur', question: 'Ramazan Bayramı 3 gün sürer.', answer: true, hint: 'Şeker Bayramı da denir' },
    { id: 46, type: 'kultur', question: 'Türkçe alfabesinde 29 harf vardır.', answer: true, hint: 'A\'dan Z\'ye kadar Türkçe harfler' },

    // Hayvanlar
    { id: 47, type: 'hayvanlar', question: 'Kanatları olan tüm hayvanlar uçabilir.', answer: false, hint: 'Tavuk ve devekuşunu düşün' },
    { id: 48, type: 'hayvanlar', question: 'Kurbağalar hem karada hem suda yaşayabilir.', answer: true, hint: 'Amfibi hayvanlar denir bunlara' },
    { id: 49, type: 'hayvanlar', question: 'Timsahlar soğukkanlı hayvanlardır.', answer: true, hint: 'Sürüngen olan hayvanlar genelde soğukkanlıdır' },
    { id: 50, type: 'hayvanlar', question: 'Aslanlar otçuldur.', answer: false, hint: 'Aslanların ne yediğini düşün' },
    { id: 51, type: 'hayvanlar', question: 'Balinalar balıktır.', answer: false, hint: 'Yunus gibi memeli bir hayvandır' },
    { id: 52, type: 'hayvanlar', question: 'Kartallar gökyüzünde en yüksek uçan kuşlar arasındadır.', answer: true, hint: 'Güçlü yırtıcı kuşlardır' },
    { id: 53, type: 'hayvanlar', question: 'Yılanların bacakları vardır.', answer: false, hint: 'Yılanların nasıl hareket ettiğini düşün' },
    { id: 54, type: 'hayvanlar', question: 'Kediler gece de görebilir.', answer: true, hint: 'Parlayan gözleri vardır karanlıkta' },
    { id: 55, type: 'hayvanlar', question: 'Tavşanlar yumurtlar.', answer: false, hint: 'Tavşan memeli bir hayvandır' },
];

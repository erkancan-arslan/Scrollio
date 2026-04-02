export interface QuestionPair {
    id: string;
    question: string;
    answer: string;
}

/**
 * Pool of kid-friendly question-answer pairs.
 * Each round randomly draws 6 from this list.
 */
export const QUESTION_POOL: QuestionPair[] = [
    // Uzay ve Bilim
    { id: 'q01', question: 'Uzaya gitmek için kullanılan araç?', answer: 'Roket' },
    { id: 'q02', question: 'Dünyamızı ısıtan ve aydınlatan yıldız?', answer: 'Güneş' },
    { id: 'q03', question: 'Gece gökyüzünde parlayan uydumuz?', answer: 'Ay' },
    { id: 'q04', question: 'Etrafında halkaları olan gezegen?', answer: 'Satürn' },
    { id: 'q05', question: 'Yıldızlara yakından bakmak için ne kullanırız?', answer: 'Teleskop' },
    { id: 'q06', question: 'Renginden dolayı kızıl gezegen denen yer?', answer: 'Mars' },

    // Doğa ve Hayvanlar
    { id: 'q07', question: 'Gündüzleri uyuyup gece uçan kuş?', answer: 'Baykuş' },
    { id: 'q08', question: 'Okyanuslarda yaşayan en büyük memeli?', answer: 'Balina' },
    { id: 'q09', question: 'Kış uykusuna yatan büyük hayvan?', answer: 'Ayı' },
    { id: 'q10', question: 'Geceleri parlayarak uçan böcek?', answer: 'Ateşböceği' },
    { id: 'q11', question: 'Çölde yaşayan hörgüçlü hayvan?', answer: 'Deve' },

    // Matematik
    { id: 'q12', question: '5 + 4 = ?', answer: '9' },
    { id: 'q13', question: '10 - 3 = ?', answer: '7' },
    { id: 'q14', question: '3 × 3 = ?', answer: '9' },
    { id: 'q15', question: '12 ÷ 2 = ?', answer: '6' },

    // Mantık ve Temel Bilgiler
    { id: 'q16', question: 'Haftanın ilk günü hangisidir?', answer: 'Pazartesi' },
    { id: 'q17', question: 'Bir yılda kaç ay vardır?', answer: '12' },
    { id: 'q18', question: 'Buz ısındığında neye dönüşür?', answer: 'Su' },
    { id: 'q19', question: '3 köşesi olan kapalı şekil?', answer: 'Üçgen' },
    { id: 'q20', question: 'Gökkuşağının en üstündeki renk?', answer: 'Kırmızı' },
    { id: 'q21', question: '3 × 5 = ?', answer: '15' },
    { id: 'q22', question: '4 + 7 = ?', answer: '11' },
    { id: 'q23', question: '10 - 3 = ?', answer: '7' },
    { id: 'q24', question: '2 × 6 = ?', answer: '12' },
    { id: 'q25', question: '8 + 5 = ?', answer: '13' },
    { id: 'q26', question: '20 ÷ 4 = ?', answer: '5' },
    { id: 'q27', question: '9 × 2 = ?', answer: '18' },
    { id: 'q28', question: '15 - 8 = ?', answer: '7' }
];

/**
 * Seeded pseudo-random shuffle (Fisher-Yates).
 * Using the roomCode string as a seed ensures both clients
 * produce the identical shuffle without any server round-trip.
 */
function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

export function pickRoundQuestions(roomCode: string): QuestionPair[] {
    const rand = seededRandom(hashCode(roomCode));
    const pool = [...QUESTION_POOL];
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
}

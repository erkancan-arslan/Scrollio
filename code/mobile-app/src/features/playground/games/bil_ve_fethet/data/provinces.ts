/**
 * Turkey province data for Bil ve Fethet.
 * 81 provinces represented as circles on a 1000×600 SVG viewport.
 * Coordinates derived from approximate geographic centroids.
 * Adjacency lists reflect actual shared land borders.
 */

export interface Province {
    id: string;       // 'TR-01' … 'TR-81' (plate code based)
    name: string;
    plateCode: number;
    /** SVG circle center X (viewport 0–1000) */
    cx: number;
    /** SVG circle center Y (viewport 0–600) */
    cy: number;
    /** Circle radius */
    r: number;
    /** IDs of bordering provinces */
    adjacentIds: string[];
}

// Helper: build an ID from plate code
const id = (n: number) => `TR-${String(n).padStart(2, '0')}`;

// Coordinate mapping (based on Turkish geographic bounds):
// Longitude 26.0–44.5 → x 40–960  (range 920)
// Latitude  36.0–42.1 → y 560–40  (inverted, range 520)
// x = 40 + (lon - 26.0) / 18.5 * 920
// y = 40 + (42.1 - lat) / 6.1 * 520
const cx = (lon: number) => Math.round(40 + ((lon - 26.0) / 18.5) * 920);
const cy = (lat: number) => Math.round(40 + ((42.1 - lat) / 6.1) * 520);
const R = 22; // default radius

export const PROVINCES: Province[] = [
    // Plate 1 – Adana
    {
        id: id(1), name: 'Adana', plateCode: 1,
        cx: cx(35.3), cy: cy(37.0), r: R,
        adjacentIds: [id(33), id(51), id(38), id(46), id(80), id(31)],
    },
    // Plate 2 – Adıyaman
    {
        id: id(2), name: 'Adıyaman', plateCode: 2,
        cx: cx(38.3), cy: cy(37.8), r: R,
        adjacentIds: [id(44), id(63), id(27), id(46)],
    },
    // Plate 3 – Afyonkarahisar
    {
        id: id(3), name: 'Afyon', plateCode: 3,
        cx: cx(30.5), cy: cy(38.7), r: R,
        adjacentIds: [id(43), id(26), id(42), id(32), id(15), id(20), id(64)],
    },
    // Plate 4 – Ağrı
    {
        id: id(4), name: 'Ağrı', plateCode: 4,
        cx: cx(43.1), cy: cy(39.7), r: R,
        adjacentIds: [id(25), id(49), id(65), id(76), id(36)],
    },
    // Plate 5 – Amasya
    {
        id: id(5), name: 'Amasya', plateCode: 5,
        cx: cx(35.8), cy: cy(40.7), r: R,
        adjacentIds: [id(55), id(19), id(60), id(58)],
    },
    // Plate 6 – Ankara
    {
        id: id(6), name: 'Ankara', plateCode: 6,
        cx: cx(32.9), cy: cy(39.9), r: R,
        adjacentIds: [id(14), id(71), id(18), id(19), id(40), id(68), id(42), id(26), id(66)],
    },
    // Plate 7 – Antalya
    {
        id: id(7), name: 'Antalya', plateCode: 7,
        cx: cx(31.0), cy: cy(37.0), r: R,
        adjacentIds: [id(48), id(15), id(32), id(42), id(70)],
    },
    // Plate 8 – Artvin
    {
        id: id(8), name: 'Artvin', plateCode: 8,
        cx: cx(41.8), cy: cy(41.2), r: R,
        adjacentIds: [id(53), id(25), id(75)],
    },
    // Plate 9 – Aydın
    {
        id: id(9), name: 'Aydın', plateCode: 9,
        cx: cx(28.0), cy: cy(37.8), r: R,
        adjacentIds: [id(35), id(45), id(20), id(48), id(64)],
    },
    // Plate 10 – Balıkesir
    {
        id: id(10), name: 'Balıkesir', plateCode: 10,
        cx: cx(27.9), cy: cy(39.6), r: R,
        adjacentIds: [id(17), id(16), id(43), id(45), id(35)],
    },
    // Plate 11 – Bilecik
    {
        id: id(11), name: 'Bilecik', plateCode: 11,
        cx: cx(30.0), cy: cy(40.2), r: R,
        adjacentIds: [id(16), id(41), id(54), id(26), id(43)],
    },
    // Plate 12 – Bingöl
    {
        id: id(12), name: 'Bingöl', plateCode: 12,
        cx: cx(40.5), cy: cy(39.1), r: R,
        adjacentIds: [id(62), id(23), id(49), id(25), id(24)],
    },
    // Plate 13 – Bitlis
    {
        id: id(13), name: 'Bitlis', plateCode: 13,
        cx: cx(42.1), cy: cy(38.4), r: R,
        adjacentIds: [id(49), id(12), id(56), id(65)],
    },
    // Plate 14 – Bolu
    {
        id: id(14), name: 'Bolu', plateCode: 14,
        cx: cx(31.6), cy: cy(40.7), r: R,
        adjacentIds: [id(67), id(74), id(78), id(81), id(54), id(6), id(71)],
    },
    // Plate 15 – Burdur
    {
        id: id(15), name: 'Burdur', plateCode: 15,
        cx: cx(30.3), cy: cy(37.7), r: R,
        adjacentIds: [id(3), id(32), id(7), id(48), id(20)],
    },
    // Plate 16 – Bursa
    {
        id: id(16), name: 'Bursa', plateCode: 16,
        cx: cx(29.0), cy: cy(40.2), r: R,
        adjacentIds: [id(10), id(43), id(11), id(77), id(41)],
    },
    // Plate 17 – Çanakkale
    {
        id: id(17), name: 'Çanakkale', plateCode: 17,
        cx: cx(26.4), cy: cy(40.2), r: R,
        adjacentIds: [id(59), id(10), id(39)],
    },
    // Plate 18 – Çankırı
    {
        id: id(18), name: 'Çankırı', plateCode: 18,
        cx: cx(33.6), cy: cy(40.6), r: R,
        adjacentIds: [id(6), id(37), id(19), id(71), id(67)],
    },
    // Plate 19 – Çorum
    {
        id: id(19), name: 'Çorum', plateCode: 19,
        cx: cx(34.9), cy: cy(40.5), r: R,
        adjacentIds: [id(5), id(18), id(66), id(58), id(60), id(55), id(6)],
    },
    // Plate 20 – Denizli
    {
        id: id(20), name: 'Denizli', plateCode: 20,
        cx: cx(29.1), cy: cy(37.8), r: R,
        adjacentIds: [id(9), id(45), id(3), id(15), id(48), id(64)],
    },
    // Plate 21 – Diyarbakır
    {
        id: id(21), name: 'Diyarbakır', plateCode: 21,
        cx: cx(40.2), cy: cy(37.9), r: R,
        adjacentIds: [id(44), id(23), id(62), id(63), id(47), id(72)],
    },
    // Plate 22 – Edirne
    {
        id: id(22), name: 'Edirne', plateCode: 22,
        cx: cx(26.6), cy: cy(41.7), r: R,
        adjacentIds: [id(39), id(59)],
    },
    // Plate 23 – Elazığ
    {
        id: id(23), name: 'Elazığ', plateCode: 23,
        cx: cx(39.2), cy: cy(38.7), r: R,
        adjacentIds: [id(44), id(58), id(24), id(12), id(21), id(62)],
    },
    // Plate 24 – Erzincan
    {
        id: id(24), name: 'Erzincan', plateCode: 24,
        cx: cx(39.5), cy: cy(39.8), r: R,
        adjacentIds: [id(58), id(23), id(12), id(62), id(25), id(69), id(29), id(28)],
    },
    // Plate 25 – Erzurum
    {
        id: id(25), name: 'Erzurum', plateCode: 25,
        cx: cx(41.3), cy: cy(39.9), r: R,
        adjacentIds: [id(24), id(12), id(49), id(4), id(36), id(8), id(75), id(69), id(29)],
    },
    // Plate 26 – Eskişehir
    {
        id: id(26), name: 'Eskişehir', plateCode: 26,
        cx: cx(30.5), cy: cy(39.8), r: R,
        adjacentIds: [id(3), id(6), id(11), id(43)],
    },
    // Plate 27 – Gaziantep
    {
        id: id(27), name: 'Gaziantep', plateCode: 27,
        cx: cx(37.4), cy: cy(37.1), r: R,
        adjacentIds: [id(63), id(79), id(31), id(46), id(2)],
    },
    // Plate 28 – Giresun
    {
        id: id(28), name: 'Giresun', plateCode: 28,
        cx: cx(38.4), cy: cy(40.9), r: R,
        adjacentIds: [id(52), id(61), id(29), id(24), id(58)],
    },
    // Plate 29 – Gümüşhane
    {
        id: id(29), name: 'Gümüşhane', plateCode: 29,
        cx: cx(39.5), cy: cy(40.4), r: R,
        adjacentIds: [id(28), id(61), id(25), id(69), id(24)],
    },
    // Plate 30 – Hakkari
    {
        id: id(30), name: 'Hakkari', plateCode: 30,
        cx: cx(43.7), cy: cy(37.6), r: R,
        adjacentIds: [id(65), id(56), id(73)],
    },
    // Plate 31 – Hatay
    {
        id: id(31), name: 'Hatay', plateCode: 31,
        cx: cx(36.1), cy: cy(36.4), r: R,
        adjacentIds: [id(1), id(80), id(27), id(79)],
    },
    // Plate 32 – Isparta
    {
        id: id(32), name: 'Isparta', plateCode: 32,
        cx: cx(30.6), cy: cy(37.8), r: R,
        adjacentIds: [id(3), id(7), id(15), id(42)],
    },
    // Plate 33 – Mersin (İçel)
    {
        id: id(33), name: 'Mersin', plateCode: 33,
        cx: cx(34.6), cy: cy(36.8), r: R,
        adjacentIds: [id(1), id(51), id(68), id(70), id(42)],
    },
    // Plate 34 – İstanbul
    {
        id: id(34), name: 'İstanbul', plateCode: 34,
        cx: cx(29.0), cy: cy(41.0), r: R,
        adjacentIds: [id(39), id(59), id(41)],
    },
    // Plate 35 – İzmir
    {
        id: id(35), name: 'İzmir', plateCode: 35,
        cx: cx(27.1), cy: cy(38.4), r: R,
        adjacentIds: [id(10), id(45), id(9), id(64)],
    },
    // Plate 36 – Kars
    {
        id: id(36), name: 'Kars', plateCode: 36,
        cx: cx(43.1), cy: cy(40.6), r: R,
        adjacentIds: [id(4), id(25), id(75), id(76)],
    },
    // Plate 37 – Kastamonu
    {
        id: id(37), name: 'Kastamonu', plateCode: 37,
        cx: cx(33.8), cy: cy(41.4), r: R,
        adjacentIds: [id(18), id(57), id(67), id(74), id(78), id(6)],
    },
    // Plate 38 – Kayseri
    {
        id: id(38), name: 'Kayseri', plateCode: 38,
        cx: cx(35.5), cy: cy(38.7), r: R,
        adjacentIds: [id(1), id(66), id(40), id(68), id(51), id(50), id(58), id(46)],
    },
    // Plate 39 – Kırklareli
    {
        id: id(39), name: 'Kırklareli', plateCode: 39,
        cx: cx(27.2), cy: cy(41.7), r: R,
        adjacentIds: [id(22), id(59), id(34), id(17)],
    },
    // Plate 40 – Kırşehir
    {
        id: id(40), name: 'Kırşehir', plateCode: 40,
        cx: cx(34.2), cy: cy(39.1), r: R,
        adjacentIds: [id(6), id(71), id(66), id(38), id(50), id(68)],
    },
    // Plate 41 – Kocaeli
    {
        id: id(41), name: 'Kocaeli', plateCode: 41,
        cx: cx(29.9), cy: cy(40.9), r: R,
        adjacentIds: [id(34), id(16), id(11), id(54), id(77)],
    },
    // Plate 42 – Konya
    {
        id: id(42), name: 'Konya', plateCode: 42,
        cx: cx(32.5), cy: cy(37.9), r: R,
        adjacentIds: [id(6), id(26), id(3), id(32), id(7), id(33), id(70), id(68), id(51), id(50)],
    },
    // Plate 43 – Kütahya
    {
        id: id(43), name: 'Kütahya', plateCode: 43,
        cx: cx(29.9), cy: cy(39.4), r: R,
        adjacentIds: [id(10), id(16), id(11), id(26), id(3), id(64)],
    },
    // Plate 44 – Malatya
    {
        id: id(44), name: 'Malatya', plateCode: 44,
        cx: cx(38.4), cy: cy(38.4), r: R,
        adjacentIds: [id(2), id(21), id(23), id(38), id(58), id(46)],
    },
    // Plate 45 – Manisa
    {
        id: id(45), name: 'Manisa', plateCode: 45,
        cx: cx(27.4), cy: cy(38.6), r: R,
        adjacentIds: [id(35), id(10), id(43), id(64), id(20)],
    },
    // Plate 46 – Kahramanmaraş
    {
        id: id(46), name: 'K.Maraş', plateCode: 46,
        cx: cx(36.9), cy: cy(37.6), r: R,
        adjacentIds: [id(44), id(2), id(27), id(1), id(80), id(38), id(58)],
    },
    // Plate 47 – Mardin
    {
        id: id(47), name: 'Mardin', plateCode: 47,
        cx: cx(40.7), cy: cy(37.3), r: R,
        adjacentIds: [id(21), id(72), id(56), id(63), id(73)],
    },
    // Plate 48 – Muğla
    {
        id: id(48), name: 'Muğla', plateCode: 48,
        cx: cx(28.4), cy: cy(37.2), r: R,
        adjacentIds: [id(9), id(20), id(15), id(7)],
    },
    // Plate 49 – Muş
    {
        id: id(49), name: 'Muş', plateCode: 49,
        cx: cx(41.7), cy: cy(38.9), r: R,
        adjacentIds: [id(12), id(25), id(4), id(13)],
    },
    // Plate 50 – Nevşehir
    {
        id: id(50), name: 'Nevşehir', plateCode: 50,
        cx: cx(34.7), cy: cy(38.6), r: R,
        adjacentIds: [id(38), id(40), id(68), id(42), id(66), id(51)],
    },
    // Plate 51 – Niğde
    {
        id: id(51), name: 'Niğde', plateCode: 51,
        cx: cx(34.7), cy: cy(37.9), r: R,
        adjacentIds: [id(1), id(33), id(68), id(38), id(50), id(42)],
    },
    // Plate 52 – Ordu
    {
        id: id(52), name: 'Ordu', plateCode: 52,
        cx: cx(37.9), cy: cy(41.0), r: R,
        adjacentIds: [id(55), id(28), id(60), id(58)],
    },
    // Plate 53 – Rize
    {
        id: id(53), name: 'Rize', plateCode: 53,
        cx: cx(40.5), cy: cy(41.0), r: R,
        adjacentIds: [id(8), id(61), id(25)],
    },
    // Plate 54 – Sakarya
    {
        id: id(54), name: 'Sakarya', plateCode: 54,
        cx: cx(30.4), cy: cy(40.8), r: R,
        adjacentIds: [id(14), id(11), id(41), id(77), id(81)],
    },
    // Plate 55 – Samsun
    {
        id: id(55), name: 'Samsun', plateCode: 55,
        cx: cx(36.3), cy: cy(41.3), r: R,
        adjacentIds: [id(5), id(57), id(52), id(19)],
    },
    // Plate 56 – Siirt
    {
        id: id(56), name: 'Siirt', plateCode: 56,
        cx: cx(42.0), cy: cy(37.9), r: R,
        adjacentIds: [id(13), id(30), id(73), id(72), id(47)],
    },
    // Plate 57 – Sinop
    {
        id: id(57), name: 'Sinop', plateCode: 57,
        cx: cx(35.2), cy: cy(42.0), r: R,
        adjacentIds: [id(55), id(37)],
    },
    // Plate 58 – Sivas
    {
        id: id(58), name: 'Sivas', plateCode: 58,
        cx: cx(37.0), cy: cy(39.7), r: R,
        adjacentIds: [id(60), id(52), id(28), id(24), id(23), id(44), id(38), id(66), id(5), id(46)],
    },
    // Plate 59 – Tekirdağ
    {
        id: id(59), name: 'Tekirdağ', plateCode: 59,
        cx: cx(27.5), cy: cy(41.0), r: R,
        adjacentIds: [id(22), id(39), id(34), id(17)],
    },
    // Plate 60 – Tokat
    {
        id: id(60), name: 'Tokat', plateCode: 60,
        cx: cx(36.6), cy: cy(40.3), r: R,
        adjacentIds: [id(5), id(55), id(52), id(28), id(58), id(19), id(66)],
    },
    // Plate 61 – Trabzon
    {
        id: id(61), name: 'Trabzon', plateCode: 61,
        cx: cx(39.7), cy: cy(41.0), r: R,
        adjacentIds: [id(53), id(8), id(29), id(28), id(69)],
    },
    // Plate 62 – Tunceli
    {
        id: id(62), name: 'Tunceli', plateCode: 62,
        cx: cx(39.5), cy: cy(39.1), r: R,
        adjacentIds: [id(12), id(24), id(58), id(23), id(21)],
    },
    // Plate 63 – Şanlıurfa
    {
        id: id(63), name: 'Şanlıurfa', plateCode: 63,
        cx: cx(39.0), cy: cy(37.2), r: R,
        adjacentIds: [id(2), id(21), id(47), id(72), id(27), id(79)],
    },
    // Plate 64 – Uşak
    {
        id: id(64), name: 'Uşak', plateCode: 64,
        cx: cx(29.4), cy: cy(38.7), r: R,
        adjacentIds: [id(3), id(43), id(45), id(20), id(35)],
    },
    // Plate 65 – Van
    {
        id: id(65), name: 'Van', plateCode: 65,
        cx: cx(43.4), cy: cy(38.5), r: R,
        adjacentIds: [id(4), id(13), id(30), id(56)],
    },
    // Plate 66 – Yozgat
    {
        id: id(66), name: 'Yozgat', plateCode: 66,
        cx: cx(34.8), cy: cy(39.8), r: R,
        adjacentIds: [id(6), id(19), id(71), id(38), id(40), id(58), id(60)],
    },
    // Plate 67 – Zonguldak
    {
        id: id(67), name: 'Zonguldak', plateCode: 67,
        cx: cx(31.8), cy: cy(41.5), r: R,
        adjacentIds: [id(14), id(74), id(78), id(18)],
    },
    // Plate 68 – Aksaray
    {
        id: id(68), name: 'Aksaray', plateCode: 68,
        cx: cx(34.0), cy: cy(38.4), r: R,
        adjacentIds: [id(42), id(51), id(38), id(50), id(40), id(33), id(70)],
    },
    // Plate 69 – Bayburt
    {
        id: id(69), name: 'Bayburt', plateCode: 69,
        cx: cx(40.2), cy: cy(40.3), r: R,
        adjacentIds: [id(24), id(25), id(29), id(61)],
    },
    // Plate 70 – Karaman
    {
        id: id(70), name: 'Karaman', plateCode: 70,
        cx: cx(33.2), cy: cy(37.2), r: R,
        adjacentIds: [id(42), id(33), id(51), id(7), id(68)],
    },
    // Plate 71 – Kırıkkale
    {
        id: id(71), name: 'Kırıkkale', plateCode: 71,
        cx: cx(33.5), cy: cy(39.8), r: R,
        adjacentIds: [id(6), id(14), id(66), id(18), id(19)],
    },
    // Plate 72 – Batman
    {
        id: id(72), name: 'Batman', plateCode: 72,
        cx: cx(41.1), cy: cy(37.9), r: R,
        adjacentIds: [id(21), id(47), id(56)],
    },
    // Plate 73 – Şırnak
    {
        id: id(73), name: 'Şırnak', plateCode: 73,
        cx: cx(42.5), cy: cy(37.5), r: R,
        adjacentIds: [id(56), id(47), id(63), id(30)],
    },
    // Plate 74 – Bartın
    {
        id: id(74), name: 'Bartın', plateCode: 74,
        cx: cx(32.3), cy: cy(41.6), r: R,
        adjacentIds: [id(67), id(78), id(37)],
    },
    // Plate 75 – Ardahan
    {
        id: id(75), name: 'Ardahan', plateCode: 75,
        cx: cx(42.7), cy: cy(41.1), r: R,
        adjacentIds: [id(36), id(8), id(25)],
    },
    // Plate 76 – Iğdır
    {
        id: id(76), name: 'Iğdır', plateCode: 76,
        cx: cx(44.0), cy: cy(39.9), r: R,
        adjacentIds: [id(4), id(36), id(75)],
    },
    // Plate 77 – Yalova
    {
        id: id(77), name: 'Yalova', plateCode: 77,
        cx: cx(29.3), cy: cy(40.7), r: R,
        adjacentIds: [id(16), id(41), id(54)],
    },
    // Plate 78 – Karabük
    {
        id: id(78), name: 'Karabük', plateCode: 78,
        cx: cx(32.6), cy: cy(41.2), r: R,
        adjacentIds: [id(74), id(37), id(18), id(14), id(67)],
    },
    // Plate 79 – Kilis
    {
        id: id(79), name: 'Kilis', plateCode: 79,
        cx: cx(37.1), cy: cy(36.7), r: R,
        adjacentIds: [id(27), id(31), id(63)],
    },
    // Plate 80 – Osmaniye
    {
        id: id(80), name: 'Osmaniye', plateCode: 80,
        cx: cx(36.2), cy: cy(37.1), r: R,
        adjacentIds: [id(1), id(31), id(46)],
    },
    // Plate 81 – Düzce
    {
        id: id(81), name: 'Düzce', plateCode: 81,
        cx: cx(31.2), cy: cy(40.8), r: R,
        adjacentIds: [id(14), id(54), id(41)],
    },
];

// O(1) lookup maps
export const PROVINCE_BY_ID: Record<string, Province> = Object.fromEntries(
    PROVINCES.map(p => [p.id, p])
);

export const PROVINCE_BY_PLATE: Record<number, Province> = Object.fromEntries(
    PROVINCES.map(p => [p.plateCode, p])
);

export const getAdjacentProvinces = (provinceId: string): Province[] =>
    (PROVINCE_BY_ID[provinceId]?.adjacentIds ?? [])
        .map(adjId => PROVINCE_BY_ID[adjId])
        .filter(Boolean);

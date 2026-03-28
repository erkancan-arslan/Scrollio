
export interface Region {
    id: string;
    name: string;
    svgPath: string;
    labelX: number;
    labelY: number;
    adjacentIds: string[];
}

// ViewBox: "0 0 720 1280"
export const REGIONS: Region[] = [
    {
        id: 'TR-1',
        name: 'Batı Çölü',
        svgPath: 'M 0,0 L 240,0 L 260,200 L 200,380 L 0,400 Z',
        labelX: 100,
        labelY: 200,
        adjacentIds: ['TR-2', 'TR-3', 'TR-5'],
    },
    {
        id: 'TR-2',
        name: 'Kuzey Kıyısı',
        svgPath: 'M 240,0 L 480,0 L 460,180 L 350,220 L 260,200 Z',
        labelX: 360,
        labelY: 100,
        adjacentIds: ['TR-1', 'TR-3', 'TR-4'],
    },
    {
        id: 'TR-3',
        name: 'Merkez Çorak Topraklar',
        svgPath: 'M 260,200 L 350,220 L 460,180 L 500,350 L 380,450 L 200,380 Z',
        labelX: 350,
        labelY: 330,
        adjacentIds: ['TR-1', 'TR-2', 'TR-4', 'TR-5', 'TR-6', 'TR-7'],
    },
    {
        id: 'TR-4',
        name: 'Doğu Limanı',
        svgPath: 'M 480,0 L 720,0 L 720,380 L 500,350 L 460,180 Z',
        labelX: 600,
        labelY: 180,
        adjacentIds: ['TR-2', 'TR-3', 'TR-6'],
    },
    {
        id: 'TR-5',
        name: 'Yeşil Delta',
        svgPath: 'M 0,400 L 200,380 L 380,450 L 350,600 L 0,620 Z',
        labelX: 150,
        labelY: 500,
        adjacentIds: ['TR-1', 'TR-3', 'TR-7', 'TR-8'],
    },
    {
        id: 'TR-6',
        name: 'Eski Harabeler',
        svgPath: 'M 500,350 L 720,380 L 720,650 L 520,630 L 380,450 Z',
        labelX: 580,
        labelY: 500,
        adjacentIds: ['TR-4', 'TR-3', 'TR-7', 'TR-9'],
    },
    {
        id: 'TR-7',
        name: 'İç Orman',
        svgPath: 'M 380,450 L 520,630 L 400,800 L 240,780 L 350,600 Z',
        labelX: 360,
        labelY: 650,
        adjacentIds: ['TR-3', 'TR-5', 'TR-6', 'TR-8', 'TR-9', 'TR-10'],
    },
    {
        id: 'TR-8',
        name: 'Batı Kıyısı',
        svgPath: 'M 0,620 L 350,600 L 240,780 L 180,950 L 0,970 Z',
        labelX: 120,
        labelY: 780,
        adjacentIds: ['TR-5', 'TR-7', 'TR-10', 'TR-11'],
    },
    {
        id: 'TR-9',
        name: 'Demir Dağları',
        svgPath: 'M 520,630 L 720,650 L 720,980 L 550,1000 L 400,800 Z',
        labelX: 600,
        labelY: 820,
        adjacentIds: ['TR-6', 'TR-7', 'TR-10', 'TR-12'],
    },
    {
        id: 'TR-10',
        name: 'Güney Bozkırları',
        svgPath: 'M 240,780 L 400,800 L 550,1000 L 360,1150 L 180,950 Z',
        labelX: 350,
        labelY: 960,
        adjacentIds: ['TR-7', 'TR-8', 'TR-9', 'TR-11', 'TR-12'],
    },
    {
        id: 'TR-11',
        name: 'Güneybatı Bataklığı',
        svgPath: 'M 0,970 L 180,950 L 360,1150 L 340,1280 L 0,1280 Z',
        labelX: 150,
        labelY: 1150,
        adjacentIds: ['TR-8', 'TR-10', 'TR-12'],
    },
    {
        id: 'TR-12',
        name: 'Volkanik Yarımada',
        svgPath: 'M 550,1000 L 720,980 L 720,1280 L 340,1280 L 360,1150 Z',
        labelX: 550,
        labelY: 1180,
        adjacentIds: ['TR-9', 'TR-10', 'TR-11'],
    },
];

export const REGION_BY_ID: Record<string, Region> = Object.fromEntries(
    REGIONS.map(r => [r.id, r])
);

export const getAdjacentRegions = (id: string): Region[] =>
    (REGION_BY_ID[id]?.adjacentIds ?? []).map(aid => REGION_BY_ID[aid]).filter(Boolean);

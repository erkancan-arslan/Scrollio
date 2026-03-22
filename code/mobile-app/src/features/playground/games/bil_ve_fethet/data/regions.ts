
export interface Region {
    id: string;
    name: string;
    svgPath: string;
    labelX: number;
    labelY: number;
    adjacentIds: string[];
}

// ViewBox: "0 0 1000 580"
// Turkey divided into 12 geographic regions
export const REGIONS: Region[] = [
    {
        id: 'TR-1',
        name: 'Trakya',
        svgPath: 'M 40,40 L 200,40 L 188,90 L 168,148 L 138,190 L 88,202 L 40,182 Z',
        labelX: 118,
        labelY: 118,
        adjacentIds: ['TR-2'],
    },
    {
        id: 'TR-2',
        name: 'Marmara',
        svgPath: 'M 188,40 L 378,55 L 380,178 L 318,228 L 232,242 L 178,218 L 138,190 L 168,148 L 188,90 Z',
        labelX: 268,
        labelY: 148,
        adjacentIds: ['TR-1', 'TR-3', 'TR-4', 'TR-5'],
    },
    {
        id: 'TR-3',
        name: 'Ege',
        svgPath: 'M 40,182 L 88,202 L 138,190 L 178,218 L 195,338 L 168,438 L 135,490 L 82,498 L 48,458 L 28,388 L 32,318 L 52,270 Z',
        labelX: 102,
        labelY: 355,
        adjacentIds: ['TR-2', 'TR-4', 'TR-11'],
    },
    {
        id: 'TR-4',
        name: 'İç Batı',
        svgPath: 'M 232,242 L 318,228 L 380,178 L 448,182 L 465,295 L 455,450 L 372,448 L 292,458 L 215,418 L 168,438 L 195,338 L 178,218 Z',
        labelX: 308,
        labelY: 335,
        adjacentIds: ['TR-2', 'TR-3', 'TR-5', 'TR-6', 'TR-11'],
    },
    {
        id: 'TR-5',
        name: 'Bat. KD',
        svgPath: 'M 378,55 L 558,60 L 560,172 L 468,200 L 448,182 L 380,178 Z',
        labelX: 452,
        labelY: 122,
        adjacentIds: ['TR-2', 'TR-4', 'TR-6', 'TR-7'],
    },
    {
        id: 'TR-6',
        name: 'Orta Anadolu',
        svgPath: 'M 448,182 L 468,200 L 560,172 L 628,188 L 648,298 L 605,408 L 545,450 L 455,450 L 465,295 Z',
        labelX: 532,
        labelY: 312,
        adjacentIds: ['TR-4', 'TR-5', 'TR-7', 'TR-9', 'TR-10', 'TR-11'],
    },
    {
        id: 'TR-7',
        name: 'Ort. KD',
        svgPath: 'M 558,60 L 738,70 L 742,182 L 662,200 L 628,188 L 560,172 Z',
        labelX: 638,
        labelY: 122,
        adjacentIds: ['TR-5', 'TR-6', 'TR-8', 'TR-9'],
    },
    {
        id: 'TR-8',
        name: 'Doğ. KD',
        svgPath: 'M 738,70 L 968,128 L 972,195 L 882,205 L 812,202 L 742,182 Z',
        labelX: 848,
        labelY: 148,
        adjacentIds: ['TR-7', 'TR-9', 'TR-12'],
    },
    {
        id: 'TR-9',
        name: 'Doğu İç',
        svgPath: 'M 628,188 L 662,200 L 742,182 L 812,202 L 832,312 L 778,418 L 720,442 L 652,445 L 605,408 L 648,298 Z',
        labelX: 702,
        labelY: 312,
        adjacentIds: ['TR-6', 'TR-7', 'TR-8', 'TR-10', 'TR-12'],
    },
    {
        id: 'TR-10',
        name: 'Güneydoğu',
        svgPath: 'M 545,450 L 605,408 L 652,445 L 720,442 L 778,418 L 798,495 L 742,542 L 672,555 L 598,555 L 525,548 Z',
        labelX: 655,
        labelY: 492,
        adjacentIds: ['TR-6', 'TR-9', 'TR-11', 'TR-12'],
    },
    {
        id: 'TR-11',
        name: 'Akdeniz',
        svgPath: 'M 168,438 L 215,418 L 292,458 L 372,448 L 455,450 L 525,548 L 445,545 L 370,538 L 285,528 L 210,508 L 150,472 L 135,490 Z',
        labelX: 362,
        labelY: 492,
        adjacentIds: ['TR-3', 'TR-4', 'TR-6', 'TR-10'],
    },
    {
        id: 'TR-12',
        name: 'Doğu',
        svgPath: 'M 812,202 L 882,205 L 972,195 L 978,318 L 965,412 L 925,462 L 858,500 L 800,532 L 742,542 L 798,495 L 778,418 L 832,312 Z',
        labelX: 878,
        labelY: 368,
        adjacentIds: ['TR-8', 'TR-9', 'TR-10'],
    },
];

export const REGION_BY_ID: Record<string, Region> = Object.fromEntries(
    REGIONS.map(r => [r.id, r])
);

export const getAdjacentRegions = (id: string): Region[] =>
    (REGION_BY_ID[id]?.adjacentIds ?? []).map(aid => REGION_BY_ID[aid]).filter(Boolean);

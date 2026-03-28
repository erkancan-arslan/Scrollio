
export interface Desk {
    id: string;
    /** Display name, e.g. "1A", "3C" */
    name: string;
    row: number;
    col: number;
    adjacentIds: string[];
}

const ROWS = 3;
const COLS = 5;
const COL_LABELS = ['A', 'B', 'C', 'D', 'E'];

const deskId = (row: number, col: number): string => `D-${row}-${col}`;

const buildAdjacency = (row: number, col: number): string[] => {
    const adj: string[] = [];
    if (row > 0) adj.push(deskId(row - 1, col));
    if (row < ROWS - 1) adj.push(deskId(row + 1, col));
    if (col > 0) adj.push(deskId(row, col - 1));
    if (col < COLS - 1) adj.push(deskId(row, col + 1));
    return adj;
};

export const DESKS: Desk[] = [];
for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        DESKS.push({
            id: deskId(r, c),
            name: `${r + 1}${COL_LABELS[c]}`,
            row: r,
            col: c,
            adjacentIds: buildAdjacency(r, c),
        });
    }
}

export const DESK_BY_ID: Record<string, Desk> = Object.fromEntries(
    DESKS.map(d => [d.id, d])
);

export const getAdjacentDesks = (id: string): Desk[] =>
    (DESK_BY_ID[id]?.adjacentIds ?? []).map(aid => DESK_BY_ID[aid]).filter(Boolean);

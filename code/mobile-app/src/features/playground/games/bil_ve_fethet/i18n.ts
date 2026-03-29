import { PlayerId, PLAYER_LABELS } from './types';

export type Lang = 'tr' | 'en';

const EN_PLAYER_LABELS: Record<PlayerId, string> = {
    player: 'You',
    bot1: 'Bot 1',
    bot2: 'Bot 2',
};

export const getPlayerLabel = (id: PlayerId, lang: Lang): string =>
    lang === 'tr' ? PLAYER_LABELS[id] : EN_PLAYER_LABELS[id];

export const getNeutralLabel = (lang: Lang): string =>
    lang === 'tr' ? 'Nötr' : 'Neutral';

const STRINGS = {
    tr: {
        // HUD
        gameTitle: 'Bil ve Fethet',
        kidsGameTitle: '🏫 Sınıfı Fethet!',
        langBtn: 'EN',
        // Claiming phase
        mapShare: 'Harita Paylaşımı',
        deskShare: 'Sıra Paylaşımı',
        round: 'Tur',
        picksRegion: 'bölge seçiyor',
        picksDesk: 'sıra seçiyor',
        // Selecting phase
        noMoves: 'Hareket edilecek bölge yok…',
        noDeskMoves: 'Hareket edilecek sıra yok…',
        takeNeutralOrAttack: 'Nötr bölge al veya rakibe saldır',
        attackEnemy: 'Rakip bölgeye saldır',
        takeDeskOrAttack: 'Boş sıra al veya rakibe saldır',
        attackDeskEnemy: 'Rakip sıraya saldır',
        // Phase labels
        attackPhase: '⚔️ Saldırı:',
        guessPhase: '🎯 Tahmin Turu:',
        deskSuffix: 'sırası',
        conquered: 'fethedildi!',
        defended: 'savunuldu!',
        deskConquered: 'sırası fethedildi!',
        deskDefended: 'sırası savunuldu!',
        // Turn banners
        yourChoice: 'Senin Seçimin',
        choosing: 'Seçiyor',
        yourTurn: 'Senin Turun',
        sTurn: '\'in Turu',
        attackingDefend: 'saldırıyor — Savun!',
        // Legend / HUD
        you: 'Sen',
        neutral: 'Nötr',
        empty: 'Boş',
        // Bot turns
        botsPlaying: 'Botlar oynuyor…',
        playing: 'oynuyor…',
        // BattleModal
        trueFalse: 'DOĞRU / YANLIŞ',
        defenseBanner: '🛡️ SAVUNMA MODU',
        target: 'Hedef:',
        score: 'Puan:',
        swipeRight: 'Doğru →',
        swipeLeft: '← Yanlış',
        // GuessingModal
        guessBadge: '🎯 TAHMİN TURU',
        guessPlaceholder: 'Tahminin…',
        submitGuess: 'Tahmin Et →',
        revealTitle: 'Rakibin tahmini açıklanıyor…',
        calculating: '⏳ Hesaplanıyor…',
        correctAnswer: 'Doğru Cevap:',
        diff: 'fark',
        tieBanner: '🤝 Beraberlik — Savunan Kazanır!',
        tieNote: 'Eşitlikte savunan kazanır',
        youWon: '🏆 Kazandın!',
        youLost: '😤 Kaybettin!',
        continueBtn: 'Devam Et',
        // ResultOverlay
        conqueredHeadline: '⚔️ Fethedildi!',
        defendedHeadline: '🛡️ Savunuldu!',
        deskConqueredHeadline: '⚔️ Sıra Fethedildi!',
        deskDefendedHeadline: '🛡️ Sıra Savunuldu!',
        pts: 'puan',
        // Game over
        allRegionsYours: 'Tüm Bölgeler Senin!',
        allDesksYours: 'Tüm Sıralar Senin!',
        eliminated: 'Elimine Edildin!',
        regionsControlled: 'bölgeye hükmediyorsun',
        desksControlled: 'sıraya hükmediyorsun',
        won: 'kazandı',
        playAgain: 'Tekrar Oyna',
        backToMenu: 'Ana Menüye Dön',
        // HUD badge
        claiming: '📍',
        regions: '🗺️',
        desks: '🪑',
    },
    en: {
        // HUD
        gameTitle: 'Know & Conquer',
        kidsGameTitle: '🏫 Conquer the Class!',
        langBtn: 'TR',
        // Claiming phase
        mapShare: 'Map Share',
        deskShare: 'Desk Share',
        round: 'Round',
        picksRegion: 'picks region',
        picksDesk: 'picks desk',
        // Selecting phase
        noMoves: 'No moves available…',
        noDeskMoves: 'No desks to move to…',
        takeNeutralOrAttack: 'Take neutral region or attack enemy',
        attackEnemy: 'Attack enemy region',
        takeDeskOrAttack: 'Take empty desk or attack enemy',
        attackDeskEnemy: 'Attack enemy desk',
        // Phase labels
        attackPhase: '⚔️ Attack:',
        guessPhase: '🎯 Guess Round:',
        deskSuffix: 'desk',
        conquered: 'conquered!',
        defended: 'defended!',
        deskConquered: 'desk conquered!',
        deskDefended: 'desk defended!',
        // Turn banners
        yourChoice: 'Your Pick',
        choosing: 'Choosing',
        yourTurn: 'Your Turn',
        sTurn: '\'s Turn',
        attackingDefend: 'is attacking — Defend!',
        // Legend / HUD
        you: 'You',
        neutral: 'Neutral',
        empty: 'Empty',
        // Bot turns
        botsPlaying: 'Bots playing…',
        playing: 'playing…',
        // BattleModal
        trueFalse: 'TRUE / FALSE',
        defenseBanner: '🛡️ DEFENSE MODE',
        target: 'Target:',
        score: 'Score:',
        swipeRight: 'True →',
        swipeLeft: '← False',
        // GuessingModal
        guessBadge: '🎯 GUESS ROUND',
        guessPlaceholder: 'Your guess…',
        submitGuess: 'Submit →',
        revealTitle: "Revealing opponent's guess…",
        calculating: '⏳ Calculating…',
        correctAnswer: 'Correct Answer:',
        diff: 'off',
        tieBanner: '🤝 Tie — Defender Wins!',
        tieNote: 'Defender wins on ties',
        youWon: '🏆 You Won!',
        youLost: '😤 You Lost!',
        continueBtn: 'Continue',
        // ResultOverlay
        conqueredHeadline: '⚔️ Conquered!',
        defendedHeadline: '🛡️ Defended!',
        deskConqueredHeadline: '⚔️ Desk Conquered!',
        deskDefendedHeadline: '🛡️ Desk Defended!',
        pts: 'pts',
        // Game over
        allRegionsYours: 'All Regions Yours!',
        allDesksYours: 'All Desks Yours!',
        eliminated: 'You\'re Eliminated!',
        regionsControlled: 'regions under your control',
        desksControlled: 'desks under your control',
        won: 'won',
        playAgain: 'Play Again',
        backToMenu: 'Back to Menu',
        // HUD badge
        claiming: '📍',
        regions: '🗺️',
        desks: '🪑',
    },
} as const;

export type GameStrings = typeof STRINGS.tr;
export type StringKey = keyof GameStrings;

export const t = (lang: Lang, key: StringKey): string =>
    (STRINGS[lang] as GameStrings)[key];

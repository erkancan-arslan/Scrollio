/**
 * Server-side Question Bank for Duel Mode
 *
 * Contains the same question data as the client to enable
 * server-side answer verification. Uses deterministic shuffling
 * with the same Fisher-Yates algorithm as the client.
 */
import * as crypto from 'crypto';

export interface DuelQuestion {
    id: number;
    type: string;
    question: string;
    answer: boolean;
    hint?: string;
}

// =====================================================
// Question Data (mirrors client infiniteFlowQuestions.ts)
// =====================================================

export const INFINITE_FLOW_QUESTIONS_ENGLISH: DuelQuestion[] = [
    { id: 1, type: 'true_false', question: 'Octopuses have 3 hearts.', answer: true },
    { id: 2, type: 'true_false', question: 'The Great Wall of China is visible from space.', answer: false },
    { id: 3, type: 'true_false', question: 'Bananas are berries.', answer: true },
    { id: 4, type: 'true_false', question: 'Goldfish have a 3-second memory.', answer: false },
    { id: 5, type: 'true_false', question: 'Lightning never strikes the same place twice.', answer: false },
    { id: 6, type: 'true_false', question: 'Sharks are mammals.', answer: false },
    { id: 7, type: 'true_false', question: 'Venus is the hottest planet in the solar system.', answer: true },
    { id: 8, type: 'true_false', question: 'Bats are blind.', answer: false },
    { id: 9, type: 'true_false', question: 'Humans share 50% of their DNA with bananas.', answer: true },
    { id: 10, type: 'true_false', question: "An ostrich's eye is bigger than its brain.", answer: true },
    { id: 11, type: 'true_false', question: 'Water makes up 90% of a cucumber.', answer: true },
    { id: 12, type: 'true_false', question: 'The Eiffel Tower can be 15 cm taller during the summer.', answer: true },
    { id: 13, type: 'true_false', question: 'Honey never spoils.', answer: true },
    { id: 14, type: 'true_false', question: 'A day on Venus is longer than a year on Venus.', answer: true },
    { id: 15, type: 'true_false', question: 'Tomatoes are vegetables.', answer: false },
    { id: 16, type: 'true_false', question: 'The shortest war in history lasted 38 minutes.', answer: true },
    { id: 17, type: 'true_false', question: 'Polar bear skin is black.', answer: true },
    { id: 18, type: 'true_false', question: 'Wombat poop is cube-shaped.', answer: true },
    { id: 19, type: 'true_false', question: 'The unicorn is the national animal of Scotland.', answer: true },
    { id: 20, type: 'true_false', question: 'Humans have 5 senses.', answer: false },
    { id: 21, type: 'true_false', question: 'Napoleon was short.', answer: false },
    { id: 22, type: 'true_false', question: 'Peanuts are nuts.', answer: false },
    { id: 23, type: 'true_false', question: 'Strawberries are berries.', answer: false },
    { id: 24, type: 'true_false', question: 'The moon has its own light.', answer: false },
    { id: 25, type: 'true_false', question: 'A jiffy is an actual unit of time.', answer: true },
    { id: 26, type: 'true_false', question: 'Cows sleep standing up.', answer: false },
    { id: 27, type: 'true_false', question: 'The heart of a shrimp is located in its head.', answer: true },
    { id: 28, type: 'true_false', question: 'It rains diamonds on Saturn and Jupiter.', answer: true },
    { id: 29, type: 'true_false', question: 'Humans can breathe and swallow at the same time.', answer: false },
    { id: 30, type: 'true_false', question: 'The Pacific Ocean is the largest ocean.', answer: true },
    { id: 31, type: 'true_false', question: 'Sound travels faster in water than in air.', answer: true },
    { id: 32, type: 'true_false', question: 'Mount Everest is the tallest mountain from base to peak.', answer: false },
    { id: 33, type: 'true_false', question: 'The human body has 206 bones.', answer: true },
    { id: 34, type: 'true_false', question: 'Vikings wore horned helmets.', answer: false },
    { id: 35, type: 'true_false', question: 'Sushi means raw fish.', answer: false },
    { id: 36, type: 'true_false', question: 'M&Ms stands for Mars and Murrie.', answer: true },
    { id: 37, type: 'true_false', question: 'The Statue of Liberty was a gift from Spain.', answer: false },
    { id: 38, type: 'true_false', question: 'Dolphins sleep with one eye open.', answer: true },
    { id: 39, type: 'true_false', question: 'Elephants are the only animals that cannot jump.', answer: true },
    { id: 40, type: 'true_false', question: 'Sloths take two weeks to digest their food.', answer: true },
    { id: 41, type: 'true_false', question: 'A sneeze travels at 100 mph.', answer: true },
    { id: 42, type: 'true_false', question: 'Australia is wider than the moon.', answer: true },
    { id: 43, type: 'true_false', question: 'Carrots help you see in the dark.', answer: false },
    { id: 44, type: 'true_false', question: 'The wood frog can freeze solid and live.', answer: true },
    { id: 45, type: 'true_false', question: 'There are more stars in the universe than grains of sand on Earth.', answer: true },
    { id: 46, type: 'true_false', question: 'Oxford University is older than the Aztec Empire.', answer: true },
    { id: 47, type: 'true_false', question: 'Blue whales are the largest animals ever known.', answer: true },
    { id: 48, type: 'true_false', question: 'A cockroach can live for weeks without its head.', answer: true },
    { id: 49, type: 'true_false', question: 'Human fingernails grow faster in the cold.', answer: false },
    { id: 50, type: 'true_false', question: 'A group of crows is called a murder.', answer: true },
    { id: 51, type: 'true_false', question: 'The fingerprints of a koala are virtually indistinguishable from humans.', answer: true },
    { id: 52, type: 'true_false', question: 'Hot water freezes faster than cold water.', answer: true },
    { id: 53, type: 'true_false', question: 'The longest river in the world is the Amazon.', answer: false },
    { id: 54, type: 'true_false', question: 'A cloud can weigh more than a million pounds.', answer: true },
    { id: 55, type: 'true_false', question: 'Cats always land on their feet.', answer: false },
    { id: 56, type: 'true_false', question: 'Chameleons change color to blend in.', answer: false },
    { id: 57, type: 'true_false', question: 'The total length of your blood vessels can circle the globe 2.5 times.', answer: true },
    { id: 58, type: 'true_false', question: 'Glass is a liquid.', answer: false },
    { id: 59, type: 'true_false', question: 'The sun is yellow.', answer: false },
    { id: 60, type: 'true_false', question: 'You can see the Great Wall of China from the moon.', answer: false },
    { id: 61, type: 'true_false', question: "A blue whale's tongue weighs as much as an elephant.", answer: true },
    { id: 62, type: 'true_false', question: 'Saltwater crocodiles have the strongest bite.', answer: true },
    { id: 63, type: 'true_false', question: 'Cleopatra lived closer to the moon landing than the building of the Great Pyramid.', answer: true },
    { id: 64, type: 'true_false', question: 'Saudi Arabia imports camels from Australia.', answer: true },
    { id: 65, type: 'true_false', question: 'The "funny bone" is a bone.', answer: false },
    { id: 66, type: 'true_false', question: 'Dead people continue to grow hair and nails.', answer: false },
    { id: 67, type: 'true_false', question: 'There are more fake flamingos than real ones.', answer: true },
    { id: 68, type: 'true_false', question: 'A strawberry has no seeds.', answer: false },
    { id: 69, type: 'true_false', question: 'Humans shed 40 pounds of skin in a lifetime.', answer: true },
    { id: 70, type: 'true_false', question: 'Baby rabbits are called kittens.', answer: true },
    { id: 71, type: 'true_false', question: 'The letter "J" is the only letter not in the periodic table.', answer: true },
    { id: 72, type: 'true_false', question: "A hippo's sweat is pink.", answer: true },
    { id: 73, type: 'true_false', question: 'The longest recorded flight of a chicken is 13 seconds.', answer: true },
    { id: 74, type: 'true_false', question: 'Earth is the only planet not named after a god.', answer: true },
    { id: 75, type: 'true_false', question: 'Bangkok is the hottest city in the world.', answer: true },
    { id: 76, type: 'true_false', question: 'A coin dropped from the Empire State Building can kill someone.', answer: false },
    { id: 77, type: 'true_false', question: 'Birds are dinosaurs.', answer: true },
    { id: 78, type: 'true_false', question: 'The oldest "your mom" joke was discovered on a 3,500 year old Babylonian tablet.', answer: true },
    { id: 79, type: 'true_false', question: 'Ketchup was once sold as medicine.', answer: true },
    { id: 80, type: 'true_false', question: 'A nanosecond is one billionth of a second.', answer: true },
    { id: 81, type: 'true_false', question: 'The Spanish flu originated in Spain.', answer: false },
    { id: 82, type: 'true_false', question: 'The first person convicted of speeding was going 8 mph.', answer: true },
    { id: 83, type: 'true_false', question: 'Most WASABI paste is just horseradish.', answer: true },
    { id: 84, type: 'true_false', question: 'You can sneeze in your sleep.', answer: false },
    { id: 85, type: 'true_false', question: 'Astronauts can accept delivery pizzas in space.', answer: true },
    { id: 86, type: 'true_false', question: 'The moon is moving away from Earth.', answer: true },
    { id: 87, type: 'true_false', question: 'Diamonds are the hardest known natural material.', answer: true },
    { id: 88, type: 'true_false', question: 'Cashews grow on apples.', answer: true },
    { id: 89, type: 'true_false', question: 'A blob of toothpaste is called a nurdle.', answer: true },
    { id: 90, type: 'true_false', question: 'Only female mosquitoes bite.', answer: true },
    { id: 91, type: 'true_false', question: 'The average person spends 6 months of their life waiting for red lights.', answer: true },
    { id: 92, type: 'true_false', question: 'Your nose and ears never stop growing.', answer: true },
    { id: 93, type: 'true_false', question: 'A snail can sleep for 3 years.', answer: true },
    { id: 94, type: 'true_false', question: 'Coca-Cola was originally green.', answer: false },
    { id: 95, type: 'true_false', question: 'Bulls are angered by the color red.', answer: false },
    { id: 96, type: 'true_false', question: 'The inventor of the Pringles can is buried in one.', answer: true },
    { id: 97, type: 'true_false', question: 'Neil Armstrong was the first person to pee on the moon.', answer: false },
    { id: 98, type: 'true_false', question: 'An octopus has 9 brains.', answer: true },
    { id: 99, type: 'true_false', question: 'Avocados are poisonous to birds.', answer: true },
    { id: 100, type: 'true_false', question: 'There are no muscles in your fingers.', answer: true },
    { id: 101, type: 'true_false', question: "The world's oldest wooden wheel has been around for more than 5,000 years.", answer: true },
    { id: 102, type: 'true_false', question: 'Nintendo was founded while the Ottoman Empire still existed.', answer: true },
    { id: 103, type: 'true_false', question: 'Killer Whales (Orcas) are actually dolphins.', answer: true },
    { id: 104, type: 'true_false', question: 'France shares its longest border with Spain.', answer: false },
    { id: 105, type: 'true_false', question: 'The "hashtag" symbol is technically called an Octothorpe.', answer: true },
    { id: 106, type: 'true_false', question: 'Humans have unique tongue prints.', answer: true },
    { id: 107, type: 'true_false', question: 'A standard golf ball has 336 dimples.', answer: true },
    { id: 108, type: 'true_false', question: 'The Mona Lisa has no eyebrows.', answer: true },
    { id: 109, type: 'true_false', question: 'Russia has a larger surface area than Pluto.', answer: true },
    { id: 110, type: 'true_false', question: 'High heels were originally created for men.', answer: true },
    { id: 111, type: 'true_false', question: 'Peacocks are male.', answer: true },
    { id: 112, type: 'true_false', question: 'The first computer bug was a literal moth.', answer: true },
    { id: 113, type: 'true_false', question: 'T-Rex lived closer in time to iPhones than to the Stegosaurus.', answer: true },
    { id: 114, type: 'true_false', question: 'A duel between three people is called a truel.', answer: true },
    { id: 115, type: 'true_false', question: 'Honeybees can recognize human faces.', answer: true },
    { id: 116, type: 'true_false', question: 'The dot over the letter "i" is called a tittle.', answer: true },
    { id: 117, type: 'true_false', question: 'McDonalds once created bubblegum-flavored broccoli.', answer: true },
    { id: 118, type: 'true_false', question: 'There are more fake flamingos in the world than real ones.', answer: true },
    { id: 119, type: 'true_false', question: 'A day on Mars is the same length as a day on Earth.', answer: false },
    { id: 120, type: 'true_false', question: 'Paper can only be folded in half 7 times.', answer: false },
    { id: 121, type: 'true_false', question: 'Sea otters hold hands when they sleep.', answer: true },
    { id: 122, type: 'true_false', question: 'Dr. Seuss invented the word "nerd".', answer: true },
    { id: 123, type: 'true_false', question: 'Venus is the only planet that spins clockwise.', answer: true },
    { id: 124, type: 'true_false', question: 'Your stomach acid is strong enough to dissolve razor blades.', answer: true },
    { id: 125, type: 'true_false', question: 'Frankenstein was the name of the monster.', answer: false },
    { id: 126, type: 'true_false', question: 'Tigers have striped skin, not just striped fur.', answer: true },
    { id: 127, type: 'true_false', question: 'The national flag of Nepal is the only non-rectangular flag.', answer: true },
    { id: 128, type: 'true_false', question: 'Humans are bioluminescent (we glow).', answer: true },
    { id: 129, type: 'true_false', question: 'Chocolate milk comes from brown cows.', answer: false },
    { id: 130, type: 'true_false', question: 'The shortest commercial flight in the world is 57 seconds.', answer: true },
];

// Turkish questions share the same IDs and answers — only the question text differs.
// For server-side verification we only need the answer (boolean), which is identical.
// So we use the English set as the canonical answer key.

// =====================================================
// Deterministic Shuffle (Fisher-Yates with seeded PRNG)
// =====================================================

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Produces the same sequence for the same seed.
 */
function seededRandom(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Deterministic Fisher-Yates shuffle using a seeded PRNG.
 */
export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const newArr = [...array];
    const random = seededRandom(seed);
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

/**
 * Get shuffled questions for a duel match.
 */
export function getShuffledQuestions(seed: number): DuelQuestion[] {
    return shuffleWithSeed(INFINITE_FLOW_QUESTIONS_ENGLISH, seed);
}

/**
 * Get the correct answer for a specific question index given a seed.
 */
export function getCorrectAnswer(seed: number, questionIndex: number): boolean | null {
    const questions = getShuffledQuestions(seed);
    if (questionIndex < 0 || questionIndex >= questions.length) return null;
    return questions[questionIndex].answer;
}

/**
 * Get total number of questions available.
 */
export function getTotalQuestions(): number {
    return INFINITE_FLOW_QUESTIONS_ENGLISH.length;
}

/**
 * Compute a content hash for the question bank (for version verification).
 */
export function getBankVersion(): string {
    const content = INFINITE_FLOW_QUESTIONS_ENGLISH
        .map(q => `${q.id}:${q.answer}`)
        .join(',');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

export const QUESTION_SET_ID = 'infinite_flow_en_v1';

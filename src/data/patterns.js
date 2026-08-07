/**
 * The pattern catalogue the Ready-to-Craft engine cross-references against the
 * yarn stash.
 *
 * `colors[].families` lists every colour family that can satisfy that slot, so
 * a pattern asking for a "dark base" is happy with black OR charcoal grey.
 * `skeins` is how many balls that slot eats, which is what makes the engine
 * able to say "you have blue, but only one ball and this needs two".
 */

export const SERIES = {
  valorant: { id: 'valorant', label: 'Valorant', accent: 'var(--ember)' },
  palworld: { id: 'palworld', label: 'Palworld', accent: 'var(--mint)' },
  gaming: { id: 'gaming', label: 'Gaming', accent: 'var(--violet)' },
  wearable: { id: 'wearable', label: 'Wearables', accent: 'var(--amber)' },
  bag: { id: 'bag', label: 'Bags', accent: 'var(--amber)' },
  home: { id: 'home', label: 'Home & Desk', accent: 'var(--tier-rare)' },
}

export const TIERS = {
  common: { id: 'common', label: 'Common', color: 'var(--tier-common)', rank: 0 },
  rare: { id: 'rare', label: 'Rare', color: 'var(--tier-rare)', rank: 1 },
  epic: { id: 'epic', label: 'Epic', color: 'var(--tier-epic)', rank: 2 },
  legendary: { id: 'legendary', label: 'Legendary', color: 'var(--tier-legendary)', rank: 3 },
}

const p = (id, name, series, tier, weight, hook, hours, blurb, colors, shape = 'critter') => ({
  id,
  name,
  series,
  tier,
  weight,
  hook,
  hours,
  blurb,
  colors,
  // Archetype silhouette for the thumbnail — see data/shapes.jsx
  shape,
})

export const PATTERNS = [
  /* ------------------------------------------------------------ Valorant -- */
  p('val-tactibear', 'Tactibear', 'valorant', 'legendary', 'DK', '3.0mm', 9,
    'The one everybody wants. Chunky little tactical bear with a strap loop.', [
      { role: 'Body', families: ['blue', 'teal'], skeins: 2 },
      { role: 'Muzzle & ears', families: ['cream', 'tan', 'white'], skeins: 1 },
      { role: 'Vest', families: ['black', 'grey'], skeins: 1 },
    ], 'critter'),
  p('val-doughnut', 'Doughnut Buddy', 'valorant', 'common', 'DK', '3.0mm', 2,
    'Two rounds, a glaze, and sprinkles. The classic first buddy.', [
      { role: 'Dough', families: ['tan', 'cream'], skeins: 1 },
      { role: 'Glaze', families: ['pink', 'purple'], skeins: 1 },
    ], 'ring'),
  p('val-polyfrog', 'Polyfrog', 'valorant', 'rare', 'DK', '3.0mm', 4,
    'Round green frog, permanently unimpressed.', [
      { role: 'Body', families: ['green', 'teal'], skeins: 1 },
      { role: 'Belly & eyes', families: ['cream', 'white'], skeins: 1 },
    ], 'critter'),
  p('val-spike', 'The Spike', 'valorant', 'rare', 'Worsted', '4.0mm', 5,
    'Plant it on the desk. Beeps not included.', [
      { role: 'Casing', families: ['black', 'grey'], skeins: 1 },
      { role: 'Core glow', families: ['red', 'orange'], skeins: 1 },
      { role: 'Panels', families: ['tan', 'cream'], skeins: 1 },
    ], 'bot'),
  p('val-sage', 'Sage Chibi', 'valorant', 'epic', 'DK', '3.0mm', 11,
    'Radianite-green robes, orb in hand, healing energy optional.', [
      { role: 'Robes', families: ['teal', 'green'], skeins: 2 },
      { role: 'Skin', families: ['tan', 'cream'], skeins: 1 },
      { role: 'Hair', families: ['black', 'brown'], skeins: 1 },
      { role: 'Trim', families: ['white', 'cream'], skeins: 1 },
    ], 'humanoid'),
  p('val-jett', 'Jett Chibi', 'valorant', 'epic', 'DK', '3.0mm', 11,
    'Windy girl. Scarf is the whole personality of the build.', [
      { role: 'Jacket', families: ['white', 'cream', 'grey'], skeins: 2 },
      { role: 'Scarf & accents', families: ['blue', 'teal'], skeins: 1 },
      { role: 'Skin', families: ['tan', 'cream'], skeins: 1 },
      { role: 'Hair', families: ['grey', 'white'], skeins: 1 },
    ], 'humanoid'),
  p('val-killjoy', 'Killjoy Chibi', 'valorant', 'epic', 'DK', '3.0mm', 12,
    'Beanie, glasses, and an alarmbot energy.', [
      { role: 'Jacket', families: ['yellow', 'orange'], skeins: 2 },
      { role: 'Beanie', families: ['blue', 'teal'], skeins: 1 },
      { role: 'Skin', families: ['tan', 'cream'], skeins: 1 },
      { role: 'Hair', families: ['brown', 'tan'], skeins: 1 },
    ], 'humanoid'),
  p('val-boombot', 'Raze Boom Bot', 'valorant', 'rare', 'DK', '3.0mm', 6,
    'Little orange menace with wheels and a grin.', [
      { role: 'Shell', families: ['orange', 'yellow'], skeins: 1 },
      { role: 'Face plate', families: ['blue', 'teal'], skeins: 1 },
      { role: 'Wheels', families: ['black', 'grey'], skeins: 1 },
    ], 'bot'),
  p('val-cypher-cam', 'Cypher Cam', 'valorant', 'common', 'DK', '3.0mm', 3,
    'Small, watching, slightly rude. Sticks to a shelf edge.', [
      { role: 'Body', families: ['white', 'cream'], skeins: 1 },
      { role: 'Lens', families: ['blue', 'teal'], skeins: 1 },
    ], 'bot'),
  p('val-omen', 'Omen Chibi', 'valorant', 'epic', 'DK', '3.0mm', 10,
    'Hooded shade with two glowing eyes and a lot of drape.', [
      { role: 'Cloak', families: ['purple', 'blue', 'black'], skeins: 2 },
      { role: 'Under-layer', families: ['grey', 'black'], skeins: 1 },
      { role: 'Eyes', families: ['white', 'cream'], skeins: 1 },
    ], 'humanoid'),
  p('val-sova-owl', 'Sova Owl Drone', 'valorant', 'rare', 'DK', '3.0mm', 6,
    'Recon owl, wings folded, permanently scanning the room.', [
      { role: 'Body', families: ['brown', 'tan'], skeins: 1 },
      { role: 'Face disc', families: ['cream', 'white'], skeins: 1 },
      { role: 'Tech accents', families: ['blue', 'teal'], skeins: 1 },
    ], 'bird'),
  p('val-gekko-wingman', 'Wingman', 'valorant', 'epic', 'DK', '3.0mm', 7,
    'Gekko’s little guy. Plants the spike, gets the credit.', [
      { role: 'Body', families: ['green', 'teal'], skeins: 1 },
      { role: 'Belly', families: ['yellow', 'cream'], skeins: 1 },
      { role: 'Eye', families: ['purple', 'pink'], skeins: 1 },
    ], 'critter'),

  /* ------------------------------------------------------------ Palworld -- */
  p('pal-lamball', 'Lamball', 'palworld', 'common', 'Chunky', '5.0mm', 4,
    'A sphere of wool with a face. Deeply huggable.', [
      { role: 'Fleece', families: ['cream', 'white'], skeins: 2 },
      { role: 'Face & feet', families: ['tan', 'brown'], skeins: 1 },
    ], 'critter'),
  p('pal-cattiva', 'Cattiva', 'palworld', 'common', 'DK', '3.0mm', 5,
    'Purple cat, permanently mid-scheme.', [
      { role: 'Body', families: ['purple', 'pink'], skeins: 1 },
      { role: 'Belly & muzzle', families: ['cream', 'white'], skeins: 1 },
    ], 'critter'),
  p('pal-chikipi', 'Chikipi', 'palworld', 'common', 'DK', '3.0mm', 3,
    'Chicken. Round. Lays eggs, causes problems.', [
      { role: 'Body', families: ['white', 'cream'], skeins: 1 },
      { role: 'Comb & beak', families: ['red', 'orange', 'yellow'], skeins: 1 },
    ], 'bird'),
  p('pal-foxparks', 'Foxparks', 'palworld', 'rare', 'DK', '3.0mm', 6,
    'Small fire fox with a suspiciously large tail.', [
      { role: 'Body', families: ['orange', 'red'], skeins: 1 },
      { role: 'Belly & tail tip', families: ['cream', 'white'], skeins: 1 },
      { role: 'Flame accents', families: ['yellow', 'orange'], skeins: 1 },
    ], 'critter'),
  p('pal-pengullet', 'Pengullet', 'palworld', 'common', 'DK', '3.0mm', 4,
    'Penguin shaped like a water balloon.', [
      { role: 'Body', families: ['blue', 'teal'], skeins: 1 },
      { role: 'Belly', families: ['white', 'cream'], skeins: 1 },
      { role: 'Beak & feet', families: ['orange', 'yellow'], skeins: 1 },
    ], 'bird'),
  p('pal-depresso', 'Depresso', 'palworld', 'rare', 'DK', '3.0mm', 5,
    'He is tired. He is coping. He is relatable.', [
      { role: 'Body', families: ['blue', 'purple', 'grey'], skeins: 1 },
      { role: 'Face', families: ['cream', 'white'], skeins: 1 },
      { role: 'Hair tuft', families: ['black', 'grey'], skeins: 1 },
    ], 'critter'),
  p('pal-grizzbolt', 'Grizzbolt', 'palworld', 'legendary', 'Chunky', '5.0mm', 14,
    'Enormous electric bear. Weekend-long build, worth every hour.', [
      { role: 'Fur', families: ['yellow', 'orange'], skeins: 3 },
      { role: 'Stripes', families: ['black', 'grey'], skeins: 1 },
      { role: 'Belly', families: ['cream', 'tan'], skeins: 1 },
    ], 'critter'),
  p('pal-cremis', 'Cremis', 'palworld', 'common', 'DK', '3.0mm', 4,
    'Cream-coloured bunny sheep. Extremely soft-looking.', [
      { role: 'Body', families: ['cream', 'white', 'tan'], skeins: 2 },
      { role: 'Inner ears', families: ['pink', 'red'], skeins: 1 },
    ], 'critter'),
  p('pal-daedream', 'Daedream', 'palworld', 'rare', 'DK', '3.0mm', 6,
    'Pink dream imp with a floaty little body.', [
      { role: 'Body', families: ['pink', 'purple'], skeins: 1 },
      { role: 'Horn & tail', families: ['cream', 'yellow'], skeins: 1 },
      { role: 'Wings', families: ['purple', 'blue'], skeins: 1 },
    ], 'critter'),
  p('pal-lifmunk', 'Lifmunk', 'palworld', 'common', 'DK', '3.0mm', 4,
    'Green squirrel guy. Leaf on head is mandatory.', [
      { role: 'Body', families: ['green', 'teal'], skeins: 1 },
      { role: 'Belly', families: ['cream', 'yellow'], skeins: 1 },
    ], 'critter'),
  p('pal-sparkit', 'Sparkit', 'palworld', 'common', 'DK', '3.0mm', 4,
    'Yellow static ferret. Slightly unhinged eyes.', [
      { role: 'Body', families: ['yellow', 'cream'], skeins: 1 },
      { role: 'Accents', families: ['orange', 'brown'], skeins: 1 },
    ], 'critter'),
  p('pal-vixy', 'Vixy', 'palworld', 'common', 'DK', '3.0mm', 5,
    'Small fox. Digs up things you needed.', [
      { role: 'Body', families: ['tan', 'orange', 'brown'], skeins: 1 },
      { role: 'Belly & tail tip', families: ['cream', 'white'], skeins: 1 },
    ], 'critter'),
  p('pal-anubis', 'Anubis', 'palworld', 'legendary', 'DK', '3.0mm', 15,
    'Tall, regal, gold-trimmed. The flex build.', [
      { role: 'Body', families: ['black', 'grey'], skeins: 2 },
      { role: 'Gold trim', families: ['yellow', 'orange'], skeins: 1 },
      { role: 'Under-fur', families: ['cream', 'tan'], skeins: 1 },
      { role: 'Eyes & detail', families: ['blue', 'teal'], skeins: 1 },
    ], 'humanoid'),
  p('pal-jetragon', 'Jetragon', 'palworld', 'legendary', 'Worsted', '4.0mm', 18,
    'The endgame mount, in yarn. Absurd. Do it anyway.', [
      { role: 'Body', families: ['red', 'pink'], skeins: 3 },
      { role: 'Underside', families: ['white', 'cream'], skeins: 1 },
      { role: 'Thruster accents', families: ['blue', 'teal'], skeins: 1 },
      { role: 'Detailing', families: ['black', 'grey'], skeins: 1 },
    ], 'critter'),

  /* -------------------------------------------------------------- Gaming -- */
  p('gam-mushroom', 'Power-Up Mushroom', 'gaming', 'common', 'Worsted', '4.0mm', 3,
    'Red cap, white spots, immediate serotonin.', [
      { role: 'Cap', families: ['red', 'green'], skeins: 1 },
      { role: 'Spots & stem', families: ['white', 'cream'], skeins: 1 },
    ], 'ball'),
  p('gam-dice-bag', 'Dice Bag', 'gaming', 'rare', 'Worsted', '3.5mm', 4,
    'Drawstring pouch. Holds dice, earbuds, or emotional damage.', [
      { role: 'Body', families: ['purple', 'blue', 'green'], skeins: 1 },
      { role: 'Drawstring & trim', families: ['cream', 'tan', 'yellow'], skeins: 1 },
    ], 'bag'),
  p('gam-controller-cozy', 'Controller Cozy', 'gaming', 'rare', 'Worsted', '4.0mm', 5,
    'Padded sleeve so the controller stops getting dinged in the bag.', [
      { role: 'Outer', families: ['black', 'grey', 'blue'], skeins: 1 },
      { role: 'Lining stripe', families: ['red', 'teal', 'yellow'], skeins: 1 },
    ], 'bag'),
  p('gam-heart-container', 'Heart Container', 'gaming', 'common', 'DK', '3.0mm', 2,
    'One extra hit point, hanging off a bag.', [
      { role: 'Heart', families: ['red', 'pink'], skeins: 1 },
      { role: 'Outline', families: ['black', 'grey', 'white'], skeins: 1 },
    ], 'heart'),
  p('gam-star-keychain', 'Star Keychain', 'gaming', 'common', 'DK', '3.0mm', 1,
    'Twenty minutes, instant win. Good for a slump day.', [
      { role: 'Star', families: ['yellow', 'orange', 'pink'], skeins: 1 },
    ], 'star'),
  p('gam-slime', 'Slime Plush', 'gaming', 'common', 'Worsted', '4.0mm', 3,
    'The friendliest possible first enemy.', [
      { role: 'Body', families: ['blue', 'green', 'teal'], skeins: 1 },
      { role: 'Face', families: ['black', 'white'], skeins: 1 },
    ], 'ball'),

  /* ----------------------------------------------------------- Wearables -- */
  p('wear-beanie', 'Ribbed Beanie', 'wearable', 'common', 'Worsted', '5.0mm', 4,
    'The everyday beanie. One ball, one evening, done.', [
      { role: 'Main', families: ['grey', 'black', 'cream', 'tan', 'pink', 'blue', 'green', 'purple', 'red'], skeins: 2 },
    ], 'hat'),
  p('wear-slouchy-beanie', 'Slouchy Beanie', 'wearable', 'common', 'Aran', '5.5mm', 5,
    'Extra length in the crown for the slouch.', [
      { role: 'Main', families: ['cream', 'tan', 'grey', 'purple', 'green', 'blue', 'pink'], skeins: 2 },
    ], 'hat'),
  p('wear-bucket-hat', 'Bucket Hat', 'wearable', 'rare', 'Worsted', '4.0mm', 6,
    'Stiff brim, tight stitch. Genuinely wearable outside.', [
      { role: 'Main', families: ['cream', 'tan', 'green', 'blue', 'black', 'pink'], skeins: 2 },
      { role: 'Brim contrast', families: ['white', 'cream', 'black', 'tan'], skeins: 1 },
    ], 'hat'),
  p('wear-scarf', 'Chunky Scarf', 'wearable', 'common', 'Chunky', '6.0mm', 6,
    'Long, warm, mindless rows. The podcast project.', [
      { role: 'Main', families: ['grey', 'cream', 'red', 'green', 'blue', 'purple', 'tan', 'pink'], skeins: 3 },
    ], 'scarf'),
  p('wear-scrunchie', 'Scrunchie', 'wearable', 'common', 'DK', '3.5mm', 1,
    'Scrap-buster. Makes a nice throw-in with a bigger gift.', [
      { role: 'Main', families: ['pink', 'purple', 'teal', 'yellow', 'cream', 'multi', 'blue', 'green', 'red', 'orange'], skeins: 1 },
    ], 'ring'),
  p('wear-headband', 'Twisted Headband', 'wearable', 'common', 'Worsted', '5.0mm', 2,
    'Ear-warmer with a twist at the front.', [
      { role: 'Main', families: ['cream', 'grey', 'pink', 'tan', 'purple', 'green', 'blue'], skeins: 1 },
    ], 'hat'),
  p('wear-fingerless', 'Fingerless Gloves', 'wearable', 'rare', 'DK', '4.0mm', 5,
    'For crocheting while cold, which is the point.', [
      { role: 'Main', families: ['grey', 'cream', 'purple', 'green', 'black', 'pink', 'blue'], skeins: 1 },
      { role: 'Cuff contrast', families: ['cream', 'white', 'black', 'tan'], skeins: 1 },
    ], 'mittens'),
  p('wear-mittens', 'Lined Mittens', 'wearable', 'rare', 'Aran', '5.0mm', 7,
    'Double-layer so they actually block wind.', [
      { role: 'Outer', families: ['red', 'grey', 'blue', 'green', 'cream', 'purple'], skeins: 2 },
      { role: 'Lining', families: ['cream', 'white', 'grey', 'tan'], skeins: 1 },
    ], 'mittens'),
  p('wear-cardigan', 'Granny Square Cardigan', 'wearable', 'legendary', 'Worsted', '4.5mm', 30,
    'The big one. Weeks of squares, then the seaming montage.', [
      { role: 'Squares A', families: ['cream', 'white', 'tan'], skeins: 4 },
      { role: 'Squares B', families: ['pink', 'red', 'purple', 'orange'], skeins: 2 },
      { role: 'Squares C', families: ['green', 'teal', 'blue'], skeins: 2 },
      { role: 'Border', families: ['black', 'grey', 'cream'], skeins: 2 },
    ], 'garment'),
  p('wear-crop-top', 'Summer Crop Top', 'wearable', 'epic', 'Sport', '3.5mm', 14,
    'Open stitch, drapes well, surprisingly quick once the yoke is set.', [
      { role: 'Main', families: ['cream', 'white', 'pink', 'teal', 'yellow', 'green'], skeins: 3 },
    ], 'garment'),

  /* ---------------------------------------------------------------- Bags -- */
  p('bag-tote', 'Everyday Tote', 'bag', 'rare', 'Worsted', '4.0mm', 9,
    'Sturdy base, long straps. Holds yarn for the next project.', [
      { role: 'Body', families: ['cream', 'tan', 'green', 'blue', 'black', 'pink'], skeins: 3 },
      { role: 'Straps & base', families: ['tan', 'brown', 'black', 'cream'], skeins: 1 },
    ], 'bag'),
  p('bag-market', 'Mesh Market Bag', 'bag', 'common', 'DK', '4.0mm', 4,
    'Stretches to swallow a whole grocery run.', [
      { role: 'Main', families: ['cream', 'tan', 'green', 'yellow', 'pink', 'teal'], skeins: 2 },
    ], 'bag'),
  p('bag-granny', 'Granny Square Bag', 'bag', 'rare', 'Worsted', '4.0mm', 8,
    'Six squares and a strap. The colour-play project.', [
      { role: 'Squares', families: ['pink', 'yellow', 'teal', 'purple', 'multi', 'orange', 'green'], skeins: 2 },
      { role: 'Joining & strap', families: ['black', 'cream', 'white', 'tan'], skeins: 1 },
    ], 'bag'),
  p('bag-phone-pouch', 'Phone Crossbody', 'bag', 'common', 'DK', '3.5mm', 3,
    'Just big enough for a phone, keys, and a card.', [
      { role: 'Body', families: ['pink', 'purple', 'teal', 'cream', 'black', 'blue'], skeins: 1 },
      { role: 'Strap', families: ['tan', 'brown', 'black', 'cream'], skeins: 1 },
    ], 'bag'),
  p('bag-laptop-sleeve', 'Laptop Sleeve', 'bag', 'rare', 'Aran', '4.5mm', 7,
    'Dense stitch with a folded flap. Fits a 13–14".', [
      { role: 'Body', families: ['grey', 'cream', 'green', 'blue', 'black'], skeins: 3 },
      { role: 'Flap contrast', families: ['tan', 'black', 'cream', 'red'], skeins: 1 },
    ], 'bag'),
  p('bag-project-bag', 'Yarn Project Bag', 'bag', 'common', 'Worsted', '4.0mm', 5,
    'Drawstring top with a yarn-feed grommet. Meta, but useful.', [
      { role: 'Body', families: ['cream', 'tan', 'teal', 'pink', 'grey'], skeins: 2 },
      { role: 'Drawstring', families: ['brown', 'black', 'cream', 'tan'], skeins: 1 },
    ], 'bag'),

  /* -------------------------------------------------------- Home & desk -- */
  p('home-coasters', 'Coaster Set (4)', 'home', 'common', 'Worsted', '4.0mm', 2,
    'Four in an evening. Great for using up half-balls.', [
      { role: 'Main', families: ['cream', 'tan', 'teal', 'grey', 'multi', 'pink', 'green'], skeins: 1 },
    ], 'blanket'),
  p('home-plant-hanger', 'Plant Hanger', 'home', 'common', 'Worsted', '4.0mm', 3,
    'Macramé-look hanger done in crochet chains.', [
      { role: 'Main', families: ['cream', 'tan', 'white'], skeins: 1 },
    ], 'bag'),
  p('home-blanket', 'Granny Stripe Blanket', 'home', 'legendary', 'Aran', '5.0mm', 40,
    'The months-long one. Put it on the sofa and never explain it.', [
      { role: 'Stripe A', families: ['cream', 'white', 'tan'], skeins: 4 },
      { role: 'Stripe B', families: ['teal', 'blue', 'green'], skeins: 3 },
      { role: 'Stripe C', families: ['pink', 'purple', 'red'], skeins: 3 },
    ], 'blanket'),
  p('home-pillow', 'Textured Cushion Cover', 'home', 'rare', 'Aran', '5.0mm', 10,
    'Bobble front, plain back, envelope closure.', [
      { role: 'Front', families: ['cream', 'tan', 'grey', 'teal', 'pink'], skeins: 3 },
      { role: 'Back', families: ['cream', 'grey', 'tan', 'white'], skeins: 2 },
    ], 'blanket'),
  p('home-mug-cozy', 'Mug Cozy', 'home', 'common', 'Worsted', '4.0mm', 1,
    'Twenty-minute win with a little wooden button.', [
      { role: 'Main', families: ['tan', 'cream', 'red', 'green', 'grey', 'teal'], skeins: 1 },
    ], 'bag'),
  p('home-desk-mat', 'Desk Mat', 'home', 'rare', 'Chunky', '6.0mm', 6,
    'Flat, dense rectangle. Makes the setup feel intentional.', [
      { role: 'Main', families: ['grey', 'cream', 'tan', 'green'], skeins: 3 },
      { role: 'Border', families: ['black', 'brown', 'teal', 'red'], skeins: 1 },
    ], 'blanket'),
  p('home-bowling-ball', 'Bowling Ball Plush', 'home', 'rare', 'Worsted', '4.0mm', 4,
    'Because obviously. Three finger holes, embroidered.', [
      { role: 'Ball', families: ['black', 'purple', 'blue', 'red'], skeins: 2 },
      { role: 'Finger holes', families: ['white', 'cream', 'grey'], skeins: 1 },
    ], 'ball'),
  p('home-bowling-pin', 'Bowling Pin Plush', 'home', 'common', 'Worsted', '4.0mm', 3,
    'Pairs with the ball. Makes a good tournament good-luck charm.', [
      { role: 'Pin', families: ['white', 'cream'], skeins: 1 },
      { role: 'Stripes', families: ['red', 'orange', 'pink'], skeins: 1 },
    ], 'pin'),
]

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((x) => [x.id, x]))

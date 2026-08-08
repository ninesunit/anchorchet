/**
 * Tab/rail destinations per role. `short` is used where space is tight.
 *
 * Ransoms are deliberately not here. They belong on each dashboard — hers is
 * the blurred card she walks past, his is the approval waiting for him — and a
 * seventh tab would squeeze the phone bar past the point where the labels stay
 * legible. /ransom exists as a route, reached from the dashboard card.
 *
 * Player 1's bar also carries the Anchor panic button, which is an action
 * rather than a destination, so it is appended by the shell rather than listed
 * here.
 */
export const NAV = {
  player1: [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/crochet', label: 'Crochet', icon: 'yarn' },
    { to: '/bowling', label: 'Bowling', icon: 'bowling' },
    { to: '/fame', label: 'Hall of Fame', short: 'Fame', icon: 'trophy' },
    { to: '/focus', label: 'Focus Mode', short: 'Focus', icon: 'music' },
  ],
  player2: [
    { to: '/', label: 'Anchor', icon: 'anchor', end: true },
    { to: '/quests', label: 'Quest Board', short: 'Quests', icon: 'quest' },
    { to: '/supply', label: 'Supply Drop', short: 'Supply', icon: 'cart' },
    { to: '/toolkit', label: 'Anchor Kit', short: 'Kit', icon: 'anchor' },
    { to: '/bowling', label: 'Her Bowling', short: 'Bowling', icon: 'bowling' },
    { to: '/fame', label: 'Hall of Fame', short: 'Fame', icon: 'trophy' },
  ],
}

export const SUBNAV = {
  // Four tabs, in this order. Quests live inside My Projects and the wishlist
  // lives inside Yarn Stash — one destination per thing she is actually doing,
  // rather than one per collection.
  '/crochet': [
    { to: '/crochet/projects', label: 'My Projects' },
    { to: '/crochet/craft', label: 'Ready to Craft' },
    { to: '/crochet/manual', label: 'Manual' },
    { to: '/crochet/stash', label: 'Yarn Stash' },
  ],
  '/bowling': [
    { to: '/bowling/sessions', label: 'Sessions' },
    { to: '/bowling/arsenal', label: 'Arsenal' },
    { to: '/bowling/calendar', label: 'Calendar' },
    { to: '/bowling/alley', label: 'The Alley' },
  ],
}

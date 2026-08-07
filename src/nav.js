/** Tab/rail destinations per role. `short` is used where space is tight. */
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
    { to: '/bowling', label: 'Her Bowling', short: 'Bowling', icon: 'bowling' },
    { to: '/fame', label: 'Hall of Fame', short: 'Fame', icon: 'trophy' },
  ],
}

export const SUBNAV = {
  '/crochet': [
    { to: '/crochet/quests', label: 'Quest Board' },
    { to: '/crochet/craft', label: 'Ready to Craft' },
    { to: '/crochet/projects', label: 'My Projects' },
    { to: '/crochet/stash', label: 'Yarn Stash' },
    { to: '/crochet/wishlist', label: 'Wishlist' },
  ],
  '/bowling': [
    { to: '/bowling/sessions', label: 'Sessions' },
    { to: '/bowling/arsenal', label: 'Arsenal' },
    { to: '/bowling/calendar', label: 'Calendar' },
    { to: '/bowling/alley', label: 'The Alley' },
  ],
}

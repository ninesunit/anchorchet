/**
 * Starter content for demo mode, so the app is explorable the moment it boots
 * instead of showing six empty states. Never used once Firebase is configured.
 */

import { analyzeStitches } from './stitchAnalyzer'

const iso = (daysFromNow, hour = 19) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function seedDemoData() {
  return {
    users: {
      'demo-p1': {
        name: 'Player 1',
        role: 'player1',
        email: 'player1@anchorchet.app',
        avatar_url: '',
      },
      'demo-p2': {
        name: 'Player 2',
        role: 'player2',
        email: 'player2@anchorchet.app',
        avatar_url: '',
      },
    },

    yarn_stash: {
      y1: { color: 'Cobalt Blue', weight: 'DK', quantity: 3, status: 'in_stock', brand: 'Ricorumi', note: '' },
      y2: { color: 'Cream', weight: 'DK', quantity: 4, status: 'in_stock', brand: 'Ricorumi', note: 'Workhorse colour' },
      y3: { color: 'Charcoal Black', weight: 'DK', quantity: 2, status: 'in_stock', brand: 'Ricorumi', note: '' },
      y4: { color: 'Dusty Rose', weight: 'DK', quantity: 1, status: 'low', brand: 'Paintbox', note: '' },
      y5: { color: 'Mustard Yellow', weight: 'DK', quantity: 2, status: 'in_stock', brand: 'Paintbox', note: '' },
      y6: { color: 'Sage Green', weight: 'Worsted', quantity: 3, status: 'in_stock', brand: 'Stylecraft', note: '' },
      y7: { color: 'Off White', weight: 'Worsted', quantity: 2, status: 'in_stock', brand: 'Stylecraft', note: '' },
      y8: { color: 'Terracotta', weight: 'Worsted', quantity: 1, status: 'low', brand: 'Stylecraft', note: 'Running out fast' },
      y9: { color: 'Heather Grey', weight: 'Aran', quantity: 4, status: 'in_stock', brand: 'Drops', note: '' },
      y10: { color: 'Lavender', weight: 'DK', quantity: 0, status: 'empty', brand: 'Paintbox', note: 'Used it all on the bunny' },
      y11: { color: 'Deep Teal', weight: 'Worsted', quantity: 2, status: 'in_stock', brand: 'Drops', note: '' },
      y12: { color: 'Camel Tan', weight: 'Chunky', quantity: 2, status: 'in_stock', brand: 'Drops', note: '' },
    },

    crochet_quests: {
      q1: {
        title: '1x Blue Tactibear',
        pattern_id: 'val-tactibear',
        requested_by: 'Player 2',
        note: 'For my desk at work. Blue one, like the in-game buddy.',
        reward: 'Weekend dinner, your pick',
        status: 'in_progress',
        priority: 'high',
        reference_image_url: '',
        completion_photo_url: '',
        suggested_stitches: analyzeStitches('1x Blue Tactibear For my desk at work. Blue one, like the in-game buddy.'),
        date_requested: iso(-9, 21),
      },
      q2: {
        title: 'Lamball plush',
        pattern_id: 'pal-lamball',
        requested_by: 'Player 2',
        note: 'The round wool one. No notes, it is perfect.',
        reward: 'That bubble tea place, twice',
        status: 'pending',
        priority: 'normal',
        reference_image_url: '',
        completion_photo_url: '',
        suggested_stitches: analyzeStitches('Lamball plush The round wool one. No notes, it is perfect.'),
        date_requested: iso(-3, 22),
      },
      q3: {
        title: 'Beanie for the cold bowling alley',
        pattern_id: 'wear-beanie',
        requested_by: 'Player 2',
        note: 'Grey, ribbed. That place is freezing and you know it.',
        reward: 'I carry the ball bag all season',
        status: 'accepted',
        priority: 'normal',
        reference_image_url: '',
        completion_photo_url: '',
        suggested_stitches: analyzeStitches('Beanie for the cold bowling alley Grey, ribbed. That place is freezing and you know it.'),
        date_requested: iso(-1, 20),
      },
      q4: {
        title: 'Bowling pin plush',
        pattern_id: 'home-bowling-pin',
        requested_by: 'Player 2',
        note: 'Good luck charm for the bag. Small enough to clip on.',
        reward: 'Breakfast in bed',
        status: 'completed',
        priority: 'normal',
        reference_image_url: '',
        completion_photo_url: '',
        suggested_stitches: analyzeStitches('Bowling pin plush Good luck charm for the bag. Small enough to clip on.'),
        date_requested: iso(-24, 18),
        date_completed: iso(-11, 16),
      },
    },

    bowling_sessions: {
      s1: {
        type: 'training',
        date: iso(-16),
        location: 'Uni Lanes',
        game_scores: [152, 168, 149],
        series_total: 469,
        session_average: 156.3,
        note: 'Spare conversion was rough.',
      },
      s2: {
        type: 'training',
        date: iso(-11),
        location: 'Uni Lanes',
        game_scores: [171, 165, 183],
        series_total: 519,
        session_average: 173,
        note: '',
      },
      s3: {
        type: 'tournament',
        date: iso(-6),
        location: 'Sunway Megalanes',
        game_scores: [188, 201, 177, 195],
        series_total: 761,
        session_average: 190.3,
        note: 'Inter-uni round 1. Held it together in game 4.',
      },
      s4: {
        type: 'training',
        date: iso(-2),
        location: 'Uni Lanes',
        game_scores: [196, 212, 184],
        series_total: 592,
        session_average: 197.3,
        note: 'That 212 felt effortless.',
      },
    },

    tournament_calendar: {
      c1: {
        title: 'Inter-Uni Round 2',
        date: iso(9, 9),
        location: 'Sunway Megalanes',
        call_time: '08:00',
        notes: 'Squad B. Bring the spare wrist support.',
      },
      c2: {
        title: 'Friendly vs. Engineering',
        date: iso(23, 15),
        location: 'Uni Lanes',
        call_time: '14:30',
        notes: '',
      },
      c3: {
        title: 'National Qualifiers',
        date: iso(48, 8),
        location: 'Ampang Bowl',
        call_time: '07:00',
        notes: 'The big one.',
      },
    },

    hall_of_fame: {
      h1: {
        title: 'Bowling pin plush',
        quest_id: 'q4',
        kind: 'finished',
        caption: 'First finished quest. Took three evenings.',
        image_url: '',
        uploaded_by: 'player1',
        created_at: iso(-11, 17),
      },
      h2: {
        title: 'Bowling pin plush',
        quest_id: 'q4',
        kind: 'in_use',
        caption: 'It lives on my bag now. Everyone at practice has asked about it.',
        image_url: '',
        uploaded_by: 'player2',
        created_at: iso(-8, 12),
      },
    },

    hype_events: {},
  }
}

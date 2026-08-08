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


/** 0.1s of silence — enough for a play button to do something in the demo. */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA='

/** Flat-colour placeholders so the demo shows the blur without shipping photos. */
const swatch = (hex) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${hex}"/><circle cx="200" cy="130" r="60" fill="rgba(255,255,255,0.35)"/><rect x="120" y="205" width="160" height="22" rx="11" fill="rgba(255,255,255,0.3)"/></svg>`
  )}`

const RANSOM_PHOTO = swatch('#e0684f')
const RANSOM_PHOTO_2 = swatch('#5b8ea8')
const PROOF_PHOTO = swatch('#6f9c7a')

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

    /**
     * A tiny silent WAV, so the demo has something to press play on without
     * shipping a real recording of anybody. Real notes are recorded in-app.
     */
    breathing_audios: {
      ba1: {
        title: 'Just breathe with me',
        audio_url: SILENT_WAV,
        kind: 'grounding',
        duration_sec: 12,
        created_at: iso(-6, 21),
      },
      ba2: {
        title: "You're safe, nothing is on fire",
        audio_url: SILENT_WAV,
        kind: 'grounding',
        duration_sec: 18,
        created_at: iso(-4, 22),
      },
      ba3: {
        title: 'Three things then stop',
        audio_url: SILENT_WAV,
        kind: 'lifeline',
        duration_sec: 9,
        created_at: iso(-3, 20),
      },
    },

    permission_slips: {
      ps1: { text: 'Do it terribly. 50% effort counts today.', created_at: iso(-5, 20) },
      ps2: {
        text: 'Just the sink. Not the counters, not the floor. The sink.',
        created_at: iso(-2, 19),
      },
    },

    ransom_tasks: {
      rt1: {
        title: 'The dishes from Tuesday',
        description: 'Just the sink, the pans can wait.',
        anchor_photo_url: RANSOM_PHOTO,
        proof_photo_url: '',
        status: 'pending',
        is_revealed: false,
        created_at: iso(-2, 11),
      },
      rt2: {
        title: 'Laundry off the chair',
        description: '',
        anchor_photo_url: RANSOM_PHOTO_2,
        proof_photo_url: PROOF_PHOTO,
        status: 'submitted_for_approval',
        is_revealed: false,
        created_at: iso(-4, 15),
        submitted_at: iso(-1, 18),
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

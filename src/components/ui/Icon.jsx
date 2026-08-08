import { cx } from '../../lib/utils'

/** Single-path 24x24 stroke icons, so the whole set costs one component. */
const PATHS = {
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-8.5Z',
  quest:
    'M7 4h9l4 4v12H7V4Zm9 0v4h4M10 12h7M10 16h7',
  // Ball of yarn: the winding lines have to be *arcs*, not straight chords, or
  // the glyph reads as a "prohibited" sign at tab-bar size.
  yarn: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.6 3.7a13.5 13.5 0 0 1 6.8 15.6M4.1 15.3A13.5 13.5 0 0 1 18.4 5.6M17.9 18.4 21 21.5',
  bowling:
    'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm-2.2 5.2h.01M13 7.6h.01M12.6 11h.01',
  trophy:
    'M7 4h10v4a5 5 0 0 1-10 0V4Zm10 1h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3m5 4v3m-3 3h6',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  cart: 'M3 4h2l2.2 10.4a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L20 7H6m3.5 12.5h.01m7-.01h.01',
  anchor:
    'M12 8v13m0 0c-4 0-7-3-7-7m7 7c4 0 7-3 7-7M12 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-8 6H2m20 0h-2M8.5 11h7',
  plus: 'M12 5v14M5 12h14',
  calendar: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm0 4h16M8 3v4m8-4v4',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a8 8 0 0 0-2.2-1.3L15 3H9l-.3 2.4a8 8 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a8.2 8.2 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 2.2 1.3L9 21h6l.3-2.4a8 8 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.07-.43.1-.86.1-1.3Z',
  check: 'm5 13 4 4L19 7',
  flame:
    'M12 2.5c4 4.5 6 7.3 6 10.5a6 6 0 0 1-12 0c0-2 .8-3.7 2-5.1.1 1.3.8 2.3 1.8 2.3 1.5 0 2.2-1.6 2.2-7.7Z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Zm4 8.5a2 2 0 0 0 4 0',
  chevron: 'm9 6 6 6-6 6',
  chevronDown: 'm6 9 6 6 6-6',
  back: 'm15 6-6 6 6 6',
  sparkle: 'M12 3v6m0 6v6m9-9h-6m-6 0H3m13.5-4.5-3 3m-5 5-3 3m11 0-3-3m-5-5-3-3',
  edit: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z',
  trash: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13',
  logout: 'M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h11',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-14v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM16 16l5 5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3.5 2',
  image: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm0 10 4.5-4.5L13 16m-2-2 2.5-2.5L20 18m-4.5-8.5h.01',
  pin: 'M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  share:
    'M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  // Rounded play triangle inside a rounded frame — reads as "video" at 16px,
  // where a bare triangle just looks like a stray chevron.
  play: 'M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7Zm7 1.8v6.4a.6.6 0 0 0 .92.5l4.8-3.2a.6.6 0 0 0 0-1l-4.8-3.2a.6.6 0 0 0-.92.5Z',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Zm0 15A2.5 2.5 0 0 0 6.5 23H19v-5M9 7.5h6M9 11h4',
  close: 'M6 6l12 12M18 6L6 18',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm7 9a7 7 0 0 1-14 0m7 7v3m-3 0h6',
  stop: 'M7 7h10v10H7z',
  play2: 'M8 5.5v13a.6.6 0 0 0 .93.5l9.5-6.5a.6.6 0 0 0 0-1L8.93 5a.6.6 0 0 0-.93.5Z',
  pause: 'M9 5v14M15 5v14',
  volume: 'M4 9.5h3L11.5 6v12L7 14.5H4v-5Zm11.5-1a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13',
  volumeOff: 'M4 9.5h3L11.5 6v12L7 14.5H4v-5Zm12-1 5 5m0-5-5 5',
  lock: 'M6.5 10.5V8a5.5 5.5 0 0 1 11 0v2.5M5 10.5h14a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1Zm7 4.5v2.5',
  unlock: 'M6.5 10.5V8a5.5 5.5 0 0 1 10.6-2M5 10.5h14a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1Zm7 4.5v2.5',
  // Life ring — the Executive Dysfunction Lifeline. Drawn rather than the 🛟
  // emoji so it inherits colour and never renders as a tofu box.
  lifeline:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-8V3m0 18v-5M8 12H3m18 0h-5M9.2 9.2 5.6 5.6m12.8 12.8-3.6-3.6M9.2 14.8l-3.6 3.6M18.4 5.6l-3.6 3.6',
  phone:
    'M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6L16.5 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z',
  note: 'M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15Zm3.5 3.5h7m-7 4h7m-7 4h4',
}

export function Icon({ name, className, size = 20, filled = false, strokeWidth = 1.7 }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      className={cx('shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

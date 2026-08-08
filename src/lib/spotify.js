/**
 * Spotify link handling.
 *
 * Nothing here talks to the Spotify API and nothing here needs a key. The
 * embed player is a plain iframe against a public URL — a client ID would only
 * be needed to *read* someone's library or drive playback with the Web
 * Playback SDK, neither of which this app does. A client secret in particular
 * must never come near this file: Vite inlines everything it can reach into the
 * bundle, which ships to the browser.
 */

/** Media types Spotify will render in an embed. */
const KINDS = 'playlist|album|track|artist|episode|show'

/**
 * Pull the type and id out of any Spotify link or URI.
 *
 * Handles the three shapes that actually get pasted: the share URL with its
 * `?si=` tracking parameter, the locale-prefixed URL Spotify hands out in some
 * regions (`/intl-de/playlist/...`), and the `spotify:playlist:ID` URI you get
 * from the desktop app with alt held down.
 *
 * @param {string} input
 * @returns {{kind:string, id:string, embedUrl:string, canonicalUrl:string}|null}
 */
export function parseSpotifyUrl(input) {
  if (!input) return null
  const text = String(input).trim()

  const uri = text.match(new RegExp(`^spotify:(${KINDS}):([A-Za-z0-9]+)`))
  if (uri) return describe(uri[1], uri[2])

  // The optional `embed/` segment is what makes this idempotent — feeding an
  // already-converted URL back in has to return the same thing, or a saved
  // document re-read through the converter would come out null.
  const url = text.match(
    new RegExp(
      `open\\.spotify\\.com/(?:intl-[a-z-]+/)?(?:embed(?:-podcast)?/)?(${KINDS})/([A-Za-z0-9]+)`
    )
  )
  if (url) return describe(url[1], url[2])

  return null
}

function describe(kind, id) {
  return {
    kind,
    id,
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
    canonicalUrl: `https://open.spotify.com/${kind}/${id}`,
  }
}

/**
 * Share URL in, embed URL out.
 *
 * The bug this exists for: a share URL dropped straight into an iframe `src`
 * renders Spotify's own "Page not found" inside the player, because
 * `/playlist/ID` is a web page and only `/embed/playlist/ID` is a player. The
 * `?si=` tracking parameter has to go too.
 *
 *   in   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=123
 *   out  https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M
 *
 * Already-embed URLs pass through unchanged, so running it twice is safe.
 *
 * @param {string} url
 * @returns {string|null} null when the input is not a Spotify link at all
 */
export function convertSpotifyUrlToEmbed(url) {
  return parseSpotifyUrl(url)?.embedUrl ?? null
}

/**
 * The `src` the iframe actually gets: the stored embed URL plus Spotify's own
 * player parameters. Kept separate from the stored value so the theme can
 * change without rewriting every saved document.
 */
export function embedSrc(embedUrl) {
  if (!embedUrl) return null
  return `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}utm_source=generator&theme=0`
}

/**
 * Personalised playlists cannot be embedded.
 *
 * Spotify's `37i9dQZF1E…` range is the per-account stuff — Daylist, your Mixes,
 * Discover Weekly. They resolve fine in the app and 404 inside an iframe for
 * everyone, including their owner, which looks exactly like a broken app rather
 * than a Spotify restriction. Editorial playlists (`37i9dQZF1DX…`) and anything
 * a person made are fine. Worth warning about at paste time rather than letting
 * her save it and wonder why the box is empty.
 */
export function isLikelyUnembeddable(parsed) {
  return parsed?.kind === 'playlist' && parsed.id.startsWith('37i9dQZF1E')
}

/** Fallback label when she does not name it. */
export function defaultTitle(kind) {
  if (!kind) return 'Playlist'
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

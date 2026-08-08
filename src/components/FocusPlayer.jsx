import { useEffect, useState } from 'react'

import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Chip, ChipRow, Field, Input } from './ui/Field'
import { Icon } from './ui/Icon'
import { Modal } from './ui/Modal'
import { useData } from '../context/DataContext'
import {
  convertSpotifyUrlToEmbed,
  defaultTitle,
  embedSrc,
  isLikelyUnembeddable,
  parseSpotifyUrl,
} from '../lib/spotify'
import { cx } from '../lib/utils'

/** Where playlists used to live, before they moved to Firestore. */
const LEGACY_KEY = 'anchorchet.playlists'

/**
 * One-time lift of locally-saved playlists into the shared collection.
 *
 * They were in localStorage on the theory that a playlist list is not something
 * Player 2 needs to see. That was the wrong call for the wrong reason: it also
 * meant a playlist saved on her phone did not exist on her iPad, which reads as
 * "saving is broken". Anything already stored is migrated once and the key is
 * dropped, so nothing she saved is lost on the way over.
 */
function useLegacyMigration(playlists, addFocusPlaylist, ready) {
  useEffect(() => {
    if (!ready) return
    let raw
    try {
      raw = localStorage.getItem(LEGACY_KEY)
    } catch {
      return // private mode
    }
    if (raw === null) return

    let saved = []
    try {
      saved = JSON.parse(raw) || []
    } catch {
      saved = []
    }

    // Clear the key first: a failed write should not leave this retrying on
    // every mount and duplicating rows.
    try {
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      /* ignore */
    }

    for (const item of saved) {
      const embed = convertSpotifyUrlToEmbed(item.embed || item.url || '')
      if (!embed) continue
      if (playlists.some((p) => p.embed_url === embed)) continue
      addFocusPlaylist({
        title: item.name || defaultTitle(item.kind),
        original_url: item.embed || '',
        embed_url: embed,
      })
    }
    // Intentionally runs once per mount-with-data; the key removal above is
    // what actually makes it a one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])
}

/** Search links always resolve, unlike guessed playlist IDs. */
const VIBES = [
  { label: 'Valorant OST', q: 'valorant original soundtrack' },
  { label: 'Valorant lobby', q: 'valorant lobby music' },
  { label: 'Palworld OST', q: 'palworld soundtrack' },
  { label: 'Cozy lofi', q: 'cozy lofi crochet' },
  { label: 'Game OST focus', q: 'video game music focus' },
  { label: 'Hyperpop warmup', q: 'hype warm up mix' },
]

/**
 * @param {'full'|'compact'} variant  compact = collapsible strip for the
 *   Crochet and Bowling screens; full = the Focus Mode tab.
 */
export function FocusPlayer({ variant = 'full', className }) {
  const { focusPlaylists, addFocusPlaylist, removeFocusPlaylist, ready } = useData()
  const [activeId, setActiveId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(variant === 'full')

  useLegacyMigration(focusPlaylists, addFocusPlaylist, ready)

  // Default to the first saved playlist, and follow along if it is deleted.
  useEffect(() => {
    if (focusPlaylists.length === 0) {
      setActiveId(null)
    } else if (!focusPlaylists.some((p) => p.id === activeId)) {
      setActiveId(focusPlaylists[0].id)
    }
  }, [focusPlaylists, activeId])

  const active = focusPlaylists.find((p) => p.id === activeId) || null

  async function save({ title, url }) {
    const parsed = parseSpotifyUrl(url)
    if (!parsed) return
    await addFocusPlaylist({
      title: title || defaultTitle(parsed.kind),
      original_url: url.trim(),
      embed_url: parsed.embedUrl,
    })
    setAdding(false)
  }

  if (variant === 'compact' && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          'no-select mb-5 flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left transition hover:border-border-strong',
          className
        )}
      >
        <Icon name="music" size={17} className="shrink-0 text-mint" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
          {active ? active.title : 'Focus Mode'}
        </span>
        <Icon name="chevronDown" size={16} className="shrink-0 text-faint" />
      </button>
    )
  }

  return (
    <div className={cx(variant === 'compact' && 'mb-5', className)}>
      {variant === 'compact' && (
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-faint">
            <Icon name="music" size={14} />
            Focus Mode
          </span>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Hide
          </Button>
        </div>
      )}

      {focusPlaylists.length > 0 && (
        <ChipRow className="mb-3">
          {focusPlaylists.map((p) => (
            <Chip key={p.id} active={p.id === activeId} onClick={() => setActiveId(p.id)}>
              {p.title}
            </Chip>
          ))}
          <Chip onClick={() => setAdding(true)}>
            <Icon name="plus" size={14} strokeWidth={2.4} />
            Add
          </Chip>
        </ChipRow>
      )}

      {active ? (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <iframe
              // Keyed so switching playlist swaps the player rather than trying
              // to navigate the existing one.
              key={active.id}
              title={active.title}
              src={embedSrc(active.embed_url)}
              width="100%"
              height={variant === 'compact' ? 152 : 352}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block"
            />
          </div>

          {variant === 'full' && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {active.original_url && (
                <Button
                  as="a"
                  variant="ghost"
                  size="sm"
                  href={active.original_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="share" size={15} />
                  Open in Spotify
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => removeFocusPlaylist(active.id)}>
                <Icon name="trash" size={15} />
                Remove &ldquo;{active.title}&rdquo;
              </Button>
            </div>
          )}

          {variant === 'full' && (
            <p className="mt-2 text-[12px] leading-snug text-faint">
              Player showing &ldquo;Page not found&rdquo;? That playlist is one Spotify made for
              you — Daylist, your Mixes, Discover Weekly. Those cannot be embedded by anyone,
              owner included. An editorial playlist or one you built yourself will work.
            </p>
          )}
        </>
      ) : (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint-soft text-mint">
              <Icon name="music" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">No playlist saved yet</p>
              <p className="mt-1 text-[13px] leading-snug text-muted">
                Paste a Spotify playlist link and it stays pinned to this screen — no app
                switching mid-round. Saved playlists sync to every device you are signed in on.
              </p>
              <Button variant="mint" size="sm" className="mt-3" onClick={() => setAdding(true)}>
                <Icon name="plus" size={16} />
                Add a playlist
              </Button>
            </div>
          </div>

          {variant === 'full' && (
            <div className="mt-4 border-t border-border pt-3.5">
              <p className="mb-2 text-[12px] font-semibold text-faint">
                Need one? Open a search in Spotify, then copy the playlist link back here.
              </p>
              <div className="flex flex-wrap gap-2">
                {VIBES.map((v) => (
                  <a
                    key={v.q}
                    href={`https://open.spotify.com/search/${encodeURIComponent(v.q)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[13px] font-semibold text-muted transition hover:text-text"
                  >
                    {v.label}
                    <Icon name="share" size={13} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <AddPlaylistModal open={adding} onClose={() => setAdding(false)} onSave={save} />
    </div>
  )
}

function AddPlaylistModal({ open, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)

  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setTitle('')
    setLink('')
  }
  if (!open && wasOpen) setWasOpen(false)

  const parsed = parseSpotifyUrl(link)
  const invalid = link.trim().length > 0 && !parsed
  const unembeddable = isLikelyUnembeddable(parsed)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a playlist"
      size="sm"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="mint"
            full
            loading={busy}
            disabled={!parsed}
            onClick={async () => {
              setBusy(true)
              await onSave({ title: title.trim(), url: link })
              setBusy(false)
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field
          label="Spotify link"
          hint="playlist, album, track or episode"
          error={invalid ? 'That does not look like a Spotify link.' : undefined}
          htmlFor="sp-link"
        >
          <Input
            id="sp-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://open.spotify.com/playlist/…"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="url"
          />
          {parsed && !unembeddable && (
            <p className="mt-1.5 text-[12px] font-semibold text-mint">
              {defaultTitle(parsed.kind)} link — ready to embed
            </p>
          )}
        </Field>

        {unembeddable && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber/45 bg-amber-soft/35 px-3.5 py-3">
            <Icon name="flame" size={16} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-[13px] leading-snug">
              <strong>This one will not play here.</strong> It is a playlist Spotify generated for
              your account — those cannot be embedded by anyone. Save it if you like, but pick an
              editorial playlist or one you made yourself if you want it in the app.
            </p>
          </div>
        )}

        <Field label="Name it" hint="optional" htmlFor="sp-name">
          <Input
            id="sp-name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Crochet hours"
          />
        </Field>

        <p className="rounded-xl bg-surface-2 px-3.5 py-3 text-[12px] leading-snug text-muted">
          In Spotify: <strong className="text-text">Share → Copy link to playlist</strong>. The
          <code className="mx-1 rounded bg-bg px-1 py-0.5 text-[11px]">?si=</code>
          on the end is fine, it gets stripped. Full tracks need you signed in to Spotify in this
          browser — otherwise the embed plays 30 second previews.
        </p>
      </div>
    </Modal>
  )
}

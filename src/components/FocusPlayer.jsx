import { useCallback, useEffect, useState } from 'react'

import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Chip, ChipRow, Field, Input } from './ui/Field'
import { Icon } from './ui/Icon'
import { Modal } from './ui/Modal'
import { cx } from '../lib/utils'

const KEY = 'anchorchet.playlists'

/**
 * Spotify links are personal, so the app ships with none and stores whatever
 * she saves locally rather than in Firestore — a playlist list is not data
 * Player 2 needs to see, and keeping it out of the shared DB means no extra
 * security rule.
 */
/**
 * Seeded on first run so Focus Mode is playing something out of the box.
 * Removing it sticks: an empty stored array is still a stored array, so the
 * default only comes back after a full reset.
 */
const DEFAULT_PLAYLISTS = [
  {
    id: 'default-focus',
    name: 'Focus',
    kind: 'playlist',
    embed: 'https://open.spotify.com/embed/playlist/37i9dQZF1EJCtsZ74SnoAi?utm_source=generator&theme=0',
  },
]

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    // A missing key means "never configured" — an empty array means "cleared".
    return raw === null ? DEFAULT_PLAYLISTS : JSON.parse(raw)
  } catch {
    return DEFAULT_PLAYLISTS
  }
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState(load)

  const persist = useCallback((next) => {
    setPlaylists(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* private mode */
    }
  }, [])

  return {
    playlists,
    add: (item) => persist([...playlists, { ...item, id: crypto.randomUUID() }]),
    remove: (id) => persist(playlists.filter((p) => p.id !== id)),
  }
}

/**
 * Turns any Spotify share link or URI into its embed form.
 * @returns {{embed:string,kind:string,id:string}|null}
 */
export function parseSpotify(input) {
  if (!input) return null
  const text = input.trim()

  // spotify:playlist:37i9dQ...
  const uri = text.match(/^spotify:(playlist|album|track|artist|episode|show):([A-Za-z0-9]+)/)
  if (uri) {
    return { kind: uri[1], id: uri[2], embed: buildEmbed(uri[1], uri[2]) }
  }

  // https://open.spotify.com/playlist/37i9dQ...?si=...
  // Also handles locale-prefixed links like /intl-de/playlist/...
  const url = text.match(
    /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/
  )
  if (url) {
    return { kind: url[1], id: url[2], embed: buildEmbed(url[1], url[2]) }
  }

  return null
}

function buildEmbed(kind, id) {
  return `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`
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
  const { playlists, add, remove } = usePlaylists()
  const [activeId, setActiveId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(variant === 'full')

  // Default to the first saved playlist, and follow along if it is deleted.
  useEffect(() => {
    if (playlists.length === 0) {
      setActiveId(null)
    } else if (!playlists.some((p) => p.id === activeId)) {
      setActiveId(playlists[0].id)
    }
  }, [playlists, activeId])

  const active = playlists.find((p) => p.id === activeId) || null

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
          {active ? active.name : 'Focus Mode'}
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

      {playlists.length > 0 && (
        <ChipRow className="mb-3">
          {playlists.map((p) => (
            <Chip key={p.id} active={p.id === activeId} onClick={() => setActiveId(p.id)}>
              {p.name}
            </Chip>
          ))}
          <Chip onClick={() => setAdding(true)}>
            <Icon name="plus" size={14} strokeWidth={2.4} />
            Add
          </Chip>
        </ChipRow>
      )}

      {active ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <iframe
            key={active.id}
            title={active.name}
            src={active.embed}
            width="100%"
            height={variant === 'compact' ? 152 : 352}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="block"
          />
        </div>
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
                switching mid-round.
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

      {active && variant === 'full' && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => remove(active.id)}
        >
          <Icon name="trash" size={15} />
          Remove &ldquo;{active.name}&rdquo;
        </Button>
      )}

      <AddPlaylistModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(item) => {
          add(item)
          setAdding(false)
        }}
      />
    </div>
  )
}

function AddPlaylistModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [link, setLink] = useState('')

  const parsed = parseSpotify(link)
  const invalid = link.trim().length > 0 && !parsed

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
            disabled={!parsed}
            onClick={() => {
              onAdd({
                name: name.trim() || defaultName(parsed.kind),
                embed: parsed.embed,
                kind: parsed.kind,
              })
              setName('')
              setLink('')
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
          hint="playlist, album or track"
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
        </Field>

        <Field label="Name it" hint="optional" htmlFor="sp-name">
          <Input
            id="sp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Crochet hours"
          />
        </Field>

        <p className="rounded-xl bg-surface-2 px-3.5 py-3 text-[12px] leading-snug text-muted">
          In Spotify: <strong className="text-text">Share → Copy link to playlist</strong>. Full
          tracks need you signed in to Spotify in this browser — otherwise the embed plays 30
          second previews.
        </p>
      </div>
    </Modal>
  )
}

function defaultName(kind) {
  return kind === 'album' ? 'Album' : kind === 'track' ? 'Track' : 'Playlist'
}

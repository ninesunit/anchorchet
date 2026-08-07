import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { StitchDiagram } from '../components/StitchDiagram'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, EmptyState, SectionTitle } from '../components/ui/Card'
import { Chip, ChipRow, Field, Input, Select } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  GLOSSARY,
  HOOK_CONVERSION,
  TUTORIAL_TIERS,
  TUTORIAL_TOPICS,
  YARN_HOOK_CHART,
  parseTutorialUrl,
  searchUrl,
} from '../data/manual'
import { cx, timeAgo } from '../lib/utils'

const SECTIONS = [
  { id: 'videos', label: 'Videos' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'sheets', label: 'Cheat sheets' },
]

export function Manual() {
  const [section, setSection] = useState('videos')

  return (
    <div className="animate-fade-up">
      <ChipRow className="mb-4">
        {SECTIONS.map((s) => (
          <Chip key={s.id} active={section === s.id} onClick={() => setSection(s.id)}>
            {s.label}
          </Chip>
        ))}
      </ChipRow>

      {section === 'videos' && <VideoLibrary />}
      {section === 'glossary' && <Glossary />}
      {section === 'sheets' && <CheatSheets />}
    </div>
  )
}

/* -------------------------------------------------------- video library -- */

function VideoLibrary() {
  const { tutorials, addTutorial, removeTutorial } = useData()
  const { isPlayer2, profile } = useAuth()

  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const dropped = tutorials.filter((t) => t.category === 'anchor_dropped')
  const byTier = (tier) => tutorials.filter((t) => t.category === tier)

  return (
    <div className="flex flex-col gap-7">
      <Card className="flex items-start gap-3 border-violet/35 bg-violet-soft/25 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet text-white">
          <Icon name="play" size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-bold">{isPlayer2 ? 'Drop her a tutorial' : 'Watch and relearn'}</p>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            {isPlayer2
              ? 'Paste a YouTube or TikTok link and it appears at the top of her library straight away.'
              : 'Anything Player 2 sends lands at the top. The topic links below open a search — no single video is baked in, so nothing here can go dead.'}
          </p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} />
            Drop a tutorial
          </Button>
        </div>
      </Card>

      {dropped.length > 0 && (
        <section>
          <SectionTitle>{TUTORIAL_TIERS.anchor_dropped.label} · {dropped.length}</SectionTitle>
          <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
            {dropped.map((t) => (
              <TutorialCard key={t.id} tutorial={t} onDelete={() => setConfirmDelete(t)} />
            ))}
          </div>
        </section>
      )}

      {['basics', 'stitches', 'amigurumi'].map((tier) => {
        const meta = TUTORIAL_TIERS[tier]
        const saved = byTier(tier)
        const topics = TUTORIAL_TOPICS.filter((t) => t.tier === tier)
        return (
          <section key={tier}>
            <SectionTitle>{meta.label}</SectionTitle>
            <p className="-mt-2 mb-3 text-[12px] text-faint">{meta.blurb}</p>

            {saved.length > 0 && (
              <div className="mb-3 flex flex-col gap-3 xl:grid xl:grid-cols-2">
                {saved.map((t) => (
                  <TutorialCard key={t.id} tutorial={t} onDelete={() => setConfirmDelete(t)} />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {topics.map((topic) => (
                <a
                  key={topic.q}
                  href={searchUrl(topic.q)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface px-3.5 transition hover:border-border-strong"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                    <Icon name="play" size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                    {topic.title}
                  </span>
                  <Icon name="share" size={15} className="shrink-0 text-faint" />
                </a>
              ))}
            </div>
          </section>
        )
      })}

      <DropTutorialModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={async (data) => {
          await addTutorial({ ...data, added_by: profile?.name || (isPlayer2 ? 'Anchor' : 'System') })
          setAdding(false)
        }}
        defaultCategory={isPlayer2 ? 'anchor_dropped' : 'basics'}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removeTutorial(confirmDelete.id)}
        title="Remove this tutorial?"
        body={`"${confirmDelete?.title}" comes off the list.`}
        confirmLabel="Remove"
      />
    </div>
  )
}

function TutorialCard({ tutorial, onDelete }) {
  const parsed = parseTutorialUrl(tutorial.media_url)
  const embeddable = parsed && (parsed.kind === 'youtube' || parsed.kind === 'tiktok')

  return (
    <Card className="overflow-hidden">
      {embeddable ? (
        <div className="aspect-video w-full bg-surface-2">
          <iframe
            src={parsed.embed}
            title={tutorial.title}
            className="size-full"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : parsed?.kind === 'media' ? (
        <img src={parsed.embed} alt={tutorial.title} className="w-full bg-surface-2 object-cover" />
      ) : null}

      <div className="flex items-center gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">{tutorial.title}</p>
          <p className="mt-0.5 text-[12px] text-faint">
            {tutorial.added_by ? `${tutorial.added_by} · ` : ''}
            {timeAgo(tutorial.date_added)}
          </p>
        </div>
        {!embeddable && tutorial.media_url && (
          <a
            href={tutorial.media_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[12px] font-bold text-muted"
          >
            Open
            <Icon name="share" size={13} />
          </a>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Remove tutorial">
          <Icon name="trash" size={16} />
        </Button>
      </div>
    </Card>
  )
}

/**
 * The Anchor's entry point, rendered on his dashboard.
 *
 * Same modal the library uses, lifted out so he never has to walk into her
 * workspace to send something — he pastes a link from wherever he found it and
 * it is at the top of her Manual before he has closed the sheet.
 */
export function DropTutorialCard() {
  const { tutorials, addTutorial } = useData()
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)

  const dropped = tutorials.filter((t) => t.category === 'anchor_dropped')
  const latest = dropped[0]

  return (
    <Card className="mt-6 flex items-start gap-3 border-violet/35 bg-violet-soft/25 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet text-white">
        <Icon name="play" size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-tight">Drop her a tutorial</p>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          {latest
            ? `Last one you sent: "${latest.title}" · ${timeAgo(latest.date_added)}`
            : 'Paste a YouTube or TikTok link and it lands at the top of her Crafter’s Manual.'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            <Icon name="plus" size={16} />
            Drop a tutorial
          </Button>
          {dropped.length > 0 && (
            <Button as={Link} to="/manual" variant="ghost" size="sm">
              {dropped.length} sent
              <Icon name="chevron" size={15} />
            </Button>
          )}
        </div>
      </div>

      <DropTutorialModal
        open={open}
        onClose={() => setOpen(false)}
        defaultCategory="anchor_dropped"
        onAdd={async (data) => {
          await addTutorial({ ...data, added_by: profile?.name || 'Anchor' })
          setOpen(false)
        }}
      />
    </Card>
  )
}

function DropTutorialModal({ open, onClose, onAdd, defaultCategory }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState(defaultCategory)
  const [busy, setBusy] = useState(false)

  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setTitle('')
    setUrl('')
    setCategory(defaultCategory)
  }
  if (!open && wasOpen) setWasOpen(false)

  const parsed = parseTutorialUrl(url)
  const invalid = url.trim().length > 0 && !parsed

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Drop a tutorial"
      subtitle="YouTube, TikTok, or a direct GIF"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            disabled={!title.trim() || !parsed}
            onClick={async () => {
              setBusy(true)
              await onAdd({
                title: title.trim(),
                media_url: url.trim(),
                media_type: parsed.kind === 'media' ? 'gif' : 'video',
                category,
              })
              setBusy(false)
            }}
          >
            Send it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Link" error={invalid ? 'Could not read that link.' : undefined} htmlFor="tut-url">
          <Input
            id="tut-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
          />
          {parsed && (
            <p className="mt-1.5 text-[12px] font-semibold text-mint">
              {parsed.kind === 'youtube'
                ? 'YouTube — will embed and play in the app'
                : parsed.kind === 'tiktok'
                  ? 'TikTok — will embed in the app'
                  : parsed.kind === 'media'
                    ? 'Direct media — will loop inline'
                    : 'Will open in a new tab'}
            </p>
          )}
        </Field>

        <Field label="What is it?" htmlFor="tut-title">
          <Input
            id="tut-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Magic ring, done really slowly"
            autoCapitalize="sentences"
          />
        </Field>

        <Field label="Section" htmlFor="tut-cat">
          <Select id="tut-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.values(TUTORIAL_TIERS).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------- glossary -- */

function Glossary() {
  const { glossary } = useData()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState('anatomy')

  // Firestore entries win over the built-ins with the same id, so a term can be
  // corrected or given a real GIF without touching the code.
  const merged = useMemo(() => {
    const custom = Object.fromEntries(glossary.map((g) => [g.id, g]))
    const base = GLOSSARY.map((g) => ({ ...g, ...custom[g.id] }))
    const extra = glossary.filter((g) => !GLOSSARY.some((b) => b.id === g.id))
    return [...base, ...extra]
  }, [glossary])

  const visible = merged.filter((g) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${g.abbreviation} ${g.full_name} ${g.description}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="relative mb-4">
        <Icon
          name="search"
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a term…"
          className="pl-10"
          type="search"
          autoCapitalize="none"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Icon name="search" size={28} />}
          title="No match"
          body="Try the abbreviation, like INV DEC or BLO."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((term) => {
            const expanded = open === term.id
            return (
              <Card key={term.id} className="overflow-hidden">
                <button
                  onClick={() => setOpen(expanded ? null : term.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-3 p-3.5 text-left"
                >
                  <span className="grid min-w-14 shrink-0 place-items-center rounded-lg bg-surface-2 px-2 py-1 text-[13px] font-extrabold tracking-tight">
                    {term.abbreviation}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold leading-tight">
                      {term.full_name}
                    </span>
                  </span>
                  {term.tier === 'amigurumi' && <Badge tone="violet">Ami</Badge>}
                  <Icon
                    name="chevronDown"
                    size={18}
                    className={cx('shrink-0 text-faint transition', expanded && 'rotate-180')}
                  />
                </button>

                {expanded && (
                  <div className="border-t border-border p-3.5">
                    <div className="mb-3 rounded-xl border border-border bg-surface-2/60 p-2">
                      {term.visual_url ? (
                        <img
                          src={term.visual_url}
                          alt={term.full_name}
                          className="mx-auto max-h-56 w-full object-contain"
                        />
                      ) : (
                        <StitchDiagram name={term.diagram} />
                      )}
                    </div>
                    <p className="text-[14px] leading-relaxed text-muted">{term.description}</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------- cheat sheets -- */

function CheatSheets() {
  return (
    <div className="flex flex-col gap-7">
      <section>
        <SectionTitle>Yarn weight → hook size</SectionTitle>
        <Card className="p-3.5">
          <div className="flex flex-col gap-2">
            {YARN_HOOK_CHART.map((w) => (
              <div key={w.n} className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-extrabold">
                  {w.n}
                </span>
                {/* strand thickness is the icon: the bar literally gets fatter */}
                <span className="flex w-12 shrink-0 justify-center">
                  <span
                    className="rounded-full bg-amber"
                    style={{ height: `${w.strand * 1.6}px`, width: '100%' }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold leading-tight">
                    {w.name}
                  </span>
                  <span className="block truncate text-[11px] text-faint">{w.also}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[14px] font-extrabold tabular-nums">
                    {w.mm[0]}–{w.mm[1]}
                  </span>
                  <span className="block text-[11px] text-faint">mm hook</span>
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 rounded-xl bg-amber-soft/40 px-3 py-2.5 text-[12px] leading-snug text-text">
            <strong>Amigurumi is the exception.</strong> Go one or two sizes{' '}
            <em>smaller</em> than the range above so the fabric is tight enough that stuffing
            cannot show through. Worsted at 3.5–4mm rather than 5.5–6.5mm is normal.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>Hook conversion · metric ↔ US</SectionTitle>
        <Card className="p-3.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {HOOK_CONVERSION.map((h) => (
              <div
                key={h.mm}
                className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/60 px-2.5 py-1.5"
              >
                <span className="flex items-center gap-1.5">
                  {/* the dot scales with the hook, so size is readable at a glance */}
                  <span
                    className="rounded-full bg-mint"
                    style={{ width: `${h.mm * 1.5}px`, height: `${h.mm * 1.5}px` }}
                  />
                  <span className="text-[13px] font-extrabold tabular-nums">{h.mm}</span>
                </span>
                <span className="text-[13px] font-bold text-muted">{h.us}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-snug text-faint">
            The two systems do not line up exactly — a US G/6 is 4.0mm in most brands but 4.25mm
            in a few. When a pattern gives both, trust the millimetres.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>Anatomy refresher</SectionTitle>
        <Card className="p-3.5">
          <StitchDiagram name="anatomy" />
          <p className="mt-2 text-center text-[12px] leading-snug text-faint">
            Unless the pattern says BLO or FLO, the hook goes under both halves of the V.
          </p>
        </Card>
      </section>
    </div>
  )
}

import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { StitchDiagram } from '../components/StitchDiagram'
import { StitchQuickView } from '../components/StitchQuickView'
import { StitchSymbol } from '../components/StitchSymbol'
import { Button } from '../components/ui/Button'
import { Card, EmptyState, SectionTitle } from '../components/ui/Card'
import { Chip, ChipRow, Field, Input, Segmented, Select } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  CHART_RULES,
  GROUPS,
  STITCHES,
  STITCHES_BY_ID,
  US_UK_TERMS,
} from '../data/crochetSymbols'
import {
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
  const [open, setOpen] = useState(null)
  const [dialect, setDialect] = useState('us')

  // Firestore entries win over the built-ins with the same id, so a term can be
  // corrected or given a real photo without touching the code.
  const merged = useMemo(() => {
    const custom = Object.fromEntries(glossary.map((g) => [g.id, g]))
    return STITCHES.map((s) => ({ ...s, ...custom[s.id] }))
  }, [glossary])

  const q = query.trim().toLowerCase()
  const visible = merged.filter((s) =>
    q
      ? `${s.abbr} ${s.name} ${s.uk?.abbr} ${s.uk?.name} ${s.how} ${s.use}`
          .toLowerCase()
          .includes(q)
      : true
  )

  return (
    <div className="flex flex-col gap-5">
      <ChartPrimer />

      <div>
        <div className="mb-3 flex gap-2.5">
          <div className="relative min-w-0 flex-1">
            <Icon
              name="search"
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a stitch…"
              className="pl-10"
              type="search"
              autoCapitalize="none"
            />
          </div>
          <Segmented
            className="w-32 shrink-0"
            size="sm"
            value={dialect}
            onChange={setDialect}
            options={[
              { value: 'us', label: 'US' },
              { value: 'uk', label: 'UK' },
            ]}
          />
        </div>

        {dialect === 'uk' && (
          <p className="mb-3 rounded-xl border border-amber/40 bg-amber-soft/30 px-3.5 py-2.5 text-[12px] leading-snug">
            Showing <strong>UK</strong> names. Most patterns online are US — if one calls a short
            dense stitch &ldquo;dc&rdquo;, it is British and means our SC.
          </p>
        )}

        {visible.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" size={28} />}
            title="No match"
            body="Try the abbreviation, like INV DEC, BLO or HDC."
          />
        ) : (
          GROUPS.map((group) => {
            const rows = visible.filter((s) => s.group === group.id)
            if (rows.length === 0) return null
            return (
              <section key={group.id} className="mb-5">
                <SectionTitle>{group.label}</SectionTitle>
                <p className="-mt-2 mb-2.5 text-[12px] text-faint">{group.blurb}</p>
                <div className="flex flex-col gap-2 xl:grid xl:grid-cols-2">
                  {rows.map((stitch) => (
                    <StitchRow
                      key={stitch.id}
                      stitch={stitch}
                      dialect={dialect}
                      onOpen={() => setOpen(stitch)}
                    />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>

      <StitchQuickView stitch={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function StitchRow({ stitch, dialect, onOpen }) {
  const label = dialect === 'uk' && stitch.uk ? stitch.uk : { abbr: stitch.abbr, name: stitch.name }

  return (
    <button
      onClick={onOpen}
      className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-border-strong"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface-2 text-text">
        <StitchSymbol name={stitch.symbol} size={26} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-extrabold leading-tight">{label.name}</span>
          <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-extrabold tracking-tight text-muted">
            {label.abbr}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-faint">
          {stitch.yarnOvers > 0
            ? `${stitch.yarnOvers} yarn over${stitch.yarnOvers === 1 ? '' : 's'}`
            : 'no yarn over'}
          {stitch.ami ? ' · amigurumi' : ''}
          {stitch.ukTrap && dialect === 'us' ? ` · UK calls it ${stitch.uk.abbr}` : ''}
        </span>
      </span>
      <Icon name="chevron" size={17} className="shrink-0 text-faint" />
    </button>
  )
}

/** The mental model, up front, before the list of symbols. */
function ChartPrimer() {
  const [open, setOpen] = useState(false)

  return (
    <Card className="overflow-hidden border-mint/35 bg-mint-soft/20">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-[#05231f]">
          <Icon name="book" size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-tight">Reading a chart is reading letters</span>
          <span className="mt-1 block text-[13px] leading-snug text-muted">
            Each symbol is one stitch. Strung together they spell a pattern.
          </span>
        </span>
        <Icon
          name="chevronDown"
          size={18}
          className={cx('mt-1 shrink-0 text-faint transition', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="border-t border-mint/25 p-4 pt-3.5">
          <div className="flex flex-col gap-3.5">
            {CHART_RULES.map((rule) => (
              <div key={rule.title}>
                <p className="text-[13px] font-extrabold">{rule.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{rule.body}</p>
              </div>
            ))}
          </div>

          {/* the crossbar rule, shown rather than described */}
          <div className="mt-4 rounded-xl border border-border bg-bg p-3">
            <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-faint">
              One slash = one yarn over
            </p>
            <div className="flex items-end justify-center gap-4">
              {['sc', 'hdc', 'dc', 'tr', 'dtr'].map((id) => {
                const s = STITCHES_BY_ID[id]
                return (
                  <span key={id} className="flex flex-col items-center gap-1">
                    <StitchSymbol name={s.symbol} size={26} />
                    <span className="text-[10px] font-extrabold text-muted">{s.abbr}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ---------------------------------------------------------- cheat sheets -- */

function CheatSheets() {
  return (
    <div className="flex flex-col gap-7">
      <section>
        <SectionTitle>US ↔ UK terms</SectionTitle>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border bg-amber-soft/35 px-3.5 py-3">
            <Icon name="flame" size={17} className="shrink-0 text-amber" />
            <p className="text-[13px] leading-snug">
              Every US term shifts one place down the UK list, so both use the same words for
              different stitches. This is the table to check before starting any pattern you did
              not write.
            </p>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2">
            <p className="px-3.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-faint">
              United States
            </p>
            <span />
            <p className="px-3.5 pb-1 pt-3 text-right text-[11px] font-bold uppercase tracking-wider text-faint">
              United Kingdom
            </p>
            {US_UK_TERMS.map((row) => (
              <Fragment key={row.us}>
                <p className="border-t border-border px-3.5 py-2.5 text-[13px] font-semibold">
                  {row.us}
                </p>
                <span className="border-t border-border py-2.5 text-faint">
                  <Icon name="chevron" size={14} />
                </span>
                <p
                  className={cx(
                    'border-t border-border px-3.5 py-2.5 text-right text-[13px] font-semibold',
                    row.trap && 'text-amber'
                  )}
                >
                  {row.uk}
                </p>
              </Fragment>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Symbol quick reference</SectionTitle>
        <Card className="p-3.5">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
            {STITCHES.map((s) => (
              <div
                key={s.id}
                className="flex flex-col items-center gap-1 rounded-xl bg-surface-2/60 px-1 py-2.5"
              >
                <StitchSymbol name={s.symbol} size={28} />
                <span className="text-[10px] font-extrabold tracking-tight text-muted">
                  {s.abbr}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-snug text-faint">
            Craft Yarn Council standard symbols. Tap any of them in the Glossary tab for the full
            entry.
          </p>
        </Card>
      </section>

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

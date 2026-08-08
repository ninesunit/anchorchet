/**
 * The stitch pop-up.
 *
 * Reached from two places: tapping an entry in the Manual's glossary, and
 * tapping a suggested-stitch pill on a quest she has accepted. It is the same
 * component in both, so a stitch she looks up mid-project reads exactly like
 * the one she read in the Manual.
 */

import { StitchDiagram } from './StitchDiagram'
import { StitchSymbol } from './StitchSymbol'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { Modal } from './ui/Modal'
import { searchUrl } from '../data/manual'

export function StitchQuickView({ stitch, onClose, label }) {
  return (
    <Modal
      open={Boolean(stitch)}
      onClose={onClose}
      title={stitch?.name ?? label ?? 'Stitch'}
      subtitle={stitch ? `${stitch.abbr}${stitch.alsoWritten ? ` · also written ${stitch.alsoWritten}` : ''}` : undefined}
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Got it
          </Button>
          <Button
            as="a"
            variant="primary"
            full
            href={searchUrl(
              stitch ? `crochet ${stitch.name} tutorial slow` : `crochet ${label} tutorial`
            )}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="play" size={16} />
            Watch it
          </Button>
        </>
      }
    >
      {stitch ? (
        <StitchDetail stitch={stitch} />
      ) : (
        <p className="pb-2 text-[14px] leading-relaxed text-muted">
          No entry for &ldquo;{label}&rdquo; in the glossary yet — the video search below will
          still find it.
        </p>
      )}
    </Modal>
  )
}

/** The body, also used inline by the Manual's expanded glossary card. */
export function StitchDetail({ stitch, compact = false }) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/60 p-4">
        <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-bg text-text">
          <StitchSymbol name={stitch.symbol} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
            Chart symbol
          </p>
          {stitch.notCharted ? (
            <p className="mt-1 text-[13px] leading-snug text-muted">
              Not a standard chart symbol — this one is an amigurumi technique, and amigurumi is
              written out rather than charted.
            </p>
          ) : (
            <p className="mt-1 text-[13px] leading-snug text-muted">
              {stitch.yarnOvers > 0
                ? `${stitch.yarnOvers} yarn over${stitch.yarnOvers === 1 ? '' : 's'} before you start — ${stitch.yarnOvers === 1 ? 'that is what the slash means' : `that is what the ${stitch.yarnOvers} slashes mean`}.`
                : 'No yarn over before you start.'}
              {stitch.heightChains ? ` About ${stitch.heightChains} chains tall.` : ''}
            </p>
          )}
        </div>
      </div>

      {stitch.uk && stitch.uk.abbr !== stitch.abbr && (
        <div
          className={
            stitch.ukTrap
              ? 'flex items-start gap-2.5 rounded-xl border border-amber/45 bg-amber-soft/35 px-3.5 py-3'
              : 'flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 px-3.5 py-3'
          }
        >
          <Icon
            name={stitch.ukTrap ? 'flame' : 'target'}
            size={16}
            className={stitch.ukTrap ? 'mt-0.5 shrink-0 text-amber' : 'mt-0.5 shrink-0 text-muted'}
          />
          <p className="text-[13px] leading-snug">
            <strong>In a UK pattern this is called {stitch.uk.name}</strong> ({stitch.uk.abbr}).
            {stitch.ukTrap && ' UK patterns use the same words for different stitches — if a pattern says "dc" and looks British, it means our SC.'}
          </p>
        </div>
      )}

      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-faint">How</p>
        <p className="text-[14px] leading-relaxed">{stitch.how}</p>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-faint">
          When you use it
        </p>
        <p className="text-[14px] leading-relaxed text-muted">{stitch.use}</p>
      </div>

      {stitch.diagram && !compact && (
        <div className="rounded-xl border border-border bg-surface-2/60 p-2">
          <StitchDiagram name={stitch.diagram} />
        </div>
      )}

      {stitch.ami && (
        <Badge tone="violet" className="self-start">
          Amigurumi essential
        </Badge>
      )}
    </div>
  )
}

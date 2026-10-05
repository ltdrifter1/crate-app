/**
 * The Board — shared parts for the Charts page and Home's Top 5.
 *
 * One grammar: a big condensed rank numeral, a station-ink stripe, a heat meter
 * built from real request/play/like counts, and a request key. Red appears once,
 * on the row that is playing.
 *
 * Layout and motion live in index.css (`.pmp-board-*`); this file only carries
 * what depends on data (ink, level, copy).
 */
import { memo } from "react";
import { color, fontMono, fontPoster } from "../../theme";
import { CLIMB_GREEN, HEAT_SEGMENTS, rankLabel } from "../../lib/board";
import { onInk } from "../../lib/mtvChannel";
import { catalogSleeveUrl } from "../../lib/catalogSleeve";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";
import { TrackMoreButton } from "../listen/TrackRow";

function Tri({ dir = "up", size = 8 }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.875)}
      viewBox="0 0 8 7"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={dir === "up" ? "M4 0 8 7H0z" : "M0 0h8L4 7z"} fill="currentColor" />
    </svg>
  );
}

/** Big condensed rank numeral. `style` picks the treatment: solid, ink-shadowed, or outlined. */
export function RankNumeral({ rank, size = 34, treatment = "plain", ink, style }) {
  const base = {
    fontFamily: fontPoster,
    fontWeight: 800,
    fontSize: size,
    lineHeight: 0.86,
    letterSpacing: "-0.01em",
    fontVariantNumeric: "tabular-nums lining-nums",
    display: "block",
    userSelect: "none",
  };
  if (treatment === "print") {
    // Misregistered print: pearl numeral over an offset ink plate — flyer, not UI.
    return (
      <span
        aria-hidden="true"
        style={{
          ...base,
          color: color.ink,
          textShadow: `${Math.max(2, Math.round(size / 28))}px ${Math.max(2, Math.round(size / 28))}px 0 ${ink}`,
          ...style,
        }}
      >
        {rankLabel(rank)}
      </span>
    );
  }
  if (treatment === "outline") {
    return (
      <span
        aria-hidden="true"
        style={{
          ...base,
          color: "#12161C",
          WebkitTextStroke: `${Math.max(1.5, size / 36)}px ${ink}`,
          paintOrder: "stroke fill",
          ...style,
        }}
      >
        {rankLabel(rank)}
      </span>
    );
  }
  return (
    <span aria-hidden="true" style={{ ...base, color: color.body, ...style }}>
      {rankLabel(rank)}
    </span>
  );
}

/** Rank movement as a printed stamp. Says nothing when there is no history to compare. */
export function MovementStamp({ movement, delta }) {
  if (movement === "up") {
    return (
      <span
        className="pmp-stamp pmp-rank-up"
        aria-label={`Up ${delta}`}
        style={{ color: CLIMB_GREEN }}
      >
        <Tri dir="up" />
        {delta}
      </span>
    );
  }
  if (movement === "down") {
    return (
      <span className="pmp-stamp pmp-rank-down" aria-label={`Down ${delta}`} style={{ color: color.muted }}>
        <Tri dir="down" />
        {delta}
      </span>
    );
  }
  if (movement === "debut" || movement === "new") {
    return (
      <span className="pmp-stamp pmp-stamp--new" aria-label="New">
        NEW
      </span>
    );
  }
  if (movement === "same") {
    return (
      <span className="pmp-stamp" aria-label="Unchanged" style={{ color: color.faint }}>
        –
      </span>
    );
  }
  return null;
}

/** Three-bar level meter that replaces the stamp on the row that is playing. Red = live, and only live. */
export function NowBars({ playing = true }) {
  return (
    <span className="pmp-nowbars" data-playing={playing ? "true" : "false"} role="img" aria-label="Now playing">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Ten-step heat meter. Level is computed from real counts (lib/board.js heatLevel). */
export function HeatMeter({ level = 0, ink, segments = HEAT_SEGMENTS, large = false }) {
  return (
    <span
      className={`pmp-heat${large ? " pmp-heat--lg" : ""}`}
      role="meter"
      aria-label="Heat"
      aria-valuemin={0}
      aria-valuemax={segments}
      aria-valuenow={level}
      style={{ "--ink": ink }}
    >
      {Array.from({ length: segments }, (_, i) => (
        <i key={i} data-on={i < level ? "true" : "false"} style={{ "--i": i }} />
      ))}
    </span>
  );
}

/** Vote key. Shows the real request count; pressed once today's request is spent. */
export function RequestKey({ count = 0, requested = false, title = "this track", onClick, ink, wide = false }) {
  const n = Number(count) || 0;
  return (
    <button
      type="button"
      className={`pmp-req${wide ? " pmp-req--wide" : ""}`}
      aria-pressed={requested}
      aria-label={requested ? `Requested ${title}` : `Request ${title}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      style={{ "--ink": ink }}
    >
      <Tri dir="up" size={wide ? 10 : 9} />
      {wide ? (
        <>
          <span className="pmp-req__label">{requested ? "Requested" : "Request"}</span>
          {n > 0 && <span className="pmp-req__count">{n}</span>}
        </>
      ) : (
        <span className="pmp-req__count">{n > 0 ? n : "REQ"}</span>
      )}
    </button>
  );
}

/** CH-06 TECHNO — printed in the station's ink, label chosen to read on it. */
export function StationBug({ channel, compact = false }) {
  if (!channel) return null;
  const num = String(channel.num).padStart(2, "0");
  const name = (channel.dialSlug || channel.shortTitle || channel.title || "").toUpperCase();
  return (
    <span className="pmp-chbug" aria-label={`CH-${num} ${name}`} style={{ "--ink": channel.accent }}>
      <span className="pmp-chbug__num" style={{ color: onInk(channel.accent) }}>
        {compact ? num : `CH-${num}`}
      </span>
      {!compact && <span className="pmp-chbug__name">{name}</span>}
    </span>
  );
}

/** Mono "132 BPM · 8A" line, or null when the track carries neither. */
export function trackMetaBits(entry) {
  const bits = [];
  if (Number(entry?.bpm) > 0) bits.push(`${Math.round(entry.bpm)} BPM`);
  if (entry?.camelot) bits.push(String(entry.camelot));
  return bits.join(" · ");
}

const rowCover = (variant, rank) => (variant === "home" ? (rank === 1 ? 60 : 50) : 52);

/**
 * One line of the chart.
 * variant "full"  — Charts page: numeral, cover, title/artist, heat meter, + , ⋯, request key.
 * variant "home"  — Top 5 on Home: numeral, cover, title/artist, request key.
 */
export const BoardRow = memo(function BoardRow({
  entry,
  ink,
  active = false,
  playing = true,
  heat = 0,
  variant = "full",
  requested = false,
  index = 0,
  onPlay,
  onAdd,
  onMore,
  onContext,
  onRequest,
}) {
  const full = variant === "full";
  const cover = rowCover(variant, entry.rank);
  const bits = trackMetaBits(entry);
  const numeralSize = variant === "home" && entry.rank === 1 ? 46 : 36;

  return (
    <li
      className="pmp-board-row pmp-board-in"
      data-active={active ? "true" : "false"}
      data-variant={variant}
      style={{ "--ink": ink, animationDelay: `${Math.min(index, 10) * 28}ms` }}
    >
      <div className="pmp-board-row__inner" onContextMenu={onContext ? (ev) => onContext(ev, entry) : undefined}>
        <div className="pmp-board-row__rank">
          <RankNumeral
            rank={entry.rank}
            size={numeralSize}
            treatment={variant === "home" && entry.rank === 1 ? "print" : "plain"}
            ink={ink}
            style={active ? { color: color.ink } : entry.rank <= 5 ? { color: color.ink } : undefined}
          />
          <span className="pmp-board-row__stamp">
            {active ? <NowBars playing={playing} /> : <MovementStamp movement={entry.movement} delta={entry.delta} />}
          </span>
        </div>

        <button
          type="button"
          className="pmp-board-row__main"
          onClick={() => onPlay?.(entry)}
          aria-label={`#${entry.rank} ${entry.title} by ${entry.artist}`}
        >
          <span className="pmp-board-row__cover" style={{ width: cover, height: cover }}>
            <CoverImage src={catalogSleeveUrl(entry.albumCover)} width={cover} height={cover} alt="" wellColor={entry.color || ""} />
          </span>
          <span className="pmp-board-row__text">
            <span className="pmp-board-row__title" style={{ fontFamily: fontPoster }}>
              {entry.title}
            </span>
            <span className="pmp-board-row__artist">
              {entry.artist}
              {entry.meta ? ` · ${entry.meta}` : ""}
            </span>
            {full && (
              <span className="pmp-board-row__stats">
                <HeatMeter level={heat} ink={ink} />
                {bits && (
                  <span className="pmp-board-row__bits" style={{ fontFamily: fontMono }}>
                    {bits}
                  </span>
                )}
              </span>
            )}
          </span>
        </button>

        <div className="pmp-board-row__actions">
          {onRequest && (
            <RequestKey
              count={entry.requestCount}
              requested={requested}
              title={entry.title}
              ink={ink}
              onClick={() => onRequest(entry)}
            />
          )}
          {full && onAdd && (
            <button
              type="button"
              className="pmp-board-icon"
              aria-label={`Add ${entry.title} to queue`}
              onClick={(ev) => onAdd(entry, ev)}
            >
              <Icon name="plus" size={15} />
            </button>
          )}
          {full && onMore && <TrackMoreButton onClick={(ev) => onMore(ev, entry)} />}
        </div>
      </div>
    </li>
  );
});

/** Plain ordered list wrapper so Charts and Home share spacing and the two-column desktop flow. */
export function BoardList({ children, columns = false, label }) {
  return (
    <ol className={`pmp-board-list${columns ? " pmp-board-list--cols" : ""}`} aria-label={label}>
      {children}
    </ol>
  );
}

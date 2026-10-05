/**
 * The Board — feature pieces: the #1 frame, the #2/#3 posters, skeleton and empty states.
 */
import { color, font, fontMono, fontPoster } from "../../theme";
import { catalogSleeveUrl } from "../../lib/catalogSleeve";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";
import { TrackMoreButton } from "../listen/TrackRow";
import { HeatMeter, MovementStamp, NowBars, RankNumeral, RequestKey, StationBug, trackMetaBits } from "./BoardParts";

function countLine(entry) {
  const bits = [];
  const req = Number(entry.requestCount) || 0;
  const plays = Number(entry.playCount) || 0;
  const likes = Number(entry.likeCount) || 0;
  if (req) bits.push(`${req} ${req === 1 ? "REQUEST" : "REQUESTS"}`);
  if (plays) bits.push(`${plays} ${plays === 1 ? "PLAY" : "PLAYS"}`);
  if (likes) bits.push(`${likes} ${likes === 1 ? "LIKE" : "LIKES"}`);
  return bits.join(" · ");
}

function PlayDisc({ size = 44 }) {
  return (
    <span className="pmp-board-disc" aria-hidden="true" style={{ width: size, height: size }}>
      <Icon name="play" size={Math.round(size * 0.4)} />
    </span>
  );
}

/** NO. 1 — the frame the whole page is built around. */
export function BoardLead({
  entry,
  ink,
  channel,
  active = false,
  playing = true,
  heat = 0,
  requested = false,
  kicker = "Top of the board",
  onPlay,
  onAdd,
  onMore,
  onContext,
  onRequest,
}) {
  const bits = trackMetaBits(entry);
  const counts = countLine(entry);
  return (
    <article
      className="pmp-chart-podium__lead pmp-board-lead pmp-board-in"
      data-active={active ? "true" : "false"}
      aria-label={`#${entry.rank} ${entry.title} by ${entry.artist}`}
      onContextMenu={onContext ? (e) => onContext(e, entry) : undefined}
      style={{ "--ink": ink }}
    >
      <header className="pmp-board-lead__head">
        <span className="pmp-board-no1" style={{ fontFamily: fontPoster }}>
          No. {entry.rank}
        </span>
        <span className="pmp-board-kicker" style={{ fontFamily: fontMono }}>
          {kicker}
        </span>
        <span style={{ marginLeft: "auto" }}>
          <StationBug channel={channel} />
        </span>
      </header>

      <button
        type="button"
        className="pmp-board-lead__sleeve"
        onClick={onPlay}
        aria-label={`Play #${entry.rank} ${entry.title}`}
      >
        <CoverImage
          src={catalogSleeveUrl(entry.albumCover)}
          width={420}
          height={420}
          alt=""
          priority
          wellColor={entry.color || ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <PlayDisc size={40} />
      </button>

      <div className="pmp-board-lead__body">
        <div className="pmp-board-lead__num">
          <RankNumeral rank={entry.rank} treatment="print" ink={ink} size={112} />
          <span className="pmp-board-lead__stamp">
            {active ? <NowBars playing={playing} /> : <MovementStamp movement={entry.movement} delta={entry.delta} />}
          </span>
        </div>
        <h2 className="pmp-board-lead__title" style={{ fontFamily: fontPoster }}>
          {entry.title}
        </h2>
        <div className="pmp-board-lead__artist" style={{ fontFamily: font }}>
          {entry.artist}
        </div>
        {bits && (
          <div className="pmp-board-lead__bits" style={{ fontFamily: fontMono }}>
            {bits}
          </div>
        )}
      </div>

      <footer className="pmp-board-lead__foot">
        <div className="pmp-board-lead__heat">
          <HeatMeter level={heat} ink={ink} large />
          {counts && (
            <span className="pmp-board-lead__counts" style={{ fontFamily: fontMono }}>
              {counts}
            </span>
          )}
        </div>
        <div className="pmp-board-lead__actions">
          {onRequest && (
            <RequestKey
              wide
              count={entry.requestCount}
              requested={requested}
              title={entry.title}
              ink={ink}
              onClick={() => onRequest(entry)}
            />
          )}
          {onAdd && (
            <button
              type="button"
              className="pmp-board-icon"
              aria-label={`Add ${entry.title} to queue`}
              onClick={(ev) => onAdd(entry, ev)}
            >
              <Icon name="plus" size={16} />
            </button>
          )}
          {onMore && <TrackMoreButton onClick={(ev) => onMore(ev, entry)} />}
        </div>
      </footer>
    </article>
  );
}

/** #2 and #3 — posters with the numeral cut into the sleeve. */
export function BoardPodiumCard({
  entry,
  ink,
  active = false,
  playing = true,
  heat = 0,
  requested = false,
  onPlay,
  onMore,
  onContext,
  onRequest,
  index = 1,
}) {
  return (
    <article
      className="pmp-board-pod pmp-board-in"
      data-active={active ? "true" : "false"}
      aria-label={`#${entry.rank} ${entry.title} by ${entry.artist}`}
      onContextMenu={onContext ? (e) => onContext(e, entry) : undefined}
      style={{ "--ink": ink, animationDelay: `${index * 70}ms` }}
    >
      <button
        type="button"
        className="pmp-board-pod__sleeve"
        onClick={onPlay}
        aria-label={`Play #${entry.rank} ${entry.title}`}
      >
        <CoverImage
          src={catalogSleeveUrl(entry.albumCover)}
          width={220}
          height={220}
          alt=""
          eager
          wellColor={entry.color || ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span className="pmp-board-pod__num">
          <RankNumeral rank={entry.rank} treatment="outline" ink={ink} size={58} />
        </span>
      </button>
      <div className="pmp-board-pod__body">
        <span className="pmp-board-pod__title" style={{ fontFamily: fontPoster }}>
          {entry.title}
        </span>
        <span className="pmp-board-pod__artist">{entry.artist}</span>
        <span className="pmp-board-pod__row">
          <span className="pmp-board-pod__stamp">
            {active ? <NowBars playing={playing} /> : <MovementStamp movement={entry.movement} delta={entry.delta} />}
          </span>
          <HeatMeter level={heat} ink={ink} />
        </span>
        <span className="pmp-board-pod__row pmp-board-pod__row--end">
          {onRequest && (
            <RequestKey
              count={entry.requestCount}
              requested={requested}
              title={entry.title}
              ink={ink}
              onClick={() => onRequest(entry)}
            />
          )}
          {onMore && <TrackMoreButton onClick={(ev) => onMore(ev, entry)} />}
        </span>
      </div>
    </article>
  );
}

export function BoardSkeleton() {
  return (
    <div aria-hidden="true" className="pmp-chart-podium pmp-chart-podium--skel">
      <div className="pmp-chart-podium__lead pmp-chart-skel" style={{ minHeight: 240 }} />
      <div className="pmp-chart-podium__side">
        <div className="pmp-chart-skel" style={{ minHeight: 210 }} />
        <div className="pmp-chart-skel" style={{ minHeight: 210 }} />
      </div>
    </div>
  );
}

/** Empty board — says what to do, in the station's voice. */
export function BoardEmpty({ note, title = "Nothing on the board" }) {
  return (
    <div role="status" className="pmp-board-empty" style={{ fontFamily: font }}>
      <span className="pmp-board-empty__num" aria-hidden="true" style={{ fontFamily: fontPoster }}>
        00
      </span>
      <div>
        <div className="pmp-board-empty__eyebrow" style={{ fontFamily: fontMono, color: color.muted }}>
          {title}
        </div>
        <p className="pmp-board-empty__note">{note}</p>
      </div>
    </div>
  );
}

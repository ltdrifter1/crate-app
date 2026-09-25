/**
 * Y2K / PS1-era icon set — hand-drawn SVGs, no Lucide.
 * Chunky, pixel-honest, bitmap-grid aesthetic. Bold fills, hard edges.
 * Every icon lives at viewBox="0 0 24 24" so size prop = px side.
 */

function Ico({ size, children, stroke = "currentColor", fill = "none", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ─── Navigation / Core ────────────────────────────────────────────────────────

function HomeIcon({ size }) {
  return (
    <Ico size={size}>
      {/* Chunky house — flat roof ridge, thick walls */}
      <polygon points="12,3 2,11 4,11 4,21 9,21 9,15 15,15 15,21 20,21 20,11 22,11" strokeWidth="2" />
      <line x1="12" y1="3" x2="12" y2="3" strokeWidth="2" />
    </Ico>
  );
}

function ChartIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Three solid bars — different heights, PS1 bar graph */}
      <rect x="3"  y="14" width="5" height="7" />
      <rect x="10" y="9"  width="5" height="12" />
      <rect x="17" y="5"  width="5" height="16" />
      <rect x="2"  y="21" width="20" height="2" />
    </Ico>
  );
}

function MapIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      {/* Simplified compass rose / map grid — Y2K globe look */}
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3"  x2="12" y2="21" />
      <line x1="3"  y1="12" x2="21" y2="12" />
      <ellipse cx="12" cy="12" rx="5" ry="9" />
    </Ico>
  );
}

function DigIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Stack of three record-crates — horizontal slabs */}
      <rect x="2"  y="4"  width="20" height="4" rx="1" />
      <rect x="2"  y="10" width="20" height="4" rx="1" />
      <rect x="2"  y="16" width="20" height="4" rx="1" />
    </Ico>
  );
}

function SearchIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2.5">
      {/* Bold circle + thick handle at 45° */}
      <circle cx="10" cy="10" r="6.5" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </Ico>
  );
}

function ProfileIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Solid head + shoulders — PS1 character silhouette */}
      <circle cx="12" cy="7" r="4" />
      <path d="M4,21 C4,16 8,13 12,13 C16,13 20,16 20,21 Z" />
    </Ico>
  );
}

function MenuIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2.5">
      {/* Three thick horizontal bars */}
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Ico>
  );
}

function TurtleIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      <ellipse cx="12" cy="12.5" rx="7.2" ry="5" />
      <circle cx="19.2" cy="11.5" r="2.3" />
      <rect x="5.2" y="16" width="2.4" height="3.4" rx="1.1" />
      <rect x="9" y="16.4" width="2.4" height="3.4" rx="1.1" />
      <rect x="13" y="16.4" width="2.4" height="3.4" rx="1.1" />
      <rect x="16.6" y="16" width="2.4" height="3.4" rx="1.1" />
    </Ico>
  );
}

function RabbitIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      <rect x="6.5" y="1.5" width="3.2" height="10" rx="1.6" />
      <rect x="14.3" y="1.5" width="3.2" height="10" rx="1.6" />
      <circle cx="12" cy="14.5" r="6.2" />
    </Ico>
  );
}

function ShareIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      <circle cx="18" cy="5" r="2.4" />
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="19" r="2.4" />
      <line x1="8.3" y1="10.7" x2="15.7" y2="6.3" />
      <line x1="8.3" y1="13.3" x2="15.7" y2="17.7" />
    </Ico>
  );
}

function PlusIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2.5">
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </Ico>
  );
}

function XIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2.5">
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </Ico>
  );
}

function ChevUpIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2.5">
      <polyline points="4,16 12,8 20,16" />
    </Ico>
  );
}

function ChevDownIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2.5">
      <polyline points="4,8 12,16 20,8" />
    </Ico>
  );
}

function EditIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      {/* Stubby pencil — PS1 cursor style */}
      <path d="M16,3 L21,8 L8,21 L3,21 L3,16 Z" />
      <line x1="14" y1="5" x2="19" y2="10" />
    </Ico>
  );
}

function TrashIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Chunky bin — lid + body + three slots */}
      <rect x="4"  y="7"  width="16" height="14" rx="1" />
      <rect x="3"  y="4"  width="18" height="3"  rx="0" />
      <rect x="9"  y="2"  width="6"  height="2"  />
      <rect x="8"  y="10" width="2"  height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <rect x="11" y="10" width="2"  height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <rect x="14" y="10" width="2"  height="8" rx="1" fill="rgba(255,255,255,0.3)" />
    </Ico>
  );
}

function DoorIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      <rect x="4" y="2" width="13" height="20" rx="1" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <polyline points="17,5 21,12 17,19" />
    </Ico>
  );
}

function SettingsIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      {/* Chunky cog — 8-tooth gear */}
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12,2 L12,5 M12,19 L12,22 M2,12 L5,12 M19,12 L22,12 M5.6,5.6 L7.8,7.8 M16.2,16.2 L18.4,18.4 M18.4,5.6 L16.2,7.8 M7.8,16.2 L5.6,18.4" strokeWidth="2.5" />
    </Ico>
  );
}

// ─── Playback ─────────────────────────────────────────────────────────────────

function PlayIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Bold filled triangle — PS1 play button */}
      <polygon points="6,3 21,12 6,21" />
    </Ico>
  );
}

function PauseIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Two thick solid bars */}
      <rect x="4"  y="3" width="6" height="18" rx="1" />
      <rect x="14" y="3" width="6" height="18" rx="1" />
    </Ico>
  );
}

function SkipIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Filled triangle + end bar */}
      <polygon points="4,4 16,12 4,20" />
      <rect x="17" y="4" width="3" height="16" rx="0.5" />
    </Ico>
  );
}

function PrevIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Mirror of skip */}
      <polygon points="20,4 8,12 20,20" />
      <rect x="4" y="4" width="3" height="16" rx="0.5" />
    </Ico>
  );
}

function RepeatIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      {/* Two arrows forming a box — chunky repeat symbol */}
      <polyline points="17,2 21,6 17,10" />
      <path d="M21,6 L7,6 C4.8,6 3,7.8 3,10 L3,14" />
      <polyline points="7,22 3,18 7,14" />
      <path d="M3,18 L17,18 C19.2,18 21,16.2 21,14 L21,10" />
    </Ico>
  );
}

function ShuffleIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      {/* Two crossing lines with arrowheads */}
      <polyline points="16,3 21,3 21,8" />
      <polyline points="21,16 21,21 16,21" />
      <line x1="3" y1="3" x2="21" y2="21" />
      <line x1="3" y1="21" x2="21" y2="3" />
    </Ico>
  );
}

function VolumeIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Chunky speaker + two wave arcs */}
      <polygon points="2,9 2,15 7,15 13,20 13,4 7,9" />
      <path d="M16,8 C18,9.5 18,14.5 16,16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="square" />
      <path d="M19,5.5 C23,8 23,16 19,18.5" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="square" />
    </Ico>
  );
}

function DiscIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Vinyl record — outer ring + groove rings + label hole */}
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="7"  fill="rgba(0,0,0,0.35)" />
      <circle cx="12" cy="12" r="4"  fill="rgba(58,66,80,0.8)" />
      <circle cx="12" cy="12" r="1.5" fill="rgba(183,228,238,0.7)" />
    </Ico>
  );
}

function HeartIcon({ size, empty = false }) {
  return (
    <Ico size={size} fill={empty ? "none" : "currentColor"} strokeWidth={empty ? "2" : "0"} stroke={empty ? "currentColor" : "none"}>
      <path d="M12,21 L3.5,12 C1.5,10 1.5,6.8 3.5,4.8 C5.5,2.8 8.5,2.8 10.5,4.8 L12,6.3 L13.5,4.8 C15.5,2.8 18.5,2.8 20.5,4.8 C22.5,6.8 22.5,10 20.5,12 Z" />
    </Ico>
  );
}

function QueueIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* List with a note symbol — three rows + mini note */}
      <rect x="2"  y="5"  width="14" height="2.5" rx="0.5" />
      <rect x="2"  y="11" width="14" height="2.5" rx="0.5" />
      <rect x="2"  y="17" width="10" height="2.5" rx="0.5" />
      {/* Mini note at right */}
      <rect x="17" y="9"  width="2.5" height="7" rx="0.5" />
      <rect x="17" y="9"  width="5"   height="2" rx="0.5" />
      <ellipse cx="18" cy="16.5" rx="2.5" ry="2" />
    </Ico>
  );
}

function FlaskIcon({ size }) {
  return (
    <Ico size={size} strokeWidth="2">
      <path d="M9,3 L9,10 L3,19 C3,20.5 4.5,21.5 6,21.5 L18,21.5 C19.5,21.5 21,20.5 21,19 L15,10 L15,3" />
      <line x1="7.5" y1="3" x2="16.5" y2="3" strokeWidth="2.5" />
    </Ico>
  );
}

function ZapIcon({ size }) {
  return (
    <Ico size={size} fill="currentColor" stroke="none">
      {/* Bold lightning bolt */}
      <polygon points="13,2 4,14 11,14 11,22 20,10 13,10" />
    </Ico>
  );
}

function ThumbsDownIcon({ size, filled = false }) {
  return (
    <Ico size={size} fill={filled ? "currentColor" : "none"} strokeWidth="2">
      <path d="M17,2 L19,2 C20.1,2 21,2.9 21,4 L21,13 C21,14.1 20.1,15 19,15 L17,15" />
      <path d="M17,2 L12,2 C10,2 9,3 8,4.5 L4,11 C3,13 4,15 6,15 L10,15 L9,20 C8.5,22 10,23 11.5,22 L18,15 L17,15 Z" />
    </Ico>
  );
}

function TimedMixIcon({ size, accent = "#6EA8FF" }) {
  const r = 9.2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.72;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true"
      strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="16" cy="16" r={r} stroke="rgba(216,223,232,0.16)" strokeWidth="2" />
      <circle
        cx="16" cy="16" r={r}
        stroke={accent} strokeWidth="2.5"
        strokeDasharray={`${arc} ${c}`}
        strokeDashoffset={28}
        transform="rotate(-95 16 16)"
        style={{ animation: "dialArc 1.1s cubic-bezier(0.22,1,0.36,1) both" }}
      />
      <rect x="10" y="12" width="12" height="2.5" fill="rgba(48,53,62,0.9)" />
      <rect x="10" y="15.5" width="8"  height="2.5" fill="rgba(184,191,202,0.65)" />
      <rect x="10" y="19"  width="5"  height="2.5" fill={accent} />
    </svg>
  );
}

// ─── Feature card icons (LandingScreen) ───────────────────────────────────────

export function FeatureIcon({ name, size = 28 }) {
  const s = size;
  if (name === "radio") return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true"
      strokeLinecap="square" strokeLinejoin="miter">
      {/* PS1-style radio — boxy body, antenna, tuner knob */}
      <rect x="2" y="10" width="24" height="16" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="5" y="13" width="10" height="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="10" x2="12" y2="4" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="4" x2="16" y2="7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
  if (name === "chart") return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
      {/* Bold bars + upward arrow — charts climbing */}
      <rect x="2"  y="18" width="5" height="8"  />
      <rect x="9"  y="12" width="5" height="14" />
      <rect x="16" y="7"  width="5" height="19" />
      <rect x="2"  y="26" width="24" height="2" />
      <polygon points="22,2 26,8 18,8" />
    </svg>
  );
  if (name === "crate") return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true"
      strokeLinecap="square" strokeLinejoin="miter">
      {/* Record crate — box with album spines sticking up */}
      <rect x="2" y="10" width="24" height="16" rx="1" stroke="currentColor" strokeWidth="2" />
      <line x1="8"  y1="10" x2="8"  y2="6"  stroke="currentColor" strokeWidth="2" />
      <line x1="13" y1="10" x2="13" y2="4"  stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="10" x2="18" y2="7"  stroke="currentColor" strokeWidth="2" />
      <line x1="23" y1="10" x2="23" y2="5"  stroke="currentColor" strokeWidth="2" />
      <line x1="5"  y1="14" x2="5"  y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="14" x2="10" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="14" x2="15" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="14" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
  if (name === "discovery") return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true"
      strokeLinecap="square" strokeLinejoin="miter">
      {/* Binoculars — PS1 exploration */}
      <rect x="2"  y="10" width="9"  height="13" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="17" y="10" width="9"  height="13" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="11" y="13" width="6"  height="5"       stroke="currentColor" strokeWidth="2" />
      <circle cx="6.5"  cy="16.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="21.5" cy="16.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="11" y1="8" x2="6" y2="10" stroke="currentColor" strokeWidth="2" />
      <line x1="17" y1="8" x2="22" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
  return null;
}

// ─── Main icon dispatch ────────────────────────────────────────────────────────

export default function Icon({ name, size = 18 }) {
  const icons = {
    play:         <PlayIcon size={size} />,
    pause:        <PauseIcon size={size} />,
    skip:         <SkipIcon size={size} />,
    prev:         <PrevIcon size={size} />,
    heart:        <HeartIcon size={size} />,
    heartempty:   <HeartIcon size={size} empty />,
    search:       <SearchIcon size={size} />,
    home:         <HomeIcon size={size} />,
    profile:      <ProfileIcon size={size} />,
    repeat:       <RepeatIcon size={size} />,
    shuffle:      <ShuffleIcon size={size} />,
    settings:     <SettingsIcon size={size} />,
    plus:         <PlusIcon size={size} />,
    door:         <DoorIcon size={size} />,
    dig:          <DigIcon size={size} />,
    chart:        <ChartIcon size={size} />,
    map:          <MapIcon size={size} />,
    drift:        <RepeatIcon size={size} />,
    grid:         <MapIcon size={size} />,
    x:            <XIcon size={size} />,
    edit:         <EditIcon size={size} />,
    trash:        <TrashIcon size={size} />,
    chev_up:      <ChevUpIcon size={size} />,
    chev_down:    <ChevDownIcon size={size} />,
    queue:        <QueueIcon size={size} />,
    volume:       <VolumeIcon size={size} />,
    hypno:        <DiscIcon size={size} />,
    disc:         <DiscIcon size={size} />,
    timedmix:     <TimedMixIcon size={size} />,
    flask:        <FlaskIcon size={size} />,
    zap:          <ZapIcon size={size} />,
    menu:         <MenuIcon size={size} />,
    dislike:      <ThumbsDownIcon size={size} />,
    dislikefilled:<ThumbsDownIcon size={size} filled />,
    turtle:       <TurtleIcon size={size} />,
    rabbit:       <RabbitIcon size={size} />,
    share:        <ShareIcon size={size} />,
  };
  return icons[name] || null;
}

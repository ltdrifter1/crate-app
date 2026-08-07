/**
 * App icon map — Lucide strokes, custom marks where the brand needs them.
 * Keep the `name` API stable for App / Immersive / DesktopMiniPlayer.
 */
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Search,
  Home,
  User,
  Repeat,
  Shuffle,
  Settings,
  Plus,
  DoorOpen,
  Layers,
  BarChart3,
  Map,
  Orbit,
  Network,
  X,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ListMusic,
  Volume2,
  Disc3,
  FlaskConical,
  Zap,
} from "lucide-react";
import { color } from "../../theme";

/** Custom mark for timed playlist builder — duration dial + track bars. */
export function TimedMixMark({ size = 28, accent = color.accent }) {
  const r = 9.2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.72;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r={r} stroke="rgba(255,255,255,0.16)" strokeWidth="1.6" />
      <circle
        cx="16" cy="16" r={r}
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${c}`}
        strokeDashoffset={28}
        transform="rotate(-95 16 16)"
        style={{ animation: "dialArc 1.1s cubic-bezier(0.22,1,0.36,1) both" }}
      />
      <rect x="10.2" y="12.1" width="11.6" height="1.7" rx="0.85" fill="rgba(48,53,62,0.9)" />
      <rect x="10.2" y="15.15" width="8.4" height="1.7" rx="0.85" fill="rgba(32,36,43,0.65)" />
      <rect x="10.2" y="18.2" width="5.6" height="1.7" rx="0.85" fill={accent} />
    </svg>
  );
}

function Lucide({ Cmp, size, filled = false }) {
  if (filled) {
    return (
      <Cmp
        size={size}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={0}
        aria-hidden="true"
      />
    );
  }
  return (
    <Cmp
      size={size}
      absoluteStrokeWidth
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      aria-hidden="true"
    />
  );
}

export default function Icon({ name, size = 18 }) {
  const icons = {
    play: <Lucide Cmp={Play} size={size} filled />,
    pause: <Lucide Cmp={Pause} size={size} filled />,
    skip: <Lucide Cmp={SkipForward} size={size} />,
    prev: <Lucide Cmp={SkipBack} size={size} />,
    heart: <Lucide Cmp={Heart} size={size} filled />,
    heartempty: <Lucide Cmp={Heart} size={size} />,
    search: <Lucide Cmp={Search} size={size} />,
    home: <Lucide Cmp={Home} size={size} />,
    profile: <Lucide Cmp={User} size={size} />,
    repeat: <Lucide Cmp={Repeat} size={size} />,
    shuffle: <Lucide Cmp={Shuffle} size={size} />,
    settings: <Lucide Cmp={Settings} size={size} />,
    plus: <Lucide Cmp={Plus} size={size} />,
    door: <Lucide Cmp={DoorOpen} size={size} />,
    dig: <Lucide Cmp={Layers} size={size} />,
    chart: <Lucide Cmp={BarChart3} size={size} />,
    map: <Lucide Cmp={Map} size={size} />,
    drift: <Lucide Cmp={Orbit} size={size} />,
    grid: <Lucide Cmp={Network} size={size} />,
    x: <Lucide Cmp={X} size={size} />,
    edit: <Lucide Cmp={Pencil} size={size} />,
    trash: <Lucide Cmp={Trash2} size={size} />,
    chev_up: <Lucide Cmp={ChevronUp} size={size} />,
    chev_down: <Lucide Cmp={ChevronDown} size={size} />,
    queue: <Lucide Cmp={ListMusic} size={size} />,
    volume: <Lucide Cmp={Volume2} size={size} />,
    hypno: <Lucide Cmp={Disc3} size={size} />,
    timedmix: <TimedMixMark size={size} />,
    flask: <Lucide Cmp={FlaskConical} size={size} />,
    zap: <Lucide Cmp={Zap} size={size} />,
  };
  return icons[name] || null;
}

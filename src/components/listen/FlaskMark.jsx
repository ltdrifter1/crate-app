/**
 * Chemistry beaker mark — Energy Shift + Interests.
 * Fill level maps the pending BPM bias (low = ease, high = lift).
 */
export default function FlaskMark({
  size = 18,
  fillLevel = 0.42,
  active = false,
}) {
  const level = Math.max(0.16, Math.min(0.92, Number(fillLevel) || 0.42));
  const liquidTop = 20.4 - level * 7.4;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        className="flask-steam flask-steam-a"
        d="M10.2 5.2c0.4-1.2 0.1-2.2-0.5-2.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        className="flask-steam flask-steam-b"
        d="M12.1 4.8c0.15-1.1 0.55-1.9 1.2-2.35"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        className="flask-steam flask-steam-c"
        d="M13.7 5.35c0.55-1 0.85-1.75 0.55-2.55"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.22"
      />
      <path d="M9 4.2h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M10 4.2v4.6L5.85 16.1A3.15 3.15 0 0 0 8.6 20.7h6.8a3.15 3.15 0 0 0 2.75-4.6L14 8.8V4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M8.2 ${liquidTop}h7.6`}
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity={active ? 0.72 : 0.42}
      />
      <path
        d={`M8.25 ${liquidTop + 0.15}C8.85 18.9 10.2 20.15 12 20.15s3.15-1.25 3.75-5.75`}
        fill="currentColor"
        opacity={active ? 0.22 : 0.12}
      />
      <circle className="flask-bubble flask-bubble-a" cx="10.4" cy="17.1" r="1.05" fill="currentColor" opacity="0.75" />
      <circle className="flask-bubble flask-bubble-b" cx="13.5" cy="16.35" r="0.78" fill="currentColor" opacity="0.55" />
      <circle className="flask-bubble flask-bubble-c" cx="12" cy="17.85" r="0.62" fill="currentColor" opacity="0.65" />
    </svg>
  );
}

// Each lane advances monotonically with the lesson clock. Small, smooth changes
// in pace create overtakes without moving a runner backwards or off their lane.
export const RUNNERS = [
    { name: '小丸子', color: '#ee5353', kind: 'maruko' },
    { name: '花輪', color: '#5899e2', kind: 'hanawa' },
    { name: '小玉', color: '#f4ad38', kind: 'tama' }
];

export function runnerProgress(progress, lane) {
    const p = Math.max(0, Math.min(1, progress));
    return p + 0.034 * Math.sin(Math.PI * p) * Math.sin(4 * Math.PI * p + lane * 1.45);
}

export const RACE_GEOMETRY = {
    // Long, symmetric straights make the top and bottom of each lane visually identical.
    left: -10, right: 710, centerY: 25, straight: 720,
    innerRadius: 94, laneGap: 64, laneWidth: 60,
    spriteScale: .78, spriteCenterY: 0
};

export function trackPosition(progress, lane) {
    const { left, right, centerY, straight, innerRadius, laneGap } = RACE_GEOMETRY;
    const radius = innerRadius + lane * laneGap;
    let distance = Math.max(0, Math.min(1, progress)) * (2 * straight + 2 * Math.PI * radius);
    if (distance <= straight) return { x: left + distance, y: centerY - radius, direction: 1 };
    distance -= straight;
    if (distance <= Math.PI * radius) {
        const angle = -Math.PI / 2 + distance / radius;
        return { x: right + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), direction: -Math.sin(angle) >= 0 ? 1 : -1 };
    }
    distance -= Math.PI * radius;
    if (distance <= straight) return { x: right - distance, y: centerY + radius, direction: -1 };
    distance -= straight;
    const angle = Math.PI / 2 + distance / radius;
    return { x: left + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), direction: -Math.sin(angle) >= 0 ? 1 : -1 };
}

export function runnerPose(progress, lane, active) {
    const p = active ? Math.max(0, Math.min(1, runnerProgress(progress, lane) + (lane - 1) * .014 * Math.sin(Math.PI * progress))) : 0;
    const position = trackPosition(1 - p, lane);
    return { ...position, facing: -position.direction };
}

function Character({ runner, running }) {
    const { kind, color } = runner;
    const tama = kind === 'tama';
    return <g className={`race-character race-chibi ${running ? 'is-running' : ''}`} stroke="#42322c" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
        <title>{`${runner.name}・大頭Q版`}</title>
        <g className="race-chibi-body" transform="translate(0 37)">
        <ellipse cy="4" rx="11" ry="2.2" fill="#493a30" opacity=".13" stroke="none" />
        <g className="race-leg race-leg-back"><path d="M-2-7 L-8-2 L-12-3" fill="none" strokeWidth="4.5" /><path d="M-12-3h-3" stroke="white" strokeWidth="4.5" /></g>
        <g className="race-arm race-arm-back"><path d="M-4-15 L-9-12 L-12-15" fill="none" stroke="#fbd7b4" strokeWidth="4.5" /></g>
        <rect x="-3" y="-25" width="6" height="8" rx="2" fill="#fbd7b4" />
        <path d="M-7-20 Q0-23 7-19 L8-8 Q0-4-7-8Z" fill={color} />
        {kind === 'maruko' && <path d="M-6-19 L-3-16 L0-19 L3-16 L6-19" fill="none" stroke="white" />}
        {kind === 'hanawa' && <path d="M-5-19 L-2-16 L0-19 L2-16 L5-19" fill="white" stroke="none" />}
        <path d="M-7-8 Q0-5 8-8 L7-4 H-6Z" fill="#ffffff" />
        <g className="race-leg race-leg-front"><path d="M2-7 L7-1 L12-2" fill="none" strokeWidth="4.5" /><path d="M12-2h3" stroke="white" strokeWidth="4.5" /></g>
        <g className="race-arm race-arm-front"><path d="M5-16 L10-12 L14-16" fill="none" stroke="#fbd7b4" strokeWidth="4.5" /></g>
        </g>
        <g className="race-chibi-head" transform="translate(0 -12) scale(1.5) translate(0 34)">
            {tama && <g fill="#302a27"><path d="M-14-37 Q-25-32-22-23 Q-26-17-20-13 Q-15-13-16-21 Q-12-26-14-37Z" /><path d="M14-37 Q25-32 22-23 Q26-17 20-13 Q15-13 16-21 Q12-26 14-37Z" /><path d="M-23-22l7 1 M16-21l7-1" stroke="#e97767" strokeWidth="3" /></g>}
            <path d={kind === 'hanawa' ? 'M-19-30 Q-27-54-7-55 Q3-60 15-52 Q24-47 20-31Z' : 'M-20-28 Q-25-55 0-55 Q25-55 20-28Z'} fill="#302a27" />
            <ellipse cx="-18" cy="-32" rx="3.5" ry="5" fill="#fbd7b4" /><ellipse cx="18" cy="-32" rx="3.5" ry="5" fill="#fbd7b4" />
            <ellipse cy="-34" rx="18.5" ry="17" fill="#ffe0bf" />
            {kind === 'maruko' && <path d="M-19-36 L-19-47 Q0-59 19-47 L19-34 L14-41 L10-36 L5-42 L0-37 L-5-42 L-10-36 L-15-41Z" fill="#302a27" />}
            {tama && <path d="M-19-37 Q-21-53-5-53 Q0-57 5-53 Q21-52 19-36 L11-40 L4-42 L0-48 L-4-42 L-11-40Z" fill="#302a27" />}
            {kind === 'hanawa' && <path d="M-19-36 Q-28-53-9-55 Q1-61 15-52 Q24-47 19-39 Q8-32-3-40 Q15-43 5-49 Q-6-44-19-36Z" fill="#302a27" />}
            {tama ? <g fill="#fff8" strokeWidth="1.5"><circle cx="-8" cy="-33" r="7" /><circle cx="8" cy="-33" r="7" /><path d="M-1-33h2" fill="none" /></g> : <path d="M-11-38q3-2 6 0 M5-38q3-2 6 0" fill="none" />}
            <g fill="#302a27" stroke="none"><ellipse cx="-7.5" cy="-32" rx="1.65" ry="2.4" /><ellipse cx="7.5" cy="-32" rx="1.65" ry="2.4" /></g>
            <g fill="#ee9a86" opacity=".65" stroke="none"><ellipse cx="-12" cy="-27" rx="4" ry="2" /><ellipse cx="12" cy="-27" rx="4" ry="2" /></g>
            <path d="M-4-25 Q0-19 5-25" fill="#da6d68" />
            {kind === 'hanawa' && <path d="M23-49v6 M20-46h6" stroke="#e6b95b" strokeWidth="1.5" />}
        </g>
    </g>;
}

// Prefer the largest readable single-line label. Split only if a single line
// would be too small to read; keep both lines entirely within the inner oval.
export function layoutReminder(text) {
    const value = String(text || '').replace(/\s+/g, '');
    const length = Math.max(1, Array.from(value).length);
    return {
        text: value,
        fontSize: Math.max(30, Math.min(74, 650 / length))
    };
}

export default function RaceTrack({ progress, active, text, color = 'stroke-green-500' }) {
    const running = active && progress < 1;
    const messageLayout = layoutReminder(text);
    return <div className="school-race" aria-label={`${text}，時間已過 ${Math.round(progress * 100)}%`}>
        <svg className="race-field" viewBox="-270 -245 1250 540" preserveAspectRatio="xMidYMid meet" role="img" aria-label="三道獨立跑道，小丸子、花輪、小玉各跑一道，大頭Q版人物與進度條同向移動">
            {RUNNERS.map((runner, lane) => {
                const radius = RACE_GEOMETRY.innerRadius + lane * RACE_GEOMETRY.laneGap;
                return <g key={`lane-${runner.kind}`} data-race-lane={lane + 1}>
                    <rect
                        x={RACE_GEOMETRY.left - radius}
                        y={RACE_GEOMETRY.centerY - radius}
                        width={RACE_GEOMETRY.straight + 2 * radius}
                        height={2 * radius}
                        rx={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={RACE_GEOMETRY.laneWidth}
                    />
                    {lane === 0 && (
                        <rect
                            x={RACE_GEOMETRY.left - radius}
                            y={RACE_GEOMETRY.centerY - radius}
                            width={RACE_GEOMETRY.straight + 2 * radius}
                            height={2 * radius}
                            rx={radius}
                            fill="none"
                            className={`track-transition race-time-progress ${color}`}
                            strokeWidth="9"
                            pathLength="100"
                            strokeDasharray="100"
                            strokeDashoffset={progress * 100}
                            strokeLinecap="round"
                        />
                    )}
                    <text x={RACE_GEOMETRY.left + 42} y={RACE_GEOMETRY.centerY - radius} textAnchor="middle" dominantBaseline="central" fill="#4b5563" fontSize="24" fontWeight="bold">{lane + 1}</text>
                </g>;
            })}
            <foreignObject x="-35" y="-30" width="770" height="110" className="race-message-zone">
                <div xmlns="http://www.w3.org/1999/xhtml" className="race-message-box">
                    <span className="race-message-text" style={{ fontSize: `${messageLayout.fontSize}px` }}>{messageLayout.text}</span>
                </div>
            </foreignObject>
            <g className="race-start" aria-label="起跑位置">
                <line
                    x1={RACE_GEOMETRY.left}
                    x2={RACE_GEOMETRY.left}
                    y1={RACE_GEOMETRY.centerY - (RACE_GEOMETRY.innerRadius + 2 * RACE_GEOMETRY.laneGap) - RACE_GEOMETRY.laneWidth / 2}
                    y2={RACE_GEOMETRY.centerY - RACE_GEOMETRY.innerRadius + RACE_GEOMETRY.laneWidth / 2}
                    stroke="#ffffff"
                    strokeWidth="5"
                />
                <line
                    x1={RACE_GEOMETRY.left - 3}
                    x2={RACE_GEOMETRY.left - 3}
                    y1={RACE_GEOMETRY.centerY - (RACE_GEOMETRY.innerRadius + 2 * RACE_GEOMETRY.laneGap) - RACE_GEOMETRY.laneWidth / 2}
                    y2={RACE_GEOMETRY.centerY - RACE_GEOMETRY.innerRadius + RACE_GEOMETRY.laneWidth / 2}
                    stroke="#6b7280"
                    strokeWidth="1.25"
                />
            </g>
            {RUNNERS.map((runner, lane) => {
                // No CSS translation tween: a straight interpolation cuts across
                // a curved lane. Every pose comes from that lane's own radius.
                const position = runnerPose(progress, lane, active);
                return <g key={runner.kind} className="race-runner" data-runner-lane={lane + 1} style={{ transform: `translate(${position.x}px, ${position.y}px)`, '--run-delay': `${lane * -.11}s` }}><g transform={`translate(0 ${RACE_GEOMETRY.spriteCenterY}) scale(${position.facing * RACE_GEOMETRY.spriteScale} ${RACE_GEOMETRY.spriteScale})`}><Character runner={runner} running={running} /></g></g>;
            })}
        </svg>
    </div>;
}

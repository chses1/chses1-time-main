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
    left: 25, right: 365, centerY: 25, straight: 340,
    innerRadius: 118, laneGap: 82, laneWidth: 78,
    spriteScale: .8, spriteCenterY: 0
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

// Keep every reminder inside a rectangle wholly contained by the inner oval.
// Explicit line breaks prevent long messages from extending into either bend.
export function layoutReminder(text) {
    const known = {
        '考試時間剩下一半': ['考試時間', '剩下一半'],
        '考試時間不到10分鐘': ['考試時間', '不到10分鐘'],
        '請收拾東西在座位上坐好': ['請收拾東西', '在座位上坐好'],
        '快去上廁所喝水': ['快去上廁所', '喝水']
    };
    const chars = Array.from(text);
    const lines = known[text] || (chars.length > 7
        ? [chars.slice(0, Math.ceil(chars.length / 2)).join(''), chars.slice(Math.ceil(chars.length / 2)).join('')]
        : [text]);
    const maxLength = Math.max(1, ...lines.map(line => Array.from(line).length));
    return { lines, fontSize: Math.min(40, 360 / maxLength, 94 / (lines.length * 1.1)) };
}

export default function RaceTrack({ progress, active, text, color = 'stroke-green-500' }) {
    const running = active && progress < 1;
    const messageLayout = layoutReminder(text);
    return <div className="school-race" aria-label={`${text}，時間已過 ${Math.round(progress * 100)}%`}>
        <svg className="race-field" viewBox="-310 -330 1010 710" preserveAspectRatio="xMidYMid meet" role="img" aria-label="三道獨立跑道，小丸子、花輪、小玉各跑一道，大頭Q版人物與進度條同向移動">
            <rect x="-45" y="-45" width="480" height="140" rx="70" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <rect x="-45" y="-45" width="480" height="140" rx="70" fill="none" className={`track-transition race-time-progress ${color}`} strokeWidth="8" pathLength="100" strokeDasharray="100" strokeDashoffset={progress * 100} strokeLinecap="round" />
            <foreignObject x="9" y="-25" width="372" height="100" className="race-message-zone">
                <div xmlns="http://www.w3.org/1999/xhtml" className="race-message-box">
                    <span className="race-message-text" style={{ fontSize: `${messageLayout.fontSize}px` }}>{messageLayout.lines.join('\n')}</span>
                </div>
            </foreignObject>
            {RUNNERS.map((runner, lane) => {
                const radius = RACE_GEOMETRY.innerRadius + lane * RACE_GEOMETRY.laneGap;
                return <g key={`lane-${runner.kind}`} data-race-lane={lane + 1}>
                    <rect x={25 - radius} y={25 - radius} width={340 + 2 * radius} height={2 * radius} rx={radius} fill="none" stroke="#e5e7eb" strokeWidth={RACE_GEOMETRY.laneWidth} />
                    <text x="75" y={25 - radius} textAnchor="middle" dominantBaseline="central" fill="#4b5563" fontSize="26" fontWeight="bold">{lane + 1}</text>
                </g>;
            })}
            <g className="race-start" aria-label="起跑線">
                <line x1="25" x2="25" y1="-296" y2="-54" stroke="#ffffff" strokeWidth="6" />
                <line x1="21" x2="21" y1="-296" y2="-54" stroke="#6b7280" strokeWidth="1.5" />
                <text x="25" y="-310" textAnchor="middle" fill="#4b5563" fontSize="17" fontWeight="bold">起跑線</text>
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

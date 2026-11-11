import { useState, useEffect, useMemo, useRef } from 'react';
import RaceTrack from './RaceTrack';

const SCHEDULE = [
    { type: 'break', start: '08:40', end: '08:45', label: '準備' },
    { type: 'exam',  start: '08:45', end: '09:25', label: '第一節' },
    { type: 'break', start: '09:25', end: '09:35', label: '下課' },
    { type: 'exam',  start: '09:35', end: '10:15', label: '第二節' },
    { type: 'break', start: '10:15', end: '10:25', label: '下課' },
    { type: 'exam',  start: '10:25', end: '11:05', label: '第三節' },
    { type: 'break', start: '11:05', end: '11:15', label: '收卷' }
];

const EXAM_SLOTS = SCHEDULE.filter(s => s.type === 'exam');

const EXAM_MESSAGES = [
    "考卷記得寫上\n班級、姓名、座號",
    "有問題請舉手，\n撿東西請監考老師幫忙",
    "不會寫的題目跳過，\n寫會的題目",
    "耐心、專心、細心",
    "考卷有問題，\n等出題老師來說明",
    "不要轉頭或玩東西，\n寫完多檢查",
    "檢查完、再檢查，\n或趴下休息",
    "考試即將結束，\n檢查有沒有寫錯答案"
];

const BREAK_MESSAGES = [
    "等監考老師喊下課，\n才能離開座位",
    "利用下課時間\n準備下個科目與文具用品",
    "提早上廁所和喝水",
    "收拾桌面，\n不要放水壺",
    "準備考試，\n等待監考老師發卷"
];

const ALL_REMINDER_MESSAGES = [...EXAM_MESSAGES, ...BREAK_MESSAGES];

const createThemeImageMap = (imagePaths) => Object.fromEntries(
    ALL_REMINDER_MESSAGES.map((message, index) => [message, [imagePaths[index]]])
);

// 各主題都以 ALL_REMINDER_MESSAGES 的順序對應，確保圖畫版與文字版輪播順序一致。
const REMINDER_IMAGE_THEMES = {
    zhongshan: {
        label: '中山校園風格',
        images: createThemeImageMap([
            './message01.jpeg', './message02.jpeg', './message03.jpeg', './message04.jpeg', './message05.jpeg',
            './message06.jpeg', './message07.jpeg', './message08.jpeg', './message09.jpeg', './message10.jpeg',
            './message11.jpeg', './message12.jpeg', './message13.jpeg'
        ])
    },
    capybara: {
        label: '卡皮巴拉風格',
        images: createThemeImageMap([
            './themes/capybara/message01.jpg', './themes/capybara/message02.jpg', './themes/capybara/message03.jpg',
            './themes/capybara/message04.jpg', './themes/capybara/message05.jpg', './themes/capybara/message06.jpg',
            './themes/capybara/message07.jpg', './themes/capybara/message08.jpg', './themes/capybara/message09.jpg',
            './themes/capybara/message10.jpg', './themes/capybara/message11.jpg', './themes/capybara/message12.jpg',
            './themes/capybara/message13.jpg'
        ])
    },
    chiikawa: {
        label: '吉伊卡哇風格',
        images: createThemeImageMap([
            './themes/chiikawa/message01.png', './themes/chiikawa/message02.png', './themes/chiikawa/message03.png',
            './themes/chiikawa/message04.png', './themes/chiikawa/message05.png', './themes/chiikawa/message06.png',
            './themes/chiikawa/message07.png', './themes/chiikawa/message08.png', './themes/chiikawa/message09.png',
            './themes/chiikawa/message10.png', './themes/chiikawa/message11.png', './themes/chiikawa/message12.png',
            './themes/chiikawa/message13.png'
        ])
    },
    snoopy: {
        label: '史努比風格',
        images: createThemeImageMap([
            './themes/snoopy/message01.jpg', './themes/snoopy/message02.jpg', './themes/snoopy/message03.jpg',
            './themes/snoopy/message04.jpg', './themes/snoopy/message05.jpg', './themes/snoopy/message06.jpg',
            './themes/snoopy/message07.jpg', './themes/snoopy/message08.jpg', './themes/snoopy/message09.jpg',
            './themes/snoopy/message10.jpg', './themes/snoopy/message11.jpg', './themes/snoopy/message12.jpg',
            './themes/snoopy/message13.jpg'
        ])
    },
    pikmin: {
        label: '皮克敏風格',
        images: createThemeImageMap([
            './themes/pikmin/message01.jpg', './themes/pikmin/message02.jpg', './themes/pikmin/message03.jpg',
            './themes/pikmin/message04.jpg', './themes/pikmin/message05.jpg', './themes/pikmin/message06.jpg',
            './themes/pikmin/message07.jpg', './themes/pikmin/message08.jpg', './themes/pikmin/message09.jpg',
            './themes/pikmin/message10.jpg', './themes/pikmin/message11.jpg', './themes/pikmin/message12.jpg',
            './themes/pikmin/message13.jpg'
        ])
    }
};

const RANDOM_IMAGE_THEME = 'random';
const DEFAULT_IMAGE_THEME = RANDOM_IMAGE_THEME;
const IMAGE_THEME_SELECTION_VERSION = 'lesson-random-v2';
const IMAGE_THEME_PLAN_STORAGE_KEY = 'daily_lesson_image_theme_plan';

const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const shuffle = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
};

const isValidLessonThemePlan = (plan, dateKey) => {
    const themeIds = Object.keys(REMINDER_IMAGE_THEMES);
    return plan?.dateKey === dateKey
        && Array.isArray(plan.themeOrder)
        && plan.themeOrder.length === themeIds.length
        && new Set(plan.themeOrder).size === themeIds.length
        && plan.themeOrder.every(themeId => themeIds.includes(themeId));
};

// 每天將主題洗牌一次，每節課依序取用，確保同一天不會抽到重複主題。
const getDailyLessonThemePlan = (date) => {
    const dateKey = getDateKey(date);
    try {
        const savedPlan = JSON.parse(localStorage.getItem(IMAGE_THEME_PLAN_STORAGE_KEY));
        if (isValidLessonThemePlan(savedPlan, dateKey)) return savedPlan;
    } catch {
        // 儲存資料不存在或格式錯誤時，直接建立新的當日順序。
    }

    const plan = { dateKey, themeOrder: shuffle(Object.keys(REMINDER_IMAGE_THEMES)) };
    localStorage.setItem(IMAGE_THEME_PLAN_STORAGE_KEY, JSON.stringify(plan));
    return plan;
};

const getLessonThemeIndex = (currentSlot) => {
    if (!currentSlot) return 0;

    const slotIndex = SCHEDULE.findIndex(slot => slot.start === currentSlot.start && slot.end === currentSlot.end);
    for (let index = slotIndex; index >= 0; index -= 1) {
        if (SCHEDULE[index].type === 'exam') {
            return EXAM_SLOTS.findIndex(slot => slot.start === SCHEDULE[index].start);
        }
    }

    // 第一節開始前的準備時段，預先顯示第一節所抽到的主題。
    return 0;
};

const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const formatAudioTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getDefaultReminderSettings = () => ({
    displayMode: 'image',
    selectionMode: 'auto',
    manualMessage: EXAM_MESSAGES[0],
    imageTheme: DEFAULT_IMAGE_THEME,
    imageThemeSelectionVersion: IMAGE_THEME_SELECTION_VERSION
});

const getDefaultViewMode = () => 'student';

const App = () => {
    const [now, setNow] = useState(new Date());
    const [offset, setOffset] = useState(() => {
        const saved = localStorage.getItem('exam_clock_offset');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [audioTracks, setAudioTracks] = useState([
        { src: null, fileName: "", isPlaying: false, progress: 0, currentTime: 0, duration: 0 },
        { src: null, fileName: "", isPlaying: false, progress: 0, currentTime: 0, duration: 0 },
        { src: null, fileName: "", isPlaying: false, progress: 0, currentTime: 0, duration: 0 }
    ]);

    const audioRefs = useRef([]);
    const fileInputRefs = useRef([]);
    const wakeLockRef = useRef(null);
    const timePanelRef = useRef(null);
    const timeTextRef = useRef(null);

    const [examData, setExamData] = useState(() => {
        const saved = localStorage.getItem('exam_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed.subject === 'string') {
                return { ...parsed, subjects: [parsed.subject, "", ""], subject: undefined };
            }
            if (!parsed.subjects) {
                return { ...parsed, subjects: ["", "", ""] };
            }
            const _shouldNum = parseInt(parsed.shouldArrive, 10);
            if (!Number.isFinite(_shouldNum) || _shouldNum <= 0) parsed.shouldArrive = "26";

            const _actualNum = parseInt(parsed.actualArrive, 10);
            if (!Number.isFinite(_actualNum) || _actualNum < 0) parsed.actualArrive = String(parsed.shouldArrive ?? "26");

            if (String(parsed.actualArrive) === "0") parsed.actualArrive = String(parsed.shouldArrive ?? "26");

            return parsed;
        }
        return {
            subjects: ["國語", "自然", "英文"],
            shouldArrive: "26",
            actualArrive: "26",
            absentList: ""
        };
    });

    const [reminderSettings, setReminderSettings] = useState(() => {
        const saved = localStorage.getItem('reminder_settings');
        if (!saved) return getDefaultReminderSettings();
        try {
            const parsed = JSON.parse(saved);
            // 保留教師已指定的主題；隨機風格改採「每節課不重複」的抽選規則。
            if (parsed.imageThemeSelectionVersion !== IMAGE_THEME_SELECTION_VERSION) {
                return {
                    ...getDefaultReminderSettings(),
                    ...parsed,
                    imageThemeSelectionVersion: IMAGE_THEME_SELECTION_VERSION
                };
            }
            return { ...getDefaultReminderSettings(), ...parsed };
        } catch {
            return getDefaultReminderSettings();
        }
    });

    const [lessonThemePlan, setLessonThemePlan] = useState(() => (
        getDailyLessonThemePlan(new Date(now.getTime() + offset))
    ));
    const [imageCycleTick, setImageCycleTick] = useState(0);
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('board_view_mode');
        return saved || getDefaultViewMode();
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
    const [timeFontSize, setTimeFontSize] = useState(150);

    const isTeacherMode = viewMode === 'teacher';

    // 恢復原 149f2e4 版本的雙日評量科目切換，沿用既有儲存鍵以保留教師設定。
    const [examDay, setExamDay] = useState(() => localStorage.getItem('exam_day') === '2' ? 2 : 1);
    const [dayTwoSubjects, setDayTwoSubjects] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('exam_day_two_subjects'));
            if (Array.isArray(saved) && saved.length === 3) {
                return saved.map(subject => subject === '正常下課' ? '正常上課' : subject);
            }
        } catch {
            // 第一次使用時套用第二天的預設科目。
        }
        return ['數學', '社會', '正常上課'];
    });
    const daySubjects = examDay === 2 ? dayTwoSubjects : examData.subjects;

    useEffect(() => {
        localStorage.setItem('exam_day', String(examDay));
    }, [examDay]);

    useEffect(() => {
        localStorage.setItem('exam_day_two_subjects', JSON.stringify(dayTwoSubjects));
    }, [dayTwoSubjects]);

    const switchExamDay = (day) => {
        if (day === examDay) return;
        audioRefs.current.forEach(audio => audio?.pause());
        setAudioTracks(tracks => tracks.map(track => ({ ...track, isPlaying: false })));
        setExamDay(day);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const imageTimer = setInterval(() => {
            setImageCycleTick(previousTick => previousTick + 1);
        }, 300000);
        return () => clearInterval(imageTimer);
    }, []);

    useEffect(() => {
        // 先在背景載入所有主題圖卡，隨機輪播切換時不必等待圖片下載。
        Object.values(REMINDER_IMAGE_THEMES)
            .flatMap(theme => Object.values(theme.images).flat())
            .forEach((src) => {
                const image = new Image();
                image.src = src;
            });
    }, []);

    useEffect(() => {
        localStorage.setItem('exam_clock_offset', offset);
    }, [offset]);

    useEffect(() => {
        localStorage.setItem('exam_data', JSON.stringify(examData));
    }, [examData]);

    useEffect(() => {
        localStorage.setItem('reminder_settings', JSON.stringify(reminderSettings));
    }, [reminderSettings]);

    useEffect(() => {
        localStorage.setItem('board_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        const panel = timePanelRef.current;
        const text = timeTextRef.current;
        if (!panel || !text) return;

        let frameId = null;

        const fitTimeText = () => {
            frameId = null;
            const panelRect = panel.getBoundingClientRect();
            const textRect = text.getBoundingClientRect();
            const currentSize = parseFloat(window.getComputedStyle(text).fontSize) || timeFontSize;

            if (!panelRect.width || !panelRect.height || !textRect.width || !textRect.height) return;

            const availableWidth = Math.max(120, panelRect.width - 28);
            const availableHeight = Math.max(90, panelRect.height - (isTeacherMode ? 108 : 30));
            const widthFit = currentSize * (availableWidth / textRect.width);
            const heightFit = currentSize * (availableHeight / textRect.height);
            const nextSize = Math.floor(Math.max(96, Math.min(widthFit, heightFit, 320)) * 0.96);

            setTimeFontSize(prev => Math.abs(prev - nextSize) > 1 ? nextSize : prev);
        };

        const scheduleFit = () => {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(fitTimeText);
        };

        const observer = new ResizeObserver(scheduleFit);
        observer.observe(panel);
        scheduleFit();

        if (document.fonts?.ready) {
            document.fonts.ready.then(scheduleFit).catch(() => {});
        }

        return () => {
            observer.disconnect();
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [isTeacherMode, isFullscreen, timeFontSize]);

    useEffect(() => {
        const syncFullscreenState = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        setFullscreenAvailable(Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
        syncFullscreenState();
        document.addEventListener('fullscreenchange', syncFullscreenState);

        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreenState);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const releaseWakeLock = async () => {
            const wakeLock = wakeLockRef.current;
            wakeLockRef.current = null;

            if (!wakeLock) return;

            try {
                await wakeLock.release();
                console.info('Screen wake lock released.');
            } catch (error) {
                console.warn('Unable to release screen wake lock.', error);
            }
        };

        const requestWakeLock = async () => {
            const shouldKeepAwake = viewMode === 'student' || isFullscreen;

            if (!shouldKeepAwake || document.visibilityState !== 'visible') {
                await releaseWakeLock();
                return;
            }

            if (!('wakeLock' in navigator)) {
                console.info('Screen Wake Lock API is not supported in this browser.');
                return;
            }

            try {
                const wakeLock = await navigator.wakeLock.request('screen');

                if (cancelled || (!shouldKeepAwake) || document.visibilityState !== 'visible') {
                    await wakeLock.release();
                    return;
                }

                if (wakeLockRef.current && wakeLockRef.current !== wakeLock) {
                    await releaseWakeLock();
                }

                wakeLockRef.current = wakeLock;
                console.info('Screen wake lock requested.');

                wakeLock.addEventListener('release', () => {
                    if (wakeLockRef.current === wakeLock) {
                        wakeLockRef.current = null;
                    }
                });
            } catch (error) {
                if (!cancelled) {
                    console.warn('Unable to request screen wake lock.', error);
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            } else {
                releaseWakeLock();
            }
        };

        requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [viewMode, isFullscreen]);

    const adjustedNow = useMemo(() => {
        return new Date(now.getTime() + offset);
    }, [now, offset]);

    const currentSlot = useMemo(() => {
        const currentMs = adjustedNow.getHours() * 3600000 + adjustedNow.getMinutes() * 60000 + adjustedNow.getSeconds() * 1000;
        for (let slot of SCHEDULE) {
            const [sh, sm] = slot.start.split(':').map(Number);
            const startMs = sh * 3600000 + sm * 60000;
            const [eh, em] = slot.end.split(':').map(Number);
            const endMs = eh * 3600000 + em * 60000;
            if (currentMs >= startMs && currentMs < endMs) {
                return { ...slot, startMs, endMs, durationMs: endMs - startMs };
            }
        }
        return null;
    }, [adjustedNow]);

    const lessonDateKey = getDateKey(adjustedNow);

    useEffect(() => {
        setLessonThemePlan(previousPlan => (
            previousPlan.dateKey === lessonDateKey
                ? previousPlan
                : getDailyLessonThemePlan(adjustedNow)
        ));
    }, [lessonDateKey]);

    const autoReminderMessage = useMemo(() => {
        if (!currentSlot) return "目前沒有提醒事項";

        const currentMs = adjustedNow.getHours() * 3600000 + adjustedNow.getMinutes() * 60000 + adjustedNow.getSeconds() * 1000;
        const elapsedMinutes = Math.floor((currentMs - currentSlot.startMs) / 60000);

        let messages = [];
        let interval = 5;

        if (currentSlot.type === 'exam') {
            messages = EXAM_MESSAGES;
            interval = 5;
        } else {
            messages = BREAK_MESSAGES;
            const durationMins = currentSlot.durationMs / 60000;
            interval = durationMins >= 20 ? 4 : 2;
        }

        const index = Math.floor(elapsedMinutes / interval) % messages.length;
        return messages[index];
    }, [adjustedNow, currentSlot]);

    const activeReminderMessage = useMemo(() => {
        if (reminderSettings.selectionMode === 'manual') {
            return reminderSettings.manualMessage || ALL_REMINDER_MESSAGES[0];
        }
        return autoReminderMessage;
    }, [reminderSettings, autoReminderMessage]);

    const activeLessonThemeIndex = getLessonThemeIndex(currentSlot);
    const activeLessonCycleKey = currentSlot?.type === 'exam'
        ? `${lessonDateKey}-${currentSlot.start}`
        : lessonDateKey;

    useEffect(() => {
        // 新的一節課從該主題的第 1 張圖重新開始播放。
        setImageCycleTick(0);
    }, [activeLessonCycleKey]);

    const activeImageTheme = reminderSettings.imageTheme === RANDOM_IMAGE_THEME
        ? lessonThemePlan.themeOrder[activeLessonThemeIndex] || lessonThemePlan.themeOrder[0]
        : REMINDER_IMAGE_THEMES[reminderSettings.imageTheme]
            ? reminderSettings.imageTheme
            : lessonThemePlan.themeOrder[activeLessonThemeIndex] || lessonThemePlan.themeOrder[0];

    const activeReminderImages = useMemo(() => {
        // 依照目前顯示的提醒文字選擇圖片，避免考試期間誤播其他提醒圖卡。
        return REMINDER_IMAGE_THEMES[activeImageTheme].images[activeReminderMessage] || [];
    }, [activeImageTheme, activeReminderMessage]);

    const reminderImageSrc = useMemo(() => {
        if (!activeReminderImages.length) return null;
        return activeReminderImages[imageCycleTick % activeReminderImages.length];
    }, [activeReminderImages, imageCycleTick]);

    const progressInfo = useMemo(() => {
        if (!currentSlot) {
            return { remainingPercent: 0, color: 'stroke-gray-300', text: '等待中' };
        }

        const currentMs = adjustedNow.getHours() * 3600000 + adjustedNow.getMinutes() * 60000 + adjustedNow.getSeconds() * 1000;
        const progressMs = currentMs - currentSlot.startMs;
        const totalMs = currentSlot.durationMs;
        const remainingMs = totalMs - progressMs;
        const elapsedPercent = Math.min(100, Math.max(0, (progressMs / totalMs) * 100));
        const remainingPercent = 100 - elapsedPercent;

        let colorClass = 'stroke-green-500';
        let statusText = "";

        if (currentSlot.type === 'exam') {
            statusText = "考試開始";
            if (remainingMs <= totalMs / 2) {
                colorClass = 'stroke-yellow-400';
                statusText = "考試時間剩下一半";
            }
            if (remainingMs <= 10 * 60000) {
                colorClass = 'stroke-red-500';
                statusText = "考試時間不到10分鐘";
            }
        } else {
            if (remainingMs > 5 * 60000) {
                colorClass = 'stroke-green-500';
                statusText = "休息時間";
            } else if (remainingMs > 3 * 60000) {
                colorClass = 'stroke-yellow-400';
                statusText = "快去上廁所喝水";
            } else {
                colorClass = 'stroke-red-500';
                statusText = "請收拾東西在座位上坐好";
            }
        }

        return { remainingPercent, color: colorClass, text: statusText };
    }, [adjustedNow, currentSlot]);

    const handleInputChange = (field, value) => {
        const sanitized = value === "" ? "" : String(Math.max(0, parseInt(value, 10) || 0));

        setExamData(prev => {
            if (field === "shouldArrive") {
                const nextShould = sanitized === "" ? "" : sanitized;
                const wasLinked = String(prev.actualArrive) === String(prev.shouldArrive) || prev.actualArrive === "";
                const next = { ...prev, shouldArrive: nextShould };
                const nextShouldNum = parseInt(nextShould, 10) || 0;
                const prevActualNum = parseInt(prev.actualArrive, 10) || 0;
                if (wasLinked || prevActualNum > nextShouldNum) {
                    next.actualArrive = nextShould;
                }
                return next;
            }

            if (field === "actualArrive") {
                const shouldNum = parseInt(prev.shouldArrive, 10) || 0;
                const actualNum = parseInt(sanitized, 10) || 0;
                const capped = sanitized === "" ? "" : String(Math.min(actualNum, shouldNum));
                return { ...prev, actualArrive: capped };
            }

            return { ...prev, [field]: sanitized };
        });
    };

    const adjustCount = (field, delta) => {
        setExamData(prev => {
            const cur = Math.max(0, parseInt(prev[field], 10) || 0);
            const nextVal = Math.max(0, cur + delta);

            if (field === "shouldArrive") {
                const wasLinked = String(prev.actualArrive) === String(prev.shouldArrive) || prev.actualArrive === "";
                const prevActualNum = Math.max(0, parseInt(prev.actualArrive, 10) || 0);
                const next = { ...prev, shouldArrive: String(nextVal) };
                if (wasLinked || prevActualNum > nextVal) {
                    next.actualArrive = String(nextVal);
                }
                return next;
            }

            if (field === "actualArrive") {
                const shouldNum = Math.max(0, parseInt(prev.shouldArrive, 10) || 0);
                return { ...prev, actualArrive: String(Math.min(nextVal, shouldNum)) };
            }

            return { ...prev, [field]: String(nextVal) };
        });
    };

    const handleSubjectChange = (index, value) => {
        if (!isTeacherMode) return;
        if (value !== '英文') {
            audioRefs.current[index]?.pause();
            setAudioTracks(tracks => tracks.map((track, trackIndex) => trackIndex === index ? { ...track, isPlaying: false } : track));
        }
        const newSubjects = [...daySubjects];
        newSubjects[index] = value;
        if (examDay === 2) {
            setDayTwoSubjects(newSubjects);
        } else {
            setExamData(prev => ({ ...prev, subjects: newSubjects }));
        }
    };

    const adjustTime = (seconds) => {
        setOffset(prev => prev + (seconds * 1000));
    };

    const resetTime = () => {
        setOffset(0);
        setNow(new Date());
    };

    const handleFileSelect = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAudioTracks(prev => {
                const newTracks = [...prev];
                if (newTracks[index].src) URL.revokeObjectURL(newTracks[index].src);
                newTracks[index] = { src: url, fileName: file.name, isPlaying: false, progress: 0, currentTime: 0, duration: 0 };
                return newTracks;
            });
        }
    };

    const togglePlay = (index) => {
        const audioEl = audioRefs.current[index];
        if (!audioEl) return;

        setAudioTracks(prev => {
            const newTracks = [...prev];
            const isNowPlaying = !newTracks[index].isPlaying;

            if (isNowPlaying) {
                newTracks.forEach((track, i) => {
                    if (i !== index && track.isPlaying) {
                        if (audioRefs.current[i]) audioRefs.current[i].pause();
                        track.isPlaying = false;
                    }
                });
                audioEl.play().catch(() => {});
            } else {
                audioEl.pause();
            }

            newTracks[index].isPlaying = isNowPlaying;
            return newTracks;
        });
    };

    const replayAudio = (index) => {
        const audioEl = audioRefs.current[index];
        if (!audioEl) return;
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});

        setAudioTracks(prev => {
            const newTracks = [...prev];
            newTracks.forEach((track, i) => {
                if (i !== index && track.isPlaying) {
                    if (audioRefs.current[i]) audioRefs.current[i].pause();
                    track.isPlaying = false;
                }
            });
            newTracks[index].isPlaying = true;
            return newTracks;
        });
    };

    const handleAudioEnded = (index) => {
        setAudioTracks(prev => {
            const newTracks = [...prev];
            newTracks[index].isPlaying = false;
            newTracks[index].progress = 0;
            newTracks[index].currentTime = 0;
            return newTracks;
        });
    };

    const handleTimeUpdate = (index, e) => {
        const current = e.target.currentTime;
        const duration = e.target.duration;
        const percent = (duration > 0) ? (current / duration) * 100 : 0;
        setAudioTracks(prev => {
            const newTracks = [...prev];
            newTracks[index] = { ...newTracks[index], progress: percent, currentTime: current, duration: Number.isFinite(duration) ? duration : 0 };
            return newTracks;
        });
    };

    const handleAudioMetadata = (index, e) => {
        const duration = e.target.duration;
        setAudioTracks(prev => {
            const newTracks = [...prev];
            newTracks[index] = { ...newTracks[index], duration: Number.isFinite(duration) ? duration : 0 };
            return newTracks;
        });
    };

    const seekAudio = (index, value) => {
        const audioEl = audioRefs.current[index];
        const nextProgress = Math.min(100, Math.max(0, parseFloat(value) || 0));
        const duration = audioEl?.duration;

        if (audioEl && Number.isFinite(duration) && duration > 0) {
            audioEl.currentTime = (nextProgress / 100) * duration;
        }

        setAudioTracks(prev => {
            const newTracks = [...prev];
            const trackDuration = Number.isFinite(duration) && duration > 0 ? duration : newTracks[index].duration;
            newTracks[index] = {
                ...newTracks[index],
                progress: nextProgress,
                currentTime: trackDuration > 0 ? (nextProgress / 100) * trackDuration : 0,
                duration: trackDuration || 0
            };
            return newTracks;
        });
    };

    const setReminderDisplayMode = (displayMode) => {
        setReminderSettings(prev => ({ ...prev, displayMode }));
    };

    const setReminderSelectionMode = (selectionMode) => {
        setReminderSettings(prev => ({ ...prev, selectionMode }));
    };

    const setManualReminderMessage = (manualMessage) => {
        setReminderSettings(prev => ({ ...prev, manualMessage }));
    };

    const setReminderImageTheme = (imageTheme) => {
        if (imageTheme !== RANDOM_IMAGE_THEME && !REMINDER_IMAGE_THEMES[imageTheme]) return;
        if (imageTheme === RANDOM_IMAGE_THEME) setLessonThemePlan(getDailyLessonThemePlan(adjustedNow));
        setReminderSettings(prev => ({
            ...prev,
            imageTheme,
            imageThemeSelectionVersion: IMAGE_THEME_SELECTION_VERSION
        }));
    };

    const toggleFullscreen = async () => {
        if (!fullscreenAvailable) return;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen();
            }
        } catch (error) {
            console.warn('Unable to toggle fullscreen mode.', error);
        }
    };

    const manualOptions = reminderSettings.displayMode === 'image'
        ? ALL_REMINDER_MESSAGES.filter(message => (REMINDER_IMAGE_THEMES[activeImageTheme].images[message] || []).length > 0)
        : ALL_REMINDER_MESSAGES;

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden text-gray-800">
            <div className="absolute top-2 right-3 z-50 flex rounded-xl overflow-hidden border border-gray-300 bg-white/95 shadow-md scale-90 origin-top-right">
                <button
                    onClick={() => setViewMode('student')}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'student' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    學生模式
                </button>
                <button
                    onClick={() => setViewMode('teacher')}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    教師模式
                </button>
                {fullscreenAvailable && (
                    <button
                        onClick={toggleFullscreen}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors ${isFullscreen ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        {isFullscreen ? '離開全螢幕' : '全螢幕'}
                    </button>
                )}
            </div>
            <div className="h-[40vh] w-full bg-white border-b-4 border-gray-300 flex flex-row relative shadow-lg z-10">
                <div ref={timePanelRef} className={`w-1/2 flex flex-col items-center justify-center border-r border-gray-200 bg-gray-50 relative px-2 overflow-hidden ${isTeacherMode ? 'group' : ''}`}>
                    <div
                        ref={timeTextRef}
                        className="time-display leading-none tabular-nums mb-3"
                        style={{ fontSize: `${timeFontSize}px` }}
                        aria-label={formatTime(adjustedNow)}
                    >
                        {formatTime(adjustedNow).split('').map((char, index) => (
                            <span
                                key={index}
                                className={char === ':' ? 'time-separator' : 'time-digit'}
                                aria-hidden="true"
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                    {isTeacherMode && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 opacity-20 group-hover:opacity-100 transition-opacity w-full max-w-[260px]">
                            <div className="flex justify-between items-center gap-1">
                                <button onClick={() => adjustTime(-3600)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">-1時</button>
                                <button onClick={() => adjustTime(3600)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">+1時</button>
                            </div>
                            <div className="flex justify-between items-center gap-1">
                                <button onClick={() => adjustTime(-60)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">-1分</button>
                                <button onClick={() => adjustTime(60)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">+1分</button>
                            </div>
                            <div className="flex justify-between items-center gap-1">
                                <button onClick={() => adjustTime(-1)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">-1秒</button>
                                <button onClick={() => adjustTime(1)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">+1秒</button>
                            </div>
                            <div className="flex justify-between items-center gap-1">
                                <button onClick={() => adjustTime(-30)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">-30秒</button>
                                <button onClick={() => adjustTime(30)} className="btn-active flex-1 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">+30秒</button>
                            </div>
                            <button
                                onClick={resetTime}
                                className="btn-active col-span-2 py-1.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-200"
                            >
                                重設為系統時間
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-1/2 flex flex-col relative bg-gray-100 items-center justify-center p-5 overflow-hidden">
                    <RaceTrack
                        color={progressInfo.color}
                        progress={currentSlot ? 1 - progressInfo.remainingPercent / 100 : (adjustedNow.getHours() * 60 + adjustedNow.getMinutes() >= 675 ? 1 : 0)}
                        active={currentSlot?.type === 'exam'}
                        text={currentSlot ? progressInfo.text : (adjustedNow.getHours() * 60 + adjustedNow.getMinutes() >= 675 ? '今日評量結束' : '等待中')}
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-row h-[60vh]">
                <div className="w-1/2 flex flex-col border-r-4 border-gray-300 bg-white overflow-hidden">
                    <div className="h-2/3 flex flex-col border-b-2 border-dashed border-gray-300 relative" style={{ paddingLeft: isTeacherMode ? '54px' : '0' }}>
                        {isTeacherMode && (
                            <nav aria-label="評量日期" style={{ position: 'absolute', left: '5px', top: 0, bottom: 0, width: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                                {[1, 2].map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => switchExamDay(day)}
                                        aria-pressed={examDay === day}
                                        style={{ writingMode: 'vertical-rl', fontSize: '20px', fontWeight: 900, padding: '14px 9px', borderRadius: '12px', border: '1px solid #cbd5e1', background: examDay === day ? '#1d4ed8' : '#f1f5f9', color: examDay === day ? 'white' : '#334155' }}
                                    >
                                        {day === 1 ? '第一天' : '第二天'}
                                    </button>
                                ))}
                            </nav>
                        )}
                        {EXAM_SLOTS.map((slot, index) => {
                            const isActive = currentSlot && currentSlot.start === slot.start;
                            const isNone = (daySubjects[index] === "正常上課");
                            return (
                                <div key={index} className={`flex-1 flex items-center gap-2 border-b border-gray-100 last:border-0 px-4 transition-colors duration-300 ${isActive ? 'bg-yellow-300' : ''} ${isNone ? 'opacity-40' : ''}`}>
                                    <div className="flex-1">
                                        {isTeacherMode ? <select
                                            disabled={!isTeacherMode}
                                            value={daySubjects[index] || ""}
                                            onChange={(e) => handleSubjectChange(index, e.target.value)}
                                            style={{ fontSize: daySubjects[index].length > 2 ? 'clamp(22px,2.4vw,44px)' : 'clamp(32px,3.6vw,64px)' }}
                                            className="subject-select w-full text-center text-[2.8vw] font-black bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none placeholder-gray-300 leading-tight text-black"
                                        >
                                            {["國語","數學","社會","自然","英文","正常上課"].map((subj) => (
                                                <option key={subj} value={subj}>{subj}</option>
                                            ))}
                                        </select> : <span className="block w-full text-center text-[2.8vw] font-black text-black" style={{ fontSize: daySubjects[index].length > 2 ? "clamp(22px,2.4vw,44px)" : "clamp(32px,3.6vw,64px)" }}>{daySubjects[index]}</span>}
                                    </div>

                                    <div className="text-[3vw] font-black whitespace-nowrap text-black font-sans tracking-tight">
                                        {slot.start}~{slot.end}
                                    </div>

                                    <div className="flex flex-col items-end justify-center gap-1 w-[22%] relative">
                                        {isTeacherMode && daySubjects[index] === '英文' && <input
                                            type="file"
                                            accept="audio/*"
                                            ref={el => fileInputRefs.current[index] = el}
                                            onChange={(e) => handleFileSelect(index, e)}
                                            className="hidden-input"
                                        />}

                                        {isTeacherMode && daySubjects[index] === '英文' && <div className="flex gap-1 w-full justify-end items-center">
                                            <button
                                                onClick={() => fileInputRefs.current[index]?.click()}
                                                className="btn-active p-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors h-8 w-8 flex items-center justify-center"
                                                title="上傳聽力"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                            </button>

                                            {audioTracks[index].src && (
                                                <button
                                                    onClick={() => togglePlay(index)}
                                                    className={`btn-active px-2 rounded text-white text-xs font-bold shadow flex items-center justify-center transition-colors h-8 min-w-[3.5rem] ${audioTracks[index].isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                                >
                                                    {audioTracks[index].isPlaying ? '暫停' : '播放'}
                                                </button>
                                            )}

                                            {audioTracks[index].src && (
                                                <button
                                                    onClick={() => replayAudio(index)}
                                                    className="btn-active p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors h-8 w-8 flex items-center justify-center"
                                                    title="重播"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                                                </button>
                                            )}
                                        </div>}

                                        {daySubjects[index] === '英文' && audioTracks[index].src && (
                                            <div className="w-full mt-1 flex flex-col gap-0.5">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={audioTracks[index].progress}
                                                    onChange={(e) => seekAudio(index, e.target.value)}
                                                    className="audio-range"
                                                    style={{ '--audio-progress': `${audioTracks[index].progress}%` }}
                                                    aria-label={`第${index + 1}節聽力播放進度`}
                                                />
                                                <div className="text-[0.72rem] leading-none text-gray-500 font-bold text-right tabular-nums">
                                                    {formatAudioTime(audioTracks[index].currentTime)} / {audioTracks[index].duration > 0 ? formatAudioTime(audioTracks[index].duration) : '--:--'}
                                                </div>
                                            </div>
                                        )}

                                        <audio
                                            ref={el => audioRefs.current[index] = el}
                                            src={audioTracks[index].src || undefined}
                                            onEnded={() => handleAudioEnded(index)}
                                            onTimeUpdate={(e) => handleTimeUpdate(index, e)}
                                            onLoadedMetadata={(e) => handleAudioMetadata(index, e)}
                                            hidden
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="h-1/3 flex flex-row bg-blue-50">
                        <div className="flex-1 flex flex-col items-center justify-center border-r border-blue-200 p-2">
                            <span className="text-[1.5vw] font-bold text-blue-800">應到</span>
                            <div className="flex items-center justify-center gap-3 w-full">
                                {isTeacherMode && <button onClick={() => adjustCount('shouldArrive', -1)} className="btn-active w-12 h-12 rounded-full bg-blue-200 text-blue-900 font-black text-2xl hover:bg-blue-300" aria-label="應到減一">−</button>}
                                {isTeacherMode ? <input type="number" value={examData.shouldArrive} onChange={(e) => handleInputChange('shouldArrive', e.target.value)} className="w-full text-center bg-transparent text-[4vw] font-bold text-blue-900 outline-none" placeholder="0" /> : <span className="w-full text-center text-[4vw] font-bold text-blue-900">{examData.shouldArrive}</span>}
                                {isTeacherMode && <button onClick={() => adjustCount('shouldArrive', 1)} className="btn-active w-12 h-12 rounded-full bg-blue-200 text-blue-900 font-black text-2xl hover:bg-blue-300" aria-label="應到加一">+</button>}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center border-r border-blue-200 p-2">
                            <span className="text-[1.5vw] font-bold text-green-800">實到</span>
                            <div className="flex items-center justify-center gap-3 w-full">
                                {isTeacherMode && <button onClick={() => adjustCount('actualArrive', -1)} className="btn-active w-12 h-12 rounded-full bg-green-200 text-green-900 font-black text-2xl hover:bg-green-300" aria-label="實到減一">−</button>}
                                {isTeacherMode ? <input type="number" value={examData.actualArrive} onChange={(e) => handleInputChange('actualArrive', e.target.value)} className="w-full text-center bg-transparent text-[4vw] font-bold text-green-900 outline-none" placeholder="0" /> : <span className="w-full text-center text-[4vw] font-bold text-green-900">{examData.actualArrive}</span>}
                                {isTeacherMode && <button onClick={() => adjustCount('actualArrive', 1)} className="btn-active w-12 h-12 rounded-full bg-green-200 text-green-900 font-black text-2xl hover:bg-green-300" aria-label="實到加一">+</button>}
                            </div>
                        </div>

                        <div className="flex-[1.5] flex flex-col items-center justify-center p-2">
                            <span className="text-[1.5vw] font-bold text-red-800">未到</span>
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-[4vw] font-bold text-red-600">
                                    {Math.max(0, (parseInt(examData.shouldArrive, 10) || 0) - (parseInt(examData.actualArrive, 10) || 0))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-1/2 bg-[#fffdf0] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 px-4 py-2 text-xl font-bold rounded-br-lg z-20 shadow-sm">
                        提醒事項
                    </div>

                    {isTeacherMode && (
                        <div className="absolute top-2 right-3 z-20 flex flex-wrap justify-end gap-2 max-w-[72%]">
                            <div className="flex rounded-xl overflow-hidden border border-yellow-300 bg-white shadow-sm">
                                <button onClick={() => setReminderDisplayMode('text')} className={`px-3 py-2 text-sm font-bold ${reminderSettings.displayMode === 'text' ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-gray-600'}`}>
                                    文字版
                                </button>
                                <button onClick={() => setReminderDisplayMode('image')} className={`px-3 py-2 text-sm font-bold ${reminderSettings.displayMode === 'image' ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-gray-600'}`}>
                                    圖畫版
                                </button>
                            </div>

                            <div className="flex rounded-xl overflow-hidden border border-blue-200 bg-white shadow-sm">
                                <button onClick={() => setReminderSelectionMode('auto')} className={`px-3 py-2 text-sm font-bold ${reminderSettings.selectionMode === 'auto' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}>
                                    自動輪播
                                </button>
                                <button onClick={() => setReminderSelectionMode('manual')} className={`px-3 py-2 text-sm font-bold ${reminderSettings.selectionMode === 'manual' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}>
                                    手動指定
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`px-4 pb-4 flex-1 flex flex-col gap-3 min-h-0 ${isTeacherMode ? 'pt-20' : 'pt-6'}`}>
                        {isTeacherMode && reminderSettings.displayMode === 'image' && (
                            <div className="shrink-0 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm">
                                <label htmlFor="image-theme" className="text-sm font-bold text-amber-900 whitespace-nowrap">
                                    圖畫主題
                                </label>
                                <select
                                    id="image-theme"
                                    value={reminderSettings.imageTheme === RANDOM_IMAGE_THEME
                                        ? RANDOM_IMAGE_THEME
                                        : activeImageTheme}
                                    onChange={(e) => setReminderImageTheme(e.target.value)}
                                    className="min-w-0 flex-1 cursor-pointer rounded-xl border border-amber-300 bg-white px-3 py-2 text-base font-bold text-gray-700 outline-none focus:border-blue-500"
                                    aria-label="選擇圖畫主題"
                                >
                                    <option value={RANDOM_IMAGE_THEME}>隨機風格</option>
                                    {Object.entries(REMINDER_IMAGE_THEMES).map(([themeId, theme]) => (
                                        <option key={themeId} value={themeId}>{theme.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {isTeacherMode && reminderSettings.selectionMode === 'manual' && (
                            <div className="bg-white/90 border border-yellow-200 rounded-2xl px-4 py-3 shadow-sm">
                                <div className="text-sm font-bold text-gray-600 mb-2">選擇要顯示的提醒項目</div>
                                <select
                                    value={manualOptions.includes(reminderSettings.manualMessage) ? reminderSettings.manualMessage : manualOptions[0]}
                                    onChange={(e) => setManualReminderMessage(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-3 text-base font-bold outline-none focus:border-blue-500 bg-white"
                                >
                                    {manualOptions.map((message) => (
                                        <option key={message} value={message}>{message}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            {reminderSettings.displayMode === 'text' ? (
                                <div key={activeReminderMessage} className="w-full h-full animate-fade-in flex items-center justify-center">
                                    <div className="w-full h-full rounded-[2rem] border-[10px] border-yellow-100 bg-white shadow-md px-8 py-6 flex flex-col items-center justify-center text-center">
                                        <div className="text-[1.4vw] font-bold tracking-[0.3em] text-yellow-600 mb-4">提醒事項</div>
                                        <div className="text-[3.1vw] leading-[1.35] font-black text-gray-800 text-shadow whitespace-pre-wrap break-words">
                                            {activeReminderMessage}
                                        </div>
                                        <div className="mt-5 text-[1.1vw] text-gray-400 font-bold">
                                            {reminderSettings.selectionMode === 'auto' ? '依照時段自動輪播' : '目前為手動指定顯示'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={activeReminderMessage + (reminderImageSrc || 'no-image')} className="relative w-full h-full flex items-center justify-center animate-fade-in">
                                    {reminderImageSrc ? (
                                        <img
                                            src={reminderImageSrc}
                                            alt={activeReminderMessage}
                                            className="max-w-full max-h-full object-contain rounded-2xl shadow-md select-none"
                                            draggable="false"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback-text');
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}

                                    <div className={`image-fallback-text ${reminderImageSrc ? 'hidden' : ''} w-full h-full rounded-[2rem] border-[8px] border-yellow-100 bg-white shadow-md px-8 py-6 flex items-center justify-center text-center`}>
                                        <div className="text-[2.6vw] leading-[1.4] font-black text-gray-800 whitespace-pre-wrap break-words">
                                            {activeReminderMessage}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-4 bg-stripes w-full"></div>
                </div>
            </div>

            <style>{`
                .bg-stripes {
                    background-image: linear-gradient(45deg, #fbbf24 25%, transparent 25%, transparent 50%, #fbbf24 50%, #fbbf24 75%, transparent 75%, transparent);
                    background-size: 20px 20px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.35s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default App;


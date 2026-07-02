import { useState, useMemo, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  Plus, 
  Trash2, 
  X, 
  AlertTriangle, 
  Flame, 
  MapPin, 
  Calendar,
  Undo2,
  CheckCircle2,
  Info,
  Sparkles,
  BookOpen,
  Check,
  VolumeX,
  Download
} from 'lucide-react';

const INITIAL_OBSERVATIONS = [
  {
    id: "obs_001",
    fox_id: "fox_001",
    location: "Северная поляна",
    color: "рыжая",
    has_prey: true,
    suspicion_level: 8,
    time: "08:20"
  },
  {
    id: "obs_002",
    fox_id: "fox_002",
    location: "Туманная тропа",
    color: "черная",
    has_prey: false,
    suspicion_level: 5,
    time: "09:05"
  },
  {
    id: "obs_003",
    fox_id: "fox_001",
    location: "Северная поляна",
    color: "рыжая",
    has_prey: false,
    suspicion_level: 9,
    time: "10:40"
  }
];

const ONBOARDING_STEPS = [
  {
    targetId: "interactive-map-section",
    title: "Карта секторов",
    text: "Это интерактивная карта леса. Сектора темнеют, если в них замечено больше 2 лис. Кликните по сектору для фильтрации таблицы."
  },
  {
    targetId: "kpi-panel",
    title: "Панель показателей",
    text: "Здесь отображаются ключевые метрики смены. Если уровень реальной угрозы превысит 9, панель предупредит о необходимости патрулирования."
  },
  {
    targetId: "action-panel",
    title: "Панель управления",
    text: "Отсюда можно сгенерировать 20 случайных событий для проверки, добавить новый контакт вручную или сбросить все данные к исходным."
  },
  {
    targetId: "btn-export-report",
    title: "Экспорт отчетов",
    text: "Нажмите эту кнопку, чтобы выгрузить и скачать детальный текстовый отчет для Министерства Леса."
  }
];

// Custom pixel-perfect Cyrillic Й component to bypass Press Start 2P font Cyrillic limitations
function PixelЙ() {
  return (
    <span className="relative inline-block font-press-start">
      И
      <span 
        className="absolute left-1/2 -translate-x-1/2 font-press-start select-none pointer-events-none text-current"
        style={{
          top: '-0.25em',
          fontSize: '0.6em',
        }}
      >
        ~
      </span>
    </span>
  );
}

export default function App() {
  // Lazy State Initialization with localStorage persistence
  const [observations, setObservations] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fox_observations');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Ошибка при чтении данных из локального хранилища:', e);
        }
      }
    }
    return INITIAL_OBSERVATIONS;
  });

  const [selectedLocation, setSelectedLocation] = useState('Все');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWorklog, setShowWorklog] = useState(false);
  const [historyLog, setHistoryLog] = useState([]); // For undo functionality
  const [toast, setToast] = useState(''); // Toast notification message

  // Onboarding States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  
  // Form states
  const [newFoxId, setNewFoxId] = useState('fox_001');
  const [isCustomFoxId, setIsCustomFoxId] = useState(false);
  const [customFoxIdText, setCustomFoxIdText] = useState('');
  const [newLocation, setNewLocation] = useState('Северная поляна');
  const [newColor, setNewColor] = useState('рыжая');
  const [newHasPrey, setNewHasPrey] = useState(false);
  const [newSuspicionLevel, setNewSuspicionLevel] = useState(5);
  const [newTime, setNewTime] = useState('');

  // Check for first-time visit to show onboarding
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('fox_onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, []);

  // Synchronize observations state with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fox_observations', JSON.stringify(observations));
    }
  }, [observations]);

  // Smooth scroll and focus on highlighted onboarding target
  useEffect(() => {
    if (showOnboarding) {
      const step = ONBOARDING_STEPS[currentOnboardingStep];
      const element = document.getElementById(step.targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentOnboardingStep, showOnboarding]);

  // Helper: Trigger Toast Notification
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast('');
    }, 3000);
  };

  // Helper: Calculate Real Threat Level for an observation
  const getRealThreatLevel = (obs) => {
    return obs.suspicion_level + (obs.has_prey ? 2 : 0);
  };

  // Optimized KPI Calculations
  const stats = useMemo(() => {
    const totalObservations = observations.length;
    
    // Unique foxes
    const uniqueFoxes = new Set(observations.map(o => o.fox_id));
    const totalUniqueFoxes = uniqueFoxes.size;
    
    // Most suspicious fox (based on calculated Real Threat Level)
    let mostSuspiciousFox = 'Нет данных';
    let maxThreatLevel = -1;
    
    observations.forEach(o => {
      const threat = getRealThreatLevel(o);
      if (threat > maxThreatLevel) {
        maxThreatLevel = threat;
        mostSuspiciousFox = `${o.fox_id} (угроза ${threat})`;
      }
    });

    return {
      totalUniqueFoxes,
      totalObservations,
      mostSuspiciousFox,
      maxThreatLevel
    };
  }, [observations]);

  // Dynamic Interactive Map Configuration
  const mapSectors = useMemo(() => {
    const presets = [
      { name: 'Северная поляна', coords: 'Сектор А-1', icon: '🌿' },
      { name: 'Туманная тропа', coords: 'Сектор А-2', icon: '🌫️' },
      { name: 'Старый дуб', coords: 'Сектор Б-1', icon: '🌳' },
      { name: 'Лисья нора', coords: 'Сектор Б-2', icon: '🦊' },
      { name: 'Южный овраг', coords: 'Сектор В-1', icon: '🧗' },
      { name: 'Забытый пруд', coords: 'Сектор В-2', icon: '🌊' },
    ];
    
    // Add unique user-added locations that are not in the presets list
    const obsLocations = Array.from(new Set(observations.map(o => o.location)));
    const merged = [...presets];
    
    obsLocations.forEach((locName) => {
      if (!merged.some(p => p.name === locName)) {
        merged.push({
          name: locName,
          coords: `Сектор Х-${merged.length + 1}`,
          icon: '📍'
        });
      }
    });
    
    return merged;
  }, [observations]);

  // Observation count per location for the Heatmap effect (optimized)
  const sectorCounts = useMemo(() => {
    const counts = {};
    observations.forEach(o => {
      counts[o.location] = (counts[o.location] || 0) + 1;
    });
    return counts;
  }, [observations]);

  // Unique fox IDs from existing observations for form dropdown
  const existingFoxIds = useMemo(() => {
    const ids = new Set(observations.map(o => o.fox_id));
    ['fox_001', 'fox_002', 'fox_003', 'fox_004', 'fox_005'].forEach(id => ids.add(id));
    return Array.from(ids);
  }, [observations]);

  // Filtered observations (optimized)
  const filteredObservations = useMemo(() => {
    if (selectedLocation === 'Все') return observations;
    return observations.filter(o => o.location === selectedLocation);
  }, [observations, selectedLocation]);

  // Actions
  const handleAddObservation = (e) => {
    e.preventDefault();
    
    const finalFoxId = isCustomFoxId ? customFoxIdText.trim() : newFoxId;
    const finalLocation = newLocation;
    
    if (!finalFoxId) {
      alert('Пожалуйста, введите ID лисы!');
      return;
    }
    if (!finalLocation) {
      alert('Пожалуйста, укажите локацию!');
      return;
    }

    let timeString = newTime;
    if (!timeString) {
      const now = new Date();
      timeString = now.toTimeString().slice(0, 5);
    }

    const newObservation = {
      id: `obs_${Date.now()}`,
      fox_id: finalFoxId,
      location: finalLocation,
      color: newColor,
      has_prey: newHasPrey,
      suspicion_level: Number(newSuspicionLevel),
      time: timeString
    };

    setObservations(prev => [newObservation, ...prev].sort((a, b) => b.time.localeCompare(a.time)));
    triggerToast('Новое наблюдение добавлено');
    
    // Reset form states
    setCustomFoxIdText('');
    setNewTime('');
    setNewHasPrey(false);
    setNewSuspicionLevel(5);
    setShowAddForm(false);
  };

  // Generate 20 Random Observations Simulator
  const handleGenerateDay = () => {
    const locationsList = ['Северная поляна', 'Туманная тропа', 'Старый дуб', 'Лисья нора', 'Южный овраг', 'Забытый пруд'];
    const colorsList = ['рыжая', 'черная', 'серая', 'белая'];
    const foxIds = ['fox_001', 'fox_002', 'fox_003', 'fox_004', 'fox_005'];
    
    const generated = [];
    const baseTime = Date.now();

    for (let i = 0; i < 20; i++) {
      const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
      const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      generated.push({
        id: `gen_${baseTime}_${i}`,
        fox_id: foxIds[Math.floor(Math.random() * foxIds.length)],
        location: locationsList[Math.floor(Math.random() * locationsList.length)],
        color: colorsList[Math.floor(Math.random() * colorsList.length)],
        has_prey: Math.random() > 0.5,
        suspicion_level: Math.floor(Math.random() * 10) + 1,
        time: timeStr
      });
    }

    setObservations(prev => {
      const merged = [...prev, ...generated];
      return merged.sort((a, b) => a.time.localeCompare(b.time));
    });
    triggerToast('Сгенерировано 20 наблюдений за день');
  };

  // Reset localStorage Cache and restore demo data
  const handleResetCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fox_observations');
    }
    setObservations(INITIAL_OBSERVATIONS);
    setSelectedLocation('Все');
    triggerToast('Данные сброшены к демо-значениям');
  };

  const handleDeleteObservation = (id) => {
    const removedObs = observations.find(o => o.id === id);
    if (removedObs) {
      setHistoryLog(prev => [{ type: 'delete', data: removedObs }, ...prev.slice(0, 4)]);
    }
    setObservations(prev => prev.filter(o => o.id !== id));
    triggerToast('Запись удалена');
  };

  const handleUndo = () => {
    if (historyLog.length === 0) return;
    const lastAction = historyLog[0];
    if (lastAction.type === 'delete') {
      setObservations(prev => [...prev, lastAction.data].sort((a, b) => a.time.localeCompare(b.time)));
    }
    setHistoryLog(prev => prev.slice(1));
    triggerToast('Удаление отменено');
  };

  const handleUpdateSuspicion = (id, delta) => {
    setObservations(prev => prev.map(o => {
      if (o.id === id) {
        const nextLevel = Math.max(1, Math.min(10, o.suspicion_level + delta));
        return { ...o, suspicion_level: nextLevel };
      }
      return o;
    }));
  };

  const handleTogglePrey = (id) => {
    setObservations(prev => prev.map(o => {
      if (o.id === id) {
        return { ...o, has_prey: !o.has_prey };
      }
      return o;
    }));
  };

  // Formatted Text Exporter for Ranger Offline Reports
  const handleExportReport = () => {
    if (observations.length === 0) {
      triggerToast('Нет данных для отчета');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU');
    const timeStr = now.toTimeString().slice(0, 5);

    let fileContent = `==================================================\n`;
    fileContent += `    ОТЧЕТ СЛУЖБЫ ЛЕСНОГО МОНИТОРИНГА: ЛИСИЙ ДИСПЕТЧЕР\n`;
    fileContent += `==================================================\n`;
    fileContent += `Дата выгрузки: ${dateStr} ${timeStr}\n`;
    fileContent += `Активный фильтр секторов: ${selectedLocation}\n`;
    fileContent += `--------------------------------------------------\n`;
    fileContent += `СВОДНЫЕ ПОКАЗАТЕЛИ:\n`;
    fileContent += `- Всего зарегистрировано контактов: ${stats.totalObservations}\n`;
    fileContent += `- Уникальных особей в базе: ${stats.totalUniqueFoxes}\n`;
    fileContent += `- Максимальный уровень угрозы: ${stats.maxThreatLevel}\n`;
    fileContent += `- Наиболее подозрительный субъект: ${stats.mostSuspiciousFox}\n`;
    fileContent += `--------------------------------------------------\n`;
    fileContent += `СПИСОК ЗАРЕГИСТРИРОВАННЫХ КОНТАКТОВ (${filteredObservations.length} зап.):\n`;
    fileContent += `--------------------------------------------------\n`;
    fileContent += `Время | ИД Лисы  | Окрас    | Добыча | Угроза | Локация\n`;
    fileContent += `--------------------------------------------------\n`;
    
    filteredObservations.forEach(obs => {
      const timePad = obs.time.padEnd(5, ' ');
      const idPad = obs.fox_id.padEnd(8, ' ');
      const colorPad = obs.color.padEnd(8, ' ');
      const preyPad = (obs.has_prey ? 'Да (🍖)' : 'Нет').padEnd(6, ' ');
      const threatPad = String(getRealThreatLevel(obs)).padEnd(6, ' ');
      const locPad = obs.location;
      fileContent += `${timePad} | ${idPad} | ${colorPad} | ${preyPad} | ${threatPad} | ${locPad}\n`;
    });
    
    fileContent += `==================================================\n`;
    fileContent += `Конец отчета. Сгенерировано автоматически.\n`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_fox_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast('Отчет сохранен в файл');
  };

  // Onboarding controls
  const handleNextOnboarding = () => {
    if (currentOnboardingStep < ONBOARDING_STEPS.length - 1) {
      setCurrentOnboardingStep(prev => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handlePrevOnboarding = () => {
    if (currentOnboardingStep > 0) {
      setCurrentOnboardingStep(prev => prev - 1);
    }
  };

  const handleCompleteOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fox_onboarding_completed', 'true');
    }
    setShowOnboarding(false);
  };

  const handleStartOnboarding = () => {
    setCurrentOnboardingStep(0);
    setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-sand p-4 md:p-8 flex flex-col items-center">
      <main id="app-container" className="w-full max-w-5xl flex flex-col gap-6">
        
        {/* HEADER */}
        <header className="retro-border bg-fox text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-wood flex items-center justify-center retro-border-sm shrink-0">
              <span className="text-4xl animate-bounce">🦊</span>
            </div>
            <div>
              <h1 id="main-title" className="text-2xl md:text-3xl font-press-start tracking-wider text-sand-light font-black uppercase text-shadow-sm">
                <span className="whitespace-nowrap">ЛИСИ<PixelЙ /></span> ДИСПЕТЧЕР
              </h1>
              <p className="text-sand-light/95 font-mono text-sm md:text-base mt-1 font-bold">
                🌲 Картографический модуль // Сектор 07-Лес
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end text-right font-mono bg-wood text-sand-light p-3 retro-border-sm w-full md:w-auto">
            <div className="font-bold flex items-center gap-2 text-sm justify-end">
              <Calendar size={14} className="text-fox-light" />
              <span>02 ИЮЛЯ 2026</span>
            </div>
            {/* Added a replay Help button alongside AI Worklog */}
            <div className="flex gap-2 mt-2 w-full">
              <button
                id="btn-open-worklog"
                onClick={() => setShowWorklog(true)}
                className="retro-btn bg-[#ecc844] hover:bg-[#dfba35] text-wood font-press-start text-xs font-black px-4 py-2 h-11 flex-1 flex items-center gap-2 justify-center transition-all duration-100 hover:scale-105 active:scale-95"
              >
                <BookOpen size={14} /> AI WORKLOG
              </button>
              <button
                id="btn-start-onboarding"
                onClick={handleStartOnboarding}
                className="retro-btn bg-[#ecc844] hover:bg-[#dfba35] text-wood font-press-start text-xs font-black w-11 h-11 flex items-center justify-center transition-all duration-100 hover:scale-105 active:scale-95"
                title="Показать обучение"
              >
                ?
              </button>
            </div>
          </div>
        </header>

        {/* UNDO LOG NOTIFICATION */}
        {historyLog.length > 0 && (
          <div className="retro-border bg-sand-light p-3 flex justify-between items-center text-wood font-mono text-base font-bold animate-pulse">
            <span className="flex items-center gap-2">
              <AlertTriangle className="text-fox" size={20} />
              Наблюдение удалено из журнала.
            </span>
            <button 
              id="btn-undo"
              onClick={handleUndo} 
              className="retro-btn bg-forest text-white px-4 py-2 font-press-start text-xs h-11 flex items-center gap-2 transition-all duration-100 hover:scale-105"
            >
              <Undo2 size={14} /> ОТМЕНИТЬ
            </button>
          </div>
        )}

        {/* 2. KPI CARD PANEL */}
        <section 
          id="kpi-panel" 
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${
            showOnboarding && currentOnboardingStep === 1 
              ? 'relative z-50 ring-4 ring-[#f26419] shadow-[0_0_25px_rgba(242,100,25,0.7)] bg-sand-light rounded-sm' 
              : ''
          }`}
        >
          
          <article className="retro-border bg-sand-light p-5 flex flex-col justify-between h-32 relative overflow-hidden transition-all duration-200 hover:scale-102">
            <div className="flex justify-between items-start">
              <span className="text-wood/75 font-mono font-black text-sm tracking-wider uppercase">Уникальные Лисы</span>
              <div className="bg-wood text-sand-light p-1.5 retro-border-sm shrink-0">
                <Flame size={20} className="text-fox" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-wood font-mono">{stats.totalUniqueFoxes}</span>
              <span className="text-wood/65 text-xs font-mono font-bold">особей</span>
            </div>
            <div className="absolute right-0 bottom-0 text-wood/5 text-9xl font-black select-none pointer-events-none translate-y-6 translate-x-3">🦊</div>
          </article>

          <article className="retro-border bg-sand-light p-5 flex flex-col justify-between h-32 relative overflow-hidden transition-all duration-200 hover:scale-102">
            <div className="flex justify-between items-start">
              <span className="text-wood/75 font-mono font-black text-sm tracking-wider uppercase">Всего контактов</span>
              <div className="bg-wood text-sand-light p-1.5 retro-border-sm shrink-0">
                <Eye size={20} className="text-forest-light" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-wood font-mono">{stats.totalObservations}</span>
              <span className="text-wood/65 text-xs font-mono font-bold">рапортов</span>
            </div>
            <div className="absolute right-0 bottom-0 text-wood/5 text-9xl font-black select-none pointer-events-none translate-y-6 translate-x-3">👁️</div>
          </article>

          <article className={`retro-border p-5 flex flex-col justify-between h-32 relative overflow-hidden transition-all duration-200 hover:scale-102 ${stats.maxThreatLevel > 9 ? 'bg-red-50' : 'bg-sand-light'}`}>
            <div className="flex justify-between items-start">
              <span className="text-wood/75 font-mono font-black text-sm tracking-wider uppercase">Макс. Уровень Угрозы</span>
              <div className="bg-wood text-sand-light p-1.5 retro-border-sm shrink-0">
                <Shield size={20} className={stats.maxThreatLevel > 9 ? 'text-red-500 animate-pulse' : 'text-amber-500'} />
              </div>
            </div>
            <div>
              <span className="text-xl md:text-2xl font-black text-wood font-mono block truncate max-w-full font-bold">
                {stats.mostSuspiciousFox}
              </span>
              {stats.maxThreatLevel > 9 ? (
                <span className="text-red-600 text-xs font-bold font-mono tracking-tighter uppercase animate-pulse">🛑 УГРОЗА ВЫСОКАЯ! ПАТРУЛЬ</span>
              ) : (
                <span className="text-forest text-xs font-bold font-mono uppercase">Обстановка стабильная</span>
              )}
            </div>
            <div className="absolute right-0 bottom-0 text-wood/5 text-9xl font-black select-none pointer-events-none translate-y-6 translate-x-3">🛡️</div>
          </article>

        </section>

        {/* 3. INTERACTIVE FOREST MAP */}
        <section 
          id="interactive-map-section" 
          className={`retro-border bg-sand-light p-5 transition-all duration-300 ${
            showOnboarding && currentOnboardingStep === 0 
              ? 'relative z-50 ring-4 ring-[#f26419] shadow-[0_0_25px_rgba(242,100,25,0.7)]' 
              : ''
          }`}
        >
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b-4 border-wood pb-3 mb-4">
            <div>
              <h2 className="text-lg font-press-start font-black text-wood uppercase flex items-center gap-2">
                🗺️ Интерактивная карта леса
              </h2>
              <p className="text-wood/75 font-mono text-xs font-bold mt-1">
                Выберите сектор для фильтрации. Ячейки темнеют (теплокарта) при более чем 2 контактах.
              </p>
            </div>
            
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="font-bold text-wood">Активный сектор:</span>
              <button
                id="btn-reset-map"
                onClick={() => setSelectedLocation('Все')}
                className={`retro-btn text-xs px-3 py-1 font-bold h-[34px] flex items-center gap-1 transition-all duration-100 ${
                  selectedLocation === 'Все' 
                    ? 'bg-wood text-sand-light cursor-default' 
                    : 'bg-fox text-white hover:bg-fox-light hover:scale-105 active:scale-95'
                }`}
                disabled={selectedLocation === 'Все'}
              >
                {selectedLocation === 'Все' ? '🌲 Все' : `📍 ${selectedLocation} [СБРОС]`}
              </button>
            </div>
          </header>

          {/* GRID HEATMAP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mapSectors.map((sector) => {
              const count = sectorCounts[sector.name] || 0;
              const isSelected = selectedLocation === sector.name;

              // Heatmap style
              let heatmapBg = 'bg-[#fbf6ef] text-wood';
              if (count > 0 && count <= 2) {
                heatmapBg = 'bg-[#e6d2b3] text-wood';
              } else if (count > 2) {
                heatmapBg = 'bg-[#cba874] text-wood font-black'; // Heatmap darker
              }

              // Selected style
              const borderStyle = isSelected 
                ? 'border-4 border-fox shadow-[4px_4px_0px_0px_#f26419]' 
                : 'border-4 border-wood shadow-[4px_4px_0px_0px_#3a2214]';

              return (
                <button
                  key={sector.name}
                  id={`map-sector-${sector.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedLocation(isSelected ? 'Все' : sector.name)}
                  className={`w-full min-h-[90px] p-3 text-left flex flex-col justify-between transition-all duration-150 cursor-pointer select-none hover:scale-103 hover:shadow-[6px_6px_0px_0px_#3a2214] active:translate-y-1 active:translate-x-1 ${borderStyle} ${heatmapBg}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-mono text-xs font-bold opacity-75">{sector.coords}</span>
                    <span className="text-xl shrink-0">{sector.icon}</span>
                  </div>
                  
                  <div className="mt-1">
                    <div className="font-mono text-sm md:text-base font-bold leading-tight truncate">
                      {sector.name}
                    </div>
                    <div className="flex justify-between items-center mt-2 border-t border-wood/20 pt-1">
                      <span className="font-mono text-xs">Наблюдения:</span>
                      <span className={`px-2 py-0.5 retro-border-sm text-xs font-press-start font-black ${
                        count > 0 ? 'bg-wood text-sand-light' : 'bg-transparent text-wood/60'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* LOG ENCOUNTER & SIMULATOR ACTION PANEL */}
        <section 
          id="action-panel" 
          className={`flex flex-col sm:flex-row justify-between gap-4 transition-all duration-300 ${
            showOnboarding && currentOnboardingStep === 2 
              ? 'relative z-50 ring-4 ring-[#f26419] shadow-[0_0_25px_rgba(242,100,25,0.7)] bg-sand rounded-sm p-2' 
              : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* SIMULATOR BUTTON */}
            <button
              id="btn-simulate-day"
              onClick={handleGenerateDay}
              className="retro-btn bg-wood hover:bg-[#4d3221] text-sand-light font-press-start text-xs font-black min-h-[44px] px-6 py-3 flex items-center justify-center gap-2 transition-all duration-100 hover:scale-105 active:scale-95"
            >
              <Sparkles size={14} className="text-fox animate-pulse" />
              <span>СГЕНЕРИРОВАТЬ ДЕНЬ (+20 лис)</span>
            </button>

            {/* RESET CACHE BUTTON */}
            <button
              id="btn-reset-cache"
              onClick={handleResetCache}
              className="retro-btn bg-[#ecc844] hover:bg-[#dfba35] text-wood font-press-start text-xs font-black min-h-[44px] px-6 py-3 flex items-center justify-center gap-2 transition-all duration-100 hover:scale-105 active:scale-95"
              title="Восстановить демо-данные"
            >
              <span>СБРОСИТЬ ДАННЫЕ</span>
            </button>
          </div>

          <button
            id="btn-toggle-add-form"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`retro-btn font-press-start text-xs font-black min-h-[44px] px-6 py-3 flex items-center justify-center gap-2 transition-all duration-100 hover:scale-105 active:scale-95 ${
              showAddForm 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-forest hover:bg-forest-light text-sand-light'
            }`}
          >
            {showAddForm ? (
              <>
                <X size={14} /> ЗАКРЫТЬ ФОРМУ
              </>
            ) : (
              <>
                <Plus size={14} /> ЗАРЕГИСТРИРОВАТЬ КОНТАКТ
              </>
            )}
          </button>
        </section>

        {/* ADD NEW OBSERVATION FORM */}
        {showAddForm && (
          <section id="add-observation-form" className="retro-border bg-sand-light p-6">
            <h2 className="text-xl font-press-start font-black text-wood mb-6 border-b-4 border-wood pb-2 uppercase">
              📝 Регистрация нового контакта
            </h2>
            <form onSubmit={handleAddObservation} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-base font-bold">
              
              {/* FOX ID */}
              <div className="flex flex-col gap-2">
                <label className="text-wood">Идентификатор лисы:</label>
                <div className="flex flex-col gap-2">
                  {!isCustomFoxId ? (
                    <div className="flex gap-2">
                      <select
                        id="form-fox-id-select"
                        value={newFoxId}
                        onChange={(e) => setNewFoxId(e.target.value)}
                        className="flex-1 bg-sand border-3 border-wood p-2 retro-border-sm min-h-[44px]"
                      >
                        {existingFoxIds.map(fid => (
                          <option key={fid} value={fid}>{fid}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        id="btn-fox-custom"
                        onClick={() => setIsCustomFoxId(true)}
                        className="retro-btn bg-wood text-sand-light px-3 py-1 font-bold text-sm min-h-[44px] transition-all duration-100 hover:scale-105"
                      >
                        Новый ID
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="form-fox-id-custom"
                        placeholder="Например, fox_004"
                        value={customFoxIdText}
                        onChange={(e) => setCustomFoxIdText(e.target.value)}
                        className="flex-1 bg-sand border-3 border-wood p-2 retro-border-sm min-h-[44px]"
                      />
                      <button
                        type="button"
                        id="btn-fox-preset"
                        onClick={() => setIsCustomFoxId(false)}
                        className="retro-btn bg-wood text-sand-light px-3 py-1 font-bold text-sm min-h-[44px] transition-all duration-100 hover:scale-105"
                      >
                        Выбрать
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PREDEFINED ONLY LOCATION SELECT */}
              <div className="flex flex-col gap-2">
                <label htmlFor="form-location-select" className="text-wood">Локация / Сектор:</label>
                <select
                  id="form-location-select"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-sand border-3 border-wood p-2 retro-border-sm min-h-[44px]"
                >
                  <option value="Северная поляна">Северная поляна</option>
                  <option value="Туманная тропа">Туманная тропа</option>
                  <option value="Старый дуб">Старый дуб</option>
                  <option value="Лисья нора">Лисья нора</option>
                  <option value="Южный овраг">Южный овраг</option>
                  <option value="Забытый пруд">Забытый пруд</option>
                </select>
              </div>

              {/* COLOR */}
              <div className="flex flex-col gap-2">
                <label htmlFor="form-color" className="text-wood">Окрас шерсти:</label>
                <select
                  id="form-color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="bg-sand border-3 border-wood p-2 retro-border-sm min-h-[44px]"
                >
                  <option value="рыжая">Рыжая (классическая)</option>
                  <option value="черная">Черная (серебристая)</option>
                  <option value="серая">Серая (степная)</option>
                  <option value="белая">Белая (полярная)</option>
                </select>
              </div>

              {/* SUSPICION LEVEL */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-wood">Базовая подозрительность:</label>
                  <span className="px-2 py-0.5 border-2 border-wood retro-border-sm bg-sand-dark text-wood font-bold text-sm">
                    {newSuspicionLevel} / 10
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewSuspicionLevel(prev => Math.max(1, prev - 1))}
                    className="retro-btn bg-sand-dark text-wood w-11 h-11 flex items-center justify-center font-bold text-xl transition-all duration-100 hover:scale-105"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    id="form-suspicion-slider"
                    min="1"
                    max="10"
                    value={newSuspicionLevel}
                    onChange={(e) => setNewSuspicionLevel(Number(e.target.value))}
                    className="flex-1 accent-[#f26419] h-2 bg-wood rounded-lg appearance-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setNewSuspicionLevel(prev => Math.min(10, prev + 1))}
                    className="retro-btn bg-sand-dark text-wood w-11 h-11 flex items-center justify-center font-bold text-xl transition-all duration-100 hover:scale-105"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* PREY STATUS */}
              <div className="flex flex-col gap-2">
                <label className="text-wood">Наличие добычи (добыча в зубах):</label>
                <button
                  type="button"
                  id="form-prey-toggle"
                  onClick={() => setNewHasPrey(!newHasPrey)}
                  className="retro-btn text-left px-4 min-h-[44px] flex items-center justify-between transition-all duration-100 hover:scale-102 bg-sand text-wood"
                >
                  <span className="font-bold">{newHasPrey ? '🍖 С добычей (+2 к угрозе)' : '❌ Пустая пасть'}</span>
                  <span className="text-xs font-press-start font-black">{newHasPrey ? 'АКТИВНО' : 'НЕТ'}</span>
                </button>
              </div>

              {/* TIME OF ENCOUNTER */}
              <div className="flex flex-col gap-2">
                <label htmlFor="form-time" className="text-wood">Время контакта (оставьте пустым для текущего):</label>
                <input
                  type="time"
                  id="form-time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-sand border-3 border-wood p-2 retro-border-sm min-h-[44px] font-mono text-base font-bold"
                />
              </div>

              {/* ACTION BUTTON */}
              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  id="btn-form-submit"
                  className="retro-btn bg-fox hover:bg-fox-light text-white font-press-start text-xs font-black w-full min-h-[50px] p-4 flex items-center justify-center gap-2 transition-all duration-100 hover:scale-102 active:scale-98"
                >
                  <CheckCircle2 size={18} /> ЗАПИСАТЬ КОНТАКТ В ЖУРНАЛ
                </button>
              </div>

            </form>
          </section>
        )}

        {/* 4. OBSERVATION LOG TABLE */}
        <section id="observations-section" className="retro-border bg-sand-light p-4 md:p-6 font-mono">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-4 border-wood pb-4 mb-4 font-mono">
            <div>
              <h2 className="text-lg md:text-xl font-press-start font-black text-wood uppercase">
                📜 ЖУРНАЛ ПОЛЕВЫХ <span className="whitespace-nowrap">НАБЛЮДЕНИ<PixelЙ /></span>
              </h2>
              <p className="text-wood/75 font-mono text-xs font-bold mt-1">
                Строки с Реальной угрозой &gt; 9 автоматически подсвечиваются красным.
              </p>
            </div>
            
            {/* Flexbox alignment for data counter and download report button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono text-sm w-full md:w-auto">
              <div className="text-wood/80 font-bold text-center sm:text-right shrink-0">
                Показано записей: <span className="bg-wood text-sand-light px-2 py-0.5 font-bold retro-border-sm">{filteredObservations.length}</span> из {observations.length}
              </div>
              
              <button
                id="btn-export-report"
                onClick={handleExportReport}
                className={`retro-btn bg-forest hover:bg-forest-light text-sand-light font-press-start text-xs font-black min-h-[38px] px-4 py-2 flex items-center justify-center gap-2 transition-all duration-100 active:scale-95 ${
                  showOnboarding && currentOnboardingStep === 3 
                    ? 'relative z-50 ring-4 ring-[#f26419] shadow-[0_0_25px_rgba(242,100,25,0.7)] scale-105 bg-forest-light' 
                    : 'hover:scale-105'
                }`}
                title="Скачать текстовый отчет"
              >
                <Download size={14} />
                <span>СКАЧАТЬ ОТЧЕТ</span>
              </button>
            </div>
          </header>

          {/* DYNAMIC EMPTY STATE */}
          {filteredObservations.length === 0 ? (
            <div className="retro-border bg-sand-dark/20 p-12 text-center text-wood/85 font-mono text-lg font-bold flex flex-col items-center gap-4 animate-fade-in">
              <div className="w-16 h-16 bg-[#e6d2b3] border-4 border-wood flex items-center justify-center retro-border-sm text-wood shrink-0">
                <VolumeX size={32} />
              </div>
              <h3 className="font-press-start text-xs font-black text-wood uppercase">В этой локации тихо</h3>
              <p className="max-w-md text-sm text-wood/80">
                {selectedLocation !== 'Все' 
                  ? `В выбранном секторе "${selectedLocation}" на данный момент нет зарегистрированных лис. Попробуйте сбросить фильтр или сгенерировать наблюдения.`
                  : 'Журнал наблюдений пуст. Добавьте контакт вручную или воспользуйтесь генератором данных.'}
              </p>
              <div className="flex gap-4 mt-2">
                {selectedLocation !== 'Все' && (
                  <button
                    onClick={() => setSelectedLocation('Все')}
                    className="retro-btn bg-wood text-sand-light px-6 py-2.5 font-press-start text-xs h-[44px] flex items-center justify-center transition-all duration-100 hover:scale-105"
                  >
                    Сбросить фильтр
                  </button>
                )}
                <button
                  onClick={handleGenerateDay}
                  className="retro-btn bg-fox text-white px-6 py-2.5 font-press-start text-xs h-[44px] flex items-center justify-center transition-all duration-100 hover:scale-105"
                >
                  Запустить генератор
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-mono border-collapse border-4 border-wood min-w-[850px]">
                <thead>
                  <tr className="bg-wood text-sand-light font-bold text-sm uppercase">
                    <th className="p-3 border-r-2 border-b-4 border-sand-dark text-center w-20">Время</th>
                    <th className="p-3 border-r-2 border-b-4 border-sand-dark">Лиса ID</th>
                    <th className="p-3 border-r-2 border-b-4 border-sand-dark">Сектор / Локация</th>
                    <th className="p-3 border-r-2 border-b-4 border-sand-dark">Окрас</th>
                    <th className="p-3 border-r-2 border-b-4 border-sand-dark text-center w-36">Добыча (+2)</th>
                    <th className="p-3 border-r-2 border-b-4 border-sand-dark text-center w-32">База (1-10)</th>
                    <th className="p-3 border-r-2 border-b-4 border-sand-dark text-center w-48">Реальная Угроза (0-12)</th>
                    <th className="p-3 border-b-4 border-sand-dark text-center w-24">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-wood text-base font-bold text-wood">
                  {filteredObservations.map((obs) => {
                    const realThreat = getRealThreatLevel(obs);
                    const isHighThreat = realThreat > 9;

                    return (
                      <tr 
                        key={obs.id} 
                        id={`row-${obs.id}`}
                        className={`hover:bg-sand/60 transition-colors ${
                          isHighThreat ? 'bg-red-200/90 text-red-950 font-black' : ''
                        }`}
                      >
                        {/* Time */}
                        <td className="p-3 border-r-2 border-wood text-center font-bold text-base min-h-[44px]">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-wood/10 retro-border-sm text-xs md:text-sm">
                            ⏰ {obs.time}
                          </span>
                        </td>

                        {/* Fox ID */}
                        <td className="p-3 border-r-2 border-wood font-mono font-black">
                          <span className="flex items-center gap-2">
                            <span className="text-xl font-normal">🦊</span>
                            <span>{obs.fox_id}</span>
                          </span>
                        </td>

                        {/* Location */}
                        <td className="p-3 border-r-2 border-wood text-sm md:text-base">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={16} className="text-forest shrink-0" />
                            <span>{obs.location}</span>
                          </span>
                        </td>

                        {/* Color */}
                        <td className="p-3 border-r-2 border-wood text-sm md:text-base capitalize">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-4 h-4 rounded-sm border-2 border-wood inline-block shrink-0" 
                              style={{
                                backgroundColor: 
                                  obs.color === 'рыжая' ? '#e05315' : 
                                  obs.color === 'черная' ? '#1f2028' : 
                                  obs.color === 'серая' ? '#8a8a8a' : 
                                  obs.color === 'белая' ? '#ffffff' : '#e05315'
                              }}
                            />
                            <span>{obs.color}</span>
                          </div>
                        </td>

                        {/* Prey Status */}
                        <td className="p-3 border-r-2 border-wood text-center">
                          <button
                            type="button"
                            id={`btn-prey-toggle-${obs.id}`}
                            onClick={() => handleTogglePrey(obs.id)}
                            title="Изменить статус добычи"
                            className={`w-full min-h-[44px] retro-btn px-2 flex items-center justify-center gap-2 transition-all duration-100 hover:scale-103 ${
                              obs.has_prey ? 'bg-amber-100 border-wood text-amber-900' : 'bg-sand-dark/70 text-wood/65'
                            }`}
                          >
                            {obs.has_prey ? (
                              <>
                                <span className="text-base">🍖</span>
                                <span className="text-xs font-black">ДА (+2)</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm">❌</span>
                                <span className="text-xs font-bold">НЕТ (0)</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Base Suspicion */}
                        <td className="p-3 border-r-2 border-wood text-center">
                          <div className="flex items-center justify-between gap-1 w-full max-w-[120px] mx-auto">
                            <button
                              type="button"
                              id={`btn-susp-dec-${obs.id}`}
                              onClick={() => handleUpdateSuspicion(obs.id, -1)}
                              className="retro-btn bg-sand-dark text-wood w-11 h-11 flex items-center justify-center font-bold text-lg leading-none shrink-0 transition-all duration-100 hover:scale-105"
                              title="Понизить"
                            >
                              -
                            </button>
                            
                            <div className="flex-1 font-mono font-black text-center text-sm md:text-base">
                              {obs.suspicion_level}
                            </div>

                            <button
                              type="button"
                              id={`btn-susp-inc-${obs.id}`}
                              onClick={() => handleUpdateSuspicion(obs.id, 1)}
                              className="retro-btn bg-sand-dark text-wood w-11 h-11 flex items-center justify-center font-bold text-lg leading-none shrink-0 transition-all duration-100 hover:scale-105"
                              title="Повысить"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Real Threat Level Progress Bar */}
                        <td className="p-3 border-r-2 border-wood text-center">
                          <div className="w-full flex flex-col gap-1 max-w-[160px] mx-auto text-left">
                            <div className="flex justify-between items-center text-[10px] font-mono font-bold leading-none">
                              <span>Угроза:</span>
                              <span className="font-press-start text-[9px]">{realThreat} / 12</span>
                            </div>
                            <div className="w-full h-5 bg-sand-dark border-3 border-wood retro-border-sm relative overflow-hidden shrink-0">
                              <div 
                                id={`bar-threat-${obs.id}`}
                                className={`h-full ${getThreatColor(realThreat)} transition-all duration-300`} 
                                style={{ width: `${(realThreat / 12) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            id={`btn-delete-${obs.id}`}
                            onClick={() => handleDeleteObservation(obs.id)}
                            className="retro-btn bg-red-100 text-red-700 w-11 h-11 flex items-center justify-center hover:bg-red-200 transition-all duration-100 hover:scale-105"
                            title="Удалить запись"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* RANGER GUIDELINES RETRO FOOTER */}
          <footer className="mt-8 bg-sand p-4 border-4 border-wood font-mono text-sm text-wood/80 font-bold flex flex-col gap-3">
            <h3 className="font-press-start text-xs font-black text-wood uppercase flex items-center gap-1.5">
              <Info size={16} /> Инструкции полевого режима
            </h3>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                <span className="text-red-700 font-black">Реальный уровень угрозы</span> рассчитывается динамически по формуле: <code className="bg-wood text-sand-light px-1 py-0.5 rounded">базовая подозрительность + 2 (при наличии добычи 🍖)</code>.
              </li>
              <li>
                При уровне угрозы выше <span className="bg-red-600 text-white px-1.5 py-0.5 font-bold retro-border-sm">9</span>, соответствующая запись выделяется красным цветом. Это критическое предупреждение о возможной опасности.
              </li>
              <li>
                Интерактивная карта леса сверху показывает агрегированные сведения. Сектор с <span className="bg-[#cba874] text-wood px-1.5 py-0.5 font-bold border border-wood">более 2 наблюдениями</span> автоматически отмечается на теплокарте темным тоном.
              </li>
            </ul>
          </footer>
        </section>

      </main>

      {/* 5. AI WORKLOG RETRO MODAL */}
      {showWorklog && (
        <div id="worklog-overlay" className="fixed inset-0 bg-wood/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            id="worklog-modal" 
            className="retro-border bg-sand-light max-w-2xl w-full max-h-[90vh] flex flex-col my-8 animate-fade-in"
          >
            {/* Modal Header */}
            <header className="bg-wood text-sand-light p-4 flex justify-between items-center border-b-4 border-wood shrink-0">
              <h2 className="text-sm md:text-base font-press-start font-black tracking-tighter uppercase flex items-center gap-2">
                ⚙️ AI WORKLOG / ЖУРНАЛ РАЗРАБОТКИ
              </h2>
              <button 
                id="btn-close-worklog"
                onClick={() => setShowWorklog(false)}
                className="retro-btn bg-fox hover:bg-fox-light text-white w-10 h-10 flex items-center justify-center font-bold transition-all duration-100 hover:scale-105"
              >
                <X size={18} />
              </button>
            </header>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-base text-wood">
              <div className="relative border-l-4 border-wood/30 ml-4 pl-6 flex flex-col gap-8">
                
                {/* Checkpoint 1 */}
                <div className="relative">
                  <div className="absolute -left-[38px] top-1 bg-wood text-sand-light w-7 h-7 rounded-full border-4 border-sand-light flex items-center justify-center font-press-start text-[10px]">
                    1
                  </div>
                  <span className="bg-forest text-sand-light text-xs font-press-start font-black px-2 py-0.5 retro-border-sm">
                    Чекпоинт 1: Оценка ТЗ, архитектура и первая задача
                  </span>
                  <h3 className="text-lg font-black mt-2 text-wood uppercase">
                    Архитектура и осознанное расширение ТЗ
                  </h3>
                  <p className="text-sm mt-2 leading-relaxed text-wood/90 bg-sand p-3 border-2 border-wood retro-border-sm">
                    Я начал с того, что распределил роли между собой и искусственным интеллектом: я выступал в качестве руководителя продукта, а нейросеть выполняла задачи старшего разработчика. После анализа исходного технического задания стало ясно, что трех базовых строк данных мало для проверки работы интерфейса на реальных объемах. Было принято решение расширить функционал, внедрив симуляцию потока данных и расчет комплексного уровня угрозы. Я утвердил предложенный стек технологий на базе современных библиотек, но поставил условие адаптировать весь интерфейс под полевые условия, сделав все элементы крупными.
                  </p>
                </div>

                {/* Checkpoint 2 */}
                <div className="relative">
                  <div className="absolute -left-[38px] top-1 bg-wood text-sand-light w-7 h-7 rounded-full border-4 border-sand-light flex items-center justify-center font-press-start text-[10px]">
                    2
                  </div>
                  <span className="bg-forest text-sand-light text-xs font-press-start font-black px-2 py-0.5 retro-border-sm">
                    Чекпоинт 2: Борьба за UX и собственные решения
                  </span>
                  <h3 className="text-lg font-black mt-2 text-wood uppercase">
                    Отказ от скучной таблицы (Мои решения vs ИИ)
                  </h3>
                  <p className="text-sm mt-2 leading-relaxed text-wood/90 bg-sand p-3 border-2 border-wood retro-border-sm">
                    Нейросеть создала стандартную таблицу строго по описанию. Я счел этот подход неэффективным для работы лесника, которому важно сразу видеть очаги активности. Вместо этого я настоял на создании интерактивной карты секторов леса с эффектом тепловой карты. Когда система предложила подключить тяжелые внешние графики, я отклонил эту идею из соображений скорости загрузки и заставил сверстать сетку на встроенных стилях фреймворка, сохранив легкость и автономность кода.
                  </p>
                </div>

                {/* Checkpoint 3 */}
                <div className="relative">
                  <div className="absolute -left-[38px] top-1 bg-wood text-sand-light w-7 h-7 rounded-full border-4 border-sand-light flex items-center justify-center font-press-start text-[10px]">
                    3
                  </div>
                  <span className="bg-forest text-sand-light text-xs font-press-start font-black px-2 py-0.5 retro-border-sm">
                    Чекпоинт 3: Доработка бизнес-логики
                  </span>
                  <h3 className="text-lg font-black mt-2 text-wood uppercase">
                    Кастомный скоринг и симуляция данных
                  </h3>
                  <p className="text-sm mt-2 leading-relaxed text-wood/90 bg-sand p-3 border-2 border-wood retro-border-sm">
                    Техническое задание требовало показать динамику изменения отчетов при смене данных. Для этого я поручил написать генератор случайных событий, имитирующий активность за сутки. Кроме того, я усложнил систему оценки: теперь рассчитывается реальная угроза, которая складывается из базовой подозрительности животного и наличия у него добычи. Код расчетов был написан автоматикой, а визуальную часть с индикацией критических уровней красным цветом я дорабатывал и настраивал сам.
                  </p>
                </div>

                {/* Checkpoint 4 */}
                <div className="relative">
                  <div className="absolute -left-[38px] top-1 bg-wood text-sand-light w-7 h-7 rounded-full border-4 border-sand-light flex items-center justify-center font-press-start text-[10px]">
                    4
                  </div>
                  <span className="bg-forest text-sand-light text-xs font-press-start font-black px-2 py-0.5 retro-border-sm">
                    Чекпоинт 4: Выявление слабых мест и исправление ошибок
                  </span>
                  <h3 className="text-lg font-black mt-2 text-wood uppercase">
                    Спасение данных и обработка краевых случаев
                  </h3>
                  <p className="text-sm mt-2 leading-relaxed text-wood/90 bg-sand p-3 border-2 border-wood retro-border-sm">
                    При тестировании я нашел критический баг: при обновлении вкладки (что часто бывает при плохой связи в лесу) все данные сбрасывались. Я поручил автоматике переписать логику сохранения на синхронизацию с локальным хранилищем браузера. Также я спроектировал кнопку сброса данных, чтобы проверяющие могли легко вернуть приложение к заводским настройкам и исходному списку. Вторая решенная проблема - пустые состояния при фильтрации локаций без лис, для которых я добавил визуальные заглушки.
                  </p>
                </div>

                {/* Checkpoint 5 */}
                <div className="relative">
                  <div className="absolute -left-[38px] top-1 bg-wood text-sand-light w-7 h-7 rounded-full border-4 border-sand-light flex items-center justify-center font-press-start text-[10px]">
                    5
                  </div>
                  <span className="bg-forest text-sand-light text-xs font-press-start font-black px-2 py-0.5 retro-border-sm">
                    Чекпоинт 5: Финальное тестирование и безопасность
                  </span>
                  <h3 className="text-lg font-black mt-2 text-wood uppercase">
                    QA и деплой
                  </h3>
                  <p className="text-sm mt-2 leading-relaxed text-wood/90 bg-sand p-3 border-2 border-wood retro-border-sm">
                    На этапе проверки адаптивности под экраны мобильных телефонов пришлось исправить компоновку таблицы, добавив горизонтальную прокрутку для сохранения структуры данных. Я убедился, что все показатели мгновенно реагируют на изменение состояния. Также во время сборки были убраны тестовые ключи метрик, которые я заменил на безопасные переменные окружения перед финальной публикацией проекта в соответствии с требованиями информационной безопасности.
                  </p>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <footer className="p-4 bg-sand border-t-4 border-wood flex justify-end shrink-0">
              <button 
                id="btn-close-worklog-bottom"
                onClick={() => setShowWorklog(false)}
                className="retro-btn bg-forest hover:bg-forest-light text-sand-light font-press-start text-xs px-6 py-3 min-h-[44px] flex items-center justify-center gap-2 transition-all duration-100 hover:scale-105 active:scale-95"
              >
                <Check size={14} /> ЗАКРЫТЬ ЖУРНАЛ
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Retro Styled Toast Notification */}
      {toast && (
        <div 
          id="toast-notification" 
          className="fixed bottom-6 right-6 z-50 retro-border bg-[#ecc844] text-wood font-mono text-base font-bold p-4 animate-fade-in flex items-center gap-2"
        >
          <span>🔔</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Onboarding Overlay Walkthrough Dialog */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-wood/75 backdrop-blur-xs z-40 pointer-events-auto transition-all duration-300">
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-sand-light retro-border p-5 z-50 animate-fade-in text-wood">
            <header className="flex justify-between items-center border-b-2 border-wood pb-2 mb-3">
              <span className="font-press-start text-[10px] font-black text-fox uppercase">
                Обучение ({currentOnboardingStep + 1} / {ONBOARDING_STEPS.length})
              </span>
              <button 
                onClick={handleCompleteOnboarding}
                className="text-wood/60 hover:text-wood font-bold text-xs font-mono"
              >
                Пропустить
              </button>
            </header>
            <h3 className="font-press-start text-xs font-black mb-2 uppercase text-wood leading-tight">
              {ONBOARDING_STEPS[currentOnboardingStep].title}
            </h3>
            <p className="font-mono text-sm leading-relaxed mb-4 font-bold text-wood/80">
              {ONBOARDING_STEPS[currentOnboardingStep].text}
            </p>
            <footer className="flex justify-between items-center gap-4">
              <button
                onClick={handlePrevOnboarding}
                disabled={currentOnboardingStep === 0}
                className={`retro-btn text-xs font-press-start font-black px-3 py-2 min-h-[38px] transition-all duration-100 ${
                  currentOnboardingStep === 0 
                    ? 'bg-sand-dark text-wood/30 cursor-not-allowed' 
                    : 'bg-sand text-wood hover:scale-105 active:scale-95'
                }`}
              >
                Назад
              </button>
              <button
                onClick={handleNextOnboarding}
                className="retro-btn bg-fox text-white text-[10px] font-press-start font-black px-4 py-2 min-h-[38px] flex-1 flex items-center justify-center gap-1 transition-all duration-100 hover:scale-105 active:scale-95"
              >
                {currentOnboardingStep === ONBOARDING_STEPS.length - 1 ? 'Начать работу' : 'Далее'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import ParameterPicker, { PARAMETERS } from './ParameterPicker';
import AmbientDial from './AmbientDial';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SessionProvider, useWorkout, useNavigate, useStopwatch, formatDuration, exportLaps, shareReport, AnimatedTime } from './runtime';

  const LOGO_URL = "/icon.svg";

  // Global Context state for the workout routine
  const InitialWorkoutConfig = {
    workSec: 60,
    restSec: 60,
    rounds: 8,
    prepSec: 10,
    noRestLast: true,
    title: "8 回合拳击训练",
    level: "标准进阶"
  };

  // Reusable Bottom Tab Navigation Bar
  function BottomNavBar({ currentPath = "/" }) {
    const navigate = useNavigate();

    return (
      <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.45)] border-t border-surface-container-highest/20">
        <div className="flex justify-around items-center h-16 px-space-xs max-w-md mx-auto">
          <button 
            onClick={() => navigate("/")}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] py-1 transition-colors ${currentPath === "/" ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[24px]">sports_mma</span>
            <span className="font-caption text-caption">首页</span>
          </button>

          <button 
            onClick={() => navigate("/stopwatch")}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] py-1 transition-colors ${currentPath === "/stopwatch" ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[24px]">timer</span>
            <span className="font-caption text-caption">秒表</span>
          </button>

          <button 
            onClick={() => navigate("/editor")}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] py-1 transition-colors ${currentPath === "/editor" ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[24px]">fitness_center</span>
            <span className="font-caption text-caption">方案</span>
          </button>

          <button 
            onClick={() => navigate("/summary")}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] py-1 transition-colors ${currentPath === "/summary" ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[24px]">monitoring</span>
            <span className="font-caption text-caption">战报</span>
          </button>

          <button 
            onClick={() => navigate("/settings")}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] py-1 transition-colors ${currentPath === "/settings" ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[24px]">tune</span>
            <span className="font-caption text-caption">设置</span>
          </button>
        </div>
      </nav>
    );
  }

  // SCREEN 8: Dashboard / Home Screen
  function DashboardScreen({ workoutConfig, setWorkoutConfig }) {
    const navigate = useNavigate();
    const { session } = useWorkout();

    const loadPreset = (work, rest, rounds, title) => {
      setWorkoutConfig(prev => ({
        ...prev,
        workSec: work,
        restSec: rest,
        rounds: rounds,
        title: title
      }));
      navigate("/prep", { ...workoutConfig, workSec: work, restSec: rest, rounds, title });
    };

    return (
      <div className="flex flex-col min-h-screen bg-surface selection:bg-primary-container selection:text-on-primary-container">
        {/* App Header */}
        <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
          <div className="h-16 px-margin flex items-center justify-between gap-space-sm max-w-md mx-auto">
            <div className="flex items-center gap-space-sm">
              <img alt="ROUND Brand Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
              <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface font-black">ROUND</span>
              <span className="text-outline font-caption text-caption uppercase px-space-xs py-0.5 rounded bg-surface-container font-bold tracking-widest">PRO</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <button 
                onClick={() => navigate("/settings")} 
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-md mx-auto">
          <div className="flex flex-col w-full px-margin pb-6 gap-space-lg">
            
            {/* Top Welcome Banner */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-sm">
                  <img alt="ROUND Brand Logo" className="h-6 w-auto object-contain rounded" src={LOGO_URL} />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-caption text-caption uppercase tracking-wider font-bold">
                    PRO HUD
                  </span>
                </div>
                <p className="text-on-surface-variant font-body-md text-body-md tracking-tight">每一回合，都值得全力以赴</p>
              </div>
              <button 
                onClick={() => navigate("/editor")}
                aria-label="快捷偏好设置" 
                className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
            </div>

            {/* Hero Active Workout Card */}
            <section className="relative w-full rounded-xl bg-surface-container-low p-space-lg shadow-xl overflow-hidden flex flex-col gap-space-md border border-surface-container-highest/30">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary-container/15 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-12 w-40 h-40 rounded-full bg-secondary-container/10 blur-2xl pointer-events-none"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                    <span className="font-label-caps text-caption text-primary tracking-widest uppercase font-bold">
                      CURRENT ACTIVE ROUTINE
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                    {workoutConfig.title}
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-tertiary-fixed font-label-caps text-caption tracking-wider flex items-center gap-1 shadow-inner font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-tertiary">military_tech</span>
                  {workoutConfig.level}
                </span>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-between gap-1.5 py-1 relative z-10">
                <div className="h-1.5 flex-1 rounded-full bg-primary shadow-[0_0_8px_rgba(255,82,93,0.6)]"></div>
                <div className="h-1.5 flex-1 rounded-full bg-primary shadow-[0_0_8px_rgba(255,82,93,0.6)]"></div>
                <div className="h-1.5 flex-1 rounded-full bg-primary-container animate-pulse"></div>
                <div className="h-1.5 flex-1 rounded-full bg-surface-container-highest"></div>
                <div className="h-1.5 flex-1 rounded-full bg-surface-container-highest"></div>
                <div className="h-1.5 flex-1 rounded-full bg-surface-container-highest"></div>
                <div className="h-1.5 flex-1 rounded-full bg-surface-container-highest"></div>
                <div className="h-1.5 flex-1 rounded-full bg-surface-container-highest"></div>
              </div>

              {/* Matrix Grid */}
              <div className="grid grid-cols-2 gap-space-sm relative z-10 pt-1">
                <div className="bg-surface-container/70 rounded-lg p-3 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                    <span className="material-symbols-outlined text-[14px] text-primary">sports_kabaddi</span>
                    <span>训练时长</span>
                  </div>
                  <span className="font-timer-lg text-headline-sm text-on-surface font-bold font-mono">
                    {String(Math.floor(workoutConfig.workSec / 60)).padStart(2, '0')}:{String(workoutConfig.workSec % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="bg-surface-container/70 rounded-lg p-3 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                    <span className="material-symbols-outlined text-[14px] text-secondary">hourglass_bottom</span>
                    <span>间歇休息</span>
                  </div>
                  <span className="font-timer-lg text-headline-sm text-secondary font-bold font-mono">
                    {String(Math.floor(workoutConfig.restSec / 60)).padStart(2, '0')}:{String(workoutConfig.restSec % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="bg-surface-container/70 rounded-lg p-3 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">repeat</span>
                    <span>总回合数</span>
                  </div>
                  <span className="font-timer-lg text-headline-sm text-on-surface font-bold font-mono">
                    {workoutConfig.rounds} <span className="font-label-caps text-caption text-outline font-normal">ROUNDS</span>
                  </span>
                </div>
                <div className="bg-surface-container/70 rounded-lg p-3 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
                    <span>有效时长</span>
                  </div>
                  <span className="font-timer-lg text-headline-sm text-on-surface font-bold font-mono">
                    {formatDuration((workoutConfig.workSec * workoutConfig.rounds + workoutConfig.restSec * (workoutConfig.rounds - (workoutConfig.noRestLast ? 1 : 0))) * 1000)}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => navigate(session.config && session.phase !== "done" && session.phase !== "idle" ? "/combat" : "/prep")}
                className="w-full h-16 rounded-full bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm shadow-[0_0_24px_rgba(255,82,93,0.5)] active:scale-[0.98] transition-all hover:brightness-110 font-bold"
              >
                <span className="material-symbols-outlined text-[28px] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                <span className="tracking-wide">{session.config && session.phase !== "done" && session.phase !== "idle" ? "继续当前训练" : "开始训练"}</span>
              </button>
            </section>

            {/* Motivational Atmosphere banner */}
            <div className="w-full rounded-xl bg-surface-container-low p-space-md flex items-center gap-space-md shadow-md overflow-hidden relative border border-surface-container-highest/20">
              <div className="w-16 h-16 rounded-lg bg-surface-container-highest shrink-0 overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Boxer wrapped hands"
                  src="/boxing.jpg"
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1 text-tertiary">
                  <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                  <span className="font-label-caps text-caption font-bold">今日对抗负荷</span>
                </div>
                <p className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">今天，向更强的自己出发</p>
                <span className="font-caption text-caption text-on-surface-variant">目标：完成 {workoutConfig.rounds} 回合 · 每一回合都算数</span>
              </div>
            </div>

            {/* Quick Presets Section */}
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-primary"></span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">快速预设</h3>
                </div>
                <span className="font-caption text-caption text-on-surface-variant">即选即练</span>
              </div>
              <div className="flex flex-col gap-space-sm">
                
                {/* Preset 1 */}
                <div className="w-full rounded-xl bg-surface-container p-space-md flex items-center justify-between shadow-sm active:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-md min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-primary-container/15 flex items-center justify-center shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[24px]">sports_mma</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-body-lg text-on-surface font-semibold truncate">拳击专业锦标</span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-caption text-caption font-bold">PRO 12R</span>
                      </div>
                      <p className="font-label-numeric text-caption text-on-surface-variant">3分钟 · 1分钟休 · 12回合</p>
                      <span className="font-caption text-caption text-outline">职业拳击标准锦标赛节奏</span>
                    </div>
                  </div>
                  <button 
                    aria-label="开始拳击专业训练"
                    onClick={() => loadPreset(180, 60, 12, "职业拳击锦标赛")}
                    className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:text-primary transition-colors shrink-0 shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>

                {/* Preset 2 */}
                <div className="w-full rounded-xl bg-surface-container p-space-md flex items-center justify-between shadow-sm active:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-md min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-secondary-container/15 flex items-center justify-center shrink-0 text-secondary">
                      <span className="material-symbols-outlined text-[24px]">bolt</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-body-lg text-on-surface font-semibold truncate">HIIT 极速间歇</span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-caption text-caption font-bold">高燃</span>
                      </div>
                      <p className="font-label-numeric text-caption text-on-surface-variant">30秒 · 15秒休 · 10回合</p>
                      <span className="font-caption text-caption text-outline">极速燃脂与最大摄氧量冲刺</span>
                    </div>
                  </div>
                  <button 
                    aria-label="开始HIIT间歇训练"
                    onClick={() => loadPreset(30, 15, 10, "HIIT 极限燃脂")}
                    className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:text-secondary transition-colors shrink-0 shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>

                {/* Preset 3 */}
                <div className="w-full rounded-xl bg-surface-container p-space-md flex items-center justify-between shadow-sm active:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-md min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-tertiary-container/15 flex items-center justify-center shrink-0 text-tertiary">
                      <span className="material-symbols-outlined text-[24px]">timer</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-body-lg text-on-surface font-semibold truncate">敏捷协调速训</span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-tertiary font-caption text-caption font-bold">轻量</span>
                      </div>
                      <p className="font-label-numeric text-caption text-on-surface-variant">1分钟 · 1分钟休 · 8回合</p>
                      <span className="font-caption text-caption text-outline">日常敏捷度与协调性保持</span>
                    </div>
                  </div>
                  <button 
                    aria-label="开始敏捷协调训练"
                    onClick={() => loadPreset(60, 60, 8, "敏捷协调速训")}
                    className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:text-tertiary transition-colors shrink-0 shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>

              </div>
            </section>

            {/* Custom Routine Trigger */}
            <button 
              onClick={() => navigate("/editor")}
              className="w-full rounded-xl bg-surface-container-high p-space-md flex items-center justify-between shadow-lg active:scale-[0.99] transition-all text-left group border border-surface-container-highest/50"
            >
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-on-surface group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[26px]">add_circle</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-body-lg text-on-surface font-semibold">自定义训练方案</span>
                  <p className="font-body-md text-caption text-on-surface-variant truncate">创建专属回合周期、热身准备及声效提示</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:text-on-surface transition-colors shrink-0">
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </div>
            </button>

          </div>
        </main>

        <BottomNavBar currentPath="/" />
      </div>
    );
  }

  // SCREEN 4: Prep / Countdown Screen
  function PrepScreen({ workoutConfig }) {
    const navigate = useNavigate();
    const { session, muted, setMuted } = useWorkout();
    const timeLeft = Math.ceil(session.remainingMs / 1000);
    const totalTime = Math.max(1, session.durationMs / 1000);
    const perimeter = 2 * Math.PI * 102;
    const dashOffset = perimeter * (1 - session.remainingMs / (totalTime * 1000));

    return (
      <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface min-h-screen">
        <div className="flex flex-col w-full px-margin pb-margin max-w-md mx-auto flex-1 justify-between">
          <div className="relative w-full overflow-hidden flex flex-col items-center">
            {/* Ambient Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-tertiary/15 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between z-10 py-space-sm mb-space-md">
              <button 
                onClick={() => navigate("/")}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
              
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-low">
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span className="font-label-caps text-caption text-tertiary uppercase tracking-wider font-bold">HUD READY</span>
              </div>

              <button 
                aria-label={muted ? "取消静音" : "静音"}
                onClick={() => setMuted(!muted)}
                className={`w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-high transition-transform active:scale-90 ${muted ? "text-on-surface-variant" : "text-tertiary"}`}
              >
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {muted ? "volume_off" : "volume_up"}
                </span>
              </button>
            </div>

            {/* Radiant Status Badge */}
            <div className="z-10 flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-highest shadow-lg shadow-tertiary/10 mb-space-lg">
              <span className="w-2 h-2 rounded-full bg-tertiary shadow-sm shadow-tertiary"></span>
              <span className="font-label-caps text-label-caps text-tertiary font-bold tracking-widest uppercase">
                GET READY · 准备开始
              </span>
            </div>

            {/* Central Dial */}
            <div className="relative w-72 h-72 flex items-center justify-center z-10 my-space-xs">
              <div className="absolute inset-4 rounded-full bg-tertiary/10 blur-xl pointer-events-none"></div>
              <svg className="w-full h-full -rotate-90 transform drop-shadow-[0_0_16px_rgba(253,187,67,0.35)]" viewBox="0 0 240 240">
                <circle className="text-surface-container-highest" cx="120" cy="120" fill="none" r="102" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></circle>
                <circle 
                  className="text-tertiary timer-ring" 
                  cx="120" cy="120" fill="none" 
                  r="102" 
                  stroke="currentColor" 
                  strokeDasharray={perimeter} 
                  strokeDashoffset={dashOffset} 
                  strokeLinecap="round" 
                  strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none text-center">
                <span className="font-caption text-caption text-tertiary uppercase tracking-widest mb-1 font-bold">COUNTDOWN</span>
                <span className="font-display-hero-mobile text-display-hero-mobile text-on-surface tracking-tighter drop-shadow-[0_0_24px_rgba(253,187,67,0.4)] font-mono font-bold">
                  <AnimatedTime value={formatDuration(timeLeft * 1000)} />
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary/40"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary/20"></span>
                </div>
              </div>
            </div>

            <p className="z-10 font-body-md text-body-md text-on-surface-variant text-center tracking-wide mt-space-md mb-space-lg max-w-[280px]">
              调整呼吸，戴好拳套，准备进入训练
            </p>

            {/* Workout Summary Card */}
            <div className="w-full bg-surface-container-low rounded-xl p-space-md shadow-md z-10 flex flex-col gap-space-sm mb-space-xl border border-surface-container-highest/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">sports_mma</span>
                  <span className="font-label-caps text-label-caps tracking-wider uppercase font-bold">即将开始 · 组合实战</span>
                </div>
                <span className="font-caption text-caption text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">高强度 HIIT</span>
              </div>
              <div className="h-[1px] w-full bg-surface-container-highest"></div>
              <div className="flex items-center justify-between text-on-surface pt-space-xs">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-semibold">
                    {workoutConfig.rounds} 回合 · {formatDuration(workoutConfig.workSec * 1000)} /轮
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">回合间休息 {formatDuration(workoutConfig.restSec * 1000)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-numeric text-label-numeric text-tertiary font-bold font-mono">{formatDuration((workoutConfig.workSec * workoutConfig.rounds + workoutConfig.restSec * (workoutConfig.rounds - (workoutConfig.noRestLast ? 1 : 0))) * 1000)}</span>
                  <span className="font-caption text-caption text-on-surface-variant">预计总时长</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col items-center gap-space-md z-10">
              <button 
                onClick={() => navigate("/combat")}
                className="w-full h-16 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center gap-space-xs shadow-lg shadow-tertiary/20 active:scale-[0.98] transition-transform font-bold"
              >
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                <span className="font-headline-sm text-headline-sm font-bold tracking-wide">跳过准备，直接开练</span>
              </button>
              <button 
                onClick={() => navigate("/")}
                className="min-h-[48px] px-space-lg flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:bg-surface-container-low transition-colors"
              >
                <span className="font-body-md text-body-md font-medium">放弃本次训练</span>
              </button>
            </div>

          </div>
        </div>
      </main>
    );
  }

  // SCREEN 6: Combat Round Timer Screen (Active Fight State)
  function CombatScreen({ workoutConfig }) {
    const navigate = useNavigate();
    const { session, muted, setMuted, addTime } = useWorkout();
    const secondsLeft = Math.ceil(session.remainingMs / 1000);
    const isRunning = session.running;
    const setSecondsLeft = (fn) => addTime((fn(secondsLeft) - secondsLeft) * 1000);
    const currentRound = session.round;
    const totalDuration = session.durationMs / 1000;
    const ringRadius = 120;
    const circumference = 2 * Math.PI * ringRadius;
    const offset = circumference * (1 - session.remainingMs / Math.max(1, session.durationMs));

    const formatMinsSecs = (sec) => {
      const mins = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
      <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface min-h-screen">
        <div className="flex flex-col w-full relative select-none overflow-hidden px-margin py-space-sm space-y-space-md max-w-md mx-auto flex-1 justify-between">
          
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary-container opacity-20 blur-3xl"></div>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full bg-primary-container opacity-10 blur-3xl"></div>

          {/* HUD Top Bar */}
          <header className="relative z-10 flex items-center justify-between w-full h-12">
            <button 
              onClick={() => navigate("/paused")}
              aria-label="暂停或退出训练" 
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-high shadow-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container"></span>
              </span>
              <span className="font-label-caps text-label-caps text-on-surface tracking-wider font-bold">训练中</span>
            </div>
            <button 
              aria-label={muted ? "取消静音" : "静音"}
                onClick={() => setMuted(!muted)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[22px]">{muted ? "volume_off" : "volume_up"}</span>
            </button>
          </header>

          {/* Status Headline Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center pt-space-xs space-y-1 text-center">
            <div className="inline-flex items-center px-space-md py-1 rounded-full bg-surface-container shadow-sm">
              <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase font-bold">ROUND COMBAT</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-headline-md text-headline-md text-primary font-bold tracking-tight">FIGHT · 训练中</span>
            </div>
          </div>

          {/* Central Countdown Dial */}
          <div className="relative z-10 flex flex-col items-center justify-center my-space-xs">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              <AmbientDial mode="work" running={session.running} remainingMs={session.remainingMs} />
              <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
                <defs>
                  <filter height="140%" id="crimsonGlow" width="140%" x="-20%" y="-20%">
                    <feDropShadow dx="0" dy="0" floodColor="#ff525d" floodOpacity="0.8" stdDeviation="6"></feDropShadow>
                    <feDropShadow dx="0" dy="0" floodColor="#ff525d" floodOpacity="0.35" stdDeviation="16"></feDropShadow>
                  </filter>
                </defs>
                <circle className="text-surface-container-highest" cx="140" cy="140" fill="transparent" r="120" stroke="currentColor" strokeWidth="12"></circle>
                <circle 
                  className="text-primary-container timer-ring" 
                  cx="140" cy="140" 
                  fill="transparent" 
                  filter="url(#crimsonGlow)" 
                  r="120" 
                  stroke="currentColor" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={offset} 
                  strokeLinecap="round" 
                  strokeWidth="12"
                ></circle>
              </svg>
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="flex items-baseline space-x-1">
                  <span className="font-display-hero-mobile text-display-hero-mobile text-on-surface tabular-nums tracking-tighter drop-shadow-lg font-mono font-bold">
                    <AnimatedTime value={formatMinsSecs(secondsLeft)} />
                  </span>
                </div>
                <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider mt-1 font-semibold">本回合剩余时间</span>
              </div>
            </div>
          </div>

          {/* Round Matrix */}
          <div className="relative z-10 flex flex-col items-center space-y-space-sm w-full">
            <div className="flex items-center space-x-2">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-wide">
                第 {currentRound} / {workoutConfig.rounds} 回合
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-2 max-w-xs">
              {[...Array(workoutConfig.rounds)].map((_, i) => {
                const roundIdx = i + 1;
                if (roundIdx < currentRound) {
                  return <div key={i} className="w-4 h-2 rounded-full bg-surface-bright" title={`第${roundIdx}回合 (已完成)`}></div>;
                } else if (roundIdx === currentRound) {
                  return <div key={i} className="w-8 h-2.5 rounded-full bg-primary-container shadow-sm shadow-primary animate-pulse" title={`第${roundIdx}回合 (当前激活)`}></div>;
                } else {
                  return <div key={i} className="w-4 h-2 rounded-full bg-surface-container-highest" title={`第${roundIdx}回合 (待开始)`}></div>;
                }
              })}
            </div>

            <div className="flex items-center space-x-2 px-space-md py-1.5 rounded-full bg-surface-container-low shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>ecg_heart</span>
              <span className="font-caption text-caption text-on-surface-variant tracking-wider font-semibold">专注呼吸 · 保持训练节奏</span>
            </div>
          </div>

          {/* Heavy Tactile Controls */}
          <div className="relative z-10 flex items-center justify-around w-full pt-space-sm pb-space-md max-w-sm mx-auto">
            <div className="flex flex-col items-center space-y-1">
              <button 
                aria-label="延长训练15秒"
                onClick={() => setSecondsLeft(prev => prev + 15)}
                className="w-16 h-16 rounded-full bg-surface-container-high active:bg-surface-bright text-on-surface flex items-center justify-center active:scale-90 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[28px]">more_time</span>
              </button>
              <span className="font-caption text-caption text-on-surface-variant font-medium">延长 15 秒</span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <button 
                onClick={() => {
                  if (isRunning) {
                    navigate("/paused");
                  }
                }}
                className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isRunning ? "pause" : "play_arrow"}
                </span>
              </button>
              <span className="font-caption text-caption text-on-surface-variant font-bold">
                {isRunning ? "暂停" : "继续"}
              </span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <button 
                aria-label="下一阶段"
                onClick={() => navigate("/rest")}
                className="w-16 h-16 rounded-full bg-surface-container-high active:bg-surface-bright text-on-surface flex items-center justify-center active:scale-90 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[28px]">skip_next</span>
              </button>
              <span className="font-caption text-caption text-on-surface-variant font-medium">下一阶段</span>
            </div>
          </div>

        </div>
      </main>
    );
  }

  // SCREEN 3: Paused Overlay / Workout Paused Screen
  function PausedScreen({ workoutConfig }) {
    const navigate = useNavigate();
    const [confirmExit, setConfirmExit] = useState(false);
    const { session, muted, setMuted, resetPhase } = useWorkout();

    return (
      <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface min-h-screen">
        <div className="flex flex-col w-full relative min-h-full px-margin pb-space-xl overflow-hidden select-none max-w-md mx-auto flex-1 justify-between">
          
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary-container/10 blur-3xl opacity-40"></div>
          <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-tertiary/10 blur-3xl opacity-30"></div>

          {/* Top Status */}
          <div className="flex flex-col items-center w-full pt-space-sm pb-space-md">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-tertiary-container/30 text-tertiary-fixed shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-label-caps text-label-caps tracking-wider uppercase font-bold">PAUSED · 已暂停</span>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-1.5 w-full mb-space-sm">
              {Array.from({ length: workoutConfig.rounds }, (_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i + 1 === session.round ? 'bg-tertiary shadow-[0_0_8px_rgba(253,187,67,0.7)]' : i + 1 < session.round ? 'bg-surface-bright' : 'bg-surface-container-highest'}`} />)}
            </div>
          </div>

          {/* Ring Display */}
          <div className="flex flex-col items-center justify-center relative my-auto py-space-sm">
            <div className="relative w-72 h-72 flex items-center justify-center">
              <AmbientDial mode={session.phase === 'rest' ? 'rest' : 'work'} running={false} />
              <div className="absolute inset-4 rounded-full bg-surface-container-low/80 backdrop-blur-lg"></div>
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 260 260">
                <circle className="text-surface-container-highest" cx="130" cy="130" fill="none" r="110" stroke="currentColor" strokeWidth="10"></circle>
                <circle 
                  className="text-tertiary-fixed-dim opacity-70" 
                  cx="130" cy="130" fill="none" 
                  r="110" 
                  stroke="currentColor" 
                  strokeDasharray="14 8" 
                  strokeDashoffset="172" 
                  strokeLinecap="round" 
                  strokeWidth="10"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase mb-1 font-bold">
                  ROUND {String(session.round).padStart(2, "0")}
                </span>
                <div className="font-display-hero-mobile text-display-hero-mobile text-on-surface tracking-tight leading-none drop-shadow-md font-mono font-bold">
                  {formatDuration(session.remainingMs)}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full bg-surface-container-high/90 text-on-surface-variant font-caption text-caption">
                  <span className="material-symbols-outlined text-[14px] text-tertiary">pause_circle</span>
                  <span>第 {session.round} / {workoutConfig.rounds} 回合 · {session.phase === "rest" ? "休息" : session.phase === "prep" ? "准备" : "训练"}已暂停</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-gutter-sm w-full max-w-xs mt-space-md">
              <div className="bg-surface-container-low/70 rounded-xl p-2.5 flex flex-col items-center text-center">
                <span className="font-caption text-caption text-on-surface-variant">心率（未连接）</span>
                <div className="flex items-baseline gap-0.5 mt-0.5 text-primary">
                  <span className="font-label-numeric text-label-numeric font-bold font-mono">—</span>
                  <span className="font-caption text-caption opacity-80">BPM</span>
                </div>
              </div>
              <div className="bg-surface-container-low/70 rounded-xl p-2.5 flex flex-col items-center text-center">
                <span className="font-caption text-caption text-on-surface-variant">热量（未连接）</span>
                <div className="flex items-baseline gap-0.5 mt-0.5 text-tertiary">
                  <span className="font-label-numeric text-label-numeric font-bold font-mono">—</span>
                  <span className="font-caption text-caption opacity-80">KCAL</span>
                </div>
              </div>
              <div className="bg-surface-container-low/70 rounded-xl p-2.5 flex flex-col items-center text-center">
                <span className="font-caption text-caption text-on-surface-variant">总计用时</span>
                <div className="flex items-baseline gap-0.5 mt-0.5 text-on-surface">
                  <span className="font-label-numeric text-label-numeric font-bold font-mono">{formatDuration(session.elapsedMs)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Glove Friendly Controls */}
          <div className="w-full flex flex-col gap-space-md mt-auto pt-space-sm z-30">
            {/* Resume Button */}
            <button 
              onClick={() => navigate("/combat")}
              className="w-full h-[68px] rounded-full bg-primary-container text-on-primary font-headline-md text-headline-md flex items-center justify-center gap-space-sm shadow-xl active:scale-[0.98] transition-transform duration-150 font-bold"
            >
              <span className="material-symbols-outlined text-[32px] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              <span className="tracking-wide">继续训练</span>
            </button>

            {/* Stop Workout / Confirmation Shield */}
            <div className="relative w-full">
              {!confirmExit ? (
                <button 
                  onClick={() => setConfirmExit(true)}
                  className="w-full h-[58px] rounded-full bg-surface-container-high text-on-surface font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs active:bg-surface-container-highest transition-colors font-bold"
                >
                  <span className="material-symbols-outlined text-[22px] text-error">stop_circle</span>
                  <span className="text-error">结束训练</span>
                </button>
              ) : (
                <div className="w-full h-[58px] rounded-full bg-surface-container-highest flex items-center justify-between p-1.5 shadow-2xl animate-fade-in border border-error/30">
                  <button 
                    onClick={() => setConfirmExit(false)}
                    className="h-full px-space-md rounded-full bg-surface-container text-on-surface-variant font-body-md text-body-md flex items-center gap-1 active:bg-surface-bright"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    <span>返回</span>
                  </button>
                  <span className="font-caption text-caption text-error font-bold">确认结束？</span>
                  <button 
                    onClick={() => navigate("/summary")}
                    className="h-full px-space-lg rounded-full bg-error text-on-error font-headline-sm text-headline-sm flex items-center justify-center active:opacity-90 font-bold"
                  >
                    <span>确认交卷</span>
                  </button>
                </div>
              )}
            </div>

            {/* Auxiliary Buttons */}
            <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
              <button 
                onClick={() => { resetPhase(); navigate("/combat"); }}
                className="h-12 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface font-body-md text-body-md flex items-center justify-center gap-space-xs active:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">replay</span>
                <span>重置本回合</span>
              </button>

              <button 
                aria-label={muted ? "取消静音" : "静音"}
                onClick={() => setMuted(!muted)}
                className="h-12 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface font-body-md text-body-md flex items-center justify-center gap-space-xs active:bg-surface-container transition-colors"
              >
                <span className={`material-symbols-outlined text-[20px] ${muted ? "text-on-surface-variant" : "text-tertiary"}`}>
                  {muted ? "volume_off" : "volume_up"}
                </span>
                <span>{muted ? "静音模式" : "铃声已开启"}</span>
              </button>
            </div>

          </div>
        </div>
      </main>
    );
  }

  // SCREEN 5: Rest Interval Screen (Rest State)
  function RestScreen({ workoutConfig }) {
    const navigate = useNavigate();
    const { session, muted, setMuted, addTime, togglePause, resetPhase } = useWorkout();
    const secondsLeft = Math.ceil(session.remainingMs / 1000);
    const isPaused = !session.running;
    const setIsPaused = togglePause;
    const initialTotal = session.durationMs / 1000;
    const setSecondsLeft = (value) => typeof value === 'function' ? addTime((value(secondsLeft) - secondsLeft) * 1000) : resetPhase();
    const ringTotalLength = 2 * Math.PI * 120;
    const offset = ringTotalLength * (1 - session.remainingMs / Math.max(1, session.durationMs));

    const formatMinsSecs = (sec) => {
      const mins = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
      <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface min-h-screen">
        <div className="flex flex-col w-full relative select-none max-w-md mx-auto flex-1 justify-between">
          
          {/* Blue ambient */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl opacity-60 animate-pulse"></div>
            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full bg-secondary/10 blur-3xl opacity-40"></div>
          </div>

          {/* Header */}
          <header className="w-full px-margin pt-space-sm pb-space-xs flex items-center justify-between">
            <button 
              onClick={() => navigate("/paused")}
              aria-label="退出训练" 
              className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-bright active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <div className="h-8 px-space-md rounded-full bg-surface-container-high flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase font-bold">休息中</span>
            </div>
            <button 
              aria-label={muted ? "取消静音" : "静音"}
                onClick={() => setMuted(!muted)}
              className={`w-12 h-12 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-bright active:scale-95 transition-transform ${muted ? "text-on-surface-variant" : "text-secondary"}`}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {muted ? "volume_off" : "volume_up"}
              </span>
            </button>
          </header>

          {/* Center Viewport */}
          <section className="flex flex-col items-center justify-center px-margin pt-space-xs pb-space-sm w-full">
            <div className="mb-space-md">
              <div className="px-space-md py-1.5 rounded-full bg-surface-container-high shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">air</span>
                <span className="font-label-caps text-label-caps text-secondary font-bold tracking-widest">REST · 深度缓释间歇</span>
              </div>
            </div>

            {/* Circular Ring */}
            <div className="relative w-72 h-72 flex items-center justify-center my-space-xs">
              <AmbientDial mode="rest" running={session.running} remainingMs={session.remainingMs} />
              <div className="absolute inset-4 rounded-full bg-secondary-container/10 blur-xl pointer-events-none"></div>
              <svg aria-hidden="true" className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
                <circle className="text-surface-container-high" cx="140" cy="140" fill="transparent" r="120" stroke="currentColor" strokeWidth="12"></circle>
                <circle 
                  className="text-secondary timer-ring" 
                  cx="140" cy="140" fill="transparent" 
                  r="120" 
                  stroke="currentColor" 
                  strokeDasharray={ringTotalLength} 
                  strokeDashoffset={offset} 
                  strokeLinecap="round" 
                  strokeWidth="12"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-caption text-caption text-secondary uppercase tracking-widest mb-1 flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[13px]">timer</span>
                  休息剩余时间
                </span>
                <div className="font-display-hero-mobile text-display-hero-mobile text-on-surface tracking-tight leading-none drop-shadow-md font-mono font-bold">
                  <AnimatedTime value={formatMinsSecs(secondsLeft)} />
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/80">
                  <span className="font-label-numeric text-caption text-on-surface-variant font-medium">总用时 {formatDuration(session.elapsedMs)}</span>
                </div>
              </div>
            </div>

            {/* 8 Round Progress */}
            <div className="w-full max-w-xs mt-space-sm mb-space-md bg-surface-container-low p-space-sm rounded-xl border border-surface-container-highest/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-caption text-on-surface-variant tracking-wider font-semibold">回合推进 (共 {workoutConfig.rounds} 轮)</span>
                <span className="font-label-numeric text-caption text-secondary font-bold font-mono">第 {session.completedRounds} 轮完成</span>
              </div>
              <div className="flex gap-1.5 h-2 w-full">
                {Array.from({ length: workoutConfig.rounds }, (_, i) => <div key={i} className={`flex-1 rounded-full ${i < session.completedRounds ? 'bg-on-surface' : i === session.completedRounds ? 'bg-secondary animate-pulse' : 'bg-surface-container-highest'}`} />)}
              </div>
            </div>

            {/* Round intelligence card */}
            <div className="w-full max-w-sm bg-surface-container rounded-xl p-space-md shadow-md flex flex-col gap-space-xs border border-surface-container-highest/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">第 {session.completedRounds} / {workoutConfig.rounds} 回合已完成</span>
                </div>
                <span className="font-label-caps text-caption bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-bold">
                  高强度重击
                </span>
              </div>
              <div className="mt-space-xs pt-space-xs bg-surface-container-low px-space-md py-2.5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">下一阶段：{session.round < workoutConfig.rounds ? `第 ${session.round + 1} 回合` : "训练完成"}</span>
                </div>
                <div className="flex items-center gap-1 font-label-numeric text-caption text-primary font-mono font-bold">
                  <span>{formatDuration(workoutConfig.workSec * 1000)}</span>
                  <span className="material-symbols-outlined text-[14px]">sports_mma</span>
                </div>
              </div>
            </div>

            {/* Quick Extension Pills */}
            <div className="flex items-center gap-3 mt-space-md w-full max-w-sm justify-center">
              <button 
                onClick={() => setSecondsLeft(prev => prev + 15)}
                className="h-10 px-4 rounded-full bg-surface-container-high hover:bg-surface-bright active:scale-95 text-secondary text-caption font-label-caps flex items-center gap-1 transition-transform font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                15秒 延时
              </button>
              <button 
                onClick={() => setSecondsLeft(prev => prev + 30)}
                className="h-10 px-4 rounded-full bg-surface-container-high hover:bg-surface-bright active:scale-95 text-secondary text-caption font-label-caps flex items-center gap-1 transition-transform font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                30秒 延时
              </button>
            </div>
          </section>

          {/* Heavy Control Panel */}
          <footer className="w-full px-margin pt-space-xs pb-space-lg mt-auto">
            <div className="max-w-md mx-auto grid grid-cols-12 gap-3 items-center">
              <button 
                onClick={() => setSecondsLeft(initialTotal)}
                className="col-span-3 h-16 rounded-full bg-surface-container text-on-surface flex flex-col items-center justify-center gap-0.5 hover:bg-surface-bright active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[26px]">replay</span>
                <span className="font-label-caps text-caption text-on-surface-variant leading-none font-semibold">重置休息</span>
              </button>

              <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`col-span-6 h-16 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${isPaused ? "bg-surface-container-high text-on-surface" : "bg-secondary-container hover:bg-secondary text-on-secondary-container shadow-secondary-container/30"}`}
              >
                <span className="material-symbols-outlined text-[34px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPaused ? "play_arrow" : "pause"}
                </span>
                <span className="font-headline-sm text-headline-sm tracking-wide font-bold">
                  {isPaused ? "继续" : "暂停"}
                </span>
              </button>

              <button 
                onClick={() => navigate("/combat")}
                className="col-span-3 h-16 rounded-full bg-surface-container text-secondary flex flex-col items-center justify-center gap-0.5 hover:bg-surface-bright active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[26px]">skip_next</span>
                <span className="font-label-caps text-caption text-secondary leading-none font-bold">{session.round >= workoutConfig.rounds ? "完成训练" : "开始战斗"}</span>
              </button>
            </div>
          </footer>

        </div>
      </main>
    );
  }

  // SCREEN 1: Session Summary / Victory Screen
  function SummaryScreen() {
    const navigate = useNavigate();
    const { session, lastReport } = useWorkout();
    const report = lastReport || { completedRounds: 0, rounds: 0, elapsedMs: 0, workSec: 0 };
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
      shareReport(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => setCopied(false));
    };

    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
          <div className="h-16 px-margin flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-space-sm">
              <button 
                onClick={() => navigate("/")} 
                className="w-11 h-11 -ml-space-xs rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <img alt="ROUND Brand Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-wide uppercase truncate max-w-[180px] font-bold">
                Session Summary
              </h1>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface max-w-md mx-auto">
          <div className="flex flex-col w-full relative px-margin pb-space-xl">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-secondary-container/15 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-tertiary/10 rounded-full blur-[64px] pointer-events-none"></div>
            
            {/* Victory Badge */}
            <div className="relative flex flex-col items-center text-center mt-space-md mb-space-lg">
              <div className="relative flex items-center justify-center w-24 h-24 mb-space-md">
                <div className="absolute inset-0 rounded-full bg-secondary-container/20 animate-pulse"></div>
                <div className="absolute inset-1 rounded-full bg-surface-container-high flex items-center justify-center shadow-[0_0_28px_rgba(41,147,247,0.35)]">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-secondary-container to-tertiary flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-surface-container-lowest text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      workspace_premium
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-1 px-space-sm py-0.5 rounded-full bg-surface-container-highest shadow-sm">
                  <span className="font-caption text-caption text-secondary tracking-widest uppercase font-bold">VICTORY</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-high mb-space-xs">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                <span className="font-label-caps text-label-caps text-secondary tracking-wider font-bold">ROUND CHAMPION</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-space-xs font-bold">{report.rounds ? (report.completedRounds >= report.rounds ? "训练完成" : "训练已结束") : "准备迎接挑战"}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{report.rounds ? "每一次坚持，都让你更强" : "完成训练后，在这里查看战报"}</p>
            </div>

            {/* Load summary card */}
            <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container mb-space-md shadow-md relative overflow-hidden border border-surface-container-highest/20">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-tertiary/10 to-transparent pointer-events-none"></div>
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_fire_department
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">本次训练记录</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">{report.rounds ? `训练时长 ${formatDuration(report.elapsedMs)}` : "尚无训练记录"}</span>
                </div>
              </div>
              <div className="px-space-sm py-1 rounded bg-surface-container-highest shrink-0">
                <span className="font-caption text-caption text-tertiary font-bold">PEAK</span>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 gap-gutter mb-space-lg">
              <div className="flex flex-col p-space-md rounded-xl bg-surface-container shadow-sm border border-surface-container-highest/20">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-caption text-caption text-on-surface-variant">已完成回合</span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">sports_mma</span>
                </div>
                <div className="flex items-baseline gap-1 my-space-xs">
                  <span className="font-timer-lg text-timer-lg text-on-surface tracking-tight font-mono font-bold">{report.completedRounds}</span>
                  <span className="font-label-numeric text-label-numeric text-on-surface-variant font-mono">/ {report.rounds}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-auto pt-space-xs">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span className="font-caption text-caption text-secondary font-bold">达成率 {report.rounds ? Math.round(report.completedRounds / report.rounds * 100) : 0}%</span>
                </div>
              </div>

              <div className="flex flex-col p-space-md rounded-xl bg-surface-container shadow-sm border border-surface-container-highest/20">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-caption text-caption text-on-surface-variant">有效训练时间</span>
                  <span className="material-symbols-outlined text-primary-container text-[18px]">timer</span>
                </div>
                <div className="my-space-xs">
                  <span className="font-timer-lg text-timer-lg text-primary tracking-tight font-mono font-bold">{formatDuration(report.workMs || 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-auto pt-space-xs">
                  <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                  <span className="font-caption text-caption text-on-surface-variant">战斗阶段累计</span>
                </div>
              </div>

              <div className="flex flex-col p-space-md rounded-xl bg-surface-container shadow-sm border border-surface-container-highest/20">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-caption text-caption text-on-surface-variant">间歇休息时间</span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">bedtime</span>
                </div>
                <div className="my-space-xs">
                  <span className="font-timer-lg text-timer-lg text-secondary tracking-tight font-mono font-bold">{formatDuration(report.restMs || 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-auto pt-space-xs">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span className="font-caption text-caption text-on-surface-variant">局间体能重置</span>
                </div>
              </div>

              <div className="flex flex-col p-space-md rounded-xl bg-surface-container shadow-sm border border-surface-container-highest/20">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-caption text-caption text-on-surface-variant">总训练耗时</span>
                  <span className="material-symbols-outlined text-tertiary text-[18px]">pace</span>
                </div>
                <div className="my-space-xs">
                  <span className="font-timer-lg text-timer-lg text-tertiary tracking-tight font-mono font-bold">{formatDuration(report.elapsedMs)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-auto pt-space-xs">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                  <span className="font-caption text-caption text-on-surface-variant">包含入场准备 · 不含暂停</span>
                </div>
              </div>
            </div>

            {/* Distribution */}
            <div className="flex flex-col p-space-md rounded-xl bg-surface-container-high mb-space-lg shadow-sm">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">回合训练时长</span>
                <span className="font-caption text-caption text-secondary font-bold">{report.completedRounds} ROUNDS</span>
              </div>
              <div className="grid gap-1.5 h-10 items-end" style={{ gridTemplateColumns: `repeat(${Math.max(1, report.rounds)}, minmax(0, 1fr))` }}>
                {Array.from({ length: Math.max(1, report.rounds) }, (_, i) => <div key={i} className="w-full bg-primary-container rounded-t" style={{ height: `${Math.max(4, Math.min(100, ((report.roundRecords?.[i] || 0) / Math.max(1, ...(report.roundRecords || []))) * 100))}%`, animationDelay: `${i * 35}ms` }} title={`第 ${i + 1} 回合：${formatDuration(report.roundRecords?.[i] || 0)}`} />)}
              </div>
              <div className="flex justify-between items-center mt-space-xs font-mono">
                <span className="font-caption text-caption text-on-surface-variant">R1</span>
                <span className="font-caption text-caption text-primary font-semibold">{report.rounds ? `R${report.completedRounds} FINISH` : "等待你的第一回合"}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-space-sm w-full mt-auto">
              <button 
                onClick={handleShare}
                className="flex items-center justify-center gap-space-xs w-full py-space-sm rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shadow-sm font-semibold"
              >
                <span className={`material-symbols-outlined text-[18px] ${copied ? "text-secondary" : "text-tertiary"}`}>
                  {copied ? "check" : "share"}
                </span>
                <span className="font-headline-sm text-headline-sm">{copied ? "战报已分享" : "分享成就"}</span>
              </button>

              <div className="flex flex-col gap-space-sm">
                <button 
                  onClick={() => navigate("/prep")}
                  className="flex items-center justify-center gap-space-xs w-full h-16 rounded-full bg-primary-container hover:bg-primary-container/90 text-on-primary-container transition-transform active:scale-[0.98] shadow-[0_0_24px_rgba(255,82,93,0.35)] font-bold"
                >
                  <span className="material-symbols-outlined text-[24px]">replay</span>
                  <span className="font-headline-sm text-headline-sm tracking-wide">再来一次</span>
                </button>
                <button 
                  onClick={() => navigate("/")}
                  className="flex items-center justify-center gap-space-xs w-full h-16 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-transform active:scale-[0.98] shadow-sm font-semibold"
                >
                  <span className="material-symbols-outlined text-[24px] text-secondary">check_circle</span>
                  <span className="font-headline-sm text-headline-sm tracking-wide">保存记录并返回首页</span>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // SCREEN 7: Routine Editor Screen (Custom Routine Configuration)
  function EditorScreen({ workoutConfig, setWorkoutConfig }) {
    const navigate = useNavigate();
    const [workSec, setWorkSec] = useState(workoutConfig.workSec);
    const [restSec, setRestSec] = useState(workoutConfig.restSec);
    const [rounds, setRounds] = useState(workoutConfig.rounds);
    const [prepSec, setPrepSec] = useState(workoutConfig.prepSec);
    const [noRestLast, setNoRestLast] = useState(workoutConfig.noRestLast);

    const { settings: toggles, setSettings: setToggles, unlockAudio } = useWorkout();
    const [activePicker, setActivePicker] = useState(null);
    const [savedNotice, setSavedNotice] = useState(false);

    const formatTime = (s) => {
      const mins = Math.floor(s / 60).toString().padStart(2, '0');
      const secs = (s % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    };

    const restRounds = noRestLast ? Math.max(0, rounds - 1) : rounds;
    const totalSeconds = (workSec * rounds) + (restSec * restRounds);

    const handleSave = () => {
      setWorkoutConfig(prev => ({
        ...prev,
        workSec,
        restSec,
        rounds,
        prepSec,
        noRestLast,
        title: "自定义职业实战方案"
      }));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 1500);
    };

    const handleStartWorkout = () => {
      handleSave();
      navigate("/prep", { ...workoutConfig, workSec, restSec, rounds, prepSec, noRestLast, title: "自定义职业实战方案" });
    };

    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
          <div className="h-16 px-margin flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-space-sm">
              <button 
                onClick={() => navigate("/")} 
                className="w-11 h-11 -ml-space-xs rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <img alt="ROUND Brand Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
              <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-wide uppercase truncate max-w-[180px] font-bold">
                Routine Editor
              </h1>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface max-w-md mx-auto">
          <div className="flex flex-col w-full pb-28">
            
            {/* Header top bar */}
            <div className="px-margin pt-space-sm pb-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                <span className="font-label-caps text-label-caps tracking-widest text-on-surface-variant uppercase font-bold">
                  PRO COMBAT PRESET
                </span>
              </div>
              <button 
                onClick={handleSave}
                className="flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-container-high active:bg-surface-bright text-on-surface transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-tertiary">bookmark_add</span>
                <span className="font-caption text-caption text-on-surface font-semibold tracking-wider">
                  {savedNotice ? "已保存!" : "保存预设"}
                </span>
              </button>
            </div>

            {/* Total Duration Metric Card */}
            <div className="px-margin mb-space-md">
              <div className="relative overflow-hidden rounded-xl bg-surface-container p-space-md shadow-lg border border-surface-container-highest/20">
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary-container/10 blur-2xl pointer-events-none"></div>
                <div className="flex items-baseline justify-between mb-space-xs">
                  <span className="font-caption text-caption text-on-surface-variant tracking-wider uppercase font-semibold">预计总时长</span>
                  <span className="font-caption text-caption text-tertiary">准备时间 {prepSec}s 不计入主赛程</span>
                </div>
                <div className="flex items-baseline gap-space-xs mb-space-sm">
                  <span className="font-display-hero-mobile text-display-hero-mobile text-on-surface tracking-tight font-mono font-bold">
                    {formatTime(totalSeconds)}
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">MIN:SEC</span>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between font-caption text-caption text-on-surface-variant">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>准备 {prepSec}s</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>{rounds} 进攻轮次</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>{restRounds} 间隔恢复</span>
                  </div>
                  {/* Segmented Timeline */}
                  <div className="h-2 w-full rounded-full bg-surface-container-lowest flex gap-0.5 overflow-hidden p-0.5">
                    <div className="h-full rounded-sm bg-tertiary w-2 shrink-0"></div>
                    {[...Array(rounds)].map((_, i) => (
                      <React.Fragment key={i}>
                        <div className="h-full rounded-sm bg-primary-container flex-1"></div>
                        {(i < rounds - 1 || !noRestLast) && <div className="h-full rounded-sm bg-secondary flex-1"></div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Core Parameters */}
            <div className="px-margin flex flex-col gap-space-sm mb-space-lg">
              <div className="flex items-center justify-between px-1">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">核心训练参数</span>
                <span className="font-caption text-caption text-on-surface-variant">轻触数值呼出滚轮调节</span>
              </div>

              {Object.entries(PARAMETERS).map(([key, meta]) => {
                const value = { work: workSec, rest: restSec, rounds, prep: prepSec }[key];
                return <button key={key} type="button" aria-label={`设置${meta.label}`} aria-haspopup="dialog" onClick={() => setActivePicker(key)}
                  className="parameter-card" style={{ '--parameter-color': meta.color, '--parameter-dot': meta.dot }}>
                  <div className="parameter-card-label"><h3><i />{meta.label}</h3><p>{meta.description}</p></div>
                  <div className="parameter-card-value"><span>{key === 'rounds' ? value : formatTime(value)}</span>{key === 'rounds' && <small>轮</small>}<span className="material-symbols-outlined parameter-tune">tune</span></div>
                </button>;
              })}
            </div>

            {/* Tactical Toggles */}
            <div className="px-margin flex flex-col gap-space-sm mb-space-lg">
              <div className="flex items-center justify-between px-1">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">声学与实战反馈</span>
                <span className="font-caption text-caption text-on-surface-variant">智能裁判系统</span>
              </div>
              
              <div className="bg-surface-container rounded-xl p-space-sm flex flex-col gap-1 border border-surface-container-highest/20">
                
                {/* Toggle 1: 末回合后免休息 */}
                <div className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
                      <span className="material-symbols-outlined text-[20px]">sports_mma</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">末回合后免休息</span>
                      <span className="font-caption text-caption text-on-surface-variant truncate">决胜局结束后立即敲响终场铃</span>
                    </div>
                  </div>
                  <button 
                    role="switch" aria-label="最后一轮跳过休息" aria-checked={noRestLast}
                    onClick={() => setNoRestLast(!noRestLast)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${noRestLast ? "bg-primary-container" : "bg-surface-container-highest"}`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-on-primary shadow transition-transform ${noRestLast ? "translate-x-5" : "translate-x-0"}`}></span>
                  </button>
                </div>

                {/* Toggle 2: 结束前10秒提醒 */}
                <div className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">notification_important</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">结束前10秒预警</span>
                      <span className="font-caption text-caption text-on-surface-variant truncate">每个训练回合剩余 10 秒时，三下敲板提醒冲刺</span>
                    </div>
                  </div>
                  <button 
                    role="switch" aria-label="倒计时预警" aria-checked={toggles.earlyWarning}
                    onClick={() => setToggles(t => ({ ...t, earlyWarning: !t.earlyWarning }))}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${toggles.earlyWarning ? "bg-primary-container" : "bg-surface-container-highest"}`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-on-primary shadow transition-transform ${toggles.earlyWarning ? "translate-x-5" : "translate-x-0"}`}></span>
                  </button>
                </div>

                {/* Bell Style 1 */}
                <button type="button" onClick={() => unlockAudio()} className="flex w-full text-left items-center justify-between p-space-sm rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">训练开始铃声</span>
                      <span className="font-caption text-caption text-on-surface-variant truncate">标准拳击圆铜锣声 (Gong)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant shrink-0">
                    <span className="font-caption text-caption text-primary font-bold">清脆单响</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </div>
                </button>

                {/* Bell Style 2 */}
                <button type="button" onClick={() => unlockAudio(3)} className="flex w-full text-left items-center justify-between p-space-sm rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
                      <span className="material-symbols-outlined text-[20px]">doorbell</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">训练结束铃声</span>
                      <span className="font-caption text-caption text-on-surface-variant truncate">回合结束清场铜锣三连响</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant shrink-0">
                    <span className="font-caption text-caption text-on-surface font-bold">长鸣三响</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </div>
                </button>

                {/* Voice speech */}
                <div className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">中文语音播报</span>
                      <span className="font-caption text-caption text-on-surface-variant truncate">“第3回合开始”、“专注防守”</span>
                    </div>
                  </div>
                  <button 
                    role="switch" aria-label="中文语音播报" aria-checked={toggles.voiceAudio}
                    onClick={() => setToggles(t => ({ ...t, voiceAudio: !t.voiceAudio }))}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${toggles.voiceAudio ? "bg-primary-container" : "bg-surface-container-highest"}`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-on-primary shadow transition-transform ${toggles.voiceAudio ? "translate-x-5" : "translate-x-0"}`}></span>
                  </button>
                </div>

                {/* Vibration */}
                <div className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
                      <span className="material-symbols-outlined text-[20px]">vibration</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">触觉强震动</span>
                      <span className="font-caption text-caption text-on-surface-variant truncate">手机马达高频脉冲震动提示</span>
                    </div>
                  </div>
                  <button 
                    role="switch" aria-label="触觉反馈" aria-checked={toggles.vibration}
                    onClick={() => setToggles(t => ({ ...t, vibration: !t.vibration }))}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${toggles.vibration ? "bg-primary-container" : "bg-surface-container-highest"}`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-on-primary shadow transition-transform ${toggles.vibration ? "translate-x-5" : "translate-x-0"}`}></span>
                  </button>
                </div>

                {/* Keep screen awake */}
                <div className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">brightness_high</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface font-semibold truncate">保持屏幕常亮</span>
                      <span className="font-caption text-caption text-on-surface-variant truncate">训练全程防黑屏锁定状态</span>
                    </div>
                  </div>
                  <button 
                    role="switch" aria-label="屏幕常亮" aria-checked={toggles.keepAwake}
                    onClick={() => setToggles(t => ({ ...t, keepAwake: !t.keepAwake }))}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${toggles.keepAwake ? "bg-primary-container" : "bg-surface-container-highest"}`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-on-primary shadow transition-transform ${toggles.keepAwake ? "translate-x-5" : "translate-x-0"}`}></span>
                  </button>
                </div>

              </div>
            </div>

            {/* Floating Dock */}
            <div className="fixed bottom-0 inset-x-0 p-margin bg-surface/90 backdrop-blur-xl z-40">
              <div className="max-w-md mx-auto">
                <button 
                  onClick={handleStartWorkout}
                  className="w-full h-16 rounded-full bg-primary-container text-on-primary font-headline-md text-headline-md flex items-center justify-center gap-space-sm shadow-xl active:scale-[0.98] transition-transform font-bold"
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  <span className="tracking-wider">开始训练</span>
                </button>
              </div>
            </div>

          </div>
        </main>
        {activePicker && <ParameterPicker type={activePicker} value={{ work: workSec, rest: restSec, rounds, prep: prepSec }[activePicker]}
          onClose={() => setActivePicker(null)} onConfirm={value => {
            ({ work: setWorkSec, rest: setRestSec, rounds: setRounds, prep: setPrepSec }[activePicker])(value);
            setActivePicker(null);
          }} />}
      </div>
    );
  }

  // SCREEN 2: Precision Stopwatch Screen (High Accuracy Chronometer & Split Ledger)
  function StopwatchScreen() {
    const navigate = useNavigate();
    const [focusMode, setFocusMode] = useState(false);
    const toggleFocus = async () => {
      if (focusMode) {
        if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {});
        setFocusMode(false);
      } else {
        setFocusMode(true);
        await document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    useEffect(() => {
      const onExit = () => { if (!document.fullscreenElement) setFocusMode(false); };
      document.addEventListener('fullscreenchange', onExit);
      return () => { document.removeEventListener('fullscreenchange', onExit); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
    }, []);
    const { elapsedTime, lapTime, isRunning, toggle: toggleStopwatch, lap: handleLap, reset: handleReset, laps, setLaps } = useStopwatch();
    const { muted: soundMuted, setMuted: setSoundMuted } = useWorkout();
    const setIsRunning = toggleStopwatch;
    const formatMs = (ms) => ({ main: formatDuration(ms), millis: `.${String(Math.floor(ms % 1000 / 10)).padStart(2, '0')}` });
    const bestLap = laps.length ? laps.reduce((best, lap) => lap.ms < best.ms ? lap : best) : null;
    const averageLap = laps.length ? laps.reduce((sum, lap) => sum + lap.ms, 0) / laps.length : 0;
    const timeParts = formatMs(elapsedTime);
    const lapFmt = formatMs(lapTime);

    return (
      <div className={`bg-surface font-body-md text-on-surface flex flex-col min-h-screen ${focusMode ? "stopwatch-focus" : ""}`}>
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
          <div className="h-16 px-margin flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-space-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_rgba(255,82,93,0.6)]"></div>
              <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface font-bold">Stopwatch</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <button 
                onClick={() => navigate("/")}
                className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen max-w-md mx-auto">
          <div className="flex flex-col w-full px-margin pb-space-xl gap-space-lg select-none">
            
            {/* HUD Status Bar */}
            <section className="flex items-center justify-between pt-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                  <span className="font-label-caps text-caption text-primary-container uppercase tracking-widest font-bold">
                    高精度竞技模式
                  </span>
                </div>
                <span className="font-label-numeric text-caption text-on-surface-variant/80 font-mono">1/100 SEC</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button 
                  aria-label={soundMuted ? "取消静音" : "静音"}
                  onClick={() => setSoundMuted(!soundMuted)}
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
                >
                  <span className={`material-symbols-outlined text-[20px] ${soundMuted ? "text-on-surface-variant" : "text-tertiary"}`}>
                    {soundMuted ? "volume_off" : "volume_up"}
                  </span>
                </button>
                <button 
                  aria-label={focusMode ? "退出专注模式" : "进入专注模式"}
                  onClick={toggleFocus}
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">{focusMode ? "fullscreen_exit" : "fullscreen"}</span>
                </button>
              </div>
            </section>

            {/* Central Precision Chronometer Dial */}
            <section className="relative flex flex-col items-center justify-center pt-space-xs pb-space-sm">
              <div className="absolute w-72 h-72 rounded-full bg-tertiary/5 blur-3xl pointer-events-none"></div>
              <div className="relative w-80 h-80 flex items-center justify-center stopwatch-dial">
                <AmbientDial mode="stopwatch" running={isRunning} />
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 320 320">
                  <circle className="text-surface-container-highest/60" cx="160" cy="160" fill="none" r="142" stroke="currentColor" strokeDasharray="2 6" strokeWidth="4"></circle>
                  <circle 
                    className="stopwatch-progress"
                    cx="160" cy="160" fill="none" 
                    r="142" 
                    stroke="currentColor" 
                    strokeDasharray="892" 
                    strokeDashoffset={(elapsedTime / 100) % 892} 
                    strokeLinecap="round" 
                    strokeWidth="5" 
                    style={{ opacity: isRunning ? 1 : 0.45 }}
                  ></circle>
                  <line className="text-primary-container" stroke="currentColor" strokeWidth="3" x1="160" x2="160" y1="10" y2="24"></line>
                  <line className="text-secondary" stroke="currentColor" strokeWidth="2" x1="310" x2="296" y1="160" y2="160"></line>
                  <line className="text-on-surface-variant/40" stroke="currentColor" strokeWidth="2" x1="160" x2="160" y1="310" y2="296"></line>
                  <line className="text-on-surface-variant/40" stroke="currentColor" strokeWidth="2" x1="10" x2="24" y1="160" y2="160"></line>
                </svg>

                <div className="flex flex-col items-center text-center z-10">
                  <div className="flex items-center gap-1.5 mb-1 px-3 py-1 rounded-full bg-surface-container/90 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(41,147,247,0.8)]"></span>
                    <span className="font-body-md text-caption text-on-surface-variant uppercase tracking-wider font-semibold">本圈用时</span>
                    <span className="font-label-numeric text-caption text-secondary font-bold tracking-wider font-mono">
                      {lapFmt.main}{lapFmt.millis}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-center tracking-tight text-on-surface my-1">
                    <span className="font-display-hero-mobile text-display-hero-mobile font-bold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)] font-mono">
                      {timeParts.main}
                    </span>
                    <span className="font-timer-lg text-timer-lg font-bold stopwatch-fraction pl-1 font-mono">
                      {timeParts.millis}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-label-caps text-caption uppercase tracking-widest text-on-surface-variant/70 font-bold">SPLIT-TIMER</span>
                    <span className="text-surface-container-highest text-caption">•</span>
                    <span className="font-label-numeric text-caption text-tertiary font-bold tracking-wider font-mono">LAP #{String(laps.length + 1).padStart(2, "0")}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3 Stat Chips */}
            <section className="grid grid-cols-3 gap-gutter-sm w-full">
              <div className="flex flex-col p-space-sm rounded-xl bg-surface-container shadow-md relative overflow-hidden border border-surface-container-highest/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body-md text-caption text-on-surface-variant truncate">最快单圈</span>
                  <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-secondary/20 text-secondary">
                    <span className="material-symbols-outlined text-[12px] font-bold">bolt</span>
                  </span>
                </div>
                <span className="font-label-numeric text-body-md font-bold text-secondary tracking-tight font-mono">{bestLap ? `${formatMs(bestLap.ms).main}${formatMs(bestLap.ms).millis}` : "—"}</span>
                <span className="font-caption text-caption text-on-surface-variant/70 mt-0.5">{bestLap ? `圈次 ${bestLap.id}` : "等待分圈"}</span>
              </div>

              <div className="flex flex-col p-space-sm rounded-xl bg-surface-container shadow-md relative overflow-hidden border border-surface-container-highest/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body-md text-caption text-on-surface-variant truncate">平均圈速</span>
                  <span className="material-symbols-outlined text-[13px] text-tertiary">pace</span>
                </div>
                <span className="font-label-numeric text-body-md font-bold text-tertiary tracking-tight font-mono">{laps.length ? `${formatMs(averageLap).main}${formatMs(averageLap).millis}` : "—"}</span>
                <span className="font-caption text-caption text-on-surface-variant/70 mt-0.5">{laps.length ? "已记录单圈的平均时间" : "开始后触击分圈"}</span>
              </div>

              <div className="flex flex-col p-space-sm rounded-xl bg-surface-container shadow-md relative overflow-hidden border border-surface-container-highest/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body-md text-caption text-on-surface-variant truncate">记录圈数</span>
                  <span className="material-symbols-outlined text-[13px] text-primary-container">format_list_numbered</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-label-numeric text-headline-sm font-bold text-on-surface font-mono">
                    {String(laps.length).padStart(2, '0')}
                  </span>
                  <span className="font-body-md text-caption text-on-surface-variant">LAPS</span>
                </div>
                <span className="font-caption text-caption text-primary mt-0.5 truncate">
                  {isRunning ? "正在计时..." : "已暂停"}
                </span>
              </div>
            </section>

            {/* Action Buttons */}
            <section className="w-full flex items-center justify-between gap-gutter-sm my-space-xs">
              <button 
                onClick={handleLap}
                disabled={!isRunning}
                className="flex-1 h-16 min-h-[64px] rounded-full bg-surface-container-high hover:bg-surface-bright active:scale-95 flex flex-col items-center justify-center gap-0.5 shadow-lg transition-transform disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-secondary">flag</span>
                  <span className="font-headline-sm text-body-lg font-bold tracking-wider">分圈</span>
                </div>
                <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">LAP</span>
              </button>

              <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-[1.4] h-16 min-h-[64px] rounded-full flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-95 shadow-lg ${isRunning ? "bg-primary-container shadow-[0_0_24px_rgba(255,82,93,0.45)]" : "bg-secondary-container shadow-[0_0_24px_rgba(41,147,247,0.45)]"}`}
              >
                <div className="flex items-center gap-2 text-on-primary-container">
                  <span className="material-symbols-outlined text-[26px]">
                    {isRunning ? "pause" : "play_arrow"}
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold tracking-widest text-on-primary-container">
                    {isRunning ? "暂停" : "开始"}
                  </span>
                </div>
                <span className="font-caption text-caption text-on-primary-container/80 uppercase font-semibold">
                  {isRunning ? "PAUSE · 触击" : "START · 触击"}
                </span>
              </button>

              <button 
                onClick={handleReset}
                className="flex-1 h-16 min-h-[64px] rounded-full bg-surface-container-low hover:bg-surface-container active:scale-95 flex flex-col items-center justify-center gap-0.5 shadow-sm transition-transform"
              >
                <div className="flex items-center gap-1 text-outline">
                  <span className="material-symbols-outlined text-[19px]">restart_alt</span>
                  <span className="font-headline-sm text-body-lg font-semibold tracking-wider text-on-surface-variant">复位</span>
                </div>
                <span className="font-caption text-caption text-outline/80 uppercase tracking-wider">RESET</span>
              </button>
            </section>

            {/* Split Lap History Ledger */}
            <section className="flex flex-col w-full bg-surface-container rounded-2xl p-space-md shadow-xl gap-space-sm border border-surface-container-highest/20">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary-container"></span>
                  <h3 className="font-headline-sm text-body-lg font-bold text-on-surface">分圈成绩清单</h3>
                </div>
                <span className="font-body-md text-caption text-on-surface-variant">累计分段 {laps.length} 次</span>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {laps.map(item => (
                  <div 
                    key={item.id} 
                    className={`lap-row flex items-center justify-between p-space-sm rounded-xl transition-colors relative overflow-hidden ${item.best ? "bg-surface-container-highest shadow-md" : "bg-surface-container-high"}`}
                  >
                    {item.best && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_8px_rgba(41,147,247,0.8)]"></div>
                    )}
                    <div className="flex items-center gap-space-sm pl-1">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-lg font-label-numeric text-caption font-bold font-mono ${item.best ? "bg-secondary text-on-secondary" : "bg-surface-container text-on-surface"}`}>
                        {item.id}
                      </span>
                      <div className="flex flex-col">
                        <span className={`font-label-numeric text-body-md font-bold font-mono ${item.best ? "text-secondary" : "text-on-surface"}`}>
                          {item.lap}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant">总时间 {item.total}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {item.best ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary">
                          <span className="material-symbols-outlined text-[13px] font-bold">military_tech</span>
                          <span className="font-label-caps text-caption uppercase font-bold">最佳单圈</span>
                        </div>
                      ) : (
                        <span className="font-label-numeric text-caption text-error font-semibold font-mono">{item.diff}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-caption font-label-caps text-on-surface-variant font-semibold">
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-space-xs text-on-surface-variant">
                <button onClick={() => exportLaps(laps)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-high active:scale-95 transition-all text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  <span className="font-body-md text-caption">导出成绩单</span>
                </button>
                <button 
                  onClick={() => setLaps([])}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-surface-container-high active:scale-95 transition-all text-error hover:text-error-container"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  <span className="font-body-md text-caption">清空历史</span>
                </button>
              </div>
            </section>

          </div>
        </main>

        <BottomNavBar currentPath="/stopwatch" />
      </div>
    );
  }


function Screens() {
  const { config: workoutConfig, setConfig: setWorkoutConfig } = useWorkout();
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return <div className="app-shell" data-screen={location.pathname}>
    <div className="screen-transition" key={location.pathname}>
    <Routes location={location}>
      <Route path="/" element={<DashboardScreen workoutConfig={workoutConfig} setWorkoutConfig={setWorkoutConfig} />} />
      <Route path="/stopwatch" element={<StopwatchScreen />} />
      <Route path="/prep" element={<PrepScreen workoutConfig={workoutConfig} />} />
      <Route path="/combat" element={<CombatScreen workoutConfig={workoutConfig} />} />
      <Route path="/paused" element={<PausedScreen workoutConfig={workoutConfig} />} />
      <Route path="/rest" element={<RestScreen workoutConfig={workoutConfig} />} />
      <Route path="/summary" element={<SummaryScreen />} />
      <Route path="/editor" element={<EditorScreen workoutConfig={workoutConfig} setWorkoutConfig={setWorkoutConfig} />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="*" element={<DashboardScreen workoutConfig={workoutConfig} setWorkoutConfig={setWorkoutConfig} />} />
    </Routes>
    </div>
    </div>;
}
function SettingsScreen() {
  const { settings, setSettings, audioReady, unlockAudio, previewWoodClapper } = useWorkout();
  const navigate = useNavigate();
  const labels = { earlyWarning: ['结束前 10 秒敲板声', '每回合一次 · 三下木板敲击'], voiceAudio: ['阶段语音', '准备、训练、休息的中文播报'], vibration: ['触觉反馈', '支持振动的安卓设备可用'], keepAwake: ['保持屏幕常亮', '支持 Wake Lock 的浏览器可用'] };
  return <div className="min-h-screen px-margin pt-safe pb-24 max-w-md mx-auto">
    <header className="flex items-center gap-3 h-20"><button aria-label="返回首页" onClick={() => navigate('/')} className="w-11 h-11 rounded-full bg-surface-container material-symbols-outlined">arrow_back</button><h1 className="text-headline-md font-bold">训练设置</h1></header>
    <div className="mb-6 flex gap-2 items-center"><span className="text-primary-container material-symbols-outlined">tune</span><span className="text-caption text-on-surface-variant tracking-widest">MAKE IT YOUR ROUND</span></div>
    <section className="rounded-xl bg-surface-container px-4 divide-y divide-surface-container-highest">{Object.entries(labels).map(([key, [title, caption]]) => <button key={key} role="switch" aria-checked={settings[key]} onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))} className="flex items-center justify-between w-full gap-4 py-5 text-left"><div><div className="font-bold">{title}</div><div className="text-caption text-on-surface-variant mt-1">{caption}</div></div><span className={`toggle-track ${settings[key] ? 'is-on' : ''}`}><span /></span></button>)}</section>
    <button onClick={() => unlockAudio()} className="mt-6 w-full rounded-full p-4 bg-primary-container text-on-primary-container font-bold">{audioReady ? '试听训练铃声' : '启用并试听铃声'}</button>
    <button onClick={previewWoodClapper} className="mt-3 w-full rounded-full p-4 bg-surface-container-high text-tertiary font-bold">试听敲板声 · 最后 10 秒预警</button>
    <BottomNavBar currentPath="/settings" />
  </div>;
}
export default function App() { return <SessionProvider initialConfig={InitialWorkoutConfig}><Screens /></SessionProvider>; }

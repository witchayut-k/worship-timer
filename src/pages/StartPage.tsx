import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { usePlan } from "../context/PlanProvider";
import { isSessionRoomId, sessionRoomControlPath } from "../lib/freeSession";
import { ControlEmptyStage } from "../components/ControlEmptyStage";
import { ControlShell } from "../components/ControlShell";
import { ControlStageOutput } from "../components/ControlStageOutput";
import { ControlTransportDock } from "../components/ControlTransportDock";
import { ControlTimerProgress } from "../components/ControlTimerProgress";
import { EndServiceModal } from "../components/EndServiceModal";
import { LeaveControlModal } from "../components/LeaveControlModal";
import { MonitorIcon, OutputLinksModal } from "../components/OutputLinksModal";
import { ProgramSchedulePanel } from "../components/ProgramSchedulePanel";
import { resolveEventSettings } from "../domain/types";
import { isManualFlashActive } from "../domain/stageOutput";
import { formatSignedMMSS } from "../domain/time";
import { useActiveControl } from "../hooks/useActiveControl";
import { useAuth } from "../hooks/useAuth";
import { useAutoStartOnNext } from "../hooks/useAutoStartOnNext";
import { useControlRailWidth } from "../hooks/useControlRailWidth";
import { useEventSession } from "../hooks/useEventSession";
import { useLeaveControl } from "../hooks/useLeaveControl";
import { useLocale } from "../i18n/useLocale";
import { getStageTheme, getTimerThemeClasses } from "../lib/displayTheme";
import { hasFirebaseConfig } from "../lib/firebase";
import { isOfflineEventId } from "../lib/eventSource";
import { loadStoredLocalRuntime, publishLocalRuntime } from "../lib/localSync";
import {
  loadRuntimeState,
  watchRuntimeState,
  writeRuntimeState,
} from "../lib/firestoreRepo";
import { draftItemsToProgramItems } from "../lib/eventSessionDraft";
import {
  deriveLocalDisplay,
  initialRuntimeState,
  normalizeRuntimeState,
  reduceRuntimeState,
} from "../lib/runtimeEngine";

export function StartPage() {
  const { eventId = "" } = useParams();
  return <StartPageInner eventId={eventId} />;
}

function StartPageInner({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  const { isFree } = usePlan();
  const { uid, ready: authReady } = useAuth();
  const { setActiveControl, isProductionForEvent } = useActiveControl();
  const session = useEventSession();
  const eventMeta = session.event;
  const items = useMemo(
    () =>
      session.setupDraft
        ? draftItemsToProgramItems(session.setupDraft.items)
        : session.programItems,
    [session.setupDraft, session.programItems],
  );
  const title = session.event?.title ?? "";
  const [outputLinksOpen, setOutputLinksOpen] = useState(false)
  const [endServiceOpen, setEndServiceOpen] = useState(false);

  const [state, dispatch] = useReducer(
    reduceRuntimeState,
    { eventId, items },
    ({ eventId: eid, items: programItems }) => {
      if (isOfflineEventId(eid)) {
        const stored = loadStoredLocalRuntime(eid);
        if (stored) return normalizeRuntimeState(stored);
      }
      return initialRuntimeState({ items: programItems });
    },
  );

  const flashPending = state.manualFlashUntilMs != null;
  const nowMs = useNowMs(
    state.phase === "running" || flashPending ? 200 : 1000,
  );
  const display = deriveLocalDisplay({ state, nowMs });
  const settings = resolveEventSettings(eventMeta);
  const manualFlashActive = isManualFlashActive(
    state.manualFlashUntilMs,
    nowMs,
  );
  const timerClass = getTimerThemeClasses({
    remainingSec: display.remainingSec,
    settings,
    manualFlash: manualFlashActive,
  });
  const stageTheme = getStageTheme({
    remainingSec: display.remainingSec,
    settings,
    manualFlash: manualFlashActive,
  });

  const current = items[state.currentIndex] ?? null;
  const prev = state.currentIndex > 0 ? items[state.currentIndex - 1] : null;
  const next =
    state.currentIndex + 1 < items.length
      ? items[state.currentIndex + 1]
      : null;

  const timeText = formatSignedMMSS(display.remainingSec);

  const isCloud = !isOfflineEventId(eventId);
  const cloudReady = isCloud && hasFirebaseConfig();
  const isLocal = isOfflineEventId(eventId);

  const hydratingRef = useRef(false);
  const runtimeSyncedRef = useRef(isLocal);
  const controlWorkspaceRef = useRef<HTMLDivElement>(null);
  const { railWidth, minRailWidth, maxRailWidth, onResizerPointerDown } =
    useControlRailWidth(controlWorkspaceRef);
  const { autoStartOnNext, setAutoStartOnNext } = useAutoStartOnNext();

  useEffect(() => {
    if (!cloudReady) return;
    const unsubState = watchRuntimeState(eventId, (s) => {
      if (!s) return;
      hydratingRef.current = true;
      runtimeSyncedRef.current = true;
      dispatch({ type: "hydrate", state: s });
      queueMicrotask(() => {
        hydratingRef.current = false;
      });
    });
    return () => {
      unsubState();
    };
  }, [eventId, cloudReady]);

  useEffect(() => {
    if (!cloudReady) return;
    if (!authReady || !uid) return;
    if (!items.length) return;
    let cancelled = false;
    void (async () => {
      const existing = await loadRuntimeState(eventId);
      if (cancelled) return;
      if (existing) {
        runtimeSyncedRef.current = true;
        return;
      }
      const nextInitial = initialRuntimeState({ items });
      await writeRuntimeState(eventId, nextInitial);
      runtimeSyncedRef.current = true;
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId, cloudReady, authReady, uid, items]);

  useEffect(() => {
    if (!cloudReady) return;
    if (!authReady || !uid) return;
    if (!runtimeSyncedRef.current) return;
    if (hydratingRef.current) return;
    void writeRuntimeState(eventId, state).catch(() => {});
  }, [eventId, cloudReady, authReady, uid, state]);

  useEffect(() => {
    if (!isLocal) return;
    if (!runtimeSyncedRef.current) return;
    if (hydratingRef.current) return;
    publishLocalRuntime(eventId, state);
  }, [eventId, isLocal, state]);

  useEffect(() => {
    if (state.phase === "running" || state.phase === "paused") {
      setActiveControl(eventId, title);
    }
  }, [eventId, title, state.phase, setActiveControl]);

  const productionMode = isProductionForEvent(eventId);
  const {
    leaveModalOpen,
    leaveModalTitle,
    requestLeave,
    confirmGoToLibrary,
    endControlAndLeave,
    cancelLeave,
    leaveDestinationKey,
  } = useLeaveControl(productionMode);

  const start = () => {
    if (!current) return;
    setActiveControl(eventId, title);
    dispatch({ type: "start", nowMs: Date.now() });
  };

  const pause = () => {
    if (state.phase !== "running") return;
    dispatch({ type: "pause", nowMs: Date.now() });
  };

  const resetCurrent = () => {
    if (!current) return;
    dispatch({ type: "resetCurrent", nowMs: Date.now(), items });
  };

  const jumpTo = (idx: number) => {
    if (autoStartOnNext) {
      setActiveControl(eventId, title);
    }
    dispatch({
      type: "jumpTo",
      nowMs: Date.now(),
      index: idx,
      items,
      autoStart: autoStartOnNext,
    });
  };

  const goNext = () => {
    if (!current) return;
    const nextIdx = state.currentIndex + 1;
    if (nextIdx >= items.length) return;
    jumpTo(nextIdx);
  };

  const adjustSec = (delta: number) => {
    dispatch({ type: "adjust", nowMs: Date.now(), deltaSec: delta });
  };

  const setBlackout = (enabled: boolean) => {
    dispatch({ type: "setBlackout", nowMs: Date.now(), enabled });
  };

  const triggerFlash = () => {
    dispatch({ type: "triggerManualFlash", nowMs: Date.now() });
  };

  const endService = () => {
    dispatch({ type: "endService", nowMs: Date.now() });
    setEndServiceOpen(false);
  };

  if (isFree && !isSessionRoomId(eventId)) {
    return <Navigate to={sessionRoomControlPath()} replace />;
  }

  const displayTitle = title.trim() || t("event.untitled");
  const sessionBarAutoStart = (
    <label className="controlSessionAutoStart" title={t('control.autoStartOnNextHint')}>
      <span className="controlSessionAutoStartTitle">{t('control.autoStartOnNext')}</span>
      <span className="switch">
        <input
          type="checkbox"
          checked={autoStartOnNext}
          onChange={(e) => setAutoStartOnNext(e.target.checked)}
        />
        <span className="switchSlider" />
      </span>
    </label>
  )

  return (
    <ControlShell
      activeNav="control"
      eventId={eventId}
      eventTitle={title}
      productionMode={productionMode}
      sessionStatus={{
        eventId,
        productionMode,
        eventTitle: title,
      }}
      sessionBarRightContent={sessionBarAutoStart}
      onLeaveToLibrary={requestLeave}
    >
      <div className="controlPage">
        <div
          ref={controlWorkspaceRef}
          className={`controlWorkspace${current ? " controlWorkspace--withRail" : " controlWorkspace--empty"}`}
        >
          <div className="controlTimerColumn">
            <header className="setupPageHeader controlPageHeader">
              <div className="setupPageHeaderText">
                <h1 className="setupPageTitle">{t("control.pageTitle")}</h1>
                <p className="setupPageDesc">
                  {t("control.desc", { title: displayTitle })}
                </p>
              </div>
              {current ? (
                <div
                  className="controlTopActions"
                  role="group"
                  aria-label={t("control.stageControl")}
                >
                  <button
                    className="btnGhost controlTopActionBtn"
                    type="button"
                    onClick={() => setOutputLinksOpen(true)}
                  >
                    <MonitorIcon />
                    {t("control.outputLinks")}
                  </button>
                  <ControlStageOutput
                    blackout={state.blackout}
                    manualFlashActive={manualFlashActive}
                    onBlackoutChange={setBlackout}
                    onFlashTrigger={triggerFlash}
                  />
                  <button
                    className={`btnDanger controlTopActionBtn${state.serviceEnded ? ' controlEndServiceBtnEnded' : ''}`}
                    type="button"
                    disabled={state.serviceEnded}
                    onClick={() => setEndServiceOpen(true)}
                  >
                    {state.serviceEnded ? t('control.endServiceEnded') : t('control.endService')}
                  </button>
                </div>
              ) : null}
            </header>
            <div className="controlTimerBody">
              {isCloud && !hasFirebaseConfig() ? (
                <div className="card">
                  <h1 className="pageTitle">{t("control.firebaseRequired")}</h1>
                  <div className="muted">
                    {t("control.firebaseHint", {
                      envFile: ".env.local",
                      envExample: ".env.example",
                    })}{" "}
                    <Link to="/setup">{t("control.localDemo")}</Link>
                  </div>
                </div>
              ) : null}

              {!current ? (
                <ControlEmptyStage
                  setupPath={eventId ? `/setup/${eventId}` : "/setup"}
                />
              ) : (
                <section className={`timerCard ${timerClass}`}>
                  <div className="timerMeta timerMetaRow">
                    <div className="timerMetaSlot timerMetaPrev">
                      <span className="timerMetaLabel">
                        {t("control.prev")}
                      </span>
                      <span className="timerMetaName">
                        {prev ? (
                          <>
                            {prev.name}
                            {prev.leaderName ? (
                              <span className="timerMetaLeader">
                                {" "}
                                — {prev.leaderName}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                    <div className="timerMetaSlot timerMetaCurrent">
                      <span className="timerMetaLabel">
                        {t("control.current")}
                      </span>
                      <span className="timerMetaName">{current.name}</span>
                      {current.leaderName ? (
                        <span className="timerMetaLeader">
                          {current.leaderName}
                        </span>
                      ) : null}
                    </div>
                    <div className="timerMetaSlot timerMetaNext">
                      <span className="timerMetaLabel">
                        {t("control.next")}
                      </span>
                      <span className="timerMetaName">
                        {next ? (
                          <>
                            {next.name}
                            {next.leaderName ? (
                              <span className="timerMetaLeader">
                                {" "}
                                — {next.leaderName}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="timerValue" aria-label="timer">
                    {timeText}
                  </div>

                  <ControlTimerProgress
                    remainingSec={display.remainingSec}
                    durationSec={current.durationSec}
                  />

                  <div className="controls">
                    <div className="pillGroup">
                      <button
                        className="btnGhost"
                        type="button"
                        onClick={() => adjustSec(-60)}
                      >
                        -60s
                      </button>
                      <button
                        className="btnGhost"
                        type="button"
                        onClick={() => adjustSec(-10)}
                      >
                        -10s
                      </button>
                      <button
                        className="btn"
                        type="button"
                        onClick={resetCurrent}
                      >
                        {t("control.reset")}
                      </button>
                      <button
                        className="btnGhost"
                        type="button"
                        onClick={() => adjustSec(+10)}
                      >
                        +10s
                      </button>
                      <button
                        className="btnGhost"
                        type="button"
                        onClick={() => adjustSec(+60)}
                      >
                        +60s
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {current ? (
            <>
              <div
                className="controlColumnResizer"
                role="separator"
                aria-orientation="vertical"
                aria-valuenow={railWidth}
                aria-valuemin={minRailWidth}
                aria-valuemax={maxRailWidth}
                aria-label={t("control.resizeRail")}
                onPointerDown={onResizerPointerDown}
              />
              <aside className="controlRightRail" style={{ width: railWidth }}>
                <ControlTransportDock
                  phase={state.phase}
                  currentIndex={state.currentIndex}
                  itemCount={items.length}
                  onPrev={() => jumpTo(state.currentIndex - 1)}
                  onStart={start}
                  onPause={pause}
                  onNext={goNext}
                />
                <ProgramSchedulePanel
                  eventId={eventId}
                  items={items}
                  currentIndex={state.currentIndex}
                  phase={state.phase}
                  displayRemainingSec={display.remainingSec}
                  eventDate={eventMeta?.date}
                  plannedStartTime={eventMeta?.plannedStartTime}
                  onJumpTo={jumpTo}
                />
              </aside>
            </>
          ) : null}
        </div>
      </div>

      <EndServiceModal
        open={endServiceOpen}
        onConfirm={endService}
        onCancel={() => setEndServiceOpen(false)}
      />

      <LeaveControlModal
        open={leaveModalOpen}
        title={leaveModalTitle}
        leaveDestinationKey={leaveDestinationKey}
        onGoToServices={confirmGoToLibrary}
        onEndControl={endControlAndLeave}
        onCancel={cancelLeave}
      />

      <OutputLinksModal
        open={outputLinksOpen}
        onClose={() => setOutputLinksOpen(false)}
        eventId={eventId}
        stageTemplate={settings.stageTemplate ?? "circle"}
        remainingSec={display.remainingSec}
        durationSec={current?.durationSec ?? 0}
        currentName={current?.name ?? ""}
        currentLeader={current?.leaderName ?? ""}
        nextName={next?.name ?? null}
        nextLeader={next?.leaderName ?? null}
        theme={stageTheme}
        paused={state.phase !== "running"}
      />
    </ControlShell>
  );
}

function useNowMs(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

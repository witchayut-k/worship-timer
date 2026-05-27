import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ControlShell } from '../components/ControlShell'
import { SwitchControlModal } from '../components/LeaveControlModal'
import {
  filterServiceEntries,
  groupServicesByDate,
  type ServiceListEntry,
} from '../domain/serviceList'
import type { EventStatus } from '../domain/types'
import { useActiveControl } from '../hooks/useActiveControl'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/useLocale'
import { hasFirebaseConfig } from '../lib/firebase'
import { listEventsForUser } from '../lib/firestoreRepo'
import { FREE_SESSION_ID } from '../lib/freeSession'
import { listLocalEvents } from '../lib/localLibrary'

function StatusBadge({ status }: { status: EventStatus }) {
  const { t } = useLocale()
  return (
    <span className={`serviceStatusBadge serviceStatusBadge--${status}`}>
      {t(`services.status.${status}`)}
    </span>
  )
}

type PendingSwitch = {
  eventId: string
  title: string
}

export function ServicesPage() {
  const nav = useNavigate()
  const { t, locale } = useLocale()
  const { activeControl, setActiveControl, endActiveControl } = useActiveControl()
  const { user, uid, ready, canUseAuth, signIn, signOut } = useAuth()
  const [entries, setEntries] = useState<ServiceListEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null)

  const cloudMode = canUseAuth && Boolean(uid)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (cloudMode && uid) {
        const docs = await listEventsForUser(uid)
        setEntries(docs.map((d) => ({ ...d, itemCount: undefined })))
      } else {
        const local = listLocalEvents().filter((e) => e.id !== FREE_SESSION_ID)
        setEntries(
          local.map((e) => ({
            id: e.id,
            data: e.event,
            itemCount: e.items.length,
          })),
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('services.loadFailed'))
      setEntries([])
    }
  }, [cloudMode, t, uid])

  useEffect(() => {
    if (!ready) return
    void refresh()
  }, [ready, refresh])

  const filtered = useMemo(
    () => filterServiceEntries(entries, search, locale),
    [entries, locale, search],
  )
  const groups = useMemo(() => groupServicesByDate(filtered, locale), [filtered, locale])

  const storageHint = cloudMode
    ? t('services.storageCloud')
    : canUseAuth
      ? t('services.storageLocalSignIn')
      : t('services.storageLocal')

  const openControl = (session: ServiceListEntry) => {
    if (activeControl && activeControl.eventId !== session.id) {
      setPendingSwitch({ eventId: session.id, title: session.data.title })
      return
    }
    nav(`/start/${session.id}`)
  }

  const confirmSwitch = () => {
    if (!pendingSwitch) return
    setActiveControl(pendingSwitch.eventId, pendingSwitch.title)
    setPendingSwitch(null)
    nav(`/start/${pendingSwitch.eventId}`)
  }

  const authHeader = canUseAuth ? (
    user ? (
      <button className="btnGhost btnSm" type="button" onClick={() => void signOut()}>
        {t('services.signOut')}
      </button>
    ) : (
      <button className="btn btnSm" type="button" onClick={() => void signIn().then(() => refresh())}>
        {t('services.signIn')}
      </button>
    )
  ) : null

  return (
    <ControlShell
      activeNav="services"
      headerEnd={authHeader}
      sessionStatus={
        activeControl
          ? {
              eventId: activeControl.eventId,
              productionMode: true,
              eventTitle: activeControl.title,
            }
          : undefined
      }
    >
      {!user && canUseAuth ? (
        <div className="planBanner planBannerPro" role="region" aria-label={t('plan.proLoginTitle')}>
          <div className="planBannerProText">
            <strong>{t('plan.proLoginTitle')}</strong>
            <p className="muted planBannerProDesc">{t('plan.proLoginDesc')}</p>
          </div>
          <button className="btnPrimary btnSm" type="button" onClick={() => void signIn().then(() => refresh())}>
            {t('services.signIn')}
          </button>
        </div>
      ) : null}

      {activeControl ? (
        <div className="servicesActiveBanner">
          <span>{t('services.activeBanner', { title: activeControl.title })}</span>
          <div className="servicesActiveBannerActions">
            <button
              className="btn btnSm"
              type="button"
              onClick={() => nav(`/start/${activeControl.eventId}`)}
            >
              {t('services.backToControl')}
            </button>
            <button
              className="btnDanger btnSm"
              type="button"
              onClick={() => void endActiveControl()}
            >
              {t('services.endControl')}
            </button>
          </div>
        </div>
      ) : null}

      <header className="servicesPageHeader">
        <div className="servicesPageHeaderText">
          <h1 className="setupPageTitle">{t('services.title')}</h1>
          <p className="setupPageDesc">{t('services.desc', { hint: storageHint })}</p>
        </div>
        <div className="servicesHeaderActions">
          <Link className="btnPrimary" to="/setup">
            {t('services.createNew')}
          </Link>
        </div>
      </header>

      <div className="servicesToolbar">
        <label className="servicesSearchField">
          <span className="servicesSearchIcon" aria-hidden>
            ⌕
          </span>
          <input
            className="servicesSearchInput"
            type="search"
            placeholder={t('services.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="saveNotice saveNoticeError">{error}</p> : null}

      {loading ? (
        <p className="muted servicesLoading">{t('services.loadingList')}</p>
      ) : groups.length === 0 ? (
        <div className="servicesEmpty">
          <p className="muted">{t('services.empty')}</p>
          <Link className="btnPrimary" to="/setup">
            {t('services.createNewAction')}
          </Link>
        </div>
      ) : (
        <div className="servicesList">
          {groups.map((group) => (
            <section key={group.date} className="servicesDateGroup">
              <header className="servicesDateHeader">
                <h2 className="servicesDateTitle">{group.label}</h2>
                <span className="servicesDateCount">
                  {t('services.sessionCount', { count: group.sessions.length })}
                </span>
              </header>
              <ul className="servicesSessionList">
                {group.sessions.map((session) => {
                  const canControl =
                    session.itemCount === undefined || session.itemCount > 0
                  const isActiveSession = activeControl?.eventId === session.id
                  return (
                    <li
                      key={session.id}
                      className={`servicesSessionCard${isActiveSession ? ' servicesSessionCard--active' : ''}`}
                    >
                      <div className="servicesSessionMain">
                        {isActiveSession ? (
                          <span className="serviceLiveBadge">{t('services.liveBadge')}</span>
                        ) : (
                          <StatusBadge status={session.data.status} />
                        )}
                        <div className="servicesSessionTitle">{session.data.title}</div>
                      </div>
                      <div className="servicesSessionActions">
                        <Link className="btn btnSm" to={`/setup/${session.id}`}>
                          {t('services.edit')}
                        </Link>
                        {canControl ? (
                          isActiveSession ? (
                            <button
                              className="btnPrimary btnSm"
                              type="button"
                              onClick={() => nav(`/start/${session.id}`)}
                            >
                              {t('services.backToControl')}
                            </button>
                          ) : (
                            <button
                              className="btnPrimary btnSm"
                              type="button"
                              onClick={() => openControl(session)}
                            >
                              {t('services.control')}
                            </button>
                          )
                        ) : (
                          <span className="btn btnSm btnDisabled" title={t('services.noProgram')}>
                            {t('services.control')}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!loading && groups.length > 0 ? (
        <footer className="servicesListFooter">
          <p className="muted">{t('services.footer')}</p>
          <Link className="btn" to="/setup">
            {t('services.createNew')}
          </Link>
        </footer>
      ) : null}

      {!hasFirebaseConfig() ? (
        <p className="muted servicesEnvHint">
          {t('services.firebaseHint', { envFile: '.env.local' })}
        </p>
      ) : null}

      <SwitchControlModal
        open={pendingSwitch != null}
        fromTitle={activeControl?.title ?? ''}
        toTitle={pendingSwitch?.title ?? ''}
        onConfirm={confirmSwitch}
        onCancel={() => setPendingSwitch(null)}
      />
    </ControlShell>
  )
}

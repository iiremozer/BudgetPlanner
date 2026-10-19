import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Masthead from './components/Masthead.jsx';
import EntryForm from './components/EntryForm.jsx';
import GoalList from './components/GoalList.jsx';
import Ledger from './components/Ledger.jsx';
import Settings from './components/Settings.jsx';
import StreakTab from './components/StreakTab.jsx';
import TransferCard from './components/TransferCard.jsx';
import Celebration from './components/Celebration.jsx';
import TabBar from './components/TabBar.jsx';
import { loadState, saveState, makeId, defaultState, normalizeState } from './lib/storage.js';
import { totalSaved, currentStreak } from './lib/savings.js';
import { formatMoney } from './lib/money.js';
import { markDeleted, shareableGoal, mergeGoalBook } from './lib/sync.js';
import { mergeBackup, replaceWithBackup } from './lib/backup.js';
import { shouldPrompt, pendingAmount } from './lib/transfers.js';
import { newFromOthers } from './lib/contributions.js';
import { pendingCelebration } from './lib/celebration.js';
import { resolveTheme, accentOf, accentRoles } from './lib/colors.js';
import { planNotifications } from './lib/notifications.js';
import {
  isNative,
  tapFeedback,
  mirrorToDevice,
  readFromDevice,
  applyNotificationPlan,
  setStatusBarStyle,
  onBackButton,
} from './lib/native.js';
import { moveGoal, normalizeOrders } from './lib/goals.js';
import { readBook, writeBook, deleteBook, isRemoteConfigured } from './lib/remote.js';

const BURST_MS = 1050;

// Eşitleme sıklığı. Eşitlemenin kendisi de state'i değiştirdiği için
// "her değişiklikte eşitle" kurmak sonsuz döngü yaratır. Bunun yerine:
// kullanıcı bir şey yaptıysa en fazla dakikada bir gönder, karşı tarafın
// değişikliklerini beş dakikada bir çek, uygulamaya dönünce ve aşağı
// çekince hemen bak.
const PUSH_EVERY_MS = 60_000;
const PULL_EVERY_MS = 5 * 60_000;
const FOCUS_MIN_GAP_MS = 20_000;
const TICK_MS = 20_000;
const PULL_THRESHOLD = 64;

function statusText(status, lastSync) {
  if (status === 'syncing') return 'Syncing…';
  if (status === 'error') return 'Offline — will retry';
  if (lastSync) {
    return `Last synced ${lastSync.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return 'Not synced yet';
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [burst, setBurst] = useState(null);
  const [status, setStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [tab, setTab] = useState('save');
  const [justAdded, setJustAdded] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const stateRef = useRef(state);
  const burstTimer = useRef(null);
  const inFlight = useRef(false);
  const dirty = useRef(false);
  const lastSyncAt = useRef(0);
  const pullStart = useRef(null);

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
    // Tarayıcı deposu işletim sistemi tarafından temizlenebiliyor;
    // native tarafta ikinci bir kopya tutuyoruz.
    mirrorToDevice(JSON.stringify(state));
  }, [state]);

  // Açılışta yerel depo boşsa native kopyadan geri yükle.
  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    (async () => {
      const current = stateRef.current;
      if (current.entries.length > 0 || current.goals.length > 0) return;
      const saved = await readFromDevice();
      if (!saved || cancelled) return;
      try {
        setState(normalizeState(JSON.parse(saved)));
      } catch {
        // Bozuk kopya varsa boş defterle devam ediyoruz.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Bildirim planı her değişiklikte baştan kurulur.
  useEffect(() => {
    if (!isNative()) return;
    applyNotificationPlan(planNotifications(state));
  }, [state.notifications, state.entries, state.transfers, state.currency]);

  useEffect(() => () => clearTimeout(burstTimer.current), []);

  const hasShared = state.goals.some((g) => g.share?.code);

  const sync = useCallback(async () => {
    if (!isRemoteConfigured() || inFlight.current) return;
    const shared = stateRef.current.goals.filter((g) => g.share?.code);
    if (shared.length === 0) return;

    inFlight.current = true;
    setStatus('syncing');
    try {
      for (const goal of shared) {
        const code = goal.share.code;
        const remote = await readBook(code);

        // Sunucu "böyle bir defter yok" diyorsa ve biz daha önce oraya
        // yazmışsak, karşı taraf ortak kopyayı silmiş demektir. Eskiden
        // burada körlemesine yeniden yazıyorduk; silinen defter bir dakika
        // içinde geri doğuyor, kodu bilen herkes tekrar içeri girebiliyordu.
        // Artık paylaşımı bu cihazda da bitiriyoruz: hedef ve kayıtlar kalır.
        if (remote == null && goal.share.published) {
          unshareGoal(goal.id);
          setNotice(
            `${goal.name} is no longer shared — the shared copy was deleted. The goal and everything you logged are still on this phone.`
          );
          continue;
        }

        // Birleştirmeyi burada yapıyoruz: setState güncelleyicisi sonradan
        // çalıştığı için sonucu oradan okumak güvenilir değil.
        const merged = mergeGoalBook(stateRef.current, remote, goal.id);
        stateRef.current = merged;
        setState(merged);
        await writeBook(code, shareableGoal(merged, goal.id));
        markPublished(goal.id);
      }
      dirty.current = false;
      lastSyncAt.current = Date.now();
      setStatus('idle');
      setLastSync(new Date());
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, []);

  // Düzenli yoklama. Kullanıcı bir şey değiştirdiyse daha sık gönderir.
  useEffect(() => {
    if (!hasShared) return undefined;
    const tick = () => {
      const since = Date.now() - lastSyncAt.current;
      if ((dirty.current && since >= PUSH_EVERY_MS) || since >= PULL_EVERY_MS) sync();
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [hasShared, sync]);

  // Uygulamaya geri dönünce bak.
  useEffect(() => {
    if (!hasShared) return undefined;
    const onWake = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastSyncAt.current >= FOCUS_MIN_GAP_MS) sync();
    };
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);
    return () => {
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [hasShared, sync]);

  // Android'in geri tuşu: önce ayarları kapatır, sonra Save sekmesine döner.
  useEffect(() => {
    return onBackButton(() => {
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      setTab((current) => (current === 'save' ? current : 'save'));
    });
  }, [settingsOpen]);

  // Ayarlarda sol kenardan sağa kaydırmak geri gitmek demek — iOS'ta
  // insanların elinde zaten olan hareket.
  //
  // Dinleyiciler pencereye bağlı, panelin kendisine değil: ekranın en solundaki
  // birkaç piksel sayfa kenar boşluğuna düşüyor ve insan tam oradan başlıyor.
  // Panele bağlı olsaydı o dokunuş hiç görünmezdi.
  //
  // Karar parmak hareket ederken verilir, kaldırıldığında değil: yatay bir
  // sürüklemede iOS touchend yerine touchcancel yollayabiliyor.
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) return undefined;

    let start = null; // kenardan başlayan dokunuş
    let active = false; // yatay olduğu anlaşıldı, paneli sürüklüyoruz

    function place(dx, animate) {
      const node = settingsRef.current;
      if (!node) return;
      node.style.transition = animate ? 'transform 160ms ease-out' : 'none';
      node.style.transform = dx > 0 ? `translateX(${dx}px)` : '';
    }

    function onStart(e) {
      if (e.touches.length !== 1) {
        start = null;
        return;
      }
      const touch = e.touches[0];
      start = touch.clientX <= 40 ? { x: touch.clientX, y: touch.clientY } : null;
      active = false;
    }

    function onMove(e) {
      if (!start || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - start.x;
      const dy = Math.abs(touch.clientY - start.y);

      if (!active) {
        // Dikey niyet belliyse bırak, sayfa normal kaydırsın.
        if (dy > 24 && dy > dx) {
          start = null;
          return;
        }
        if (dx < 10) return;
        active = true;
      }

      place(dx, false);

      if (dx > 72) {
        start = null;
        active = false;
        place(0, false);
        setSettingsOpen(false);
      }
    }

    function onEnd() {
      // Eşiğe varmadan bırakıldı: panel yerine kaysın.
      if (active) place(0, true);
      start = null;
      active = false;
    }

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      place(0, false);
    };
  }, [settingsOpen]);

  // Sayfayı aşağı çekince yenile.
  function onTouchStart(e) {
    pullStart.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  }

  function onTouchMove(e) {
    if (pullStart.current === null) return;
    const delta = e.touches[0].clientY - pullStart.current;
    setPullDistance(delta > 0 ? Math.min(delta * 0.5, 90) : 0);
  }

  function onTouchEnd() {
    if (pullDistance >= PULL_THRESHOLD) sync();
    pullStart.current = null;
    setPullDistance(0);
  }

  // Hedefler sekmesinden çıkarken paylaşılan hedefleri görülmüş sayıyoruz.
  // Girerken işaretlersek rozet okunmadan kaybolur.
  const leavingGoals = useRef(false);
  useEffect(() => {
    if (tab === 'goals') {
      leavingGoals.current = true;
      return;
    }
    if (!leavingGoals.current) return;
    leavingGoals.current = false;

    const shared = stateRef.current.goals.filter((g) => g.share?.code);
    if (shared.length === 0) return;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      seen: shared.reduce((acc, g) => ({ ...acc, [g.id]: now }), { ...prev.seen }),
    }));
  }, [tab]);

  // Tema ve vurgu rengi belgeye yazılır; CSS değişkenleri oradan okunur.
  const [prefersDark, setPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const onChange = (e) => setPrefersDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = resolveTheme(state.theme, prefersDark);
  const accent = accentOf(state.accent);

  useEffect(() => {
    const root = document.documentElement;
    const roles = accentRoles(accent, theme);
    root.dataset.theme = theme;
    root.style.setProperty('--pine', roles.surface);
    root.style.setProperty('--on-pine', roles.onSurface);
    root.style.setProperty('--fill', roles.fill);
    root.style.setProperty('--on-fill', roles.onFill);
    root.style.setProperty('--accent', roles.bright);
    root.style.setProperty('--pine-soft', roles.bright);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', roles.surface);
    setStatusBarStyle(theme);
  }, [theme, accent]);

  const total = useMemo(() => totalSaved(state.entries), [state.entries]);
  const streak = useMemo(() => currentStreak(state.entries), [state.entries]);
  const pending = useMemo(
    () => pendingAmount(state.entries, state.transfers),
    [state.entries, state.transfers]
  );
  const unseenCount = useMemo(
    () =>
      state.goals
        .filter((g) => g.share?.code)
        .reduce(
          (sum, g) =>
            sum + newFromOthers(state.entries, g.id, state.member?.name, state.seen?.[g.id]).length,
          0
        ),
    [state.goals, state.entries, state.member, state.seen]
  );
  const celebrating = useMemo(
    () => pendingCelebration(state.goals, state.entries, state.celebrated),
    [state.goals, state.entries, state.celebrated]
  );
  const prompting = useMemo(
    () => shouldPrompt(state.entries, state.transfers),
    [state.entries, state.transfers]
  );

  function addEntry({ amount, note, goalId, emoji }) {
    const entry = {
      id: makeId('e'),
      amount,
      note,
      goalId,
      emoji: emoji ?? null,
      by: state.member?.name ?? '',
      at: new Date().toISOString(),
    };
    dirty.current = true;
    setState((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
    setBurst(entry);
    setJustAdded(entry);
    tapFeedback();
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(null), BURST_MS);
  }

  function confirmTransfer(amount) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      transfers: [
        ...prev.transfers,
        { id: makeId('t'), amount, at: new Date().toISOString() },
      ],
    }));
  }

  function removeEntry(id) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
      deleted: markDeleted(prev.deleted, 'entries', id),
    }));
  }

  function reassignEntry(id, goalId) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...e, goalId } : e)),
    }));
  }

  function addGoal({ name, target, emoji, plan, share }) {
    dirty.current = true;
    const now = new Date().toISOString();
    const goal = {
      id: makeId('g'),
      name,
      target,
      emoji,
      plan: plan ?? null,
      share: share ?? null,
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, goals: normalizeOrders([...prev.goals, goal]) }));
  }

  function removeGoal(id) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      goals: normalizeOrders(prev.goals.filter((g) => g.id !== id)),
      entries: prev.entries.map((e) => (e.goalId === id ? { ...e, goalId: null } : e)),
      deleted: markDeleted(prev.deleted, 'goals', id),
    }));
  }

  function editGoal(id, changes) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, ...changes, updatedAt: new Date().toISOString() } : g
      ),
    }));
  }

  function reorderGoal(id, direction) {
    dirty.current = true;
    setState((prev) => ({ ...prev, goals: moveGoal(prev.goals, id, direction) }));
  }

  function shareGoal(id, code) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, share: { code } } : g)),
    }));
  }

  /**
   * Paylaşılan kopyayı sunucudan siler ve hedefi yerelde paylaşımdan çıkarır.
   * Kayıtlar cihazda kalır; silinen şey yalnızca sunucudaki ortak kopyadır.
   */
  /**
   * Bu cihazdaki her şeyi siler. Paylaşımlı hedeflerde kullanıcı, sunucudaki
   * kopyanın da silinmesini isteyebilir — istemezse karşı taraf devam eder.
   * Sunucu silinemezse bunu söylüyoruz: cihaz yine de temizleniyor, çünkü
   * kullanıcı bunu istedi ve kodlar da onunla birlikte gidiyor.
   */
  async function eraseEverything(codes = []) {
    if (codes.length > 0) setStatus('syncing');
    let failed = 0;
    for (const code of codes) {
      try {
        await deleteBook(code);
      } catch {
        failed += 1;
      }
    }

    dirty.current = false;
    setState(defaultState());
    setStatus(failed > 0 ? 'error' : 'idle');
    setNotice(
      failed > 0
        ? `Everything on this phone was erased, but ${failed === 1 ? 'one shared copy' : `${failed} shared copies`} could not be removed from the server. The other person still has ${failed === 1 ? 'it' : 'them'}.`
        : null
    );
  }

  async function deleteSharedCopy(id) {
    const goal = stateRef.current.goals.find((g) => g.id === id);
    const code = goal?.share?.code;
    if (!code) return;

    setStatus('syncing');
    let removed = false;
    try {
      await deleteBook(code);
      removed = true;
    } catch {
      removed = false;
    }

    // Sunucu silme başarısız olsa bile bu cihazda paylaşımı kesiyoruz:
    // kullanıcı durdurmak istedi, hedefin "Shared" kalması yanlış olur.
    // Ama sunucudaki kopya durabileceği için bunu açıkça söylüyoruz.
    unshareGoal(id);
    setStatus(removed ? 'idle' : 'error');
    setNotice(
      removed
        ? null
        : 'Sharing stopped here, but the shared copy could not be removed from the server. Try again when you are back online.'
    );
  }

  function unshareGoal(id) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, share: null } : g)),
    }));
  }

  /**
   * Bu kodun sunucuda gerçekten bir karşılığı olduğunu işaretler. Sonraki bir
   * senkronda sunucu "yok" derse, bunun silinme olduğunu buradan biliyoruz.
   */
  function markPublished(id) {
    setState((prev) => {
      const goal = prev.goals.find((g) => g.id === id);
      if (!goal?.share?.code || goal.share.published) return prev;
      const goals = prev.goals.map((g) =>
        g.id === id ? { ...g, share: { ...g.share, published: true } } : g
      );
      const next = { ...prev, goals };
      stateRef.current = next;
      return next;
    });
  }

  async function joinGoal(code) {
    setStatus('syncing');
    try {
      const remote = await readBook(code);
      if (!remote || !remote.goal) {
        setStatus('error');
        return;
      }
      const goalId = remote.goal.id;
      const merged = mergeGoalBook(stateRef.current, remote, goalId);
      const withShare = {
        ...merged,
        goals: normalizeOrders(
          // Katıldığımız defter sunucuda zaten var; published en baştan doğru.
          merged.goals.map((g) =>
            g.id === goalId ? { ...g, share: { code, published: true } } : g
          )
        ),
      };
      stateRef.current = withShare;
      setState(withShare);
      await writeBook(code, shareableGoal(withShare, goalId));
      dirty.current = false;
      lastSyncAt.current = Date.now();
      setStatus('idle');
      setLastSync(new Date());
    } catch {
      setStatus('error');
    }
  }

  const sharedCount = state.goals.filter((g) => g.share?.code).length;

  // Uyarı iki yerde görünebilmeli: hedefler sekmesinde ve ayarlarda. Silme
  // sonrası uyarısı ayarlarda doğuyor, orada görünmezse kimse okumaz.
  const noticeBox = notice ? (
    <div className="notice">
      <span>{notice}</span>
      <button type="button" className="link" onClick={() => setNotice(null)}>
        Dismiss
      </button>
    </div>
  ) : null;

  return (
    <div
      className="app"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {hasShared ? (
        <div className="refresh" style={{ height: pullDistance }}>
          {pullDistance > 0 || status === 'syncing' ? (
            <span className="refresh-text">
              {status === 'syncing'
                ? 'Syncing…'
                : pullDistance >= PULL_THRESHOLD
                  ? 'Release to refresh'
                  : 'Pull to refresh'}
            </span>
          ) : null}
        </div>
      ) : null}

      <Masthead onOpenSettings={() => setSettingsOpen(true)} />

      {/* Uyarı hangi sekmede olursan ol görünür: paylaşımın bittiğini
          yalnızca Hedefler sekmesinde söylemek, kimsenin görmemesi demek. */}
      {noticeBox}

      {settingsOpen ? (
        <div className="settings-view panel" ref={settingsRef}>
        <Settings
          member={state.member}
          currency={state.currency}
          state={state}
          bankLink={state.bankLink}
          theme={state.theme}
          accent={state.accent}
          onSetTheme={(value) => setState((prev) => ({ ...prev, theme: value }))}
          onSetAccent={(value) => setState((prev) => ({ ...prev, accent: value }))}
          notifications={state.notifications}
          onSetNotifications={(value) => setState((prev) => ({ ...prev, notifications: value }))}
          onSetName={(name) =>
            setState((prev) => ({
              ...prev,
              member: { id: prev.member?.id ?? makeId('m'), name },
            }))
          }
          onCurrencyChange={(currency) =>
            setState((prev) => ({ ...prev, currency, currencyAt: new Date().toISOString() }))
          }
          onSetBankLink={(bankLink) => setState((prev) => ({ ...prev, bankLink }))}
          onEraseEverything={eraseEverything}
          onRestore={(restored, mode) => {
            dirty.current = true;
            setState((prev) =>
              mode === 'replace' ? replaceWithBackup(restored) : mergeBackup(prev, restored)
            );
          }}
          onClose={() => setSettingsOpen(false)}
        />
        </div>
      ) : (
        <>

      {tab === 'save' ? (
        <div className="panel">
          <section className="hero">
            <p className="hero-label">Total saved</p>
            <p className={`hero-amount${burst ? ' is-bumped' : ''}`}>
              {formatMoney(total, state.currency)}
            </p>
            <div className="hero-meta">
              <span className={`pill${streak > 0 ? ' pill-live' : ''}`}>
                {streak > 0 ? `${streak} day streak` : 'No streak yet'}
              </span>
              <span className="pill">
                {state.entries.length} {state.entries.length === 1 ? 'win' : 'wins'}
              </span>
              {pending > 0 ? (
                <span className="pill">{formatMoney(pending, state.currency)} to move</span>
              ) : null}
            </div>
          </section>

          {prompting ? (
            <TransferCard
              entries={state.entries}
              transfers={state.transfers}
              currency={state.currency}
              prompting
              bankLink={state.bankLink}
              onConfirm={confirmTransfer}
            />
          ) : null}

          <EntryForm
            currency={state.currency}
            goals={state.goals}
            entries={state.entries}
            generalName={state.generalName}
            onAdd={addEntry}
          />

          {justAdded ? (
            <div className="just-added">
              <span className="just-added-text">
                Added {justAdded.note || 'a win'} · {formatMoney(justAdded.amount, state.currency)}
              </span>
              <button
                type="button"
                className="link"
                onClick={() => {
                  removeEntry(justAdded.id);
                  setJustAdded(null);
                }}
              >
                Undo
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'goals' ? (
        <div className="panel">
          <GoalList
            goals={state.goals}
            entries={state.entries}
            currency={state.currency}
            memberName={state.member?.name}
            syncStatus={statusText(status, lastSync)}
            onAdd={addGoal}
            onRemove={removeGoal}
            onMove={reorderGoal}
            onShare={shareGoal}
            onUnshare={unshareGoal}
            onDeleteShared={deleteSharedCopy}
            onJoin={joinGoal}
            onSyncNow={sync}
            seen={state.seen}
            theme={theme}
            onEdit={editGoal}
            generalName={state.generalName}
            onRenameGeneral={(name) =>
              setState((prev) => ({ ...prev, generalName: name.trim() || prev.generalName }))
            }
          />

        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="panel">
        <StreakTab entries={state.entries} currency={state.currency}>
          <TransferCard
            entries={state.entries}
            transfers={state.transfers}
            currency={state.currency}
            bankLink={state.bankLink}
            onConfirm={confirmTransfer}
          />

          <Ledger
            entries={state.entries}
            goals={state.goals}
            currency={state.currency}
            generalName={state.generalName}
            lastId={burst?.id}
            onRemove={removeEntry}
            onReassign={reassignEntry}
          />
        </StreakTab>
        </div>
      ) : null}

      <p className="footnote">
        {sharedCount > 0
          ? `${sharedCount} shared ${sharedCount === 1 ? 'goal' : 'goals'} · everything else stays on this device`
          : 'Saved on this device only'}
      </p>

        </>
      )}

      {settingsOpen ? null : (
        <TabBar active={tab} onChange={setTab} badge={streak} goalsDot={unseenCount > 0} />
      )}

      {celebrating ? (
        <Celebration
          goal={celebrating}
          entries={state.entries}
          currency={state.currency}
          myName={state.member?.name}
          onClose={() =>
            setState((prev) => ({
              ...prev,
              celebrated: { ...prev.celebrated, [celebrating.id]: new Date().toISOString() },
            }))
          }
        />
      ) : null}

      {burst ? (
        <div className="burst" aria-hidden="true">
          <div className="burst-pill">+{formatMoney(burst.amount, state.currency)}</div>
        </div>
      ) : null}
    </div>
  );
}

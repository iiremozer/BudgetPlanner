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

  const stateRef = useRef(state);
  const burstTimer = useRef(null);
  const inFlight = useRef(false);
  const dirty = useRef(false);
  const lastSyncAt = useRef(0);
  const pullStart = useRef(null);

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

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
        // Birleştirmeyi burada yapıyoruz: setState güncelleyicisi sonradan
        // çalıştığı için sonucu oradan okumak güvenilir değil.
        const merged = mergeGoalBook(stateRef.current, remote, goal.id);
        stateRef.current = merged;
        setState(merged);
        await writeBook(code, shareableGoal(merged, goal.id));
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

  const total = useMemo(() => totalSaved(state.entries), [state.entries]);
  const streak = useMemo(() => currentStreak(state.entries), [state.entries]);

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
    if (navigator.vibrate) navigator.vibrate(18);
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(null), BURST_MS);
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

  function unshareGoal(id) {
    dirty.current = true;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, share: null } : g)),
    }));
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
          merged.goals.map((g) => (g.id === goalId ? { ...g, share: { code } } : g))
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

      <Masthead
        currency={state.currency}
        onCurrencyChange={(currency) =>
          setState((prev) => ({ ...prev, currency, currencyAt: new Date().toISOString() }))
        }
      />

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
        </div>
      </section>

      <EntryForm
        currency={state.currency}
        goals={state.goals}
        entries={state.entries}
        onAdd={addEntry}
      />

      <GoalList
        goals={state.goals}
        entries={state.entries}
        currency={state.currency}
        memberName={state.member?.name}
        syncStatus={statusText(status, lastSync)}
        onSyncNow={sync}
        onAdd={addGoal}
        onRemove={removeGoal}
        onMove={reorderGoal}
        onShare={shareGoal}
        onUnshare={unshareGoal}
        onJoin={joinGoal}
      />

      <Ledger
        entries={state.entries}
        goals={state.goals}
        currency={state.currency}
        lastId={burst?.id}
        onRemove={removeEntry}
        onReassign={reassignEntry}
      />

      <MemberCard
        member={state.member}
        onSetName={(name) =>
          setState((prev) => ({
            ...prev,
            member: { id: prev.member?.id ?? makeId('m'), name },
          }))
        }
      />

      <p className="footnote">
        {sharedCount > 0
          ? `${sharedCount} shared ${sharedCount === 1 ? 'goal' : 'goals'} · everything else stays on this device`
          : 'Saved on this device only'}
      </p>

      {burst ? (
        <div className="burst" aria-hidden="true">
          <div className="burst-pill">+{formatMoney(burst.amount, state.currency)}</div>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'countly-data-v1';
const freshData = () => ({ total: 0, events: [] });

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function readData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isFinite(saved.total) && Array.isArray(saved.events)) return saved;
  } catch {
    // Start fresh if local storage is unavailable or contains invalid data.
  }
  return freshData();
}

function App() {
  const [data, setData] = useState(readData);
  const [notice, setNotice] = useState('');
  const today = todayKey();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const days = useMemo(() => {
    const grouped = new Map();
    data.events.forEach((event) => {
      const day = grouped.get(event.date) ?? { date: event.date, plus: 0, minus: 0, net: 0 };
      if (event.amount > 0) day.plus += event.amount;
      else day.minus += Math.abs(event.amount);
      day.net += event.amount;
      grouped.set(event.date, day);
    });
    return [...grouped.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [data.events]);

  const todayEvents = days.find((day) => day.date === today) ?? { net: 0 };
  const weekStartDate = new Date();
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStart = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}`;
  const weekNet = data.events.filter((event) => event.date >= weekStart).reduce((sum, event) => sum + event.amount, 0);

  function change(amount) {
    setData((current) => ({
      total: current.total + amount,
      events: [...current.events, {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        date: today,
        amount,
        time: new Date().toISOString(),
      }],
    }));
    setNotice(amount > 0 ? 'Added one' : 'Removed one');
    window.setTimeout(() => setNotice(''), 1100);
  }

  function reset() {
    if (data.events.length && window.confirm('Clear your count and all saved history?')) setData(freshData());
  }

  function dayName(value) {
    if (value === today) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (value === yesterdayKey) return 'Yesterday';
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' });
  }

  function prettyDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: new Date().getFullYear() === Number(value.slice(0, 4)) ? undefined : 'numeric',
    });
  }

  const signed = (value) => `${value > 0 ? '+' : ''}${value.toLocaleString()}`;

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Countly home"><span className="brand-mark">↗</span><span className="brand-name">count<span>ly</span></span></a>
        <span className="header-note">Small steps add up.</span>
      </header>
      <main className="main">
        <div className="eyebrow">Your personal counter</div>
        <h1 className="title">Keep your momentum.</h1>
        <p className="subtitle">One little count at a time. Your progress stays right here.</p>

        <section className="counter-card" aria-label="Counter">
          <div className="counter-top">
            <span className="today-pill"><i className="live-dot" />{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <button className="reset" onClick={reset} title="Clear all counts and history">Reset history</button>
          </div>
          <p className="count-label">Your total count</p>
          <div className="count-number" aria-live="polite">{data.total.toLocaleString()}</div>
          <div className="controls">
            <button className="control minus" onClick={() => change(-1)} aria-label="Decrease count by one"><span className="symbol">−</span><span>One</span></button>
            <button className="control plus" onClick={() => change(1)} aria-label="Increase count by one"><span className="symbol">+</span><span>Add one</span></button>
          </div>
          <div className="counter-foot" aria-live="polite">{notice || 'Every tap is saved automatically'}</div>
        </section>

        <section className="stats" aria-label="Progress summary">
          <div className="stat"><div className="stat-label">Today</div><div className="stat-value">{signed(todayEvents.net)}</div><div className="stat-caption">net change</div></div>
          <div className="stat"><div className="stat-label">Last 7 days</div><div className="stat-value">{signed(weekNet)}</div><div className="stat-caption">net change</div></div>
          <div className="stat"><div className="stat-label">Days active</div><div className="stat-value">{days.length}</div><div className="stat-caption">with activity</div></div>
        </section>

        <section className="history">
          <div className="history-head"><div><div className="history-title">Your timeline</div><div className="history-sub">Daily activity and running total</div></div><span className="range">ALL TIME</span></div>
          {days.length === 0 ? <div className="timeline empty">Your first count will start the timeline here.</div> : (
            <ol className="timeline">{days.map((day) => <li className="day" key={day.date}>
              <div><div className="day-name">{dayName(day.date)}</div><div className="day-date">{prettyDate(day.date)}</div></div>
              <div className="changes"><span className={day.plus ? 'positive' : 'zero'}>+{day.plus}</span><span className="zero">·</span><span className={day.minus ? 'negative' : 'zero'}>−{day.minus}</span></div>
              <div className="day-total">{signed(day.net)}<small>that day</small></div>
            </li>)}</ol>
          )}
        </section>
        <p className="footer">Saved on this device <b>·</b> Your progress is always yours</p>
      </main>
    </div>
  );
}

export default App;

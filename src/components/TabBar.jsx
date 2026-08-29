const TABS = [
  { id: 'save', label: 'Save' },
  { id: 'goals', label: 'Goals' },
  { id: 'streak', label: 'Streak' },
];

export default function TabBar({ active, onChange, badge }) {
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="tab"
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-label">{tab.label}</span>
          {tab.id === 'streak' && badge > 0 ? <span className="tab-badge">{badge}</span> : null}
        </button>
      ))}
    </nav>
  );
}

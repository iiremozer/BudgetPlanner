import Icon from './Icon.jsx';

const TABS = [
  { id: 'save', label: 'Save', icon: 'tabSave' },
  { id: 'goals', label: 'Goals', icon: 'tabGoals' },
  { id: 'history', label: 'History', icon: 'tabHistory' },
];

export default function TabBar({ active, onChange, badge, goalsDot }) {
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
          <span className="tab-icon">
            <Icon name={tab.icon} size={23} strokeWidth={active === tab.id ? 2 : 1.7} />
            {/* Seri sayısı ikona yapışık duruyor: çubuğun köşesinde durduğunda
                okunmamış bildirim sanılıyordu. */}
            {tab.id === 'history' && badge > 0 ? (
              <span className="tab-badge" aria-label={`${badge} day streak`}>
                {badge}
              </span>
            ) : null}
          </span>
          <span className="tab-label">{tab.label}</span>
          {tab.id === 'goals' && goalsDot ? <span className="tab-dot" /> : null}
        </button>
      ))}
    </nav>
  );
}

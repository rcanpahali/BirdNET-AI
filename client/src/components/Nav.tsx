import { NavLink } from 'react-router-dom';

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
  }`;

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
          <span aria-hidden="true">🐦</span> BirdNet Analyzer
        </span>
        <nav className="flex gap-1">
          <NavLink to="/" end className={linkClasses}>
            Analyze
          </NavLink>
          <NavLink to="/list" className={linkClasses}>
            List
          </NavLink>
          <NavLink to="/map" className={linkClasses}>
            Map
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

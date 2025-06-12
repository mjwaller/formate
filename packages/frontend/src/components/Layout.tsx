import { Link, Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import logo from '../assets/logo.svg';

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', width: '100%' }}>
          <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit'}}>
            <img src={logo} alt="FORMATE logo" style={{ height: '2rem', marginRight: '0.5rem' }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem'}}>FORMATE</h1>
          </Link>
          <nav className="main-nav" style={{padding: '0.5rem'}}>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="content" style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </>
  );
}





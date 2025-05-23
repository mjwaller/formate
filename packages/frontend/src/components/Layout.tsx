import { Link, Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Layout() {

  return (
    <>
      <header className="site-header">
        <Link to="/"><h1 className="brand">FORMATE</h1></Link>

        <nav className="main-nav">
          {' '}| <ThemeToggle />
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </>
  );
}

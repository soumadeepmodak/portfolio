
import { NavLink, Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Experience', path: '/experience' },
    { label: 'Internships', path: '/internships' },
    { label: 'Skills', path: '/skills' },
    { label: 'Projects', path: '/projects' },
    { label: 'Education', path: '/education' },
    { label: 'Resume', path: '/resume' },
    { label: 'Certifications', path: '/certifications' },
    { label: 'Contact', path: '/contact' },
  ]

  return (
    <nav className="site-navbar">
      <div className="navbar-brand">
        <Link to="/">Portfolio.</Link>
      </div>

      <div className="site-nav-links">
        {navLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <NavLink
        to="/admin"
        className="admin-secret-link"
        aria-label="Admin access"
        title="Admin access"
      >
        <span className="admin-secret-mark">S</span>
      </NavLink>
    </nav>
  )
}

export default Navbar

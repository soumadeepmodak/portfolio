
import './App.css'
import { useEffect, useState } from 'react'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from './config/firebase.js'
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'

const DEFAULT_ABOUT_CONTENT = {
  aboutHeading: 'About Me',
  aboutText:
    'I am building my foundation in programming, data analysis and problem-solving. My goal is to learn through practical projects, explore data-driven questions and keep improving my technical skills.',
  hireHeading: 'A learner focused on practical growth',
  hireText:
    'I focus on continuous learning, logical thinking and developing practical skills through projects. I aim to contribute with honesty, curiosity and a willingness to improve.',
  hirePoints: [
    'Committed to continuous learning',
    'Interested in data analysis and Python',
    'Focused on practical projects and problem-solving',
  ],
}

function App() {
  console.log('CURRENT APP JSX LOADED')

  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState(false)

  const [aboutContent, setAboutContent] = useState(DEFAULT_ABOUT_CONTENT)
  const [aboutContentError, setAboutContentError] = useState(false)
  const [hirePanelOpen, setHirePanelOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthChecked(true)
    })

    return unsubscribe
  }, [])

  // Load projects
  useEffect(() => {
    console.log('PUBLIC PROJECTS LISTENER STARTING')

    const projectsQuery = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        setProjects(
          snapshot.docs.map((projectDoc) => ({
            id: projectDoc.id,
            ...projectDoc.data(),
          }))
        )
        setProjectsLoading(false)
        setProjectsError(false)
      },
      (error) => {
        console.error('Could not load projects:', error)
        setProjectsError(true)
        setProjectsLoading(false)
      }
    )

    return unsubscribe
  }, [])

  // Load About and Hire Me content
  useEffect(() => {
    console.log('PUBLIC ABOUT LISTENER STARTING')

    const aboutDocument = doc(db, 'siteContent', 'about')

    const unsubscribe = onSnapshot(
      aboutDocument,
      (snapshot) => {
        console.log('PUBLIC ABOUT DOCUMENT EXISTS:', snapshot.exists())

        if (!snapshot.exists()) {
          console.warn('Public About document does not exist.')
          setAboutContent(DEFAULT_ABOUT_CONTENT)
          setAboutContentError(false)
          return
        }

        const saved = snapshot.data()

        console.log('PUBLIC ABOUT DATA:', saved)
        console.log('PUBLIC ABOUT TEXT:', saved.aboutText)
        console.log('PUBLIC HIRE TEXT:', saved.hireText)

        setAboutContent({
          ...DEFAULT_ABOUT_CONTENT,
          ...saved,
          hirePoints: Array.isArray(saved.hirePoints)
            ? saved.hirePoints
            : DEFAULT_ABOUT_CONTENT.hirePoints,
        })

        setAboutContentError(false)
      },
      (error) => {
        console.error('Could not load About content:', error)
        setAboutContentError(true)
      }
    )

    return unsubscribe
  }, [])

  const path = window.location.pathname

  if (path === '/admin') {
    return <AdminLogin />
  }

  if (path === '/admin/dashboard') {
    if (!authChecked) {
      return <p>Checking login...</p>
    }

    if (!user) {
      window.location.replace('/admin')
      return null
    }

    return <AdminDashboard />
  }

  const visibleProjects = projects.filter(
    (project) => project.isHidden !== true
  )

  return (
    <main>
      <nav className="navbar">
        <a className="brand" href="#home">
          Portfolio<span>.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#education">Education</a>
          <a href="#contact">Contact</a>
          <a className="admin-nav-btn" href="/admin">
            Admin Login
          </a>
        </div>
      </nav>

      <section className="hero-section" id="home">
        <div className="hero-content">
          <p className="eyebrow">WELCOME TO MY PORTFOLIO</p>

          <h1>
            Hi, I'm <span>Soumadeep</span>
          </h1>

          <h2>Aspiring Data Analyst &amp; Data Scientist</h2>

          <p className="hero-description">
            I am learning to turn data into meaningful insights and build
            useful digital solutions. Explore my learning journey and projects.
          </p>

          <div className="hero-actions">
            <a className="primary-btn" href="#projects">
              Explore Projects ↗
            </a>
            <a className="secondary-btn" href="#contact">
              Contact Me
            </a>
          </div>

          <div className="hero-tags">
            <span>Data Analytics</span>
            <span>Python</span>
            <span>Machine Learning</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>

          <div className="data-card">
            <div className="card-top">
              <span className="status-dot"></span>
              <span>DATA / INSIGHTS</span>
            </div>

            <div className="chart-bars">
              <span style={{ height: '35%' }}></span>
              <span style={{ height: '55%' }}></span>
              <span style={{ height: '42%' }}></span>
              <span style={{ height: '75%' }}></span>
              <span style={{ height: '62%' }}></span>
              <span style={{ height: '92%' }}></span>
              <span style={{ height: '70%' }}></span>
            </div>

            <div className="chart-footer">
              <span>Explore</span>
              <span>Analyze</span>
              <span>Learn</span>
            </div>
          </div>

          <div className="floating-badge badge-python">Python</div>
          <div className="floating-badge badge-data">Data Science</div>
        </div>
      </section>

      <section className="content-section" id="about">
        <p className="eyebrow">GET TO KNOW ME</p>

        <h2>{aboutContent.aboutHeading || 'About Me'}</h2>

        {aboutContentError ? (
          <p className="section-description">
            About content could not be loaded. Please try again later.
          </p>
        ) : (
          <p className="section-description">{aboutContent.aboutText}</p>
        )}

        <button
          className="primary-btn hire-button"
          type="button"
          onClick={() => setHirePanelOpen((open) => !open)}
          aria-controls="hire-panel"
          aria-expanded={hirePanelOpen}
        >
          {hirePanelOpen
            ? 'Why Should You Hire Me? −'
            : 'Why Should You Hire Me? +'}
        </button>

        <div
          id="hire-panel"
          className="hire-panel"
          hidden={!hirePanelOpen}
        >
          <h3>{aboutContent.hireHeading}</h3>
          <p>{aboutContent.hireText}</p>

          {aboutContent.hirePoints.length > 0 && (
            <ul>
              {aboutContent.hirePoints.map((point, index) => (
                <li key={`${index}-${point}`}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="content-section alternate" id="skills">
        <p className="eyebrow">MY TOOLKIT</p>

        <h2>
          Skills I'm <span>Developing</span>
        </h2>

        <p className="section-description">
          This section will grow as I learn and verify each skill through practice.
        </p>

        <div className="skill-grid">
          <article className="info-card">
            <div className="card-icon">01</div>
            <h3>Programming</h3>
            <p>Python · JavaScript · Problem Solving</p>
          </article>

          <article className="info-card">
            <div className="card-icon">02</div>
            <h3>Data Analytics</h3>
            <p>Data cleaning · Analysis · Visualization</p>
          </article>

          <article className="info-card">
            <div className="card-icon">03</div>
            <h3>Data Science</h3>
            <p>Statistics · Machine learning fundamentals</p>
          </article>

          <article className="info-card">
            <div className="card-icon">04</div>
            <h3>Web Development</h3>
            <p>HTML · CSS · React fundamentals</p>
          </article>
        </div>
      </section>

      <section className="content-section" id="projects">
        <p className="eyebrow">LEARN BY BUILDING</p>

        <h2>
          Featured <span>Projects</span>
        </h2>

        <p className="section-description">
          Projects added through the private Admin Dashboard appear here.
        </p>

        {projectsLoading && (
          <p className="section-description">Loading projects...</p>
        )}

        {projectsError && (
          <p className="section-description">
            Projects could not be loaded. Please try again later.
          </p>
        )}

        {!projectsLoading && !projectsError && visibleProjects.length === 0 && (
          <p className="section-description">
            No projects have been published yet.
          </p>
        )}

        <div className="project-grid">
          {visibleProjects.map((project) => (
            <article className="info-card project-card" key={project.id}>
              <span className="project-label">
                {Array.isArray(project.technologies) &&
                project.technologies.length > 0
                  ? project.technologies.join(' · ')
                  : 'PROJECT'}
              </span>

              <h3>{project.title || 'Untitled Project'}</h3>

              <p>
                {project.description || 'Project details will be added soon.'}
              </p>

              {Array.isArray(project.technologies) &&
                project.technologies.length > 0 && (
                  <p>
                    <strong>Technologies:</strong>{' '}
                    {project.technologies.join(', ')}
                  </p>
                )}

              <div className="hero-actions">
                {project.github && (
                  <a
                    className="secondary-btn"
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source Code ↗
                  </a>
                )}

                {project.liveDemo && (
                  <a
                    className="primary-btn"
                    href={project.liveDemo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live Demo ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section alternate" id="education">
        <p className="eyebrow">MY LEARNING JOURNEY</p>

        <h2>
          Education &amp; <span>Growth</span>
        </h2>

        <article className="info-card education-card">
          <span className="project-label">CURRENT STUDY</span>
          <h3>Bachelor of Computer Applications (BCA)</h3>
          <p>Maulana Abul Kalam Azad University of Technology (MAKAUT)</p>
          <p className="muted-text">
            Currently pursuing · Add verified dates and details later
          </p>
        </article>
      </section>

      <section className="content-section" id="contact">
        <p className="eyebrow">LET'S CONNECT</p>

        <h2>
          Contact <span>Me</span>
        </h2>

        <p className="section-description">
          Contact details and a secure message form will be added after the
          backend is configured.
        </p>

        <a className="secondary-btn" href="#home">
          Back to Top ↑
        </a>
      </section>

      <footer className="footer">
        <a className="brand" href="#home">
          Portfolio<span>.</span>
        </a>

        <p>Built with curiosity and a commitment to learning.</p>
        <p>© {new Date().getFullYear()} Portfolio</p>

        <a className="secondary-btn" href="/admin">
          Admin Login
        </a>
      </footer>
    </main>
  )
}

export default App

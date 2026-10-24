
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase.js'



const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'


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

function getSocialIcon(url = '') {
  try {
    const hostname = new URL(
      url.startsWith('http') ? url : `https://${url}`
    ).hostname.toLowerCase().replace(/^www\./, '')

    if (hostname.endsWith('github.com')) return 'github'
    if (hostname.endsWith('linkedin.com')) return 'linkedin'
    if (hostname === 'youtube.com' || hostname === 'youtu.be' || hostname.endsWith('.youtube.com')) return 'youtube'
    if (hostname.endsWith('instagram.com')) return 'instagram'
    if (hostname.endsWith('facebook.com')) return 'facebook'
    if (hostname === 'x.com' || hostname === 'twitter.com') return 'x'
    if (hostname === 'discord.com' || hostname === 'discord.gg') return 'discord'
    if (hostname === 'medium.com') return 'medium'
    if (hostname === 'stackoverflow.com') return 'stackoverflow'

    return 'link'
  } catch {
    return 'link'
  }
}

function SocialIcon({ type }) {
  const common = {
    width: 25,
    height: 25,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (type === 'github') {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.51-1.29-1.24-1.63-1.24-1.63-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.62 1.22 3.26.93.1-.73.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.05 1.15a10.6 10.6 0 0 1 5.56 0c2.1-1.45 3.04-1.15 3.04-1.15.61 1.54.23 2.68.12 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.61 5.24-5.1 5.52.4.35.76 1.02.76 2.06v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
      </svg>
    )
  }

  if (type === 'linkedin') {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.5H4.96V9h2.97v9.5ZM6.45 7.7a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44ZM19 18.5h-2.96v-4.62c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.78 1.2-1.78 2.44v4.7H9.76V9h2.84v1.3h.04c.4-.75 1.36-1.54 2.8-1.54 3 0 3.56 1.98 3.56 4.56v5.18Z" />
      </svg>
    )
  }

  if (type === 'youtube') {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M23 7a3 3 0 0 0-2.1-2.1C19.05 4.4 12 4.4 12 4.4s-7.05 0-8.9.5A3 3 0 0 0 1 7a31 31 0 0 0-.5 5 31 31 0 0 0 .5 5 3 3 0 0 0 2.1 2.1c1.85.5 8.9.5 8.9.5s7.05 0 8.9-.5A3 3 0 0 0 23 17a31 31 0 0 0 .5-5 31 31 0 0 0-.5-5ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z" />
      </svg>
    )
  }

  if (type === 'instagram') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" />
      </svg>
    )
  }

  if (type === 'facebook') {
    return (
      <svg {...common} fill="currentColor" stroke="none">
        <path d="M13.4 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.2V13H10v8h3.4Z" />
      </svg>
    )
  }

  if (type === 'x') {
    return (
      <svg {...common} strokeWidth="2">
        <path d="M4 3h4.5L20 21h-4.5L4 3Z" />
        <path d="M20 3 4 21" />
      </svg>
    )
  }

  if (type === 'discord') {
    return (
      <svg {...common}>
        <path d="M8 7.5a10 10 0 0 1 8 0l2 1.5 1 8a14 14 0 0 1-4 2l-1-1.5M8 7.5 6 9l-1 8a14 14 0 0 0 4 2l1-1.5M8 7.5l1 1M16 7.5l-1 1" />
        <circle cx="9" cy="13" r="1" fill="currentColor" />
        <circle cx="15" cy="13" r="1" fill="currentColor" />
      </svg>
    )
  }

  if (type === 'medium') {
    return (
      <svg {...common}>
        <ellipse cx="7" cy="12" rx="5" ry="7" />
        <ellipse cx="17" cy="12" rx="2" ry="7" />
        <rect x="20" y="5" width="2" height="14" rx="1" />
      </svg>
    )
  }

  if (type === 'stackoverflow') {
    return (
      <svg {...common}>
        <path d="M6 17v4h13v-4M8 15h9M8.5 12l8 2M10 8l7 4M13 5l6 7" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
    </svg>
  )
}

function Home() {
  const [aboutContent, setAboutContent] = useState(DEFAULT_ABOUT_CONTENT)
  const [aboutContentError, setAboutContentError] = useState(false)
  const [hirePanelOpen, setHirePanelOpen] = useState(false)
  const [socialLinks, setSocialLinks] = useState([])
  const [socialLinksError, setSocialLinksError] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProfilePhoto() {
      try {
        const response = await fetch(`${API_URL}/api/profile-photo`)

        if (!response.ok) {
          throw new Error('Could not load profile photo.')
        }

        const data = await response.json()

        if (!cancelled) {
          setPhotoUrl(data.url || '')
          setPhotoError(false)
        }
      } catch (error) {
        console.error('Could not load profile photo:', error)

        if (!cancelled) {
          setPhotoError(true)
        }
      }
    }

    loadProfilePhoto()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'siteContent', 'about'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setAboutContent(DEFAULT_ABOUT_CONTENT)
          setAboutContentError(false)
          return
        }

        const saved = snapshot.data()

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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'socialLinks'),
      (snapshot) => {
        const visibleLinks = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter((item) => item.isHidden !== true && item.url)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

        setSocialLinks(visibleLinks)
        setSocialLinksError(false)
      },
      (error) => {
        console.error('Could not load social links:', error)
        setSocialLinksError(true)
      }
    )

    return unsubscribe
  }, [])

  return (
    <main className="home-page">
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
            <Link className="primary-btn" to="/projects">
              Explore Projects ↗
            </Link>

            <Link className="secondary-btn" to="/contact">
              Contact Me
            </Link>
          </div>

          <div className="hero-tags">
            <span>Data Analytics</span>
            <span>Python</span>
            <span>Machine Learning</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="profile-photo-frame">
            {photoUrl ? (
              <img
                className="home-profile-photo"
                src={photoUrl}
                alt="Soumadeep's profile"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="profile-photo-placeholder">
                {photoError
                  ? 'Profile photo unavailable'
                  : 'Loading profile photo...'}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        className="chart-section home-social-section"
        id="social-links"
      >
        <div className="home-social-card">
          <p className="eyebrow">FIND ME ONLINE</p>
          <h2 className="social-links-heading">Connect With Me</h2>
          <p className="section-description">
            Explore my professional profiles and follow my learning journey.
          </p>

          {socialLinksError ? (
            <p className="section-description">
              Social links could not be loaded right now.
            </p>
          ) : socialLinks.length === 0 ? (
            <p className="section-description">
              My social links will appear here soon.
            </p>
          ) : (
            <div className="home-social-links">
              {socialLinks.map((item) => (
                <a
                  className="home-social-link"
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.name || 'Social link'} (opens in a new tab)`}
                >
                  <span className="home-social-icon">
                    <SocialIcon type={getSocialIcon(item.url)} />
                  </span>

                  <span className="home-social-name">
                    {item.name || 'Website'}
                  </span>

                  <span className="home-social-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          )}
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
          <p className="section-description">
            {aboutContent.aboutText}
          </p>
        )}

        <Link className="primary-btn" to="/about">
          Learn More About Me ↗
        </Link>
      </section>

      <section className="content-section alternate" id="hire-me">
        <p className="eyebrow">RECRUITER INFORMATION</p>

        <h2>
          Why Should You <span>Hire Me?</span>
        </h2>

        <button
          className="primary-btn hire-button"
          type="button"
          onClick={() => setHirePanelOpen((open) => !open)}
          aria-controls="hire-panel"
          aria-expanded={hirePanelOpen}
        >
          {hirePanelOpen ? 'Hide Details −' : 'Show Details +'}
        </button>

        <div
          id="hire-panel"
          className="hire-panel"
          hidden={!hirePanelOpen}
        >
          {aboutContentError ? (
            <p>
              Hire Me content could not be loaded. Please try again later.
            </p>
          ) : (
            <>
              <h3>{aboutContent.hireHeading}</h3>
              <p>{aboutContent.hireText}</p>

              {aboutContent.hirePoints.length > 0 && (
                <ul>
                  {aboutContent.hirePoints.map((point, index) => (
                    <li key={`${index}-${point}`}>{point}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default Home

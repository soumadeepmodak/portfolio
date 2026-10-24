
import { useEffect, useState } from 'react'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Resume() {
  const [resumeUrl, setResumeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadResume() {
      try {
        const response = await fetch(`${API_URL}/api/resume`)

        if (!response.ok) {
          throw new Error('Unable to load resume.')
        }

        const data = await response.json()

        if (active) {
          setResumeUrl(data.url || '')
          setError(data.url ? '' : 'Resume has not been uploaded yet.')
        }
      } catch {
        if (active) {
          setError('Resume could not be loaded. Please try again later.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadResume()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">MY PROFESSIONAL PROFILE</p>
        <h1>My <span>Resume</span></h1>

        <p className="section-description">
          View my resume to learn about my education, technical skills,
          and project work.
        </p>
      </section>

      <section className="content-section alternate">
        <article className="info-card">
          <h2>Resume PDF</h2>

          {loading ? (
            <p>Loading resume...</p>
          ) : resumeUrl ? (
            <>
              <p>My latest resume is available below.</p>

              <div className="hero-actions">
                <a
                  className="primary-btn"
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Resume ↗
                </a>

                <a
                  className="secondary-btn"
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Soumadeep-Modak-Resume.pdf"
                >
                  Download Resume ↓
                </a>
              </div>
            </>
          ) : (
            <p>{error || 'Resume is not available right now.'}</p>
          )}
        </article>
      </section>
    </main>
  )
}

export default Resume

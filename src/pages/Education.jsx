import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase.js'

export function Education() {
  const [educationList, setEducationList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'education'),
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setEducationList(records)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('Education loading error:', err)
        setError('Education details could not be loaded.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  function getStatusLabel(status) {
    const value = String(status || '').toLowerCase()

    if (value.includes('pursu') || value.includes('current')) {
      return 'CURRENTLY PURSUING'
    }

    if (value.includes('complet')) {
      return 'COMPLETED'
    }

    return status ? String(status).toUpperCase() : 'EDUCATION'
  }

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">MY ACADEMIC JOURNEY</p>

        <h1>
          Education &amp; <span>Growth</span>
        </h1>

        <p className="section-description">
          My education is helping me build a strong foundation in
          computer applications, programming, data analysis and
          software development.
        </p>
      </section>

      <section className="content-section alternate">
        {loading && (
          <p className="section-description">
            Loading education details...
          </p>
        )}

        {!loading && error && (
          <p className="section-description" role="alert">
            {error} Please check your Firebase configuration and
            Firestore security rules.
          </p>
        )}

        {!loading && !error && educationList.length === 0 && (
          <p className="section-description">
            No education details have been added yet.
          </p>
        )}

        {!loading &&
          !error &&
          educationList.map((item) => (
            <article
              className="info-card education-card"
              key={item.id}
            >
              <span className="project-label">
                {getStatusLabel(item.status)}
              </span>

              <h2>{item.title || 'Education'}</h2>

              {item.institution && <p>{item.institution}</p>}

              {(item.startDate || item.endDate) && (
                <p className="muted-text">
                  {item.startDate || ''}
                  {item.startDate && item.endDate ? ' - ' : ''}
                  {item.endDate || ''}
                </p>
              )}

              {item.description && <p>{item.description}</p>}
            </article>
          ))}
      </section>

      <section className="content-section">
        <p className="eyebrow">CONTINUOUS LEARNING</p>

        <h2>
          Learning Beyond <span>Classroom</span>
        </h2>

        <p className="section-description">
          I am strengthening my technical foundation through
          coursework, programming practice and independent projects.
          My goal is to keep learning and improve my practical skills.
        </p>

        <div className="hero-actions">
          <Link className="primary-btn" to="/skills">
            Explore Skills -&gt;
          </Link>

          <Link className="secondary-btn" to="/projects">
            View Projects -&gt;
          </Link>
        </div>
      </section>
    </main>
  )
}

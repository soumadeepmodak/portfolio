import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../config/firebase.js'
import './Certifications.css'

function Certifications() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCertificate, setSelectedCertificate] = useState(null)

  useEffect(() => {
    const certificatesQuery = query(
      collection(db, 'certificates'),
      where('published', '==', true)
    )

    const unsubscribe = onSnapshot(
      certificatesQuery,
      (snapshot) => {
        const publishedDocuments = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0
            const dateB = b.createdAt?.seconds || 0
            return dateB - dateA
          })

        setDocuments(publishedDocuments)
        setLoading(false)
        setError('')
      },
      (err) => {
        console.error('Certificates loading error:', err)
        setError(
          'Unable to load certificates right now. Please try again later.'
        )
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!selectedCertificate) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedCertificate(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedCertificate])

  function formatDate(date) {
    if (!date) return ''

    const parsedDate = new Date(`${date}T00:00:00`)

    if (Number.isNaN(parsedDate.getTime())) return date

    return parsedDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function isImage(item) {
    return Boolean(
      item.fileUrl && item.fileType?.startsWith('image/')
    )
  }

  function isPdf(item) {
    return Boolean(
      item.fileUrl && item.fileType === 'application/pdf'
    )
  }

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">ACHIEVEMENTS &amp; LEARNING</p>

        <h1>
          Certifications &amp; <span>Research</span>
        </h1>

        <p className="section-description">
          Explore my certificates, training achievements and
          research-related documents.
        </p>
      </section>

      <section className="content-section alternate">
        <div className="info-card">
          <span className="project-label">
            CERTIFICATES &amp; RESEARCH
          </span>

          <h2>My Certifications &amp; Research Work</h2>

          {loading ? (
            <p>Loading certificates...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : documents.length === 0 ? (
            <p>
              No certificates or research documents have been published yet.
              Please check back later.
            </p>
          ) : (
            <div className="certifications-grid">
              {documents.map((item) => (
                <article className="info-card" key={item.id}>
                  <span className="project-label">
                    {item.type || 'Certificate'}
                  </span>

                  {isImage(item) && (
                    <div className="certificate-preview">
                      <img
                        src={item.fileUrl}
                        alt={item.title || 'Certificate'}
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                  )}

                  {isPdf(item) && (
                    <div className="certificate-pdf-card">
                      <div className="certificate-pdf-icon" aria-hidden="true">
                        PDF
                      </div>
                      <p>PDF certificate</p>
                    </div>
                  )}

                  <h2>{item.title || 'Untitled Certificate'}</h2>

                  {item.issuer && (
                    <p>
                      <strong>Issuer / Institution:</strong> {item.issuer}
                    </p>
                  )}

                  {item.date && (
                    <p>
                      <strong>Date:</strong> {formatDate(item.date)}
                    </p>
                  )}

                  {item.description && <p>{item.description}</p>}

                  {item.publication && (
                    <p>
                      <strong>Publication Details:</strong>{' '}
                      {item.publication}
                    </p>
                  )}

                  {(isImage(item) || isPdf(item)) && (
                    <button
                      type="button"
                      className="primary-btn certificate-view-btn"
                      onClick={() => setSelectedCertificate(item)}
                    >
                      View Certificate
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="content-section">
        <h2>
          Explore My <span>Work</span>
        </h2>

        <div className="hero-actions">
          <Link className="primary-btn" to="/projects">
            View Projects &rarr;
          </Link>

          <Link className="secondary-btn" to="/resume">
            View Resume &rarr;
          </Link>
        </div>
      </section>

      {selectedCertificate && (
        <div
          className="certificate-modal-overlay"
          onClick={() => setSelectedCertificate(null)}
          role="presentation"
        >
          <section
            className="certificate-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedCertificate.title || 'Certificate viewer'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="certificate-modal-header">
              <h2>
                {selectedCertificate.title || 'Certificate'}
              </h2>

              <button
                type="button"
                className="certificate-modal-close"
                aria-label="Close certificate"
                onClick={() => setSelectedCertificate(null)}
              >
                ×
              </button>
            </div>

            <div className="certificate-modal-content">
              {isImage(selectedCertificate) && (
                <img
                  src={selectedCertificate.fileUrl}
                  alt={selectedCertificate.title || 'Certificate'}
                  draggable={false}
                />
              )}

              {isPdf(selectedCertificate) && (
                <iframe
                  src={`${selectedCertificate.fileUrl}#toolbar=0&navpanes=0`}
                  title={selectedCertificate.title || 'Certificate PDF'}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            <p className="certificate-modal-note">
              Certificate preview
            </p>
          </section>
        </div>
      )}
    </main>
  )
}

export default Certifications
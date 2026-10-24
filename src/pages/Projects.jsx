
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../config/firebase.js'
import './Projects.css'

function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
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
        setLoading(false)
        setError(false)
      },
      (err) => {
        console.error('Could not load projects:', err)
        setError(true)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const visibleProjects = projects.filter(
    (project) => project.isHidden !== true
  )

  function closeProject() {
    setSelectedProject(null)
  }

  useEffect(() => {
    if (!selectedProject) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeProject()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedProject])

  return (
    <main className="content-page projects-page">
      <section className="content-section projects-heading">
        <p className="eyebrow">LEARN BY BUILDING</p>

        <h1>
          My <span>Projects</span>
        </h1>

        <p className="section-description">
          Explore my practical work, technologies, project details
          and the skills I develop while building each project.
        </p>
      </section>

      <section className="content-section alternate projects-section">
        {loading && <p>Loading projects...</p>}

        {error && (
          <p role="alert">
            Projects could not be loaded. Please try again later.
          </p>
        )}

        {!loading && !error && visibleProjects.length === 0 && (
          <p>No projects have been added yet.</p>
        )}

        {!loading && !error && visibleProjects.length > 0 && (
          <div className="project-grid">
            {visibleProjects.map((project) => {
              const imageUrl =
                project.imageUrl ||
                project.image ||
                project.imageURL ||
                project.photo ||
                ''

              const technologies = Array.isArray(project.technologies)
                ? project.technologies
                : []

              return (
                <article
                  className="info-card project-card"
                  key={project.id}
                >
                  {imageUrl && (
                    <img
                      className="project-card-image"
                      src={imageUrl}
                      alt={`${project.title || 'Project'} preview`}
                      loading="lazy"
                    />
                  )}

                  <span className="project-label">
                    {technologies.length > 0
                      ? technologies.join(' · ')
                      : 'PROJECT'}
                  </span>

                  <h2>{project.title || 'Untitled Project'}</h2>

                  <p>
                    {project.description ||
                      'Project details will be added soon.'}
                  </p>

                  {technologies.length > 0 && (
                    <p>
                      <strong>Technologies:</strong>{' '}
                      {technologies.join(', ')}
                    </p>
                  )}

                  <div className="hero-actions project-card-actions">
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => setSelectedProject(project)}
                    >
                      Explore Project →
                    </button>

                    {project.github && (
                      <a
                        className="secondary-btn"
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source Code ↗
                      </a>
                    )}

                    {project.liveDemo && (
                      <a
                        className="primary-btn"
                        href={project.liveDemo}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {selectedProject && (
        <div
          className="project-modal-backdrop"
          onClick={closeProject}
        >
          <section
            className="project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="project-modal-close"
              type="button"
              onClick={closeProject}
              aria-label="Close project details"
            >
              ×
            </button>

            <p className="eyebrow">PROJECT DETAILS</p>

            {(
              selectedProject.imageUrl ||
              selectedProject.image ||
              selectedProject.imageURL ||
              selectedProject.photo
            ) && (
              <img
                className="project-modal-image"
                src={
                  selectedProject.imageUrl ||
                  selectedProject.image ||
                  selectedProject.imageURL ||
                  selectedProject.photo
                }
                alt={`${selectedProject.title || 'Project'} preview`}
              />
            )}

            <h2 id="project-modal-title">
              {selectedProject.title || 'Untitled Project'}
            </h2>

            <h3>About This Project</h3>

            <p>
              {selectedProject.description ||
                'Project description will be added soon.'}
            </p>

            <h3>Technologies Used</h3>

            {Array.isArray(selectedProject.technologies) &&
            selectedProject.technologies.length > 0 ? (
              <ul className="project-modal-technologies">
                {selectedProject.technologies.map(
                  (technology, index) => (
                    <li key={`${technology}-${index}`}>
                      {technology}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>Technologies will be added soon.</p>
            )}

            <div className="hero-actions project-modal-actions">
              {selectedProject.github && (
                <a
                  className="secondary-btn"
                  href={selectedProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Source Code ↗
                </a>
              )}

              {selectedProject.liveDemo && (
                <a
                  className="primary-btn"
                  href={selectedProject.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Live Project ↗
                </a>
              )}
            </div>
          </section>
        </div>
      )}

      <section className="content-section">
        <h2>
          Explore My <span>Skills</span>
        </h2>

        <Link className="primary-btn" to="/skills">
          View Skills →
        </Link>
      </section>
    </main>
  )
}

export default Projects

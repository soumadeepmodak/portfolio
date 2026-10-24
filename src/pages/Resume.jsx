
function Resume() {
  const resumeUrl = '/resume.pdf'

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">MY PROFESSIONAL PROFILE</p>
        <h1>My <span>Resume</span></h1>

        <p className="section-description">
          View or download my resume to learn more about my education,
          technical skills and verified project work.
        </p>
      </section>

      <section className="content-section alternate">
        <article className="info-card">
          <h2>Resume PDF</h2>

          <p>
            The resume preview will appear here after the PDF file is added.
          </p>

          <div className="hero-actions">
            <a
              className="primary-btn"
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Resume ↗
            </a>

            <a
              className="secondary-btn"
              href={resumeUrl}
              download="Soumadeep-Modak-Resume.pdf"
            >
              Download Resume ↓
            </a>
          </div>
        </article>
      </section>
    </main>
  )
}

export default Resume


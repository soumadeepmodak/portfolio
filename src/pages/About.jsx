
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase.js'

const DEFAULT_CONTENT = {
  heading: 'About Me',

  paragraphs: [
    'I am currently pursuing a Bachelor of Computer Applications (BCA) and building my foundation in programming, data analysis and software development.',
    'I enjoy learning Python, exploring data, solving problems and creating practical projects. My goal is to keep improving my technical knowledge through consistent practice.',
  ],

  directionEyebrow: 'MY DIRECTION',
  directionHeading: 'Learning With Purpose',

  cards: [
    {
      title: 'Programming',
      description: 'Building a foundation in Python and JavaScript.',
    },
    {
      title: 'Data Analytics',
      description: 'Learning how to understand, clean and analyze data.',
    },
    {
      title: 'Practical Projects',
      description: 'Applying what I learn through real implementations.',
    },
  ],
}

function About() {
  const [content, setContent] = useState(DEFAULT_CONTENT)

  useEffect(() => {
    const aboutRef = doc(db, 'pageContent', 'about')

    const unsubscribe = onSnapshot(
      aboutRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setContent(DEFAULT_CONTENT)
          return
        }

        const data = snapshot.data()

        setContent({
          heading:
            typeof data.heading === 'string' && data.heading.trim()
              ? data.heading
              : DEFAULT_CONTENT.heading,

          paragraphs:
            Array.isArray(data.paragraphs) &&
            data.paragraphs.some(
              (paragraph) =>
                typeof paragraph === 'string' && paragraph.trim()
            )
              ? data.paragraphs.filter(
                  (paragraph) =>
                    typeof paragraph === 'string' && paragraph.trim()
                )
              : DEFAULT_CONTENT.paragraphs,

          directionEyebrow:
            typeof data.directionEyebrow === 'string' &&
            data.directionEyebrow.trim()
              ? data.directionEyebrow
              : DEFAULT_CONTENT.directionEyebrow,

          directionHeading:
            typeof data.directionHeading === 'string' &&
            data.directionHeading.trim()
              ? data.directionHeading
              : DEFAULT_CONTENT.directionHeading,

          cards: Array.isArray(data.cards)
            ? data.cards.filter(
                (card) =>
                  card &&
                  typeof card.title === 'string' &&
                  typeof card.description === 'string'
              )
            : DEFAULT_CONTENT.cards,
        })
      },
      (error) => {
        console.error('About Page load error:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">GET TO KNOW ME</p>

        <h1>
          {content.heading === 'About Me' ? (
            <>
              About <span>Me</span>
            </>
          ) : (
            content.heading
          )}
        </h1>

        {content.paragraphs.map((paragraph, index) => (
          <p className="section-description" key={index}>
            {paragraph}
          </p>
        ))}
      </section>

      <section className="content-section alternate">
        <p className="eyebrow">
          {content.directionEyebrow}
        </p>

        <h2>
          {content.directionHeading === 'Learning With Purpose' ? (
            <>
              Learning With <span>Purpose</span>
            </>
          ) : (
            content.directionHeading
          )}
        </h2>

        <div className="skill-grid">
          {content.cards.map((card, index) => (
            <article className="info-card" key={index}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <h2>
          Explore My <span>Journey</span>
        </h2>

        <div className="hero-actions">
          <Link className="primary-btn" to="/education">
            Education →
          </Link>

          <Link className="secondary-btn" to="/experience">
            Experience →
          </Link>
        </div>
      </section>
    </main>
  )
}

export default About

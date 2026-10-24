import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase.js";

function Experience() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "experiences"),
      (snapshot) => {
        const records = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter((item) => item.isHidden !== true)
          .sort((a, b) =>
            (b.createdAt || "").localeCompare(a.createdAt || "")
          );

        setExperiences(records);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Error loading experiences:", err);
        setError("Experience records could not be loaded.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">MY PROFESSIONAL JOURNEY</p>

        <h1>
          Experience &amp; <span>Practice</span>
        </h1>

        <p className="section-description">
          As a BCA student, I am building practical knowledge through
          programming practice, academic learning and independent
          projects, with a growing interest in data analysis.
        </p>
      </section>

      <section className="content-section alternate">
        <article className="info-card">
          <span className="project-label">PRACTICAL LEARNING</span>

          <h2>Project-Based Learning</h2>

          <p>
            I apply what I learn by building projects, understanding
            technical concepts and exploring how different tools
            work together.
          </p>

          <p>
            My goal is to strengthen my problem-solving abilities
            and gain practical experience through hands-on work.
          </p>

          <Link className="primary-btn" to="/projects">
            Explore Projects →
          </Link>
        </article>

        <article className="info-card">
          <span className="project-label">CAREER INTEREST</span>

          <h2>Data Analysis &amp; Visualization</h2>

          <p>
            I am interested in learning how to organize data,
            identify useful patterns and communicate findings
            through clear visualizations.
          </p>

          <p>
            I aim to develop my skills in data cleaning, statistical
            fundamentals and data visualization through practice
            and projects.
          </p>

          <Link className="secondary-btn" to="/skills">
            Explore Skills →
          </Link>
        </article>
      </section>

      <section className="content-section">
        <p className="eyebrow">ADDITIONAL EXPERIENCE</p>

        <h2>
          My <span>Experience Records</span>
        </h2>

        <p className="section-description">
          Practical experience, training and learning activities.
        </p>

        {loading && <p>Loading experience records...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && experiences.length === 0 && (
          <p>No additional experience records are available yet.</p>
        )}

        {experiences.length > 0 && (
          <div className="content-section alternate">
            {experiences.map((item) => (
              <article className="info-card" key={item.id}>
                <span className="project-label">
                  {item.type || "Experience"}
                </span>

                <h2>{item.title}</h2>

                {item.organization && (
                  <p>
                    <strong>Organization:</strong>{" "}
                    {item.organization}
                  </p>
                )}

                {(item.startDate || item.endDate) && (
                  <p>
                    <strong>Duration:</strong>{" "}
                    {item.startDate || "Start date not specified"}
                    {" — "}
                    {item.endDate || "Present"}
                  </p>
                )}

                {item.description && <p>{item.description}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="content-section">
        <p className="eyebrow">NEXT MILESTONE</p>

        <h2>
          Preparing for <span>Internships</span>
        </h2>

        <p className="section-description">
          I aim to gain industry exposure through suitable internship
          opportunities, practical assignments and collaborative
          projects as I continue my studies.
        </p>

        <Link className="secondary-btn" to="/contact">
          Contact Me →
        </Link>
      </section>
    </main>
  );
}

export default Experience;
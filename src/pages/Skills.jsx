
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase.js";

function TechnicalSkillCard({ skill }) {
  const percentage = Math.min(
    100,
    Math.max(0, Number(skill.percentage) || 0)
  );

  return (
    <article className="technical-skill-card">
      <div className="technical-skill-heading">
        <span className="technical-skill-icon">
          {skill.icon || "✦"}
        </span>

        <div className="technical-skill-title">
          <h3>{skill.name}</h3>
          {skill.category && <p>{skill.category}</p>}
        </div>

        <span className="technical-skill-percent">
          {percentage}%
        </span>
      </div>

      <div
        className="skill-progress-track"
        role="progressbar"
        aria-label={`${skill.name} self-assessed skill level`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="skill-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {skill.description && (
        <p className="technical-skill-description">
          {skill.description}
        </p>
      )}
    </article>
  );
}

function ProfessionalSkillCard({ skill }) {
  const percentage = Math.min(
    100,
    Math.max(0, Number(skill.percentage) || 0)
  );

  const circumference = 2 * Math.PI * 42;
  const dashOffset =
    circumference - (percentage / 100) * circumference;

  return (
    <article className="professional-skill-card">
      <div className="professional-skill-circle">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`${skill.name}: ${percentage}% self-assessed level`}
        >
          <circle
            className="professional-circle-background"
            cx="50"
            cy="50"
            r="42"
          />
          <circle
            className="professional-circle-progress"
            cx="50"
            cy="50"
            r="42"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>

        <span>{percentage}%</span>
      </div>

      <h3>{skill.name}</h3>

      {skill.description && (
        <p>{skill.description}</p>
      )}
    </article>
  );
}

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "skills"),
      (snapshot) => {
        const visibleSkills = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter((skill) => skill.isHidden !== true);

        setSkills(visibleSkills);
        setError("");
        setLoading(false);
      },
      (firebaseError) => {
        console.error("Error loading skills:", firebaseError);
        setError("Skills could not be loaded right now.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const technicalSkills = skills.filter(
    (skill) => skill.type === "Technical"
  );

  const professionalSkills = skills.filter(
    (skill) => skill.type === "Professional"
  );

  return (
    <main className="content-page skills-page">
      <section className="content-section">
        <p className="eyebrow">MY TECHNICAL TOOLKIT</p>

        <h1>
          Skills in <span>Practice</span>
        </h1>

        <p className="section-description">
          My technical and professional skills, including the areas
          I am learning and practising. The displayed percentages
          represent my own assessment of my current skill level.
        </p>
      </section>

      {loading ? (
        <section className="content-section alternate">
          <p>Loading skills...</p>
        </section>
      ) : error ? (
        <section className="content-section alternate">
          <p role="alert">{error}</p>
        </section>
      ) : (
        <>
          <section className="content-section alternate">
            <p className="eyebrow">TOOLS & TECHNOLOGY</p>

            <h2>
              Technical <span>Skills</span>
            </h2>

            {technicalSkills.length === 0 ? (
              <p className="section-description">
                Technical skills will appear here after they are
                added and made visible in the Admin Dashboard.
              </p>
            ) : (
              <div className="technical-skills-grid">
                {technicalSkills.map((skill) => (
                  <TechnicalSkillCard
                    key={skill.id}
                    skill={skill}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="content-section">
            <p className="eyebrow">HOW I WORK</p>

            <h2>
              Professional <span>Skills</span>
            </h2>

            {professionalSkills.length === 0 ? (
              <p className="section-description">
                Professional skills will appear here after they are
                added and made visible in the Admin Dashboard.
              </p>
            ) : (
              <div className="professional-skills-grid">
                {professionalSkills.map((skill) => (
                  <ProfessionalSkillCard
                    key={skill.id}
                    skill={skill}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="content-section alternate">
        <p className="eyebrow">LEARN BY DOING</p>

        <h2>
          Skills in <span>Practice</span>
        </h2>

        <p className="section-description">
          Projects help demonstrate how I apply what I learn.
        </p>

        <Link className="primary-btn" to="/projects">
          View My Projects →
        </Link>
      </section>
    </main>
  );
}

export default Skills;

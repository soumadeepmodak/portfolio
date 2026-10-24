
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase.js";

const defaultTopics = [
  {
    id: "goals",
    label: "OPEN TO LEARNING",
    title: "Internship Goals",
    description:
      "As a BCA student, I want to gain practical exposure, understand professional workflows and improve my problem-solving skills through hands-on experience.",
    details: [
      "Gain practical experience through real-world tasks.",
      "Improve teamwork and professional communication.",
      "Strengthen problem-solving and technical skills.",
      "Learn professional development workflows.",
    ],
  },
  {
    id: "data-analysis",
    label: "AREA OF INTEREST",
    title: "Data Analysis",
    description:
      "I am interested in data cleaning, data visualization, statistical fundamentals and learning how to turn data into useful insights.",
    details: [
      "Explore and clean datasets using Python.",
      "Practise data analysis with Pandas and SQL.",
      "Create charts and visualizations.",
      "Present findings through clear reports.",
    ],
  },
  {
    id: "programming",
    label: "ALSO INTERESTED IN",
    title: "Programming & Software Projects",
    description:
      "I want to strengthen my programming fundamentals and learn how real-world applications are planned, developed and improved.",
    details: [
      "Plan projects and identify the problem to solve.",
      "Build applications using suitable technologies.",
      "Test features and fix bugs.",
      "Document projects and share code through GitHub.",
    ],
  },
];

function Internships() {
  const [expanded, setExpanded] = useState(null);
  const [topics, setTopics] = useState(defaultTopics);
  const [internships, setInternships] = useState([]);
  const [topicError, setTopicError] = useState(false);
  const [internshipError, setInternshipError] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "internshipTopics"),
      (snapshot) => {
        const savedTopics = {};

        snapshot.docs.forEach((item) => {
          savedTopics[item.id] = item.data();
        });

        const mergedTopics = defaultTopics.map((topic) => {
          const saved = savedTopics[topic.id];

          if (!saved) return { ...topic, isHidden: false };

          return {
            ...topic,
            ...saved,
            id: topic.id,
            details: Array.isArray(saved.details)
              ? saved.details
              : typeof saved.details === "string"
                ? saved.details.split("\n").filter(Boolean)
                : topic.details,
            isHidden: saved.isHidden === true,
          };
        });

        setTopics(mergedTopics);
        setTopicError(false);
      },
      (error) => {
        console.error("Could not load internship topics:", error);
        setTopicError(true);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "internships"),
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        items.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setInternships(items);
        setInternshipError(false);
      },
      (error) => {
        console.error("Could not load internships:", error);
        setInternshipError(true);
      }
    );

    return () => unsubscribe();
  }, []);

  const visibleTopics = topics.filter(
    (topic) => topic.isHidden !== true
  );

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">CAREER DEVELOPMENT</p>

        <h1>
          Internships &amp; <span>Opportunities</span>
        </h1>

        <p className="section-description">
          I am looking for opportunities to apply my academic
          knowledge, develop practical skills and learn from
          real-world projects.
        </p>
      </section>

      {topicError && (
        <section className="content-section">
          <p>
            Internship topics could not be loaded. Please refresh
            the page and try again.
          </p>
        </section>
      )}

      {visibleTopics.length > 0 && (
        <section className="content-section alternate">
          {visibleTopics.map((topic) => {
            const isExpanded = expanded === topic.id;

            return (
              <article className="info-card" key={topic.id}>
                <span className="project-label">
                  {topic.label}
                </span>

                <h2>{topic.title}</h2>
                <p>{topic.description}</p>

                <button
                  type="button"
                  className="secondary-btn"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpanded(isExpanded ? null : topic.id)
                  }
                >
                  {isExpanded ? "Show Less ↑" : "Explore Details ↓"}
                </button>

                {isExpanded && (
                  <div className="internship-topic-details">
                    <h3>What I Want to Learn and Do</h3>

                    <ul>
                      {topic.details.map((detail, index) => (
                        <li key={`${topic.id}-${index}`}>
                          {detail}
                        </li>
                      ))}
                    </ul>

                    <p>
                      These are my learning goals and planned
                      activities, not claims of completed work.
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {visibleTopics.length === 0 && !topicError && (
        <section className="content-section">
          <p>
            Internship topic information will be available soon.
          </p>
        </section>
      )}

      {internships.length > 0 && (
        <section className="content-section">
          <p className="eyebrow">INTERNSHIPS &amp; OPPORTUNITIES</p>

          <h2>
            My <span>Internship Updates</span>
          </h2>

          <div className="project-admin-list">
            {internships.map((item) => (
              <article
                className="project-admin-item"
                key={item.id}
              >
                <span className="project-label">
                  {item.status || "Opportunity"}
                </span>

                <h3>{item.title}</h3>

                {item.organization && (
                  <p>{item.organization}</p>
                )}

                <p>
                  {item.type || "Internship"} ·{" "}
                  {item.mode || "Not specified"}
                </p>

                <p>{item.description}</p>

                {(item.startDate || item.endDate) && (
                  <p>
                    {item.startDate || "Date not specified"}
                    {" — "}
                    {item.endDate || "Present / not specified"}
                  </p>
                )}

                {Array.isArray(item.skills) &&
                  item.skills.length > 0 && (
                    <p>
                      <strong>Skills:</strong>{" "}
                      {item.skills.join(", ")}
                    </p>
                  )}

                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Opportunity →
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {internshipError && (
        <section className="content-section">
          <p>
            Internship updates are temporarily unavailable.
            Please refresh the page and try again.
          </p>
        </section>
      )}

      <section className="content-section">
        <p className="eyebrow">EXPLORE MY WORK</p>

        <h2>
          Building Skills Through <span>Projects</span>
        </h2>

        <p className="section-description">
          My projects help me practise what I learn and build
          evidence of my technical abilities.
        </p>

        <div className="hero-actions">
          <Link className="primary-btn" to="/projects">
            View Projects →
          </Link>

          <Link className="secondary-btn" to="/contact">
            Contact Me →
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Internships;

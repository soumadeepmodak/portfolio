
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
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
    isHidden: false,
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
    isHidden: false,
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
    isHidden: false,
  },
];

const emptyInternship = {
  title: "",
  organization: "",
  description: "",
  type: "Internship",
  status: "Planned",
  mode: "",
  startDate: "",
  endDate: "",
  link: "",
  skills: "",
};

const fieldStyle = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  marginTop: "8px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #6754b8",
  background: "#171d35",
  color: "#f1f0ff",
  fontSize: "15px",
  lineHeight: 1.7,
  outline: "none",
  boxShadow: "0 0 0 1px rgba(124, 92, 255, 0.08)",
};

const groupStyle = {
  display: "block",
  width: "100%",
  minWidth: 0,
  marginBottom: "20px",
  color: "#c8c5ff",
};

const cardStyle = {
  display: "block",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  marginBottom: "24px",
  padding: "22px",
  border: "1px solid #51418c",
  borderRadius: "16px",
  background:
    "linear-gradient(145deg, #18233d 0%, #17152f 100%)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
};

const actionStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "12px",
  marginTop: "20px",
};

function InternshipManager() {
  const [internships, setInternships] = useState([]);
  const [topics, setTopics] = useState(defaultTopics);
  const [topicForms, setTopicForms] = useState({});
  const [form, setForm] = useState(emptyInternship);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        setLoading(false);
      },
      (error) => {
        console.error("Could not load internships:", error);
        setMessage(
          "Could not load internship records. Check Firestore rules."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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

          if (!saved) return topic;

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

        const forms = {};

        mergedTopics.forEach((topic) => {
          forms[topic.id] = {
            label: topic.label || "",
            title: topic.title || "",
            description: topic.description || "",
            details: topic.details.join("\n"),
          };
        });

        setTopicForms(forms);
      },
      (error) => {
        console.error("Could not load internship topics:", error);
        setMessage(
          "Could not load topic details. Check Firestore rules."
        );
      }
    );

    return () => unsubscribe();
  }, []);

  function handleInternshipChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetInternshipForm() {
    setForm(emptyInternship);
    setEditingId(null);
  }

  async function handleInternshipSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const internshipData = {
        title: form.title.trim(),
        organization: form.organization.trim(),
        description: form.description.trim(),
        type: form.type.trim() || "Internship",
        status: form.status.trim() || "Planned",
        mode: form.mode.trim(),
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
        link: form.link.trim(),
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "internships", editingId),
          internshipData
        );

        setMessage("Internship updated successfully.");
      } else {
        await addDoc(collection(db, "internships"), {
          ...internshipData,
          createdAt: serverTimestamp(),
        });

        setMessage("Internship added successfully.");
      }

      resetInternshipForm();
    } catch (error) {
      console.error("Could not save internship:", error);
      setMessage(
        "Could not save internship. Check your admin login and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditingInternship(item) {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      organization: item.organization || "",
      description: item.description || "",
      type: item.type || "Internship",
      status: item.status || "Planned",
      mode: item.mode || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      link: item.link || "",
      skills: Array.isArray(item.skills)
        ? item.skills.join(", ")
        : "",
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteInternship(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this internship record?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      await deleteDoc(doc(db, "internships", id));

      if (editingId === id) {
        resetInternshipForm();
      }

      setMessage("Internship record deleted.");
    } catch (error) {
      console.error("Could not delete internship:", error);
      setMessage(
        "Could not delete internship. Check your admin login and Firestore rules."
      );
    }
  }

  function handleTopicChange(topicId, field, value) {
    setTopicForms((previous) => ({
      ...previous,
      [topicId]: {
        ...(previous[topicId] || {}),
        [field]: value,
      },
    }));
  }

  async function saveTopic(topicId) {
    const topic = topics.find((item) => item.id === topicId);
    const topicForm = topicForms[topicId];

    if (!topic || !topicForm) return;

    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "internshipTopics", topicId),
        {
          label: topicForm.label.trim(),
          title: topicForm.title.trim(),
          description: topicForm.description.trim(),
          details: topicForm.details
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          isHidden: topic.isHidden === true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage(`"${topicForm.title}" saved successfully.`);
    } catch (error) {
      console.error("Could not save topic:", error);
      setMessage(
        "Could not save topic. Check your admin login and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTopicVisibility(topic) {
    const shouldHide = topic.isHidden !== true;

    const confirmed = window.confirm(
      shouldHide
        ? `Hide "${topic.title}" from the public Internships page? You can restore it later.`
        : `Restore "${topic.title}" on the public Internships page?`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const topicForm = topicForms[topic.id] || {
        label: topic.label,
        title: topic.title,
        description: topic.description,
        details: topic.details.join("\n"),
      };

      await setDoc(
        doc(db, "internshipTopics", topic.id),
        {
          label: topicForm.label.trim(),
          title: topicForm.title.trim(),
          description: topicForm.description.trim(),
          details: topicForm.details
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
          isHidden: shouldHide,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setTopics((previous) =>
        previous.map((item) =>
          item.id === topic.id
            ? { ...item, isHidden: shouldHide }
            : item
        )
      );

      setMessage(
        shouldHide
          ? `"${topic.title}" is now hidden. You can restore it anytime.`
          : `"${topic.title}" has been restored on the public page.`
      );
    } catch (error) {
      console.error("Could not change topic visibility:", error);
      setMessage(
        "Could not change topic visibility. Check your admin login and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  }

  function renderField(
    label,
    id,
    value,
    onChange,
    options = {}
  ) {
    const {
      multiline = false,
      rows = 3,
      placeholder = "",
      required = false,
      type = "text",
    } = options;

    const Tag = multiline ? "textarea" : "input";

    return (
      <div className="form-group" style={groupStyle}>
        <label
          htmlFor={id}
          style={{
            display: "block",
            marginBottom: "6px",
            color: "#c9c5ff",
            fontSize: "15px",
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          {label}
        </label>

        <Tag
          id={id}
          type={multiline ? undefined : type}
          rows={multiline ? rows : undefined}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          required={required}
          style={{
            ...fieldStyle,
            minHeight: multiline ? `${rows * 30}px` : "48px",
            resize: multiline ? "vertical" : "none",
            fontFamily: "inherit",
          }}
        />
      </div>
    );
  }

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">CAREER MANAGEMENT</p>

        <h1>
          Internship <span>Management</span>
        </h1>

        <p className="section-description">
          Manage internship records and the three topics displayed on the public page.
        </p>

        {message && (
          <p role="status" aria-live="polite">
            {message}
          </p>
        )}
      </section>

      <section className="content-section alternate">
        <p className="eyebrow">PUBLIC PAGE CONTENT</p>

        <h2>
          Manage Internship <span>Topic Details</span>
        </h2>

        <p className="section-description">
          Edit a topic and click Save Topic. Hide a card from the public
          page without deleting its content. Restore it at any time.
        </p>

        <div className="project-admin-list">
          {topics.map((topic) => {
            const topicForm = topicForms[topic.id] || {
              label: topic.label,
              title: topic.title,
              description: topic.description,
              details: topic.details.join("\n"),
            };

            return (
              <article
                className="project-admin-item"
                key={topic.id}
                style={cardStyle}
              >
                <span className="project-label">
                  {topic.isHidden
                    ? "HIDDEN FROM PUBLIC"
                    : topic.label}
                </span>

                <div style={{ marginTop: "22px" }}>
                  {renderField(
                    "Card Label",
                    `${topic.id}-label`,
                    topicForm.label,
                    (event) =>
                      handleTopicChange(
                        topic.id,
                        "label",
                        event.target.value
                      )
                  )}

                  {renderField(
                    "Topic Title",
                    `${topic.id}-title`,
                    topicForm.title,
                    (event) =>
                      handleTopicChange(
                        topic.id,
                        "title",
                        event.target.value
                      )
                  )}

                  {renderField(
                    "Description",
                    `${topic.id}-description`,
                    topicForm.description,
                    (event) =>
                      handleTopicChange(
                        topic.id,
                        "description",
                        event.target.value
                      ),
                    { multiline: true, rows: 4 }
                  )}

                  {renderField(
                    "Detailed Content (Enter each point on a new line)",
                    `${topic.id}-details`,
                    topicForm.details,
                    (event) =>
                      handleTopicChange(
                        topic.id,
                        "details",
                        event.target.value
                      ),
                    { multiline: true, rows: 6 }
                  )}
                </div>

                <div
                  className="hero-actions"
                  style={actionStyle}
                >
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={saving}
                    onClick={() => saveTopic(topic.id)}
                  >
                    {saving ? "Saving..." : "Save Topic"}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={saving}
                    onClick={() => toggleTopicVisibility(topic)}
                  >
                    {topic.isHidden
                      ? "Restore Topic"
                      : "Hide Topic"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-section">
        <p className="eyebrow">INTERNSHIP RECORDS</p>

        <h2>
          {editingId ? "Edit" : "Add New"} <span>Internship</span>
        </h2>

        <form
          className="admin-form"
          onSubmit={handleInternshipSubmit}
        >
          {renderField(
            "Title *",
            "internship-title",
            form.title,
            (event) =>
              handleInternshipChange({
                target: {
                  name: "title",
                  value: event.target.value,
                },
              }),
            { required: true }
          )}

          {renderField(
            "Organization",
            "internship-organization",
            form.organization,
            (event) =>
              handleInternshipChange({
                target: {
                  name: "organization",
                  value: event.target.value,
                },
              })
          )}

          {renderField(
            "Description",
            "internship-description",
            form.description,
            (event) =>
              handleInternshipChange({
                target: {
                  name: "description",
                  value: event.target.value,
                },
              }),
            { multiline: true, rows: 4 }
          )}

          {[
            ["Type", "type", ""],
            ["Status", "status", ""],
            ["Mode", "mode", "Remote, On-site, Hybrid..."],
            ["Start Date", "startDate", "e.g. October 2026"],
            ["End Date", "endDate", "e.g. December 2026"],
            ["Opportunity Link", "link", "https://..."],
            ["Skills (comma-separated)", "skills", "Python, SQL, Excel"],
          ].map(([label, name, placeholder]) =>
            renderField(
              label,
              `internship-${name}`,
              form[name],
              (event) =>
                setForm((previous) => ({
                  ...previous,
                  [name]: event.target.value,
                })),
              {
                placeholder,
                type: name === "link" ? "url" : "text",
              }
            )
          )}

          <div
            className="hero-actions"
            style={actionStyle}
          >
            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Internship"
                  : "Add Internship"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetInternshipForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="content-section alternate">
        <p className="eyebrow">SAVED RECORDS</p>

        <h2>
          Saved <span>Internships ({internships.length})</span>
        </h2>

        {loading ? (
          <p>Loading internship records...</p>
        ) : internships.length === 0 ? (
          <p>No internships have been added yet.</p>
        ) : (
          <div className="project-admin-list">
            {internships.map((item) => (
              <article
                className="project-admin-item"
                key={item.id}
                style={cardStyle}
              >
                <span className="project-label">
                  {item.status || "Opportunity"}
                </span>

                <h3>{item.title}</h3>

                {item.organization && (
                  <p>{item.organization}</p>
                )}

                <p>{item.type || "Internship"}</p>
                <p>{item.description}</p>

                <div
                  className="hero-actions"
                  style={actionStyle}
                >
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => startEditingInternship(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => deleteInternship(item.id)}
                  >
                    Delete Internship
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default InternshipManager;


import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../config/firebase.js";
import CertificateManager from "./CertificateManager.jsx";
import ResumeManager from "./ResumeManager.jsx";
import PhotoManager from "./PhotoManager.jsx";
import InternshipManager from "./InternshipManager.jsx";
import ExperienceManager from "./ExperienceManager.jsx";
import EducationManager from "./EducationManager.jsx";
import SkillsManager from "./SkillsManager.jsx";
import AboutManager from "./AboutManager.jsx";
import AboutPageManager from "./AboutPageManager.jsx";
import SocialLinksManager from "./SocialLinksManager.jsx";

const API_BASE_URL = "http://127.0.0.1:8001";

const sections = [
  "Overview",
  "About & Skills",
  "About Page",
  "Projects",
  "Social Links",
  "Internships",
  "Experience",
  "Education",
  "Certificates",
  "Photo & Resume",
  "Contact Information",
  "Contact Messages",
];

const emptyProject = {
  title: "",
  description: "",
  technologies: "",
  github: "",
  liveDemo: "",
};

const emptyContactInfo = {
  email: "",
  phone: "",
};

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [projects, setProjects] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  const [form, setForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [contactInfo, setContactInfo] = useState(emptyContactInfo);
  const [contactInfoLoading, setContactInfoLoading] = useState(false);
  const [contactInfoSaving, setContactInfoSaving] = useState(false);

  const [replyDrafts, setReplyDrafts] = useState({});
  const [repliesByMessage, setRepliesByMessage] = useState({});
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [historyLoadingId, setHistoryLoadingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        setProjects(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error loading projects:", error);
        setMessage(
          "Could not load projects. Check Firestore security rules."
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeSection !== "Contact Information") return;

    let cancelled = false;
    setContactInfoLoading(true);
    setMessage("");

    async function loadContactInfo() {
      try {
        const snapshot = await getDoc(
          doc(db, "siteSettings", "contact")
        );

        if (!cancelled) {
          setContactInfo(
            snapshot.exists()
              ? {
                  email: snapshot.data().email || "",
                  phone: snapshot.data().phone || "",
                }
              : emptyContactInfo
          );
        }
      } catch (error) {
        console.error("Error loading contact information:", error);
        if (!cancelled) {
          setMessage(
            "Could not load contact information. Check Firestore rules."
          );
        }
      } finally {
        if (!cancelled) setContactInfoLoading(false);
      }
    }

    loadContactInfo();

    return () => {
      cancelled = true;
    };
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "Contact Messages") return;

    setMessagesLoading(true);
    setMessage("");

    const messagesQuery = query(
      collection(db, "contactMessages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setContactMessages(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        setMessagesLoading(false);
      },
      (error) => {
        console.error("Error loading contact messages:", error);
        setMessage(
          "Could not load messages. Check admin login and Firestore rules."
        );
        setMessagesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeSection]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleContactInfoChange(event) {
    const { name, value } = event.target;

    setContactInfo((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveContactInfo(event) {
    event.preventDefault();

    if (contactInfoSaving) return;

    const email = contactInfo.email.trim();
    const phone = contactInfo.phone.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && (!emailPattern.test(email) || email.length > 254)) {
      setMessage("Please enter an email address in a valid format.");
      return;
    }

    if (phone.length > 30) {
      setMessage("Phone number must be 30 characters or fewer.");
      return;
    }

    setContactInfoSaving(true);
    setMessage("");

    try {
      await setDoc(doc(db, "siteSettings", "contact"), {
        email,
        phone,
      });

      setContactInfo({ email, phone });
      setMessage("Contact information saved successfully.");
    } catch (error) {
      console.error("Error saving contact information:", error);
      setMessage(
        "Could not save contact information. Check Firestore security rules."
      );
    } finally {
      setContactInfoSaving(false);
    }
  }

  async function saveProject(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setMessage("");

    const project = {
      title: form.title.trim(),
      description: form.description.trim(),
      technologies: form.technologies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      github: form.github.trim(),
      liveDemo: form.liveDemo.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId === null) {
        await addDoc(collection(db, "projects"), {
          ...project,
          isHidden: false,
          createdAt: new Date().toISOString(),
        });

        setMessage("Project added successfully.");
      } else {
        await updateDoc(doc(db, "projects", editingId), project);
        setMessage("Project updated successfully.");
      }

      setForm(emptyProject);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving project:", error);
      setMessage(
        "Could not save project. Check Firestore security rules."
      );
    } finally {
      setSaving(false);
    }
  }

  function editProject(project) {
    setForm({
      title: project.title || "",
      description: project.description || "",
      technologies: Array.isArray(project.technologies)
        ? project.technologies.join(", ")
        : "",
      github: project.github || "",
      liveDemo: project.liveDemo || "",
    });

    setEditingId(project.id);
    setMessage("");
    setActiveSection("Projects");
  }

  async function toggleProjectVisibility(project) {
    setMessage("");

    try {
      await updateDoc(doc(db, "projects", project.id), {
        isHidden: project.isHidden !== true,
        updatedAt: new Date().toISOString(),
      });

      setMessage(
        project.isHidden === true
          ? "Project restored successfully."
          : "Project hidden successfully."
      );
    } catch (error) {
      console.error("Error updating project visibility:", error);
      setMessage(
        "Could not update project visibility. Check Firestore security rules."
      );
    }
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;

    setMessage("");

    try {
      await deleteDoc(doc(db, "projects", project.id));
      setMessage("Project deleted successfully.");

      if (editingId === project.id) {
        setForm(emptyProject);
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      setMessage(
        "Could not delete project. Check Firestore security rules."
      );
    }
  }

  function cancelEdit() {
    setForm(emptyProject);
    setEditingId(null);
    setMessage("");
  }

  async function toggleMessageStatus(item) {
    setMessage("");

    try {
      await updateDoc(doc(db, "contactMessages", item.id), {
        status: item.status === "read" ? "unread" : "read",
      });
    } catch (error) {
      console.error("Error updating message status:", error);
      setMessage("Could not update message status.");
    }
  }

  async function deleteContactMessage(item) {
    if (!window.confirm(`Delete the message from "${item.name}"?`)) {
      return;
    }

    setMessage("");

    try {
      await deleteDoc(doc(db, "contactMessages", item.id));
      setMessage("Message deleted successfully.");

      setRepliesByMessage((previous) => {
        const updated = { ...previous };
        delete updated[item.id];
        return updated;
      });

      if (expandedMessageId === item.id) {
        setExpandedMessageId(null);
      }
    } catch (error) {
      console.error("Error deleting contact message:", error);
      setMessage("Could not delete this message.");
    }
  }

  async function loadReplyHistory(messageId) {
    setHistoryLoadingId(messageId);

    try {
      const repliesQuery = query(
        collection(db, "contactMessages", messageId, "replies"),
        orderBy("sentAt", "asc")
      );

      const snapshot = await getDocs(repliesQuery);

      setRepliesByMessage((previous) => ({
        ...previous,
        [messageId]: snapshot.docs.map((replyDoc) => ({
          id: replyDoc.id,
          ...replyDoc.data(),
        })),
      }));
    } catch (error) {
      console.error("Error loading reply history:", error);
      setMessage(
        "Could not load reply history. Check admin login and Firestore rules."
      );
    } finally {
      setHistoryLoadingId(null);
    }
  }

  async function toggleReplyPanel(item) {
    if (expandedMessageId === item.id) {
      setExpandedMessageId(null);
      return;
    }

    setExpandedMessageId(item.id);
    setMessage("");
    await loadReplyHistory(item.id);
  }

  async function sendContactReply(item) {
    const replyText = (replyDrafts[item.id] || "").trim();

    if (!replyText) {
      setMessage("Please write a reply first.");
      return;
    }

    if (replyText.length > 5000) {
      setMessage("Reply must be 5000 characters or fewer.");
      return;
    }

    if (replyingId !== null) return;

    setReplyingId(item.id);
    setMessage("");

    try {
      if (!auth.currentUser) {
        throw new Error("Please log in as admin again.");
      }

      const token = await getIdToken(auth.currentUser);

      const response = await fetch(
        `${API_BASE_URL}/api/contact-messages/${encodeURIComponent(item.id)}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reply: replyText }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.detail || "Could not send the reply.");
      }

      setReplyDrafts((previous) => ({
        ...previous,
        [item.id]: "",
      }));

      setMessage(
        `Reply email sent successfully to ${result.recipient || item.email}.`
      );

      await loadReplyHistory(item.id);
    } catch (error) {
      console.error("Error sending contact reply:", error);
      setMessage(error.message || "Could not send the reply.");
    } finally {
      setReplyingId(null);
    }
  }

  const unreadCount = contactMessages.filter(
    (item) => item.status !== "read"
  ).length;

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <h2>My Portfolio</h2>
        <p>ADMIN DASHBOARD</p>

        <nav>
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              className={activeSection === section ? "active" : ""}
              onClick={() => {
                setActiveSection(section);
                setMessage("");
              }}
            >
              {section}
              {section === "Contact Messages" && unreadCount > 0
                ? ` (${unreadCount})`
                : ""}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p>PORTFOLIO MANAGEMENT</p>
            <h1>{activeSection}</h1>
          </div>
          <span>Admin</span>
        </header>

        {activeSection === "Overview" && (
          <section className="admin-welcome">
            <h2>Welcome to Your Dashboard</h2>
            <p>Manage your portfolio content from one place.</p>
            <p>Choose a section from the sidebar to get started.</p>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setActiveSection("Projects")}
            >
              Manage Projects
            </button>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setActiveSection("Internships")}
            >
              Manage Internships
            </button>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setActiveSection("Social Links")}
            >
              Manage Social Links
            </button>

            <button
              className="primary-btn"
              type="button"
              onClick={() => setActiveSection("Contact Messages")}
            >
              View Contact Messages
              {unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
            </button>
          </section>
        )}

        {activeSection === "About & Skills" && (
          <>
            <AboutManager />
            <SkillsManager />
          </>
        )}

        {activeSection === "About Page" && <AboutPageManager />}

        {activeSection === "Social Links" && <SocialLinksManager />}

        {activeSection === "Projects" && (
          <section className="admin-welcome">
            <h2>
              {editingId === null ? "Add New Project" : "Edit Project"}
            </h2>

            <p>Fill in the project details and click Save Project.</p>

            <form className="project-admin-form" onSubmit={saveProject}>
              <label>
                Project Name *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. TutorMap"
                  required
                />
              </label>

              <label>
                Project Description *
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what your project does"
                  rows={4}
                  required
                />
              </label>

              <label>
                Technologies (comma-separated) *
                <input
                  name="technologies"
                  value={form.technologies}
                  onChange={handleChange}
                  placeholder="React, Python, Firebase"
                  required
                />
              </label>

              <label>
                GitHub URL
                <input
                  name="github"
                  type="url"
                  value={form.github}
                  onChange={handleChange}
                  placeholder="https://github.com/..."
                />
              </label>

              <label>
                Live Demo URL
                <input
                  name="liveDemo"
                  type="url"
                  value={form.liveDemo}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>

              <div className="project-admin-actions">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId === null
                      ? "Save Project"
                      : "Update Project"}
                </button>

                {editingId !== null && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {message && <p role="status">{message}</p>}

            <h2 className="project-admin-list-title">
              Your Projects ({projects.length})
            </h2>

            {loading ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <p>No projects have been added yet.</p>
            ) : (
              <div className="project-admin-list">
                {projects.map((project) => (
                  <article className="project-admin-item" key={project.id}>
                    <h3>{project.title}</h3>

                    {project.isHidden === true && (
                      <p>
                        <strong>Hidden from public website</strong>
                      </p>
                    )}

                    <p>{project.description}</p>

                    <p>
                      <strong>Technologies:</strong>{" "}
                      {Array.isArray(project.technologies)
                        ? project.technologies.join(", ")
                        : ""}
                    </p>

                    <div className="project-admin-links">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub
                        </a>
                      )}

                      {project.liveDemo && (
                        <a
                          href={project.liveDemo}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Live Demo
                        </a>
                      )}
                    </div>

                    <div className="project-admin-actions">
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => editProject(project)}
                      >
                        Edit
                      </button>

                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => deleteProject(project)}
                      >
                        Delete
                      </button>

                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => toggleProjectVisibility(project)}
                      >
                        {project.isHidden === true ? "Restore" : "Hide"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "Internships" && <InternshipManager />}
        {activeSection === "Experience" && <ExperienceManager />}
        {activeSection === "Education" && <EducationManager />}
        {activeSection === "Certificates" && <CertificateManager />}

        {activeSection === "Photo & Resume" && (
          <>
            <PhotoManager />
            <ResumeManager />
          </>
        )}

        {activeSection === "Contact Information" && (
          <section className="admin-welcome">
            <h2>Public Contact Information</h2>
            <p>
              These details will appear on the public Contact page.
            </p>

            {contactInfoLoading ? (
              <p>Loading contact information...</p>
            ) : (
              <form
                className="project-admin-form"
                onSubmit={saveContactInfo}
              >
                <label>
                  Public Email Address
                  <input
                    name="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={handleContactInfoChange}
                    placeholder="you@example.com"
                    maxLength={254}
                    autoComplete="email"
                  />
                </label>

                <label>
                  Public Phone Number
                  <input
                    name="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleContactInfoChange}
                    placeholder="Enter your contact number"
                    maxLength={30}
                    autoComplete="tel"
                  />
                </label>

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={contactInfoSaving}
                >
                  {contactInfoSaving
                    ? "Saving..."
                    : "Save Contact Information"}
                </button>
              </form>
            )}

            {message && <p role="status">{message}</p>}
          </section>
        )}

        {activeSection === "Contact Messages" && (
          <section className="admin-welcome">
            <h2>Contact Messages ({contactMessages.length})</h2>

            <p>
              Unread messages: <strong>{unreadCount}</strong>
            </p>

            {message && <p role="status">{message}</p>}

            {messagesLoading ? (
              <p>Loading messages...</p>
            ) : contactMessages.length === 0 ? (
              <p>No contact messages found.</p>
            ) : (
              <div className="project-admin-list">
                {contactMessages.map((item) => (
                  <article className="project-admin-item" key={item.id}>
                    <h3>{item.subject || "(No subject)"}</h3>

                    <p>
                      <strong>From:</strong> {item.name}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${item.email}`}>{item.email}</a>
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {item.status === "read" ? "Read" : "Unread"}
                    </p>

                    <p>
                      <strong>Received:</strong>{" "}
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleString()
                        : "Date unavailable"}
                    </p>

                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {item.message}
                    </p>

                    <div className="project-admin-actions">
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => toggleMessageStatus(item)}
                      >
                        {item.status === "read"
                          ? "Mark Unread"
                          : "Mark Read"}
                      </button>

                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => toggleReplyPanel(item)}
                      >
                        {expandedMessageId === item.id
                          ? "Close Reply"
                          : "Reply / View History"}
                      </button>

                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => deleteContactMessage(item)}
                      >
                        Delete
                      </button>
                    </div>

                    {expandedMessageId === item.id && (
                      <div className="contact-reply-section">
                        <h3>Reply History</h3>

                        {historyLoadingId === item.id ? (
                          <p>Loading reply history...</p>
                        ) : (repliesByMessage[item.id] || []).length === 0 ? (
                          <p>No replies sent yet.</p>
                        ) : (
                          (repliesByMessage[item.id] || []).map((reply) => (
                            <article
                              className="project-admin-item"
                              key={reply.id}
                            >
                              <p style={{ whiteSpace: "pre-wrap" }}>
                                {reply.reply}
                              </p>

                              <small>
                                {reply.sentAt?.toDate
                                  ? reply.sentAt.toDate().toLocaleString()
                                  : "Date unavailable"}
                              </small>

                              <p>
                                <strong>Status:</strong>{" "}
                                {reply.status || "sent"}
                              </p>
                            </article>
                          ))
                        )}

                        <label htmlFor={`reply-${item.id}`}>
                          Write your reply
                        </label>

                        <textarea
                          id={`reply-${item.id}`}
                          value={replyDrafts[item.id] || ""}
                          onChange={(event) =>
                            setReplyDrafts((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Write a reply to this visitor..."
                          rows={4}
                          maxLength={5000}
                        />

                        <button
                          className="primary-btn"
                          type="button"
                          disabled={
                            replyingId !== null ||
                            !(replyDrafts[item.id] || "").trim()
                          }
                          onClick={() => sendContactReply(item)}
                        >
                          {replyingId === item.id
                            ? "Sending..."
                            : "Send Reply"}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

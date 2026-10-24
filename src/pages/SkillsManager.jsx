
import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import "./SkillsManager.css";

const SKILL_DETAILS = {
  python: { icon: "🐍", category: "Programming" },
  javascript: { icon: "🟨", category: "Programming" },
  typescript: { icon: "🔷", category: "Programming" },
  java: { icon: "☕", category: "Programming" },
  "c++": { icon: "💻", category: "Programming" },
  "c#": { icon: "💻", category: "Programming" },

  "web development": { icon: "🌐", category: "Web Development" },
  html: { icon: "🌐", category: "Web Development" },
  css: { icon: "🎨", category: "Web Development" },
  "responsive design": { icon: "📱", category: "Web Development" },
  "web accessibility": { icon: "♿", category: "Web Development" },

  react: { icon: "⚛️", category: "Frontend Development" },
  "react.js": { icon: "⚛️", category: "Frontend Development" },
  "next.js": { icon: "▲", category: "Frontend Development" },
  bootstrap: { icon: "🅱️", category: "Frontend Development" },
  tailwind: { icon: "🌬️", category: "Frontend Development" },
  "tailwind css": { icon: "🌬️", category: "Frontend Development" },
  vite: { icon: "⚡", category: "Frontend Development" },

  node: { icon: "🟢", category: "Backend Development" },
  "node.js": { icon: "🟢", category: "Backend Development" },
  express: { icon: "🚂", category: "Backend Development" },
  "express.js": { icon: "🚂", category: "Backend Development" },
  flask: { icon: "🌶️", category: "Backend Development" },
  django: { icon: "🎸", category: "Backend Development" },
  api: { icon: "🔌", category: "Backend Development" },
  "rest api": { icon: "🔌", category: "Backend Development" },

  sql: { icon: "🗄️", category: "Database" },
  mysql: { icon: "🗄️", category: "Database" },
  postgresql: { icon: "🐘", category: "Database" },
  mongodb: { icon: "🍃", category: "Database" },
  firebase: { icon: "🔥", category: "Database & Backend Services" },
  firestore: { icon: "🔥", category: "Database" },

  "data analysis": { icon: "📊", category: "Data Analytics" },
  "data analytics": { icon: "📊", category: "Data Analytics" },
  "data cleaning": { icon: "🧹", category: "Data Preparation" },
  "data visualization": { icon: "📈", category: "Data Visualization" },
  excel: { icon: "📗", category: "Data Analysis" },
  "microsoft excel": { icon: "📗", category: "Data Analysis" },
  "power bi": { icon: "📊", category: "Data Visualization" },
  tableau: { icon: "📈", category: "Data Visualization" },
  pandas: { icon: "🐼", category: "Data Analysis" },
  numpy: { icon: "🔢", category: "Data Analysis" },
  matplotlib: { icon: "📉", category: "Data Visualization" },
  seaborn: { icon: "🎨", category: "Data Visualization" },
  statistics: { icon: "📐", category: "Mathematics & Statistics" },
  probability: { icon: "🎲", category: "Mathematics & Statistics" },
  "exploratory data analysis": {
    icon: "🔍",
    category: "Data Analytics",
  },
  eda: { icon: "🔍", category: "Data Analytics" },

  "data science": { icon: "🔬", category: "Data Science" },
  "machine learning": { icon: "🤖", category: "Machine Learning" },
  "deep learning": { icon: "🧠", category: "Deep Learning" },
  "artificial intelligence": {
    icon: "🤖",
    category: "Artificial Intelligence",
  },
  "scikit-learn": { icon: "🤖", category: "Machine Learning" },
  tensorflow: { icon: "🧠", category: "Deep Learning" },
  pytorch: { icon: "🔥", category: "Deep Learning" },
  "feature engineering": { icon: "⚙️", category: "Machine Learning" },
  "jupyter notebook": { icon: "📓", category: "Development Tools" },
  "big data": { icon: "🗃️", category: "Data Engineering" },
  etl: { icon: "🔄", category: "Data Engineering" },

  git: { icon: "🔀", category: "Version Control" },
  github: { icon: "🐙", category: "Version Control" },
  vscode: { icon: "💻", category: "Development Tools" },
  "vs code": { icon: "💻", category: "Development Tools" },

  communication: { icon: "💬", category: "Professional Skills" },
  teamwork: { icon: "🤝", category: "Professional Skills" },
  leadership: { icon: "🌟", category: "Professional Skills" },
  "problem solving": { icon: "🧩", category: "Professional Skills" },
  creativity: { icon: "💡", category: "Professional Skills" },
  adaptability: { icon: "🔄", category: "Professional Skills" },
};

const EMPTY_FORM = {
  name: "",
  type: "Technical",
  category: "",
  icon: "",
  percentage: 50,
  description: "",
};

function getSkillDetails(name) {
  const key = String(name || "").trim().toLowerCase();

  return SKILL_DETAILS[key] || {
    icon: "✦",
    category: "",
  };
}

export default function SkillsManager() {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "skills"),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        records.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

        setSkills(records);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Skills loading error:", err);
        setError(
          "Unable to load skills. Check your Firestore connection and security rules."
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => {
      if (name === "name") {
        const details = getSkillDetails(value);
        const previousDetails = getSkillDetails(previous.name);

        const iconWasAutomatic =
          !previous.icon ||
          previous.icon === previousDetails.icon;

        const categoryWasAutomatic =
          !previous.category ||
          previous.category === previousDetails.category;

        return {
          ...previous,
          name: value,
          icon: iconWasAutomatic ? details.icon : previous.icon,
          category: categoryWasAutomatic
            ? details.category
            : previous.category,
        };
      }

      return {
        ...previous,
        [name]: value,
      };
    });

    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const category = form.category.trim();
    const icon = form.icon.trim();
    const percentage = Number(form.percentage);

    if (!name) {
      setError("Please enter a skill name.");
      return;
    }

    if (!category) {
      setError("Please enter a category.");
      return;
    }

    if (!icon) {
      setError("Please enter an icon or emoji.");
      return;
    }

    if (
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      setError("Percentage must be between 0 and 100.");
      return;
    }

    const duplicate = skills.some(
      (skill) =>
        (skill.name || "").trim().toLowerCase() ===
          name.toLowerCase() &&
        skill.id !== editingId
    );

    if (duplicate) {
      setError("This skill already exists.");
      return;
    }

    const payload = {
      name,
      type: form.type,
      category,
      icon,
      percentage,
      description: form.description.trim(),
      updatedAt: serverTimestamp(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "skills", editingId), payload);
        setSuccess("Skill updated successfully.");
      } else {
        await addDoc(collection(db, "skills"), {
          ...payload,
          isHidden: false,
          createdAt: serverTimestamp(),
        });
        setSuccess("Skill added successfully.");
      }

      setForm({ ...EMPTY_FORM });
      setEditingId(null);
    } catch (err) {
      console.error("Skill save error:", err);
      setError(
        "Unable to save the skill. Check your admin login and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(skill) {
    setEditingId(skill.id);

    setForm({
      name: skill.name || "",
      type: skill.type || "Technical",
      category: skill.category || "",
      icon: skill.icon || "✦",
      percentage: skill.percentage ?? 50,
      description: skill.description || "",
    });

    setError("");
    setSuccess("");

    document
      .getElementById("skills-manager-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  async function handleToggleVisibility(skill) {
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "skills", skill.id), {
        isHidden: !skill.isHidden,
        updatedAt: serverTimestamp(),
      });

      setSuccess(
        skill.isHidden
          ? "Skill is now visible on the public page."
          : "Skill is now hidden from the public page."
      );
    } catch (err) {
      console.error("Skill visibility error:", err);
      setError("Unable to change skill visibility.");
    }
  }

  async function handleDelete(skill) {
    const confirmed = window.confirm(
      `Permanently delete "${skill.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteDoc(doc(db, "skills", skill.id));

      if (editingId === skill.id) {
        setForm({ ...EMPTY_FORM });
        setEditingId(null);
      }

      setSuccess("Skill deleted successfully.");
    } catch (err) {
      console.error("Skill delete error:", err);
      setError("Unable to delete the skill.");
    }
  }

  const technicalSkills = skills.filter(
    (skill) => skill.type === "Technical"
  );

  const professionalSkills = skills.filter(
    (skill) => skill.type === "Professional"
  );

  function renderSkillList(title, list) {
    return (
      <section className="skills-manager-list" key={title}>
        <h3>
          {title} ({list.length})
        </h3>

        {list.length === 0 ? (
          <p>No skills have been added yet.</p>
        ) : (
          <div className="skills-manager-records">
            {list.map((skill) => (
              <article
                className="skills-manager-record"
                key={skill.id}
              >
                <div className="skills-manager-record-info">
                  <span className="skills-manager-icon">
                    {skill.icon || "✦"}
                  </span>

                  <div className="skills-manager-record-text">
                    <h4>{skill.name}</h4>
                    <p>{skill.category || "No category"}</p>
                    <small>
                      {skill.percentage ?? 0}% ·{" "}
                      {skill.isHidden ? "Hidden" : "Visible"}
                    </small>

                    {skill.description && (
                      <p>{skill.description}</p>
                    )}
                  </div>
                </div>

                <div className="skills-manager-actions">
                  <button
                    className="skill-btn secondary"
                    type="button"
                    onClick={() => handleEdit(skill)}
                  >
                    Edit
                  </button>

                  <button
                    className="skill-btn secondary"
                    type="button"
                    onClick={() => handleToggleVisibility(skill)}
                  >
                    {skill.isHidden ? "Show" : "Hide"}
                  </button>

                  <button
                    className="skill-btn danger"
                    type="button"
                    onClick={() => handleDelete(skill)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="skills-manager">
      <div className="skills-manager-header">
        <div>
          <p className="skills-manager-eyebrow">
            PORTFOLIO ADMINISTRATION
          </p>
          <h2>Manage Skills</h2>
          <p>
            Add and manage your technical and professional skills.
            Recognized skill names automatically fill in their icon
            and category. You can edit both manually.
          </p>
        </div>
      </div>

      {error && (
        <p className="skills-manager-message error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="skills-manager-message success" role="status">
          {success}
        </p>
      )}

      <form
        id="skills-manager-form"
        className="skills-manager-form"
        onSubmit={handleSubmit}
      >
        <h3>
          {editingId ? "Edit Skill" : "Add New Skill"}
        </h3>

        <div className="skills-manager-grid">
          <label>
            Skill Type
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="Technical">Technical Skill</option>
              <option value="Professional">
                Professional Skill
              </option>
            </select>
          </label>

          <label>
            Skill Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Python, React, Data Science"
              required
            />
          </label>

          <label>
            Category
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Automatic or enter manually"
              required
            />
          </label>

          <label>
            Icon or Emoji
            <input
              name="icon"
              value={form.icon}
              onChange={handleChange}
              placeholder="Automatic or enter manually"
              required
            />
          </label>

          <label>
            Percentage (0–100)
            <input
              name="percentage"
              type="number"
              min="0"
              max="100"
              value={form.percentage}
              onChange={handleChange}
              required
            />
          </label>

          <label className="skills-manager-full-width">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Write a short description about this skill"
              rows="3"
            />
          </label>
        </div>

        <div className="skills-manager-actions">
          <button
            className="skill-btn primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Skill"
                : "Add Skill"}
          </button>

          {editingId && (
            <button
              className="skill-btn secondary"
              type="button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Loading skills...</p>
      ) : (
        <>
          {renderSkillList("Technical Skills", technicalSkills)}
          {renderSkillList(
            "Professional Skills",
            professionalSkills
          )}
        </>
      )}
    </div>
  );
}


import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDocFromServer,
} from "firebase/firestore";
import { db } from "../config/firebase.js";
import "./AboutManager.css";

const DEFAULT_CONTENT = {
  aboutHeading: "About Me",
  aboutText:
    "I am building my foundation in programming, data analysis and problem-solving. My goal is to learn through practical projects, explore data-driven questions and keep improving my technical skills.",
  hireHeading: "A learner focused on practical growth",
  hireText:
    "I focus on continuous learning, logical thinking and developing practical skills through projects. I aim to contribute with honesty, curiosity and a willingness to improve.",
  hirePoints: [
    "Committed to continuous learning",
    "Interested in data analysis and Python",
    "Focused on practical projects and problem-solving",
  ],
};

export default function AboutManager() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newPoint, setNewPoint] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "siteContent", "about"),
      (snapshot) => {
        if (snapshot.exists()) {
          const saved = snapshot.data();

          setContent({
            ...DEFAULT_CONTENT,
            ...saved,
            hirePoints: Array.isArray(saved.hirePoints)
              ? saved.hirePoints
              : DEFAULT_CONTENT.hirePoints,
          });
        } else {
          setContent(DEFAULT_CONTENT);
        }

        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("About content load error:", err);
        setError(
          "Unable to load content. Check your admin login and Firestore rules."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function updateField(field, value) {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
  }

  async function saveContent() {
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const aboutRef = doc(db, "siteContent", "about");

      const dataToSave = {
        aboutHeading: content.aboutHeading.trim(),
        aboutText: content.aboutText.trim(),
        hireHeading: content.hireHeading.trim(),
        hireText: content.hireText.trim(),
        hirePoints: content.hirePoints
          .map((point) => point.trim())
          .filter(Boolean),
        updatedAt: serverTimestamp(),
      };

      await setDoc(aboutRef, dataToSave, { merge: true });

      // Verify the saved content directly from the Firestore server.
      const savedSnapshot = await getDocFromServer(aboutRef);

      if (!savedSnapshot.exists()) {
        throw new Error(
          "The document could not be found on the server after saving."
        );
      }

      const savedData = savedSnapshot.data();

      const matches =
        savedData.aboutHeading === dataToSave.aboutHeading &&
        savedData.aboutText === dataToSave.aboutText &&
        savedData.hireHeading === dataToSave.hireHeading &&
        savedData.hireText === dataToSave.hireText &&
        JSON.stringify(savedData.hirePoints) ===
          JSON.stringify(dataToSave.hirePoints);

      if (!matches) {
        throw new Error(
          "The server returned different content after saving. Another app or browser may be overwriting this document."
        );
      }

      setContent({
        ...DEFAULT_CONTENT,
        ...savedData,
        hirePoints: Array.isArray(savedData.hirePoints)
          ? savedData.hirePoints
          : DEFAULT_CONTENT.hirePoints,
      });

      setSuccess("Saved and verified on the server.");
    } catch (err) {
      console.error("About content save error:", err);

      setError(
        err?.message
          ? `Save verification failed: ${err.message}`
          : "Unable to save changes. Check your admin login and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  }

  function addPoint() {
    const value = newPoint.trim();

    if (!value) {
      setError("Please enter a point before adding it.");
      return;
    }

    if (value.length > 300) {
      setError("Each point must be 300 characters or fewer.");
      return;
    }

    updateField("hirePoints", [...content.hirePoints, value]);
    setNewPoint("");
    setError("");
  }

  function startEditing(index) {
    setEditingIndex(index);
    setEditingText(content.hirePoints[index]);
    setError("");
  }

  function saveEditedPoint() {
    const value = editingText.trim();

    if (!value) {
      setError("A point cannot be empty.");
      return;
    }

    const updatedPoints = [...content.hirePoints];
    updatedPoints[editingIndex] = value;

    updateField("hirePoints", updatedPoints);
    setEditingIndex(null);
    setEditingText("");
    setError("");
  }

  function deletePoint(index) {
    if (
      !window.confirm(
        "Are you sure you want to delete this point?"
      )
    ) {
      return;
    }

    updateField(
      "hirePoints",
      content.hirePoints.filter((_, i) => i !== index)
    );

    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingText("");
    }

    setError("");
  }

  if (loading) {
    return (
      <div className="about-manager about-manager-status">
        <p>Loading your content...</p>
      </div>
    );
  }

  return (
    <div className="about-manager">
      <div className="about-manager-header">
        <div>
          <span className="about-manager-eyebrow">
            WEBSITE CONTENT
          </span>

          <h2>About Page Manager</h2>

          <p>
            Update the content displayed on your public portfolio.
          </p>
        </div>

        <div
          className="about-manager-icon"
          aria-hidden="true"
        >
          ✦
        </div>
      </div>

      {error && (
        <div
          className="about-manager-alert error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="about-manager-alert success"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="about-manager-card">
        <div className="about-manager-card-heading">
          <span className="about-manager-number">01</span>

          <div>
            <h3>About Me</h3>
            <p>
              Introduce yourself to recruiters and visitors.
            </p>
          </div>
        </div>

        <div className="about-manager-fields">
          <div className="about-manager-field">
            <label htmlFor="aboutHeading">
              Section Heading
            </label>

            <input
              id="aboutHeading"
              value={content.aboutHeading}
              onChange={(e) =>
                updateField("aboutHeading", e.target.value)
              }
              maxLength={100}
              placeholder="About Me"
            />
          </div>

          <div className="about-manager-field">
            <label htmlFor="aboutText">
              About Description
            </label>

            <textarea
              id="aboutText"
              value={content.aboutText}
              onChange={(e) =>
                updateField("aboutText", e.target.value)
              }
              rows={6}
              maxLength={5000}
              placeholder="Write your introduction..."
            />

            <span className="about-manager-hint">
              {content.aboutText.length}/5000 characters
            </span>
          </div>
        </div>
      </section>

      <section className="about-manager-card">
        <div className="about-manager-card-heading">
          <span className="about-manager-number">02</span>

          <div>
            <h3>Why Should You Hire Me?</h3>
            <p>
              Explain your strengths, interests and professional
              goals honestly.
            </p>
          </div>
        </div>

        <div className="about-manager-fields">
          <div className="about-manager-field">
            <label htmlFor="hireHeading">
              Main Heading
            </label>

            <input
              id="hireHeading"
              value={content.hireHeading}
              onChange={(e) =>
                updateField("hireHeading", e.target.value)
              }
              maxLength={150}
              placeholder="Your main heading"
            />
          </div>

          <div className="about-manager-field">
            <label htmlFor="hireText">
              Description
            </label>

            <textarea
              id="hireText"
              value={content.hireText}
              onChange={(e) =>
                updateField("hireText", e.target.value)
              }
              rows={5}
              maxLength={5000}
              placeholder="Describe the value you can bring..."
            />

            <span className="about-manager-hint">
              {content.hireText.length}/5000 characters
            </span>
          </div>
        </div>

        <div className="about-manager-points-heading">
          <div>
            <h4>Key Points</h4>
            <p>
              Add the strengths you want visitors to see.
            </p>
          </div>

          <span className="about-manager-count">
            {content.hirePoints.length} points
          </span>
        </div>

        <div className="about-manager-points">
          {content.hirePoints.map((point, index) => (
            <div
              className="about-manager-point"
              key={index}
            >
              <span className="about-manager-point-marker">
                {String(index + 1).padStart(2, "0")}
              </span>

              {editingIndex === index ? (
                <div className="about-manager-edit-area">
                  <input
                    aria-label={`Edit point ${index + 1}`}
                    value={editingText}
                    onChange={(e) =>
                      setEditingText(e.target.value)
                    }
                    maxLength={300}
                    autoFocus
                  />

                  <div className="about-manager-actions">
                    <button
                      className="about-manager-btn primary"
                      type="button"
                      onClick={saveEditedPoint}
                    >
                      Save Point
                    </button>

                    <button
                      className="about-manager-btn secondary"
                      type="button"
                      onClick={() => {
                        setEditingIndex(null);
                        setEditingText("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{point}</p>

                  <div className="about-manager-actions">
                    <button
                      className="about-manager-btn secondary"
                      type="button"
                      onClick={() => startEditing(index)}
                    >
                      Edit
                    </button>

                    <button
                      className="about-manager-btn danger"
                      type="button"
                      onClick={() => deletePoint(index)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {content.hirePoints.length === 0 && (
            <p className="about-manager-empty">
              No points added yet. Add your first point below.
            </p>
          )}
        </div>

        <div className="about-manager-add-point">
          <label htmlFor="newHirePoint">
            Add a New Point
          </label>

          <div className="about-manager-add-row">
            <input
              id="newHirePoint"
              value={newPoint}
              onChange={(e) => setNewPoint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPoint();
                }
              }}
              placeholder="e.g. Interested in data analytics"
              maxLength={300}
            />

            <button
              className="about-manager-btn primary"
              type="button"
              onClick={addPoint}
            >
              + Add Point
            </button>
          </div>
        </div>
      </section>

      <div className="about-manager-savebar">
        <div>
          <strong>
            Ready to publish your changes?
          </strong>

          <p>
            Save your changes to update the stored content.
          </p>
        </div>

        <button
          className="about-manager-btn save"
          type="button"
          onClick={saveContent}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}

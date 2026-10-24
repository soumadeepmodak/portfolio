import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase.js";

const emptyForm = {
  title: "",
  organization: "",
  type: "Experience",
  startDate: "",
  endDate: "",
  description: "",
};

export default function ExperienceManager() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const recordsQuery = collection(db, "experiences");

    const unsubscribe = onSnapshot(
      recordsQuery,
      (snapshot) => {
        setRecords(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error loading experience records:", error);
        setMessage(
          "Could not load experience records. Check Firestore security rules."
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveExperience(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const record = {
      title: form.title.trim(),
      organization: form.organization.trim(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "experiences", editingId), record);
        setMessage("Experience updated successfully.");
      } else {
        await addDoc(collection(db, "experiences"), {
          ...record,
          isHidden: false,
          createdAt: new Date().toISOString(),
        });
        setMessage("Experience added successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving experience:", error);
      setMessage(
        "Could not save experience. Check Firestore security rules."
      );
    } finally {
      setSaving(false);
    }
  }

  function editExperience(record) {
    setForm({
      title: record.title || "",
      organization: record.organization || "",
      type: record.type || "Experience",
      startDate: record.startDate || "",
      endDate: record.endDate || "",
      description: record.description || "",
    });

    setEditingId(record.id);
    setMessage("");
  }

  async function toggleVisibility(record) {
    setMessage("");

    try {
      await updateDoc(doc(db, "experiences", record.id), {
        isHidden: record.isHidden !== true,
        updatedAt: new Date().toISOString(),
      });

      setMessage(
        record.isHidden === true
          ? "Experience restored successfully."
          : "Experience hidden successfully."
      );
    } catch (error) {
      console.error("Error updating experience visibility:", error);
      setMessage(
        "Could not update visibility. Check Firestore security rules."
      );
    }
  }

  async function deleteExperience(record) {
    if (!window.confirm(`Delete "${record.title}"?`)) {
      return;
    }

    setMessage("");

    try {
      await deleteDoc(doc(db, "experiences", record.id));

      if (editingId === record.id) {
        setForm(emptyForm);
        setEditingId(null);
      }

      setMessage("Experience deleted successfully.");
    } catch (error) {
      console.error("Error deleting experience:", error);
      setMessage(
        "Could not delete experience. Check Firestore security rules."
      );
    }
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  }

  return (
    <section className="admin-welcome">
      <h2>{editingId ? "Edit Experience" : "Add Experience"}</h2>
      <p>
        Manage your practical experience, training and professional journey.
      </p>

      <form className="project-admin-form" onSubmit={saveExperience}>
        <label>
          Title *
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Web Development Intern"
            required
          />
        </label>

        <label>
          Organization
          <input
            name="organization"
            value={form.organization}
            onChange={handleChange}
            placeholder="Company, institution or project"
          />
        </label>

        <label>
          Type *
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            required
          >
            <option value="Experience">Experience</option>
            <option value="Internship">Internship</option>
            <option value="Training">Training</option>
            <option value="Achievement">Achievement</option>
            <option value="Practical Learning">Practical Learning</option>
          </select>
        </label>

        <label>
          Start Date
          <input
            type="month"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
          />
        </label>

        <label>
          End Date
          <input
            type="month"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
          />
        </label>

        <label>
          Description *
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your responsibilities or learning"
            rows={4}
            required
          />
        </label>

        <div className="project-admin-actions">
          <button className="primary-btn" type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
                ? "Update Experience"
                : "Save Experience"}
          </button>

          {editingId && (
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
        Experience Records ({records.length})
      </h2>

      {loading ? (
        <p>Loading experience records...</p>
      ) : records.length === 0 ? (
        <p>No experience records have been added yet.</p>
      ) : (
        <div className="project-admin-list">
          {records.map((record) => (
            <article className="project-admin-item" key={record.id}>
              <span className="project-label">
                {record.type || "Experience"}
              </span>

              <h3>{record.title}</h3>

              {record.isHidden === true && (
                <p><strong>Hidden from public website</strong></p>
              )}

              {record.organization && <p>{record.organization}</p>}

              {(record.startDate || record.endDate) && (
                <p>
                  {record.startDate || "Start date not set"} —{" "}
                  {record.endDate || "Present"}
                </p>
              )}

              <p>{record.description}</p>

              <div className="project-admin-actions">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => editExperience(record)}
                >
                  Edit
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => toggleVisibility(record)}
                >
                  {record.isHidden === true ? "Restore" : "Hide"}
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => deleteExperience(record)}
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
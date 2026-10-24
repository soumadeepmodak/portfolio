
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

const emptyEducation = {
  title: "",
  institution: "",
  startDate: "",
  endDate: "",
  status: "Completed",
  description: "",
};

export default function EducationManager() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyEducation);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "education"),
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
        console.error("Error loading education:", error);
        setMessage(
          "Could not load education records. Check Firestore rules."
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

  async function saveEducation(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const education = {
      title: form.title.trim(),
      institution: form.institution.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      status: form.status,
      description: form.description.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await updateDoc(
          doc(db, "education", editingId),
          education
        );
        setMessage("Education updated successfully.");
      } else {
        await addDoc(collection(db, "education"), {
          ...education,
          createdAt: new Date().toISOString(),
        });
        setMessage("Education added successfully.");
      }

      setForm(emptyEducation);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving education:", error);
      setMessage(
        "Could not save education. Check your Admin login and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  }

  function editEducation(record) {
    setForm({
      title: record.title || "",
      institution: record.institution || "",
      startDate: record.startDate || "",
      endDate: record.endDate || "",
      status: record.status || "Completed",
      description: record.description || "",
    });

    setEditingId(record.id);
    setMessage("");
  }

  async function removeEducation(record) {
    const confirmed = window.confirm(
      `Delete "${record.title}"?`
    );

    if (!confirmed) return;

    setMessage("");

    try {
      await deleteDoc(doc(db, "education", record.id));

      if (editingId === record.id) {
        setForm(emptyEducation);
        setEditingId(null);
      }

      setMessage("Education deleted successfully.");
    } catch (error) {
      console.error("Error deleting education:", error);
      setMessage(
        "Could not delete education. Check your Admin login and Firestore rules."
      );
    }
  }

  function cancelEdit() {
    setForm(emptyEducation);
    setEditingId(null);
    setMessage("");
  }

  return (
    <section className="admin-welcome">
      <h2>
        {editingId ? "Edit Education" : "Add Education"}
      </h2>

      <p>
        Manage your academic qualifications and educational journey.
      </p>

      <form
        className="project-admin-form"
        onSubmit={saveEducation}
      >
        <label>
          Degree / Qualification *
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Bachelor of Computer Applications"
            required
          />
        </label>

        <label>
          Institution
          <input
            name="institution"
            value={form.institution}
            onChange={handleChange}
            placeholder="College, university or institute"
          />
        </label>

        <label>
          Start Date
          <input
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            placeholder="e.g. August 2025"
          />
        </label>

        <label>
          End Date
          <input
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            placeholder="e.g. Present or 2028"
          />
        </label>

        <label>
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Currently Pursuing">
              Currently Pursuing
            </option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
          </select>
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your studies and learning"
            rows={4}
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
              : editingId
                ? "Update Education"
                : "Save Education"}
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

      <h2>Education Records ({records.length})</h2>

      {loading ? (
        <p>Loading education records...</p>
      ) : records.length === 0 ? (
        <p>No education records have been added yet.</p>
      ) : (
        <div className="project-admin-list">
          {records.map((record) => (
            <article
              className="project-admin-item"
              key={record.id}
            >
              <h3>{record.title}</h3>

              {record.institution && (
                <p>{record.institution}</p>
              )}

              <p>
                {record.startDate || "Start date not set"}
                {" — "}
                {record.endDate || "End date not set"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {record.status || "Not specified"}
              </p>

              {record.description && (
                <p>{record.description}</p>
              )}

              <div className="project-admin-actions">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => editEducation(record)}
                >
                  Edit
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => removeEducation(record)}
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

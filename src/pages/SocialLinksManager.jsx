
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

const COLLECTION_NAME = "socialLinks";

const EMPTY_FORM = {
  name: "",
  url: "",
  isHidden: false,
};

function getSocialIcon(url = "") {
  const value = url.toLowerCase();

  if (value.includes("linkedin.com")) return "linkedin";
  if (value.includes("github.com")) return "github";
  if (value.includes("youtube.com") || value.includes("youtu.be"))
    return "youtube";
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("facebook.com")) return "facebook";
  if (value.includes("x.com") || value.includes("twitter.com"))
    return "x";
  if (value.includes("discord.com") || value.includes("discord.gg"))
    return "discord";
  if (value.includes("medium.com")) return "medium";
  if (value.includes("stackoverflow.com")) return "stackoverflow";

  return "link";
}

export default function SocialLinksManager() {
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        setLinks(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error loading social links:", error);
        setMessage("Could not load links. Check Firestore security rules.");
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

  async function saveLink(event) {
    event.preventDefault();

    if (saving) return;

    const name = form.name.trim();
    const url = form.url.trim();

    if (!name || name.length > 60) {
      setMessage("Enter a name of 1–60 characters.");
      return;
    }

    if (url.length > 2048) {
      setMessage("The URL is too long.");
      return;
    }

    try {
      const parsedUrl = new URL(url);

      if (
        !["https:", "http:"].includes(parsedUrl.protocol) ||
        !parsedUrl.hostname.includes(".")
      ) {
        throw new Error("Enter a valid website URL.");
      }
    } catch {
      setMessage("Please enter a valid URL starting with https://");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const data = {
        name,
        url,
        icon: getSocialIcon(url),
        isHidden: form.isHidden === true,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, COLLECTION_NAME, editingId), data);
        setMessage("Social link updated successfully.");
      } else {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...data,
          isHidden: false,
          createdAt: new Date().toISOString(),
        });
        setMessage("Social link added successfully.");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving social link:", error);
      setMessage("Could not save link. Check Firestore security rules.");
    } finally {
      setSaving(false);
    }
  }

  function editLink(link) {
    setForm({
      name: link.name || "",
      url: link.url || "",
      isHidden: link.isHidden === true,
    });

    setEditingId(link.id);
    setMessage("");
  }

  async function toggleVisibility(link) {
    setMessage("");

    try {
      await updateDoc(doc(db, COLLECTION_NAME, link.id), {
        isHidden: link.isHidden !== true,
        updatedAt: new Date().toISOString(),
      });

      setMessage(
        link.isHidden === true
          ? "Link restored successfully."
          : "Link hidden successfully."
      );
    } catch (error) {
      console.error("Error updating link visibility:", error);
      setMessage("Could not change visibility. Check Firestore rules.");
    }
  }

  async function removeLink(link) {
    if (!window.confirm(`Delete "${link.name}"?`)) return;

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, link.id));

      if (editingId === link.id) {
        setForm(EMPTY_FORM);
        setEditingId(null);
      }

      setMessage("Social link deleted successfully.");
    } catch (error) {
      console.error("Error deleting social link:", error);
      setMessage("Could not delete link. Check Firestore security rules.");
    }
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage("");
  }

  return (
    <section className="admin-welcome">
      <h2>{editingId ? "Edit Social Link" : "Add Social Link"}</h2>
      <p>
        Add LinkedIn, GitHub or another website. The icon is selected
        automatically from its URL.
      </p>

      <form className="project-admin-form" onSubmit={saveLink}>
        <label>
          Link Name *
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. GitHub"
            maxLength={60}
            required
          />
        </label>

        <label>
          Website URL *
          <input
            name="url"
            type="url"
            value={form.url}
            onChange={handleChange}
            placeholder="https://github.com/yourusername"
            maxLength={2048}
            required
          />
        </label>

        {form.url.trim() && (
          <p>
            Detected icon: <strong>{getSocialIcon(form.url)}</strong>
          </p>
        )}

        <div className="project-admin-actions">
          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Link" : "Add Link"}
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

      <h2>Social Links ({links.length})</h2>

      {loading ? (
        <p>Loading social links...</p>
      ) : links.length === 0 ? (
        <p>No social links added yet.</p>
      ) : (
        <div className="project-admin-list">
          {links.map((link) => (
            <article className="project-admin-item" key={link.id}>
              <h3>
                {link.name} <small>({getSocialIcon(link.url)})</small>
              </h3>

              <p>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.url}
                </a>
              </p>

              <p>
                Status: {link.isHidden === true ? "Hidden" : "Visible"}
              </p>

              <div className="project-admin-actions">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => editLink(link)}
                >
                  Edit
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => toggleVisibility(link)}
                >
                  {link.isHidden === true ? "Show" : "Hide"}
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => removeLink(link)}
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

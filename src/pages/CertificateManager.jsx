import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase.js";
import "./CertificateManager.css";

const emptyForm = {
  title: "",
  type: "Certificate",
  issuer: "",
  date: "",
  description: "",
  publication: "",
  published: false,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function CertificateManager() {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "certificates"),
      (snapshot) => {
        setDocuments(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Certificate loading error:", error);
        showMessage(
          "Could not load documents. Check Firestore security rules.",
          true
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  function showMessage(text, isError = false) {
    setMessage(text);
    setMessageIsError(isError);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setFile(null);
    showMessage("");

    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      showMessage("Only PDF, JPG, PNG and WebP files are allowed.", true);
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      showMessage("The file must be 10 MB or smaller.", true);
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  function resetForm() {
    setForm(emptyForm);
    setFile(null);
    setEditingId(null);
    setProgress(0);

    const input = document.getElementById("certificate-file");
    if (input) input.value = "";
  }

  async function uploadFile(selectedFile) {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error(
        "Cloudinary configuration is missing. Check the .env file and restart Vite."
      );
    }

    const resourceType = selectedFile.type === "application/pdf"
      ? "raw"
      : "image";

    const endpoint =
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    const body = new FormData();
    body.append("file", selectedFile);
    body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    body.append("folder", "portfolio-certificates");

    setProgress(10);

    const response = await fetch(endpoint, {
      method: "POST",
      body,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Cloudinary upload error:", result);
      throw new Error(
        result.error?.message || "Cloudinary upload failed."
      );
    }

    setProgress(100);

    return {
      fileName: selectedFile.name,
      fileUrl: result.secure_url,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      storageProvider: "cloudinary",
      cloudinaryPublicId: result.public_id || "",
      cloudinaryResourceType: resourceType,
    };
  }

  async function saveDocument(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      showMessage("Please enter a document title.", true);
      return;
    }

    if (editingId === null && !file) {
      showMessage("Please select a PDF or image.", true);
      return;
    }

    setSaving(true);
    showMessage("");
    setProgress(0);

    try {
      let uploadedFile = null;

      if (file) {
        uploadedFile = await uploadFile(file);
      }

      const payload = {
        title: form.title.trim(),
        type: form.type,
        issuer: form.issuer.trim(),
        date: form.date,
        description: form.description.trim(),
        publication: form.publication.trim(),
        published: form.published,
        updatedAt: serverTimestamp(),
      };

      if (uploadedFile) {
        Object.assign(payload, uploadedFile);
      }

      if (editingId !== null) {
        await updateDoc(doc(db, "certificates", editingId), payload);
        showMessage(
          uploadedFile
            ? "Document updated. If you replaced a file, the previous Cloudinary file may still need manual removal."
            : "Document updated successfully."
        );
      } else {
        await addDoc(collection(db, "certificates"), {
          ...payload,
          ...uploadedFile,
          createdAt: serverTimestamp(),
        });

        showMessage("Document uploaded successfully.");
      }

      resetForm();
    } catch (error) {
      console.error("Document save error:", error);
      showMessage(
        error.message ||
          "Could not save the document. Check Cloudinary settings and Firestore permissions.",
        true
      );
    } finally {
      setSaving(false);
    }
  }

  function editDocument(item) {
    setForm({
      title: item.title || "",
      type: item.type || "Certificate",
      issuer: item.issuer || "",
      date: item.date || "",
      description: item.description || "",
      publication: item.publication || "",
      published: item.published === true,
    });

    setFile(null);
    setEditingId(item.id);
    setProgress(0);
    showMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublished(item) {
    showMessage("");

    try {
      await updateDoc(doc(db, "certificates", item.id), {
        published: !item.published,
        updatedAt: serverTimestamp(),
      });

      showMessage(
        item.published ? "Document unpublished." : "Document published."
      );
    } catch (error) {
      console.error("Publish update error:", error);
      showMessage("Could not change publish status. Check permissions.", true);
    }
  }

  async function removeDocument(item) {
    const confirmed = window.confirm(
      item.storageProvider === "cloudinary"
        ? `Delete "${item.title}" from your portfolio? Its Cloudinary file will not be deleted automatically.`
        : `Delete "${item.title}" and its Firestore record?`
    );

    if (!confirmed) return;

    showMessage("");

    try {
      await deleteDoc(doc(db, "certificates", item.id));

      if (editingId === item.id) {
        resetForm();
      }

      showMessage(
        item.storageProvider === "cloudinary"
          ? "Portfolio record deleted. The uploaded file may still remain in Cloudinary."
          : "Document record deleted successfully."
      );
    } catch (error) {
      console.error("Document deletion error:", error);
      showMessage(
        "Could not delete the document record. Check Firestore permissions.",
        true
      );
    }
  }

  const visibleDocuments = documents.filter(
    (item) => filter === "All" || item.type === filter
  );

  return (
    <div className="certificate-manager">
      <header className="certificate-manager-header">
        <p className="cm-eyebrow">PORTFOLIO MANAGEMENT</p>
        <h1>Certificates &amp; Research</h1>
        <p>
          Manage your certificates, research papers and publications
          from one place.
        </p>

        <div className="cm-header-stats">
          <div className="cm-stat">
            <span>Total Documents</span>
            <strong>{documents.length}</strong>
          </div>
          <div className="cm-stat">
            <span>Published</span>
            <strong>
              {documents.filter((item) => item.published === true).length}
            </strong>
          </div>
          <div className="cm-stat">
            <span>Drafts</span>
            <strong>
              {documents.filter((item) => item.published !== true).length}
            </strong>
          </div>
        </div>
      </header>

      <section className="certificate-manager-panel">
        <div className="cm-section-heading">
          <div className="cm-heading-icon" aria-hidden="true">
            {editingId !== null ? "✎" : "+"}
          </div>
          <div>
            <h2>
              {editingId !== null ? "Edit Document" : "Upload New Document"}
            </h2>
            <p>Add a document to your portfolio collection.</p>
          </div>
        </div>

        <form onSubmit={saveDocument}>
          <div className="cm-field">
            <label htmlFor="certificate-title">Document Title *</label>
            <input
              id="certificate-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={150}
              required
              placeholder="e.g. Python Data Analysis Certificate"
            />
          </div>

          <div className="cm-field">
            <label htmlFor="certificate-type">Document Type</label>
            <select
              id="certificate-type"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option>Certificate</option>
              <option>Research Paper</option>
              <option>Publication</option>
              <option>Other</option>
            </select>
          </div>

          <div className="cm-field">
            <label htmlFor="certificate-issuer">Issuer / Institution</label>
            <input
              id="certificate-issuer"
              name="issuer"
              value={form.issuer}
              onChange={handleChange}
              maxLength={150}
              placeholder="Institution or publisher"
            />
          </div>

          <div className="cm-field">
            <label htmlFor="certificate-date">Issue / Publication Date</label>
            <input
              id="certificate-date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          <div className="cm-field cm-field-full">
            <label htmlFor="certificate-description">Description</label>
            <textarea
              id="certificate-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              maxLength={3000}
              placeholder="Describe this certificate or research"
            />
          </div>

          <div className="cm-field cm-field-full">
            <label htmlFor="certificate-publication">
              Publication Details (optional)
            </label>
            <input
              id="certificate-publication"
              name="publication"
              value={form.publication}
              onChange={handleChange}
              maxLength={500}
              placeholder="Journal, DOI or publication reference"
            />
          </div>

          <div className="cm-field cm-field-full">
            <label htmlFor="certificate-file">
              PDF or Image {editingId !== null ? "(optional)" : "*"}
            </label>
            <input
              id="certificate-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              required={editingId === null}
              disabled={saving}
            />
            <p className="cm-hint">
              PDF, JPG, PNG or WebP · Maximum file size: 10 MB
            </p>
            {file && (
              <p className="cm-selected-file">
                <span aria-hidden="true">✓</span> {file.name}
              </p>
            )}
          </div>

          <label className="cm-publish-option">
            <input
              type="checkbox"
              name="published"
              checked={form.published}
              onChange={handleChange}
            />
            <span>
              <strong>Publish on portfolio</strong>
              <small>
                Published documents appear on the public Certificates page.
              </small>
            </span>
          </label>

          {saving && (
            <div className="cm-upload-progress">
              <div className="cm-progress-label">
                <span>Uploading document</span>
                <strong>{progress}%</strong>
              </div>
              <div
                className="cm-progress-track"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="cm-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {message && (
            <p
              className={`cm-notice ${messageIsError ? "cm-error" : ""}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <div className="cm-form-actions">
            <button
              className="cm-btn cm-btn-primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save Changes"
                  : "Upload Document"}
            </button>

            {editingId !== null && (
              <button
                className="cm-btn"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="certificate-manager-list">
        <div className="cm-list-heading">
          <div>
            <p className="cm-eyebrow">YOUR COLLECTION</p>
            <h2>Manage Documents</h2>
            <p className="cm-list-description">
              Edit details, change publication status or remove documents.
            </p>
          </div>

          <label className="cm-filter-label" htmlFor="certificate-filter">
            Filter by type
            <select
              id="certificate-filter"
              className="cm-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option>All</option>
              <option>Certificate</option>
              <option>Research Paper</option>
              <option>Publication</option>
              <option>Other</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="cm-empty">
            <div className="cm-loading-spinner" />
            <p>Loading your documents...</p>
          </div>
        ) : visibleDocuments.length === 0 ? (
          <div className="cm-empty">
            <div className="cm-empty-icon" aria-hidden="true">▤</div>
            <h3>No documents found</h3>
            <p>
              {filter === "All"
                ? "Upload your first certificate or research document using the form above."
                : `There are no documents in the ${filter} category yet.`}
            </p>
          </div>
        ) : (
          <div className="certificate-manager-grid">
            {visibleDocuments.map((item) => (
              <article className="certificate-manager-card" key={item.id}>
                <div className="cm-card-preview">
                  {item.fileType?.startsWith("image/") && item.fileUrl ? (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open image for ${item.title}`}
                    >
                      <img
                        src={item.fileUrl}
                        alt={item.title}
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className="cm-file-icon">
                      <span aria-hidden="true">
                        {item.fileType === "application/pdf" ? "PDF" : "▤"}
                      </span>
                      <span>{item.fileName || "Uploaded document"}</span>
                    </div>
                  )}
                </div>

                <div className="cm-card-body">
                  <div className="cm-badges">
                    <span className="cm-badge">{item.type || "Document"}</span>
                    <span
                      className={`cm-badge ${
                        item.published ? "cm-badge-published" : "cm-badge-draft"
                      }`}
                    >
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <h3>{item.title}</h3>

                  {item.issuer && (
                    <p className="cm-card-meta">
                      <span>Issuer</span>
                      {item.issuer}
                    </p>
                  )}

                  {item.date && (
                    <p className="cm-card-meta">
                      <span>Date</span>
                      {item.date}
                    </p>
                  )}

                  {item.description && (
                    <p className="cm-card-description">{item.description}</p>
                  )}

                  {item.publication && (
                    <p className="cm-card-publication">{item.publication}</p>
                  )}

                  <div className="cm-card-actions">
                    {item.fileUrl && (
                      <a
                        className="cm-btn cm-btn-view"
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View / Download
                      </a>
                    )}

                    <button
                      className="cm-btn"
                      type="button"
                      onClick={() => editDocument(item)}
                    >
                      Edit
                    </button>

                    <button
                      className="cm-btn cm-btn-publish"
                      type="button"
                      onClick={() => togglePublished(item)}
                    >
                      {item.published ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      className="cm-btn cm-btn-delete"
                      type="button"
                      onClick={() => removeDocument(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

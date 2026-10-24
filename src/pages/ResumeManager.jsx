
import { useEffect, useState } from "react";
import { auth } from "../config/firebase.js";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function ResumeManager() {
  const [file, setFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadResume() {
    try {
      const response = await fetch(`${API_URL}/api/resume`);

      if (!response.ok) {
        throw new Error("Could not load Resume.");
      }

      const data = await response.json();
      setResumeUrl(data.url || "");
      setFileName(data.fileName || "");
    } catch (error) {
      console.error("Resume loading error:", error);
      setMessage(
        "Could not load Resume. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResume();
  }, []);

  async function uploadResume(event) {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a PDF file.");
      return;
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Only PDF files are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("PDF must be 10 MB or smaller.");
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setMessage("Please log in to your Admin account first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume upload failed.");
      }

      setResumeUrl(data.url || "");
      setFileName(data.fileName || file.name);
      setFile(null);
      event.target.reset();
      setMessage("Resume uploaded successfully!");
    } catch (error) {
      console.error("Resume upload error:", error);
      setMessage(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="admin-welcome">
      <h2>Upload or Replace Resume</h2>
      <p>
        Select your latest Resume PDF. The existing file will be replaced.
      </p>

      <form className="project-admin-form" onSubmit={uploadResume}>
        <label>
          Resume PDF *
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
            required
          />
        </label>

        {file && <p>Selected: {file.name}</p>}

        <button
          className="primary-btn"
          type="submit"
          disabled={uploading || loading}
        >
          {uploading
            ? "Uploading..."
            : resumeUrl
              ? "Replace Resume PDF"
              : "Upload Resume PDF"}
        </button>
      </form>

      {loading && <p>Checking current Resume...</p>}

      {resumeUrl && (
        <p>
          Current Resume{fileName ? ` (${fileName})` : ""}:{" "}
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View PDF
          </a>
        </p>
      )}

      {message && <p role="status">{message}</p>}
    </section>
  );
}

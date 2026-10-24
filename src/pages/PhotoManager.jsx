
import { useEffect, useState } from "react";
import { auth } from "../config/firebase.js";

const API_URL = "";

export default function PhotoManager() {
  const [file, setFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPhoto() {
      try {
        const response = await fetch(`${API_URL}/api/profile-photo`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not load profile photo.");
        }

        setPhotoUrl(data.url || "");
        setFileName(data.fileName || "");
      } catch (error) {
        setMessage(error.message || "Could not load profile photo.");
      } finally {
        setLoading(false);
      }
    }

    loadPhoto();
  }, []);

  useEffect(() => {
    if (!previewUrl) return;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setFile(null);
    setPreviewUrl("");
    setMessage("");

    if (!selectedFile) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) {
      setMessage("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function uploadPhoto(event) {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a photo first.");
      return;
    }

    if (!auth.currentUser) {
      setMessage("Please log in to your admin account first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/profile-photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Photo upload failed.");
      }

      setPhotoUrl(data.url || "");
      setFileName(data.fileName || file.name);
      setFile(null);
      setPreviewUrl("");
      event.target.reset();
      setMessage("Profile photo uploaded successfully.");
    } catch (error) {
      console.error("Profile photo upload error:", error);
      setMessage(error.message || "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="admin-welcome">
      <h2>Profile Photo</h2>
      <p>Upload or replace your portfolio photo. JPG, PNG or WEBP, up to 5 MB.</p>

      {loading ? (
        <p>Loading current photo...</p>
      ) : photoUrl ? (
        <div style={{ marginBottom: "24px" }}>
          <p><strong>Current profile photo</strong></p>
          <img
            src={photoUrl}
            alt="Current portfolio profile"
            style={{
              width: "180px",
              height: "180px",
              objectFit: "cover",
              borderRadius: "16px",
              border: "1px solid #475569",
            }}
          />
          {fileName && <p>File: {fileName}</p>}
          <p>
            <a href={photoUrl} target="_blank" rel="noreferrer">
              View current photo
            </a>
          </p>
        </div>
      ) : (
        <p>No profile photo uploaded yet.</p>
      )}

      {previewUrl && (
        <div style={{ marginBottom: "20px" }}>
          <p><strong>Selected photo preview</strong></p>
          <img
            src={previewUrl}
            alt="Selected photo preview"
            style={{
              width: "180px",
              height: "180px",
              objectFit: "cover",
              borderRadius: "16px",
            }}
          />
        </div>
      )}

      <form onSubmit={uploadPhoto}>
        <label htmlFor="profile-photo-input">Choose profile photo</label>
        <input
          id="profile-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />

        {file && <p>Selected: {file.name}</p>}

        <button
          className="primary-btn"
          type="submit"
          disabled={!file || uploading}
          style={{ marginTop: "16px" }}
        >
          {uploading ? "Uploading..." : "Upload / Replace Photo"}
        </button>
      </form>

      {message && <p role="status" style={{ marginTop: "16px" }}>{message}</p>}
    </section>
  );
}

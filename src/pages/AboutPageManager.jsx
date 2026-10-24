
import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
} from "firebase/firestore";
import { db } from "../config/firebase.js";

const PAGE_REF = doc(db, "pageContent", "about");

const DEFAULT_CONTENT = {
  heading: "About Me",
  paragraphs: [
    "I am currently pursuing a Bachelor of Computer Applications (BCA) and building my foundation in programming, data analysis and software development.",
    "I enjoy learning Python, exploring data, solving problems and creating practical projects. My goal is to keep improving my technical knowledge through consistent practice.",
  ],
  directionEyebrow: "MY DIRECTION",
  directionHeading: "Learning With Purpose",
  cards: [
    {
      title: "Programming",
      description: "Building a foundation in Python and JavaScript.",
    },
    {
      title: "Data Analytics",
      description: "Learning how to understand, clean and analyze data.",
    },
    {
      title: "Practical Projects",
      description: "Applying what I learn through real implementations.",
    },
  ],
};

function normalizeContent(data = {}) {
  return {
    heading: data.heading || DEFAULT_CONTENT.heading,
    paragraphs:
      Array.isArray(data.paragraphs) && data.paragraphs.length > 0
        ? data.paragraphs
        : DEFAULT_CONTENT.paragraphs,
    directionEyebrow:
      data.directionEyebrow || DEFAULT_CONTENT.directionEyebrow,
    directionHeading:
      data.directionHeading || DEFAULT_CONTENT.directionHeading,
    cards: Array.isArray(data.cards)
      ? data.cards
      : DEFAULT_CONTENT.cards,
  };
}

export default function AboutPageManager() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      PAGE_REF,
      (snapshot) => {
        setExists(snapshot.exists());
        setContent(
          snapshot.exists()
            ? normalizeContent(snapshot.data())
            : DEFAULT_CONTENT
        );
        setLoading(false);
      },
      (error) => {
        console.error("About Page load error:", error);
        setMessage(
          "Could not load About Page. Check Firestore permissions."
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  function updateField(field, value) {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage("");
  }

  function updateParagraph(index, value) {
    updateField(
      "paragraphs",
      content.paragraphs.map((item, i) =>
        i === index ? value : item
      )
    );
  }

  function addParagraph() {
    if (content.paragraphs.length >= 20) {
      setMessage("You can add up to 20 paragraphs.");
      return;
    }

    updateField("paragraphs", [
      ...content.paragraphs,
      "",
    ]);
  }

  function removeParagraph(index) {
    if (content.paragraphs.length <= 1) {
      setMessage("Keep at least one paragraph.");
      return;
    }

    updateField(
      "paragraphs",
      content.paragraphs.filter((_, i) => i !== index)
    );
  }

  function updateCard(index, field, value) {
    updateField(
      "cards",
      content.cards.map((card, i) =>
        i === index
          ? { ...card, [field]: value }
          : card
      )
    );
  }

  function addCard() {
    if (content.cards.length >= 20) {
      setMessage("You can add up to 20 cards.");
      return;
    }

    updateField("cards", [
      ...content.cards,
      { title: "", description: "" },
    ]);
  }

  function removeCard(index) {
    const cardTitle = content.cards[index]?.title || "new";

    if (
      !window.confirm(`Delete the "${cardTitle}" card?`)
    ) {
      return;
    }

    updateField(
      "cards",
      content.cards.filter((_, i) => i !== index)
    );
  }

  async function saveContent(event) {
    event.preventDefault();

    if (saving) return;

    const dataToSave = {
      heading: content.heading.trim(),
      paragraphs: content.paragraphs
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      directionEyebrow: content.directionEyebrow.trim(),
      directionHeading: content.directionHeading.trim(),
      cards: content.cards.map((card) => ({
        title: card.title.trim(),
        description: card.description.trim(),
      })),
    };

    if (
      !dataToSave.heading ||
      dataToSave.paragraphs.length === 0 ||
      !dataToSave.directionEyebrow ||
      !dataToSave.directionHeading
    ) {
      setMessage(
        "Complete the page heading, at least one paragraph, and Direction headings."
      );
      return;
    }

    if (
      dataToSave.cards.some(
        (card) => !card.title || !card.description
      )
    ) {
      setMessage(
        "Every card needs a title and description, or delete the empty card."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await setDoc(PAGE_REF, {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      });

      const saved = await getDocFromServer(PAGE_REF);

      if (!saved.exists()) {
        throw new Error(
          "Saved document could not be verified."
        );
      }

      const savedData = normalizeContent(saved.data());

      if (
        JSON.stringify(savedData) !==
        JSON.stringify(dataToSave)
      ) {
        throw new Error(
          "The saved content did not match the submitted content."
        );
      }

      setExists(true);
      setContent(dataToSave);
      setMessage(
        "All About Page changes saved successfully."
      );
    } catch (error) {
      console.error("About Page save error:", error);
      setMessage(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent() {
    if (!exists || saving) return;

    const confirmed = window.confirm(
      "Delete all saved About Page content? The public page will return to its default content."
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      await deleteDoc(PAGE_REF);
      setExists(false);
      setContent(DEFAULT_CONTENT);
      setMessage(
        "Saved content deleted. Default content is restored."
      );
    } catch (error) {
      console.error("About Page delete error:", error);
      setMessage(`Delete failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading About Page Manager...</p>;
  }

  return (
    <section className="admin-welcome">
      <h2>About Page Manager</h2>

      <p>
        Manage the separate public About Page. Changes appear
        publicly after you save them.
      </p>

      {message && <p role="status">{message}</p>}

      <form
        className="project-admin-form"
        onSubmit={saveContent}
      >
        <h3>About Me</h3>

        <label>
          Page Heading
          <input
            value={content.heading}
            onChange={(e) =>
              updateField("heading", e.target.value)
            }
            maxLength={150}
            required
          />
        </label>

        <h4>About Paragraphs</h4>

        {content.paragraphs.map((paragraph, index) => (
          <div key={index}>
            <label>
              Paragraph {index + 1}
              <textarea
                value={paragraph}
                onChange={(e) =>
                  updateParagraph(index, e.target.value)
                }
                rows={4}
                maxLength={5000}
              />
            </label>

            <button
              className="secondary-btn"
              type="button"
              onClick={() => removeParagraph(index)}
              disabled={
                saving || content.paragraphs.length <= 1
              }
            >
              Delete Paragraph
            </button>
          </div>
        ))}

        <button
          className="secondary-btn"
          type="button"
          onClick={addParagraph}
          disabled={
            saving || content.paragraphs.length >= 20
          }
        >
          + Add Paragraph
        </button>

        <hr />

        <h3>Direction Section</h3>

        <label>
          Small Heading
          <input
            value={content.directionEyebrow}
            onChange={(e) =>
              updateField(
                "directionEyebrow",
                e.target.value
              )
            }
            maxLength={100}
            required
          />
        </label>

        <label>
          Main Heading
          <input
            value={content.directionHeading}
            onChange={(e) =>
              updateField(
                "directionHeading",
                e.target.value
              )
            }
            maxLength={150}
            required
          />
        </label>

        <h4>Direction Cards ({content.cards.length})</h4>

        {content.cards.map((card, index) => (
          <section
            key={index}
            className="admin-welcome"
          >
            <h4>Card {index + 1}</h4>

            <label>
              Card Title
              <input
                value={card.title}
                onChange={(e) =>
                  updateCard(index, "title", e.target.value)
                }
                maxLength={150}
                required
              />
            </label>

            <label>
              Card Description
              <textarea
                value={card.description}
                onChange={(e) =>
                  updateCard(
                    index,
                    "description",
                    e.target.value
                  )
                }
                rows={3}
                maxLength={2000}
                required
              />
            </label>

            <button
              className="secondary-btn"
              type="button"
              onClick={() => removeCard(index)}
              disabled={saving}
            >
              Delete Card
            </button>
          </section>
        ))}

        <button
          className="secondary-btn"
          type="button"
          onClick={addCard}
          disabled={
            saving || content.cards.length >= 20
          }
        >
          + Add New Card
        </button>

        <div className="project-admin-actions">
          <button
            className="primary-btn"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={deleteContent}
            disabled={saving || !exists}
          >
            Delete All Saved About Content
          </button>
        </div>
      </form>
    </section>
  );
}

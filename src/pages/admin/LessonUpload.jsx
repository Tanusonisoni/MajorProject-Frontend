
import { useEffect, useState } from "react";
import {
  FiBookOpen,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPlay,
  FiX,
  FiUploadCloud,
  FiFileText,
  FiFlag,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
// import { adminLessonsApi } from "../../services.jsx/adminApi";
import "./Lesson.css";

export default function Lesson() {
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  const initialForm = {
    title: "",
    description: "",
    topic: "",
    status: "draft",
    video: null,
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    try {
      setLoading(true);
      setError("");

      const response = await adminLessonsApi.getAll();
      const data = response.data?.data ?? response.data;

      setLessons(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.lessons)
          ? data.lessons
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load lessons."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, files } = event.target;

    if (name === "video") {
      const file = files?.[0];
      if (!file) return;

      setForm((prev) => ({ ...prev, video: file }));

      if (videoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreview);
      }

      setVideoPreview(URL.createObjectURL(file));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("topic", form.topic);
      payload.append("status", form.status);

      if (form.video) {
        payload.append("video", form.video);
      }

      if (editingId) {
        await adminLessonsApi.update(editingId, payload);
        setMessage("Lesson updated successfully.");
      } else {
        if (!form.video) {
          setError("Please select a lesson video.");
          return;
        }

        await adminLessonsApi.create(payload);
        setMessage("Lesson created successfully.");
      }

      resetForm();
      await fetchLessons();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save lesson."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(lesson) {
    if (videoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreview);
    }

    setEditingId(lesson._id);

    setForm({
      title: lesson.title || "",
      description: lesson.description || "",
      topic: lesson.topic || "",
      status: lesson.status || "draft",
      video: null,
    });

    setVideoPreview(lesson.videoUrl || "");
    setError("");
    setMessage("");

    document
      .getElementById("lesson-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lesson?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await adminLessonsApi.remove(id);
      setMessage("Lesson deleted successfully.");

      if (editingId === id) resetForm();

      await fetchLessons();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete lesson."
      );
    }
  }

  function resetForm() {
    if (videoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreview);
    }

    setForm(initialForm);
    setEditingId(null);
    setVideoPreview("");

    const fileInput = document.getElementById("lesson-video");
    if (fileInput) fileInput.value = "";
  }

  const filteredLessons = lessons.filter((lesson) => {
    const query = search.toLowerCase();

    return (
      lesson.title?.toLowerCase().includes(query) ||
      lesson.topic?.toLowerCase().includes(query) ||
      lesson.description?.toLowerCase().includes(query)
    );
  });

  return (
    <main className="lesson-page">
      <header className="lesson-header">
        <div className="lesson-brand">
          <div className="lesson-brand-icon">
            <FiBookOpen />
          </div>

          <div>
            <h1>EcoQuest</h1>
            <p>Admin Dashboard</p>
          </div>
        </div>

      </header>

      <div className="lesson-container">
        <section className="lesson-welcome">
          <div>
            <h2>Manage Lessons</h2>
            <p>
              Create lessons, manage learning videos, and organize
              your educational content.
            </p>
          </div>

          <div className="lesson-total">
            <FiBookOpen />
            <div>
              <strong>{lessons.length}</strong>
              <span>Total Lessons</span>
            </div>
          </div>
        </section>

        {/* TOP NAVIGATION: QUIZ AND CHALLENGE */}
        <section className="lesson-quick-links">
          <button
            className="lesson-quick-card quiz-link"
            onClick={() => navigate("/admin/quizzes")}
            type="button"
          >
            <span className="quick-icon">
              <FiFileText />
            </span>
            <span className="quick-text">
              <strong>Quiz Management</strong>
              <small>Create and manage lesson quizzes</small>
            </span>
            <span className="quick-arrow">→</span>
          </button>

          <button
            className="lesson-quick-card challenge-link"
            onClick={() => navigate("/admin/challenges")}
            type="button"
          >
            <span className="quick-icon">
              <FiFlag />
            </span>
            <span className="quick-text">
              <strong>Challenge Management</strong>
              <small>Manage student environmental challenges</small>
            </span>
            <span className="quick-arrow">→</span>
          </button>
        </section>

        {error && <div className="lesson-alert error-alert">{error}</div>}
        {message && (
          <div className="lesson-alert success-alert">{message}</div>
        )}

        <section className="lesson-workspace">
          <div className="lesson-list-section">
            <div className="lesson-section-heading">
              <div>
                <h3>All Lessons</h3>
                <p>Manage your existing learning content</p>
              </div>

              <span className="lesson-count">{lessons.length} lessons</span>
            </div>

            <div className="lesson-search">
              <FiSearch />
              <input
                type="search"
                placeholder="Search lessons or topics..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {loading ? (
              <div className="lesson-empty">Loading lessons...</div>
            ) : filteredLessons.length === 0 ? (
              <div className="lesson-empty">
                <FiBookOpen />
                <h4>No lessons found</h4>
                <p>Create a lesson or try another search.</p>
              </div>
            ) : (
              <div className="lesson-cards">
                {filteredLessons.map((lesson) => (
                  <article className="lesson-card" key={lesson._id}>
                    <div className="lesson-video">
                      {lesson.videoUrl ? (
                        <video
                          src={lesson.videoUrl}
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <div className="lesson-no-video">
                          <FiPlay />
                          <span>No video available</span>
                        </div>
                      )}
                    </div>

                    <div className="lesson-card-body">
                      <div className="lesson-card-meta">
                        <span className="lesson-topic">
                          {lesson.topic || "General"}
                        </span>

                        <span
                          className={`lesson-status ${
                            lesson.status === "published"
                              ? "published"
                              : "draft"
                          }`}
                        >
                          {lesson.status || "draft"}
                        </span>
                      </div>

                      <h4>{lesson.title}</h4>

                      <p className="lesson-description">
                        {lesson.description || "No description added."}
                      </p>

                      <div className="lesson-card-actions">
                        <button
                          type="button"
                          className="lesson-edit-btn"
                          onClick={() => handleEdit(lesson)}
                        >
                          <FiEdit2 /> Edit
                        </button>

                        <button
                          type="button"
                          className="lesson-delete-btn"
                          onClick={() => handleDelete(lesson._id)}
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <section className="lesson-form-section" id="lesson-form">
            <div className="lesson-section-heading">
              <div>
                <h3>{editingId ? "Edit Lesson" : "Add New Lesson"}</h3>
                <p>
                  {editingId
                    ? "Update your lesson details"
                    : "Add a new video lesson"}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  className="lesson-cancel-icon"
                  onClick={resetForm}
                  aria-label="Cancel editing"
                >
                  <FiX />
                </button>
              )}
            </div>

            <form className="lesson-form" onSubmit={handleSubmit}>
              <label htmlFor="lesson-title">Lesson Title</label>
              <input
                id="lesson-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Water Conservation"
                required
              />

              <label htmlFor="lesson-topic">Topic</label>
              <input
                id="lesson-topic"
                name="topic"
                value={form.topic}
                onChange={handleChange}
                placeholder="e.g. Water Conservation"
                required
              />

              <label htmlFor="lesson-description">Description</label>
              <textarea
                id="lesson-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write a short lesson description..."
                rows={4}
                required
              />

              <label htmlFor="lesson-video">
                Lesson Video {editingId && "(optional when editing)"}
              </label>

              <label className="lesson-upload-box" htmlFor="lesson-video">
                <FiUploadCloud />
                <strong>Choose a video</strong>
                <span>Click to select a video file</span>
                <input
                  id="lesson-video"
                  name="video"
                  type="file"
                  accept="video/*"
                  onChange={handleChange}
                />
              </label>

              {videoPreview && (
                <div className="lesson-video-preview">
                  <video src={videoPreview} controls />
                </div>
              )}

              <label htmlFor="lesson-status">Status</label>
              <select
                id="lesson-status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <button
                className="lesson-submit-btn"
                type="submit"
                disabled={saving}
              >
                <FiPlus />
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Lesson"
                  : "Create Lesson"}
              </button>

              {editingId && (
                <button
                  className="lesson-reset-btn"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

import { createElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckSquare,
  FileQuestion,
  Plus,
  Target,
  Trash2,
  Users,
} 
from "lucide-react";

import WorkspaceLayout from "../../layout/WorkspaceLayout";
import {
  adminDashboard,
  createChallenge,
  createLesson,
  createQuiz,
  deleteChallenge,
  deleteLesson,
  deleteQuiz,
  deleteQuizQuestion,
  deleteUser,
  getApiError,
  getChallenges,
  getLessons,
  getQuizzes,
  getSubmissions,
  getUser,
  getUsers,
  reviewSubmission,
  updateChallenge,
  updateLesson,
  updateUser,
  uploadVideoDirectly,
} from "../../services.jsx/adminApi";

function Heading({ title, description, action }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Message({ error, success }) {
  return <>{error && <div className="page-alert page-alert-error" role="alert">{error}</div>}{success && <div className="page-alert page-alert-success" role="status">{success}</div>}</>;
}

function extractList(result, key) {
  if (Array.isArray(result)) return result;
  return Array.isArray(result?.[key]) ? result[key] : [];
}

async function getAllSubmissionPages() {
  const firstPage = await getSubmissions(1, 50);
  const submissions = extractList(firstPage, "submissions");
  const totalPages = Number(firstPage?.pagination?.totalPages) || 1;
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => getSubmissions(index + 2, 50)),
  );
  return submissions.concat(...remainingPages.map((page) => extractList(page, "submissions")));
}

async function getAllChallenges() {
  const firstPage = await getChallenges(1, 100);
  const challenges = extractList(firstPage, "challenge");
  const totalPages = Number(firstPage?.pagination?.totalPages) || 1;
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => getChallenges(index + 2, 100)),
  );
  return challenges.concat(...remainingPages.map((page) => extractList(page, "challenge")));
}

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsError, setSubmissionsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([adminDashboard(), getSubmissions()]).then(([dashboardResult, submissionResult]) => {
      if (!active) return;
      if (dashboardResult.status === "fulfilled") setStats(dashboardResult.value);
      else setError(getApiError(dashboardResult.reason, "Unable to load admin dashboard."));
      if (submissionResult.status === "fulfilled") {
        setSubmissions(extractList(submissionResult.value, "submissions").slice(0, 5));
      } else {
        setSubmissionsError(getApiError(submissionResult.reason, "Unable to load recent submissions."));
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const cards = [
    ["Lessons", stats?.totalLessons, BookOpen],
    ["Quizzes", stats?.totalQuizzes, FileQuestion],
    ["Challenges", stats?.totalChallenges, Target],
    ["Students", stats?.totalStudents, Users],
    ["Active students", stats?.activeStudents, Award],
    ["Quiz attempts", stats?.totalQuizResults, FileQuestion],
    ["Pending submissions", stats?.pendingSubmissions, CheckSquare],
  ].filter(([, value]) => value !== undefined && value !== null);

  return (
    <WorkspaceLayout role="admin">
      <div className="page-stack">
        <Heading title="Admin dashboard" description="Manage environmental lessons, quizzes, challenges, and student activity." />
        {error && <Message error={error} />}
        {loading ? <div className="page-grid">{Array.from({ length: 4 }, (_, i) => <div className="page-card page-loading" key={i}>Loading…</div>)}</div> : (
          <>
            <div className="page-grid">
              {cards.map(([label, value, Icon]) => <article className="stat-card" key={label}><span className="stat-icon">{createElement(Icon, { size: 21 })}</span><div><span>{label}</span><strong>{value}</strong></div></article>)}
            </div>
            <section className="page-card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2>Recent challenge submissions</h2><Link className="page-button-secondary" to="/admin/submissions">Review submissions</Link></div>
              {submissions.length ? (
                <div className="page-table-wrap"><table className="page-table"><thead><tr><th>Student</th><th>Challenge</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{submissions.map((item) => <tr key={item._id}><td>{item.studentId?.name || "Student"}</td><td>{item.challengeId?.title || "Challenge"}</td><td><span className="page-badge page-badge--warning">{item.status}</span></td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div>
              ) : <p className="mb-0 mt-3 text-sm">{submissionsError || "There are no submission records to display."}</p>}
            </section>
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}

const lessonTopics = ["Water Conservation", "Waste Management", "Climate Change", "Pollution", "Sustainability"];
const blankLesson = { title: "", description: "", topic: lessonTopics[0], videoUrl: "", status: "draft" };

function isYouTubeWatchUrl(value) {
  try {
    const url = new URL(value);
    return ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname.toLowerCase())
      && url.pathname === "/watch";
  } catch {
    return false;
  }
}

export function AdminLessons() {
  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState(blankLesson);
  const [videoFile, setVideoFile] = useState(null);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState("");

  async function loadLessons() {
    setLoading(true);
    setError("");
    try {
      setLessons(extractList(await getLessons(), "lessons"));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load lessons."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    getLessons().then((data) => {
      if (active) setLessons(extractList(data, "lessons"));
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load lessons."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!editingId && !videoFile) {
      setError("Select an MP4 or WebM video file to upload to Cloudinary.");
      return;
    }
    if (editingId && !videoFile && !form.videoUrl) {
      setError("This lesson has no saved video URL. Select a video file to upload it.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      setUploadProgress(0);
      const videoUrl = videoFile
        ? await uploadVideoDirectly(videoFile, setUploadProgress)
        : form.videoUrl;
      if (typeof videoUrl !== "string" || !videoUrl.trim()) {
        throw new Error("Cloudinary did not return a lesson video URL.");
      }
      const payload = { ...form, videoUrl };
      if (editingId) await updateLesson(editingId, payload);
      else await createLesson(payload);
      setSuccess(editingId ? "Lesson updated." : "Lesson created.");
      setForm(blankLesson);
      setVideoFile(null);
      setVideoInputKey((value) => value + 1);
      setEditingId("");
      await loadLessons();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to save lesson."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this lesson?")) return;
    setError("");
    try {
      await deleteLesson(id);
      setSuccess("Lesson deleted.");
      if (editingId === id) {
        setEditingId("");
        setForm(blankLesson);
        setVideoFile(null);
        setVideoInputKey((value) => value + 1);
      }
      await loadLessons();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to delete lesson."));
    }
  }

  const visible = lessons.filter((item) => `${item.title || ""} ${item.topic || ""}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <WorkspaceLayout role="admin">
      <div className="page-stack">
        <Heading title="Lesson management" description="Create and maintain lesson content using the lesson API." />
        <Message error={error} success={success} />
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.8fr)]">
          <section className="page-card page-stack">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2>Lessons</h2><input className="page-search max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lessons…" aria-label="Search lessons" /></div>
            {loading ? <div className="page-loading">Loading lessons…</div> : visible.length === 0 ? <div className="page-empty">No matching lessons.</div> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visible.map((item) => <article className="min-w-0 rounded-xl border border-gray-100 p-4" key={item._id}>
                  <div className="flex items-start justify-between gap-2"><span className="page-badge">{item.status}</span><span className="text-xs text-gray-500">{item.topic}</span></div>
                  <h3 className="mt-3 break-words text-base font-bold text-emerald-900">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">{item.description}</p>
                  {item.videoUrl && <video className="page-media mt-3 aspect-video" src={item.videoUrl} controls preload="metadata" />}
                  <div className="mt-3 flex gap-2"><button type="button" className="page-button-secondary" onClick={() => { setEditingId(item._id); setForm({ title: item.title || "", description: item.description || "", topic: item.topic || lessonTopics[0], videoUrl: item.videoUrl || "", status: item.status || "draft" }); setVideoFile(null); setVideoInputKey((value) => value + 1); setSuccess(""); }}>Edit</button><button type="button" className="page-button-danger" onClick={() => remove(item._id)}><Trash2 size={14} />Delete</button></div>
                </article>)}
              </div>
            )}
          </section>
          <form className="page-card page-form h-fit" onSubmit={save}>
            <h2>{editingId ? "Edit lesson" : "Create lesson"}</h2>
            <div className="page-field"><label htmlFor="lesson-title">Title</label><input id="lesson-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div>
            <div className="page-field"><label htmlFor="lesson-description">Description</label><textarea id="lesson-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></div>
            <div className="page-form-row">
              <div className="page-field"><label htmlFor="lesson-topic">Topic</label><select id="lesson-topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })}>{lessonTopics.map((topic) => <option key={topic}>{topic}</option>)}</select></div>
              <div className="page-field"><label htmlFor="lesson-status">Status</label><select id="lesson-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></div>
            </div>
            <div className="page-field">
              <label htmlFor="lesson-video">Lesson Video File</label>
              <input
                key={videoInputKey}
                id="lesson-video"
                type="file"
                accept="video/mp4,video/webm"
                required={!editingId}
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file && !["video/mp4", "video/webm"].includes(file.type)) {
                    setError("Choose an MP4 or WebM video file.");
                    event.target.value = "";
                    setVideoFile(null);
                    return;
                  }
                  if (file && file.size > 100 * 1024 * 1024) {
                    setError("The video file must be 100 MB or smaller.");
                    event.target.value = "";
                    setVideoFile(null);
                    return;
                  }
                  setError("");
                  setVideoFile(file);
                }}
                aria-describedby="lesson-video-help"
              />
              <span id="lesson-video-help" className="text-xs text-gray-500">
                {form.videoUrl
                  ? `Current saved video: ${form.videoUrl}${isYouTubeWatchUrl(form.videoUrl) ? " (This is a YouTube page, not an uploaded video.)" : ""}. Choose a new MP4 or WebM file to replace it.`
                  : "Choose an MP4 or WebM file. It will be uploaded to Cloudinary and saved as the lesson video URL."}
              </span>
              {videoFile && <span className="text-xs text-emerald-800">Selected: {videoFile.name}</span>}
              {videoFile && saving && (
                <div className="grid gap-1" aria-live="polite">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Uploading video…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-label="Video upload progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={uploadProgress}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-[width]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2"><button className="page-button" disabled={saving}>{saving ? videoFile ? "Uploading and saving…" : "Saving…" : editingId ? "Save changes" : <><Plus size={16} />Upload and create lesson</>}</button>{editingId && <button className="page-button-secondary" type="button" disabled={saving} onClick={() => { setForm(blankLesson); setVideoFile(null); setVideoInputKey((value) => value + 1); setEditingId(""); }}>Cancel</button>}</div>
          </form>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

const blankQuestion = () => ({ questionText: "", options: ["", ""], correctAnswer: "", points: 5 });
const blankQuiz = { title: "", lessonId: "", status: "draft", questions: [blankQuestion()] };

export function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [expandedQuizId, setExpandedQuizId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState(blankQuiz);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [quizData, lessonData] = await Promise.all([getQuizzes(), getLessons()]);
      setQuizzes(extractList(quizData, "quizzes"));
      setLessons(extractList(lessonData, "lessons"));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load quiz data."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    Promise.all([getQuizzes(), getLessons()]).then(([quizData, lessonData]) => {
      if (active) {
        setQuizzes(extractList(quizData, "quizzes"));
        setLessons(extractList(lessonData, "lessons"));
      }
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load quiz data."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function updateQuestion(index, updates) {
    setForm((current) => ({ ...current, questions: current.questions.map((question, i) => i === index ? { ...question, ...updates } : question) }));
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createQuiz({
        ...form,
        questions: form.questions.map((question) => ({
          ...question,
          options: question.options.map((option) => option.trim()).filter(Boolean),
          correctAnswer: question.correctAnswer.trim(),
        })),
      });
      setSuccess("Quiz created.");
      setForm({ ...blankQuiz, questions: [blankQuestion()] });
      await reload();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to create quiz."));
    } finally {
      setSaving(false);
    }
  }
  async function remove(id) {
    if (!window.confirm("Delete this quiz and its questions?")) return;
    try {
      await deleteQuiz(id);
      setSuccess("Quiz deleted.");
      await reload();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to delete quiz."));
    }
  }
  async function removeQuestion(quizId, questionId) {
    if (!window.confirm("Delete this question from the quiz?")) return;
    try {
      await deleteQuizQuestion(quizId, questionId);
      setSuccess("Question deleted.");
      await reload();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to delete question."));
    }
  }
  const matchingQuizzes = quizzes.filter((quiz) => {
    const lesson = typeof quiz.lessonId === "object"
      ? `${quiz.lessonId?.title || ""} ${quiz.lessonId?.topic || ""}`
      : lessons.find((item) => item._id === quiz.lessonId)?.title || "";
    const query = `${quiz.title || ""} ${lesson} ${quiz.status || ""}`.toLowerCase();
    return (statusFilter === "all" || quiz.status === statusFilter) && query.includes(search.trim().toLowerCase());
  });
  const quizStatuses = [
    ["all", "All"],
    ["draft", "Draft"],
    ["published", "Published"],
  ];
  return (
    <WorkspaceLayout role="admin">
      <div className="page-stack">
        <Heading title="Quiz management" description="Create quizzes from lesson data and manage existing quizzes." />
        <Message error={error} success={success} />
        <section className="page-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2>Existing quizzes</h2>
            <input className="page-search max-w-xs" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, lesson, or status…" aria-label="Search quizzes" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter quizzes by status">
            {quizStatuses.map(([status, label]) => {
              const count = status === "all" ? quizzes.length : quizzes.filter((quiz) => quiz.status === status).length;
              return <button key={status} type="button" className={statusFilter === status ? "page-button" : "page-button-secondary"} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>{label} ({count})</button>;
            })}
          </div>
          {loading ? <div className="page-loading">Loading quizzes…</div> : matchingQuizzes.length === 0 ? <div className="page-empty mt-3">{quizzes.length ? "No quizzes match your search and filters." : "No quizzes have been created."}</div> : (
            <div className="page-table-wrap mt-3"><table className="page-table"><thead><tr><th>Quiz</th><th>Lesson</th><th>Questions</th><th>Status</th><th>Action</th></tr></thead><tbody>{matchingQuizzes.map((quiz) => <tr key={quiz._id}><td>{quiz.title}</td><td>{quiz.lessonId?.title || lessons.find((lesson) => lesson._id === quiz.lessonId)?.title || "Lesson"}</td><td>{quiz.questions?.length ?? "—"}</td><td><span className={`page-badge ${quiz.status === "published" ? "page-badge--success" : "page-badge--warning"}`}>{quiz.status}</span></td><td><div className="flex flex-wrap gap-2"><button type="button" className="page-button-secondary" onClick={() => setExpandedQuizId(expandedQuizId === quiz._id ? "" : quiz._id)}>{expandedQuizId === quiz._id ? "Hide questions" : "Manage questions"}</button><button type="button" className="page-button-danger" onClick={() => remove(quiz._id)}><Trash2 size={14} />Delete</button></div></td></tr>)}</tbody></table></div>
          )}
          {expandedQuizId && quizzes.find((quiz) => quiz._id === expandedQuizId) && (
            <div className="mt-4 grid gap-2">
              <h3 className="text-sm font-bold text-emerald-900">Questions</h3>
              {quizzes.find((quiz) => quiz._id === expandedQuizId).questions?.map((question, index) => (
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3" key={question._id}>
                  <p className="m-0 min-w-0 flex-1 break-words text-sm">{index + 1}. {question.questionText}</p>
                  <button type="button" className="page-button-danger" disabled={quizzes.find((quiz) => quiz._id === expandedQuizId).questions.length <= 1} title={quizzes.find((quiz) => quiz._id === expandedQuizId).questions.length <= 1 ? "A quiz must keep at least one question." : "Delete question"} onClick={() => removeQuestion(expandedQuizId, question._id)}><Trash2 size={14} />Delete question</button>
                </div>
              ))}
            </div>
          )}
        </section>
        <form className="page-card page-form" onSubmit={save}>
          <h2>Create quiz</h2>
          <div className="page-form-row">
            <div className="page-field"><label htmlFor="quiz-title">Quiz title</label><input id="quiz-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div>
            <div className="page-field"><label htmlFor="quiz-lesson">Lesson</label><select id="quiz-lesson" value={form.lessonId} onChange={(event) => setForm({ ...form, lessonId: event.target.value })} required><option value="">Choose a lesson</option>{lessons.map((lesson) => <option value={lesson._id} key={lesson._id}>{lesson.title}</option>)}</select></div>
          </div>
          <div className="page-field max-w-xs"><label htmlFor="quiz-status">Status</label><select id="quiz-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <div className="grid gap-3">
            {form.questions.map((question, index) => <section className="rounded-xl border border-gray-200 p-4" key={index}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-emerald-900">Question {index + 1}</h3>{form.questions.length > 1 && <button type="button" className="page-button-danger" onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) })}><Trash2 size={14} />Remove</button>}</div>
              <div className="page-form">
                <div className="page-field"><label htmlFor={`question-${index}`}>Question text</label><textarea id={`question-${index}`} value={question.questionText} onChange={(event) => updateQuestion(index, { questionText: event.target.value })} required /></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => <div className="page-field" key={optionIndex}><label htmlFor={`option-${index}-${optionIndex}`}>Option {optionIndex + 1}</label><input id={`option-${index}-${optionIndex}`} value={option} onChange={(event) => updateQuestion(index, { options: question.options.map((value, i) => i === optionIndex ? event.target.value : value) })} required /></div>)}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="page-field min-w-[220px] flex-1"><label htmlFor={`correct-${index}`}>Correct answer</label><select id={`correct-${index}`} value={question.correctAnswer} onChange={(event) => updateQuestion(index, { correctAnswer: event.target.value })} required><option value="">Choose the correct option</option>{question.options.filter(Boolean).map((option, optionIndex) => <option key={`${optionIndex}-${option}`}>{option}</option>)}</select></div>
                  <div className="page-field w-32"><label htmlFor={`points-${index}`}>Points</label><input id={`points-${index}`} type="number" min="0" value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} /></div>
                </div>
              </div>
            </section>)}
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" className="page-button-secondary" onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}><Plus size={15} />Add question</button><button className="page-button" disabled={saving || lessons.length === 0}>{saving ? "Creating…" : "Create quiz"}</button></div>
          {lessons.length === 0 && <p className="m-0 text-xs text-amber-700">Create a lesson before adding a quiz.</p>}
        </form>
      </div>
    </WorkspaceLayout>
  );
}

const blankChallenge = { title: "", description: "", lessonId: "", instructions: "", marks: 0, status: "draft" };

export function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [search, setSearch] = useState("");
  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState(blankChallenge);
  const [editingId, setEditingId] = useState("");
  const [challengePage, setChallengePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function reload(nextPage = challengePage) {
    setLoading(true);
    setError("");
    try {
      const [challengeData, lessonData] = await Promise.all([getAllChallenges(), getLessons()]);
      setChallenges(challengeData);
      setChallengePage(nextPage);
      setLessons(extractList(lessonData, "lessons"));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load challenge data."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    Promise.all([getAllChallenges(), getLessons()]).then(([challengeData, lessonData]) => {
      if (active) {
        setChallenges(challengeData);
        setLessons(extractList(lessonData, "lessons"));
      }
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load challenge data."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = { ...form, marks: Number(form.marks) };
      if (editingId) await updateChallenge(editingId, payload);
      else await createChallenge(payload);
      setSuccess(editingId ? "Challenge updated." : "Challenge created.");
      setForm(blankChallenge);
      setEditingId("");
      setChallengePage(1);
      await reload(1);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to save challenge."));
    } finally {
      setSaving(false);
    }
  }
  async function remove(id) {
    if (!window.confirm("Delete this challenge?")) return;
    try {
      await deleteChallenge(id);
      setSuccess("Challenge deleted.");
      setChallengePage(1);
      await reload(1);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to delete challenge."));
    }
  }
  const visibleChallenges = challenges.filter((item) => {
    const lesson = `${item.lessonId?.title || ""} ${item.lessonId?.topic || ""}`;
    return `${item.title || ""} ${item.description || ""} ${lesson}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const challengePageSize = 10;
  const challengeTotalPages = Math.max(1, Math.ceil(visibleChallenges.length / challengePageSize));
  const pageChallenges = visibleChallenges.slice((challengePage - 1) * challengePageSize, challengePage * challengePageSize);

  return (
    <WorkspaceLayout role="admin">
      <div className="page-stack">
        <Heading title="Challenge management" description="Create and publish challenges for students. Challenge reference media is not part of the current backend model." />
        <Message error={error} success={success} />
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <section className="page-card page-stack">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2>Challenges</h2><input className="page-search max-w-xs" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setChallengePage(1); }} placeholder="Search challenges…" aria-label="Search challenges" /></div>
            {loading ? <div className="page-loading">Loading challenges…</div> : visibleChallenges.length === 0 ? <div className="page-empty">{challenges.length ? "No matching challenges." : "No challenges have been created."}</div> : pageChallenges.map((item) => <article className="rounded-xl border border-gray-100 p-4" key={item._id}>
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words text-base font-bold text-emerald-900">{item.title}</h3><span className="page-badge">{item.status}</span></div>
              {(item.lessonId?.title || item.lessonId?.topic) && <p className="mb-1 mt-2 text-xs text-gray-500">{item.lessonId?.title}{item.lessonId?.topic ? ` · ${item.lessonId.topic}` : ""}</p>}
              <p className="mt-2 text-sm">{item.description}</p>
              {item.marks !== undefined && <span className="page-badge">{item.marks} available marks</span>}
              {item.instructions && <p className="whitespace-pre-wrap text-xs leading-5 text-gray-500">{item.instructions}</p>}
              <div className="mt-3 flex gap-2"><button className="page-button-secondary" type="button" onClick={() => { setEditingId(item._id); setForm({ title: item.title || "", description: item.description || "", lessonId: item.lessonId?._id || item.lessonId || "", instructions: item.instructions || "", marks: item.marks ?? 0, status: item.status === "published" ? "published" : "draft" }); setSuccess(""); }}>Edit</button><button className="page-button-danger" type="button" onClick={() => remove(item._id)}><Trash2 size={14} />Delete</button></div>
            </article>)}
            {!loading && challengeTotalPages > 1 && <div className="flex items-center justify-center gap-3">
              <button type="button" className="page-button-secondary" disabled={challengePage <= 1} onClick={() => setChallengePage((value) => value - 1)}>Previous</button>
              <span className="text-xs text-gray-600">Page {challengePage} of {challengeTotalPages}</span>
              <button type="button" className="page-button-secondary" disabled={challengePage >= challengeTotalPages} onClick={() => setChallengePage((value) => value + 1)}>Next</button>
            </div>}
          </section>
          <form className="page-card page-form h-fit" onSubmit={save}>
            <h2>{editingId ? "Edit challenge" : "Create challenge"}</h2>
            <div className="page-field"><label htmlFor="challenge-title">Title</label><input id="challenge-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div>
            <div className="page-field"><label htmlFor="challenge-description">Description</label><textarea id="challenge-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></div>
            <div className="page-field"><label htmlFor="challenge-instructions">Instructions</label><textarea id="challenge-instructions" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} required /></div>
            <div className="page-form-row">
              <div className="page-field"><label htmlFor="challenge-lesson">Related lesson</label><select id="challenge-lesson" value={form.lessonId} onChange={(event) => setForm({ ...form, lessonId: event.target.value })} required><option value="">Choose a lesson</option>{lessons.map((lesson) => <option value={lesson._id} key={lesson._id}>{lesson.title}</option>)}</select></div>
              <div className="page-field"><label htmlFor="challenge-status">Status</label><select id="challenge-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></div>
            </div>
            <div className="page-field max-w-xs"><label htmlFor="challenge-marks">Available marks</label><input id="challenge-marks" type="number" min="0" value={form.marks} onChange={(event) => setForm({ ...form, marks: event.target.value })} /></div>
            <p className="m-0 text-xs text-gray-500">The current Challenge model has no reference image/video field.</p>
            <div className="flex gap-2"><button className="page-button" disabled={saving || lessons.length === 0}>{saving ? "Saving…" : editingId ? "Save changes" : <><Plus size={16} />Create challenge</>}</button>{editingId && <button type="button" className="page-button-secondary" onClick={() => { setEditingId(""); setForm(blankChallenge); }}>Cancel</button>}</div>
          </form>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

export function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function reload(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      setSubmissions(await getAllSubmissionPages());
      setPage(nextPage);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load challenge submissions."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    getAllSubmissionPages().then((data) => {
      if (active) {
        setSubmissions(data);
      }
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load challenge submissions."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  function changeReview(id, updates) {
    setReviews((value) => ({ ...value, [id]: { status: "approved", marks: "", feedback: "", ...value[id], ...updates } }));
  }
  async function saveReview(id, defaultStatus) {
    if (savingId) return;
    const review = reviews[id] || {};
    const status = review.status || defaultStatus;
    setSavingId(id);
    setError("");
    setSuccess("");
    try {
      const payload = { status, feedback: review.feedback || "" };
      if (review.marks !== "") payload.marks = Number(review.marks);
      await reviewSubmission(id, payload);
      setSubmissions((items) => items.map((item) => item._id === id ? { ...item, ...payload } : item));
      setPage(1);
      setSuccess("Submission review saved.");
      await reload(1);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to review this submission."));
    } finally {
      setSavingId("");
    }
  }
  const visibleSubmissions = submissions.filter((item) => {
    const text = `${item.studentId?.name || ""} ${item.studentId?.email || ""} ${item.challengeId?.title || ""} ${item.status || ""}`.toLowerCase();
    return (statusFilter === "all" || item.status === statusFilter) && text.includes(search.trim().toLowerCase());
  });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(visibleSubmissions.length / pageSize));
  const pageSubmissions = visibleSubmissions.slice((page - 1) * pageSize, page * pageSize);
  const submissionStatuses = [
    ["all", "All"],
    ["pending", "Pending"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
  ];
  return (
    <WorkspaceLayout role="admin">
      <div className="page-stack">
        <Heading title="Submission review" description="Review student proof and submit an approval or rejection with optional marks and feedback." />
        <Message error={error} success={success} />
        <section className="page-card page-stack">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2>Challenge submissions</h2>
            <input className="page-search max-w-xs" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search student or challenge…" aria-label="Search challenge submissions" />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter submissions by status">
            {submissionStatuses.map(([status, label]) => {
              const count = status === "all" ? submissions.length : submissions.filter((item) => item.status === status).length;
              return <button key={status} type="button" className={statusFilter === status ? "page-button" : "page-button-secondary"} aria-pressed={statusFilter === status} onClick={() => { setStatusFilter(status); setPage(1); }}>{label} ({count})</button>;
            })}
          </div>
          <p className="m-0 text-xs text-gray-500">Counts include all submissions returned by the submissions API.</p>
        </section>
        {loading ? <div className="page-card page-loading">Loading submissions…</div> : visibleSubmissions.length === 0 ? <div className="page-card page-empty">{submissions.length ? "No submissions match your search and filters." : "There are no challenge submissions yet."}</div> : pageSubmissions.map((item) => {
          const review = reviews[item._id] || { status: item.status === "pending" ? "approved" : item.status || "approved", marks: item.marks ?? "", feedback: item.feedback || "" };
          return <article className="page-card grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]" key={item._id}>
            <div className="page-stack">
              <div><h2>{item.challengeId?.title || "Challenge"}</h2><p className="mb-0 mt-1 text-sm">{item.studentId?.name || "Student"} · {item.studentId?.email || "Email unavailable"}</p></div>
              {item.proofUrl && (item.proofType === "video" ? <video className="page-media aspect-video" src={item.proofUrl} controls /> : <a href={item.proofUrl} target="_blank" rel="noreferrer"><img className="page-media aspect-video" src={item.proofUrl} alt="Student submitted proof" /></a>)}
              {!item.proofUrl && <p className="m-0 text-sm text-gray-500">Proof file is unavailable.</p>}
              <p className="m-0 text-xs text-gray-500">Submitted {item.createdAt ? new Date(item.createdAt).toLocaleString() : "date unavailable"}</p>
              {item.proofUrl && <a className="break-all text-sm font-semibold text-emerald-800 hover:underline" href={item.proofUrl} target="_blank" rel="noreferrer">Open proof</a>}
              <span className={`page-badge w-fit ${item.status === "pending" ? "page-badge--warning" : item.status === "rejected" ? "page-badge--danger" : "page-badge--success"}`}>{item.status || "pending"}</span>
            </div>
            <div className="page-form content-start">
              <div className="page-field"><label htmlFor={`review-status-${item._id}`}>Decision</label><select id={`review-status-${item._id}`} value={review.status} onChange={(event) => changeReview(item._id, { status: event.target.value })}><option value="approved">Approve</option><option value="rejected">Reject</option></select></div>
              <div className="page-field"><label htmlFor={`review-marks-${item._id}`}>Marks</label><input id={`review-marks-${item._id}`} type="number" min="0" value={review.marks} onChange={(event) => changeReview(item._id, { marks: event.target.value })} /></div>
              <div className="page-field"><label htmlFor={`review-feedback-${item._id}`}>Feedback</label><textarea id={`review-feedback-${item._id}`} value={review.feedback} onChange={(event) => changeReview(item._id, { feedback: event.target.value })} /></div>
              <button type="button" className="page-button w-fit" disabled={savingId === item._id} onClick={() => saveReview(item._id, review.status)}>{savingId === item._id ? "Saving…" : "Save review"}</button>
            </div>
          </article>;
        })}
        {!loading && totalPages > 1 && <div className="flex items-center justify-center gap-3">
          <button type="button" className="page-button-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
          <button type="button" className="page-button-secondary" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>}
      </div>
    </WorkspaceLayout>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function reload(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers(nextPage);
      setUsers(extractList(data, "users"));
      setPagination(data?.pagination || null);
      setPage(nextPage);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load students."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    getUsers(1).then((data) => {
      if (active) {
        setUsers(extractList(data, "users"));
        setPagination(data?.pagination || null);
      }
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load students."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const visible = users.filter((user) => `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(search.toLowerCase()));
  async function showUser(id) {
    setError("");
    try {
      setSelectedUser(await getUser(id));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load student details."));
    }
  }
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateUser(editingId, { name: form.name.trim(), email: form.email.trim() });
      setSuccess("Student details updated.");
      setEditingId("");
      await reload();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update student."));
    } finally {
      setSaving(false);
    }
  }
  async function remove(id) {
    if (!window.confirm("Permanently delete this student account?")) return;
    try {
      await deleteUser(id);
      setSuccess("Student deleted.");
      await reload();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to delete student."));
    }
  }
  return (
    <WorkspaceLayout role="admin">
      <div className="page-stack">
        <Heading title="Student management" description="Search students and manage only the name and email fields supported by the user API." />
        <Message error={error} success={success} />
        <section className="page-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2>Students</h2><input className="page-search max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email…" aria-label="Search students" /></div>
          {loading ? <div className="page-loading">Loading students…</div> : visible.length === 0 ? <div className="page-empty">No students match this search.</div> : (
            <div className="page-table-wrap"><table className="page-table"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td><span className="page-badge page-badge--muted">{user.status || "—"}</span></td><td><div className="flex flex-wrap gap-2"><button className="page-button-secondary" type="button" onClick={() => showUser(user._id)}>View</button><button className="page-button-secondary" type="button" onClick={() => { setEditingId(user._id); setForm({ name: user.name || "", email: user.email || "" }); }}>Edit</button><button className="page-button-danger" type="button" onClick={() => remove(user._id)}><Trash2 size={14} />Delete</button></div></td></tr>)}</tbody></table></div>
          )}
          {!loading && pagination?.totalPages > 1 && <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" className="page-button-secondary" disabled={page <= 1} onClick={() => reload(page - 1)}>Previous</button>
            <span className="text-xs text-gray-600">Page {page} of {pagination.totalPages}</span>
            <button type="button" className="page-button-secondary" disabled={page >= pagination.totalPages} onClick={() => reload(page + 1)}>Next</button>
          </div>}
        </section>
        {selectedUser && <section className="page-card max-w-xl">
          <div className="mb-4 flex items-center justify-between gap-3"><h2>Student details</h2><button className="page-button-secondary" type="button" onClick={() => setSelectedUser(null)}>Close</button></div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-gray-500">Name</dt><dd className="mt-1 font-semibold">{selectedUser.name}</dd></div>
            <div><dt className="text-xs text-gray-500">Email</dt><dd className="mt-1 break-all font-semibold">{selectedUser.email}</dd></div>
            <div><dt className="text-xs text-gray-500">Role</dt><dd className="mt-1 font-semibold">{selectedUser.role}</dd></div>
            <div><dt className="text-xs text-gray-500">Status</dt><dd className="mt-1 font-semibold">{selectedUser.status}</dd></div>
            {selectedUser.createdAt && <div><dt className="text-xs text-gray-500">Joined</dt><dd className="mt-1 font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</dd></div>}
          </dl>
        </section>}
        {editingId && <form className="page-card page-form max-w-xl" onSubmit={save}>
          <h2>Edit student</h2>
          <div className="page-field"><label htmlFor="user-name">Name</label><input id="user-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
          <div className="page-field"><label htmlFor="user-email">Email</label><input id="user-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
          <div className="flex gap-2"><button className="page-button" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button><button type="button" className="page-button-secondary" onClick={() => setEditingId("")}>Cancel</button></div>
        </form>}
      </div>
    </WorkspaceLayout>
  );
}

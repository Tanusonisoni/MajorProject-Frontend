import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Leaf,
  Target,
  Upload,
} from "lucide-react";
import WorkspaceLayout from "../../layout/WorkspaceLayout";
import {
  getApiError,
  getChallenge,
  getChallenges,
  getLeaderboard,
  getLesson,
  getLessons,
  getMySubmissions,
  getNotifications,
  getProfile,
  getQuiz,
  getQuizzes,
  getStudentDashboard,
  markNotificationRead,
  submitChallengeProof,
  submitQuiz,
  updateProfile,
} from "../../services.jsx/adminApi";

function PageHeading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function RequestState({ loading, error, empty, children }) {
  if (loading) return <div className="page-card page-loading">Loading…</div>;
  if (error) return <div className="page-alert page-alert-error" role="alert">{error}</div>;
  if (empty) return <div className="page-card page-empty">{empty}</div>;
  return children;
}

function lessonArray(result) {
  return Array.isArray(result) ? result : Array.isArray(result?.lessons) ? result.lessons : [];
}

function quizArray(result) {
  return Array.isArray(result) ? result : Array.isArray(result?.quizzes) ? result.quizzes : [];
}

function challengeArray(result) {
  return Array.isArray(result) ? result : Array.isArray(result?.challenge) ? result.challenge : [];
}

async function getAllChallenges() {
  const firstPage = await getChallenges(1, 100);
  const challenges = challengeArray(firstPage);
  const totalPages = Number(firstPage?.pagination?.totalPages) || 1;
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => getChallenges(index + 2, 100)),
  );
  return challenges.concat(...remainingPages.map(challengeArray));
}

function mediaErrorMessage(error) {
  switch (error?.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "Video playback was interrupted. Try playing the lesson again.";
    case MediaError.MEDIA_ERR_NETWORK:
      return "The video could not be downloaded. Check your connection and the Cloudinary delivery URL.";
    case MediaError.MEDIA_ERR_DECODE:
      return "The video was downloaded but could not be decoded. The uploaded file may use an unsupported or damaged encoding.";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "The video source or format is not supported by this browser. Check that the Cloudinary URL delivers a browser-compatible video.";
    default:
      return "The lesson video could not be played. Check the Cloudinary video URL and try again.";
  }
}

function isYouTubeWatchPage(url) {
  try {
    const parsedUrl = new URL(url);
    return ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsedUrl.hostname.toLowerCase())
      && parsedUrl.pathname === "/watch";
  } catch {
    return false;
  }
}

// function LessonVideo({ url }) {
//   const [mediaError, setMediaError] = useState(null);

//   if (typeof url !== "string" || !url.trim()) {

//     return <p className="page-alert page-alert-error m-0">No lesson video URL is available.</p>;
//   }
//   if (isYouTubeWatchPage(url)) {
//     return <p className="page-alert page-alert-error m-0" role="alert">
//       This lesson has a YouTube watch-page URL saved instead of its Cloudinary video URL. Ask an administrator to edit the lesson and upload the original video file again.
//     </p>;
//   }
//   return (
//     <>
//       <video
//         className="page-media aspect-video"
//         src={url.trim()}
//         controls
//         playsInline
//         preload="metadata"
//         onError={(event) => setMediaError(event.currentTarget.error)}
//       />
//       {mediaError && (
//         <div className="page-alert page-alert-error" role="alert">
//           {mediaErrorMessage(mediaError)}
//           {mediaError.message && <span> Media detail: {mediaError.message}</span>}
//           {" "}
//           <a href={url.trim()} target="_blank" rel="noreferrer">Open the Cloudinary video URL</a>.
//         </div>
//       )}
//     </>
//   );
// }


function LessonVideo({ url }) {
  const [mediaError, setMediaError] = useState(null);

  if (typeof url !== "string" || !url.trim()) {
    return (
      <p className="page-alert page-alert-error m-0">
        No lesson video URL is available.
      </p>
    );
  }

  const videoUrl = url.trim();

  return (
    <>
      <video
        key={videoUrl}
        className="page-media aspect-video"
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        onError={(event) => {
          const error = event.currentTarget.error;
          setMediaError(error);
          console.error("Lesson video playback failed:", {
            videoUrl,
            errorCode: error?.code,
            errorMessage: error?.message,
          });
        }}
      />

      {mediaError && (
        <div className="page-alert page-alert-error" role="alert">
          Video play nahi ho raha hai. Check the video URL and browser console.
          {mediaError.message && (
            <span> Media detail: {mediaError.message}</span>
          )}
          {" "}
          <a href={videoUrl} target="_blank" rel="noreferrer">
            Open video URL
          </a>
        </div>
      )}
    </>
  );
}


export function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getStudentDashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError, "Unable to load your dashboard."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const stats = [
    { label: "Total marks", value: data?.totalMarks, icon: Award },
    { label: "Quiz marks", value: data?.quizMarks, icon: FileQuestion },
    { label: "Challenge marks", value: data?.challengeMarks, icon: Target },
    { label: "Lessons completed", value: data?.completedLessons, icon: BookOpen },
  ].filter((item) => item.value !== undefined && item.value !== null);

  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <PageHeading title="Your learning dashboard" description="Keep learning about the planet and track your progress." />
        {error && <div className="page-alert page-alert-error" role="alert">{error}</div>}
        {loading ? (
          <div className="page-grid">
            {Array.from({ length: 3 }, (_, index) => <div className="page-card page-loading" key={index}>Loading…</div>)}
          </div>
        ) : !error && (
          <>
            <div className="page-grid">
              {stats.map(({ label, value, icon: Icon }) => (
                <article className="stat-card" key={label}>
                  <span className="stat-icon">{createElement(Icon, { size: 21 })}</span>
                  <div><span>{label}</span><strong>{value}</strong></div>
                </article>
              ))}
              {data?.progressPercentage !== undefined && (
                <article className="page-card">
                  <span className="text-xs font-semibold text-gray-500">Learning progress</span>
                  <strong className="mt-2 block text-2xl font-extrabold text-emerald-800">{data.progressPercentage}%</strong>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, Math.max(0, data.progressPercentage))}%` }} />
                  </div>
                  {data.totalLessons !== undefined && <p className="mb-0 mt-2 text-xs text-gray-500">{data.completedLessons} of {data.totalLessons} lessons</p>}
                </article>
              )}
            </div>
            <section className="page-card">
              <h2>Continue your quest</h2>
              <p className="mt-2 text-sm">Explore published lessons, take an available quiz, or contribute to a challenge.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="page-button" to="/student/lessons"><BookOpen size={16} /> Browse lessons</Link>
                <Link className="page-button-secondary" to="/student/quizzes"><FileQuestion size={16} /> View quizzes</Link>
                <Link className="page-button-secondary" to="/student/challenges"><Leaf size={16} /> Explore challenges</Link>
              </div>
            </section>
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}

export function StudentLessons() {
  const [lessons, setLessons] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getLessons().then((result) => {
      if (active) setLessons(lessonArray(result));
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load lessons."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const visibleLessons = lessons.filter((lesson) => `${lesson.title || ""} ${lesson.topic || ""} ${lesson.description || ""}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <PageHeading title="Lessons" description="Choose a lesson and explore its environmental topic." />
        <p className="m-0 text-xs text-gray-500">Your overall completion total is available from the learning dashboard; the current API does not expose completion for individual lessons.</p>
        <input className="page-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lessons by title or topic…" aria-label="Search lessons" />
        <RequestState loading={loading} error={error} empty={lessons.length === 0 && "No published lessons are available yet."}>
          {visibleLessons.length === 0 ? <div className="page-card page-empty">No lessons match your search.</div> :
          <div className="lesson-card-grid">
            {visibleLessons.map((lesson) => (
              <article className="lesson-card" key={lesson._id}>
                {lesson.topic && <span className="lesson-topic">{lesson.topic}</span>}
                <h2 className="break-words">{lesson.title}</h2>
                <p className="lesson-description">{lesson.description}</p>
                <div className="lesson-card-meta">
                  <span className={`page-badge ${lesson.videoUrl ? "lesson-video-available" : "page-badge--muted"}`}>{lesson.videoUrl ? "Video available" : "No video"}</span>
                  <span className="page-badge page-badge--muted">Completion not tracked per lesson</span>
                </div>
                <Link className="page-button lesson-watch-action" to={`/student/lessons/${lesson._id}`}>Watch lesson</Link>
              </article>
            ))}
          </div>}
        </RequestState>
      </div>
    </WorkspaceLayout>
  );
}

export function StudentLessonDetail() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getLesson(id).then((result) => {
      if (active) setLesson(result);
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load this lesson."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <Link className="text-sm font-semibold text-emerald-800 hover:underline" to="/student/lessons">← All lessons</Link>
        <RequestState loading={loading} error={error} empty={!lesson && "Lesson not found."}>
          {lesson && (
            <>
              <PageHeading title={lesson.title} description={lesson.topic || "Environmental learning"} />
              <section className="page-card page-stack">
                {lesson.videoUrl ? <LessonVideo key={lesson.videoUrl} url={lesson.videoUrl} /> : <p className="page-alert page-alert-error m-0">No video has been added to this lesson yet.</p>}
                <p className="m-0 whitespace-pre-wrap text-sm leading-7">{lesson.description}</p>
              </section>
            </>
          )}
        </RequestState>
      </div>
    </WorkspaceLayout>
  );
}

export function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getQuizzes().then((result) => {
      if (active) setQuizzes(quizArray(result));
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load quizzes."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const visibleQuizzes = quizzes.filter((quiz) => `${quiz.title || ""} ${quiz.lessonId?.title || ""} ${quiz.lessonId?.topic || ""} ${quiz.status || ""}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <PageHeading title="Quizzes" description="Check your understanding with quizzes connected to your lessons." />
        <input className="page-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search quizzes by title, lesson, or status…" aria-label="Search quizzes" />
        <RequestState loading={loading} error={error} empty={quizzes.length === 0 && "No published quizzes are available yet."}>
          {visibleQuizzes.length === 0 ? <div className="page-card page-empty">No quizzes match your search.</div> :
          <div className="page-grid">
            {visibleQuizzes.map((quiz) => (
              <article className="page-card flex min-w-0 flex-col gap-3" key={quiz._id}>
                <span className="stat-icon"><FileQuestion size={21} /></span>
                <h2 className="break-words">{quiz.title}</h2>
                {quiz.lessonId?.title && <p className="m-0 text-sm">Lesson: {quiz.lessonId.title}</p>}
                {quiz.lessonId?.topic && <span className="page-badge w-fit">{quiz.lessonId.topic}</span>}
                <Link className="page-button mt-auto w-fit" to={`/student/quizzes/${quiz._id}`}>View quiz</Link>
              </article>
            ))}
          </div>}
        </RequestState>
      </div>
    </WorkspaceLayout>
  );
}

function readStoredAttempt(id) {
  const raw = sessionStorage.getItem(`ecoquest-quiz-${id}`);
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw);
    if (saved && (saved.expiresAt === null || Number.isFinite(saved.expiresAt)) && saved.answers && typeof saved.answers === "object") return saved;
  } catch {
    sessionStorage.removeItem(`ecoquest-quiz-${id}`);
  }
  return null;
}

export function StudentQuizAttempt() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [fetchedLesson, setFetchedLesson] = useState(null);
  const [lessonLookupError, setLessonLookupError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [attemptBlocked, setAttemptBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(() => Boolean(readStoredAttempt(id)));
  const [remaining, setRemaining] = useState(() => {
    const saved = readStoredAttempt(id);
    return saved?.expiresAt ? Math.max(0, Math.ceil((saved.expiresAt - Date.now()) / 1000)) : 0;
  });
  const [answers, setAnswers] = useState(() => readStoredAttempt(id)?.answers || {});
  const [hasDeadline, setHasDeadline] = useState(() => Boolean(readStoredAttempt(id)?.expiresAt));
  const answersRef = useRef(answers);
  const expiresAtRef = useRef(readStoredAttempt(id)?.expiresAt || null);
  const submittingRef = useRef(false);
  const expiryHandledRef = useRef(false);
  const navigate = useNavigate();
  const relatedLesson = typeof quiz?.lessonId === "object" ? quiz.lessonId : fetchedLesson;
  const durationSeconds = Number.isFinite(Number(quiz?.timeLimitSeconds)) && Number(quiz.timeLimitSeconds) > 0
    ? Number(quiz.timeLimitSeconds)
    : Number.isFinite(Number(quiz?.timeLimitMinutes)) && Number(quiz.timeLimitMinutes) > 0
      ? Number(quiz.timeLimitMinutes) * 60
      : null;

  useEffect(() => {
    let active = true;
    getQuiz(id).then((data) => {
      if (active) setQuiz(data);
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load this quiz."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const lessonId = quiz?.lessonId?._id || quiz?.lessonId;
    if (!lessonId) return undefined;
    if (typeof quiz.lessonId === "object") return undefined;
    let active = true;
    getLesson(lessonId).then((lesson) => {
      if (active) setFetchedLesson(lesson);
    }).catch((requestError) => {
      if (active) setLessonLookupError(getApiError(requestError, "Unable to load this quiz's lesson details."));
    });
    return () => { active = false; };
  }, [quiz]);

  const sendAnswers = useCallback(async () => {
    if (submittingRef.current || result) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const payload = Object.entries(answersRef.current).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
      const submittedResult = await submitQuiz(id, payload);
      setResult(submittedResult);
      sessionStorage.removeItem(`ecoquest-quiz-${id}`);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to submit this quiz. Your answers remain available to retry."));
      if (requestError?.response?.status === 409) {
        setAttemptBlocked(true);
        sessionStorage.removeItem(`ecoquest-quiz-${id}`);
      }
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [id, result]);

  useEffect(() => {
    if (!started || result || !expiresAtRef.current) return undefined;
    if (remaining <= 0) {
      if (!expiryHandledRef.current) {
        expiryHandledRef.current = true;
        void sendAnswers();
      }
      return undefined;
    }
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, remaining, result, sendAnswers]);

  useEffect(() => {
    if (!started || result) return undefined;
    function warnBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    function confirmNavigation(event) {
      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank") return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      if (!window.confirm("Leave this quiz? Your answers are saved in this browser, but you may lose your place.")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    document.addEventListener("click", confirmNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      document.removeEventListener("click", confirmNavigation, true);
    };
  }, [started, result]);

  function startQuiz() {
    const expiresAt = durationSeconds ? Date.now() + durationSeconds * 1000 : null;
    expiresAtRef.current = expiresAt;
    setHasDeadline(Boolean(expiresAt));
    sessionStorage.setItem(`ecoquest-quiz-${id}`, JSON.stringify({ expiresAt, answers: answersRef.current }));
    setRemaining(durationSeconds || 0);
    expiryHandledRef.current = false;
    setStarted(true);
  }

  function chooseAnswer(questionId, answer) {
    const updated = { ...answersRef.current, [questionId]: answer };
    answersRef.current = updated;
    setAnswers(updated);
    const saved = readStoredAttempt(id);
    if (saved) sessionStorage.setItem(`ecoquest-quiz-${id}`, JSON.stringify({ ...saved, answers: updated }));
  }

  function submitManually() {
    if (window.confirm("Submit your answers now? You cannot attempt this quiz again after submission.")) {
      void sendAnswers();
    }
  }

  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const [activeQuestion, setActiveQuestion] = useState(0);
  const currentQuestion = questions[activeQuestion];
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <Link className="text-sm font-semibold text-emerald-800 hover:underline" to="/student/quizzes">← All quizzes</Link>
        {error && <div className="page-alert page-alert-error" role="alert">{error}</div>}
        {lessonLookupError && <div className="page-alert page-alert-error" role="alert">{lessonLookupError}</div>}
        {loading ? <div className="page-card page-loading">Loading quiz…</div> : !quiz ? null : attemptBlocked ? (
          <section className="page-card page-stack">
            <span className="page-badge page-badge--warning w-fit">Attempted</span>
            <PageHeading title="This quiz has already been attempted" description="The quiz service enforces the one-attempt rule. Saved marks cannot be retrieved because the current API has no student attempt-history endpoint." />
            <button type="button" className="page-button w-fit" onClick={() => navigate("/student/quizzes")}>Back to quizzes</button>
          </section>
        ) : result ? (
          <section className="page-card page-stack">
            <div className="stat-icon"><CheckCircle2 size={23} /></div>
            <PageHeading title="Quiz submitted" description="Your score was returned by the quiz service." />
            {result.score !== undefined && <p className="m-0 text-2xl font-extrabold text-emerald-800">Score: {result.score}{result.totalMarks !== undefined ? ` / ${result.totalMarks}` : ""}</p>}
            {result.totalMarks > 0 && result.score !== undefined && <p className="m-0 text-sm text-gray-600">Percentage: {Math.round((result.score / result.totalMarks) * 100)}%</p>}
            <span className="page-badge page-badge--success w-fit">Completed</span>
            {result.attemptedQuestions !== undefined && <p className="m-0 text-sm text-gray-600">Questions attempted: {result.attemptedQuestions}</p>}
            {result.correctAnswers !== undefined && result.totalQuestions !== undefined && <p className="m-0 text-sm text-gray-600">{result.correctAnswers} of {result.totalQuestions} correct</p>}
            <button type="button" className="page-button w-fit" onClick={() => navigate("/student/quizzes")}>Back to quizzes</button>
          </section>
        ) : !started ? (
          <section className="page-card page-stack">
            <span className="stat-icon"><Clock3 size={22} /></span>
            <PageHeading title={quiz.title} description={durationSeconds ? `You have ${Math.ceil(durationSeconds / 60)} minutes once you start. Your answers are saved in this browser if you refresh.` : "Your answers are saved in this browser if you refresh. No time limit is configured for this quiz."} />
            {(relatedLesson?.title || relatedLesson?.topic) && <p className="m-0 text-sm">Lesson: {relatedLesson.title || "Environmental learning"}{relatedLesson.topic ? ` · ${relatedLesson.topic}` : ""}</p>}
            <p className="m-0 text-sm text-gray-600">{questions.length} questions</p>
            {questions.some((question) => Number.isFinite(Number(question.points))) && <p className="m-0 text-sm text-gray-600">Total marks: {questions.reduce((total, question) => total + (Number(question.points) || 0), 0)}</p>}
            <button className="page-button w-fit" type="button" onClick={startQuiz}>Start quiz</button>
          </section>
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
            <section className="page-card page-stack">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2>{quiz.title}</h2><p className="mb-0 mt-1 text-sm">Question {activeQuestion + 1} of {questions.length}</p></div>
                {hasDeadline && <span className={`page-badge ${remaining < 60 ? "page-badge--danger" : ""}`} aria-live="polite"><Clock3 size={14} /> {minutes}:{seconds}</span>}
              </div>
              {currentQuestion ? (
                <>
                  <h3 className="text-base leading-7">{currentQuestion.questionText}</h3>
                  <div className="grid gap-2">
                    {(currentQuestion.options || []).map((option) => (
                      <label key={option} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${answers[currentQuestion._id] === option ? "border-violet-400 bg-violet-50" : "border-gray-200"}`}>
                        <input type="radio" name={`question-${currentQuestion._id}`} checked={answers[currentQuestion._id] === option} onChange={() => chooseAnswer(currentQuestion._id, option)} />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <button type="button" className="page-button-secondary" disabled={activeQuestion === 0} onClick={() => setActiveQuestion((value) => value - 1)}>Previous</button>
                    {activeQuestion < questions.length - 1 && <button type="button" className="page-button" onClick={() => setActiveQuestion((value) => value + 1)}>Next question</button>}
                  </div>
                </>
              ) : <p className="m-0 text-sm">This quiz has no questions.</p>}
              <button type="button" className="page-button w-fit" disabled={submitting || !Object.keys(answers).length} onClick={submitManually}>{submitting ? "Submitting…" : "Submit quiz"}</button>
            </section>
            <aside className="page-card h-fit">
              <h2>Questions</h2>
              <div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">
                {questions.map((question, index) => (
                  <button key={question._id} type="button" onClick={() => setActiveQuestion(index)} aria-label={`Go to question ${index + 1}`} className={`h-9 rounded-lg border text-xs font-bold ${index === activeQuestion ? "border-emerald-700 bg-emerald-700 text-white" : answers[question._id] ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-500"}`}>{index + 1}</button>
                ))}
              </div>
              <p className="mb-0 mt-4 text-xs text-gray-500">{Object.keys(answers).length} answered</p>
            </aside>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}

export function StudentChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getAllChallenges().then((result) => {
      if (active) {
        setChallenges(result);
      }
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load challenges."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    getMySubmissions().then((result) => {
      if (active) setSubmissions(Array.isArray(result) ? result : Array.isArray(result?.submissions) ? result.submissions : []);
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load your challenge progress."));
    });
    return () => { active = false; };
  }, []);
  const latestSubmissionByChallenge = new Map();
  for (const submission of submissions) {
    const challengeId = submission.challengeId?._id || submission.challengeId;
    if (challengeId && !latestSubmissionByChallenge.has(String(challengeId))) {
      latestSubmissionByChallenge.set(String(challengeId), submission);
    }
  }
  const visibleChallenges = challenges.filter((challenge) => {
    const submission = latestSubmissionByChallenge.get(String(challenge._id));
    const status = submission?.status || "not-submitted";
    const title = `${challenge.title || ""} ${challenge.description || ""} ${challenge.lessonId?.title || ""} ${challenge.lessonId?.topic || ""}`.toLowerCase();
    return (statusFilter === "all" || statusFilter === status) && title.includes(search.trim().toLowerCase());
  });
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(visibleChallenges.length / pageSize));
  const pageChallenges = visibleChallenges.slice((page - 1) * pageSize, page * pageSize);
  const studentName = localStorage.getItem("userName")?.trim() || "Signed-in student";
  const challengeStatuses = [
    ["all", "All"],
    ["not-submitted", "Not submitted"],
    ["pending", "Pending"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
  ];
  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <PageHeading title="Challenges" description="Take a real-world action and share proof of your work." action={<Link to="/student/submissions" className="page-button-secondary">My submissions</Link>} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input className="page-search max-w-md" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search challenges by title or topic…" aria-label="Search challenges" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter challenges by submission status">
            {challengeStatuses.map(([status, label]) => <button key={status} type="button" className={statusFilter === status ? "page-button" : "page-button-secondary"} aria-pressed={statusFilter === status} onClick={() => { setStatusFilter(status); setPage(1); }}>{label}</button>)}
          </div>
        </div>
        <RequestState loading={loading} error={error} empty={challenges.length === 0 && "No published challenges are available yet."}>
          {visibleChallenges.length === 0 ? <div className="page-card page-empty">No challenges match your search and filters.</div> :
          <div className="challenge-card-grid">
            {pageChallenges.map((challenge) => {
              const topic = challenge.lessonId?.topic || challenge.lessonId?.title || "Topic unavailable";
              const dueDate = challenge.dueDate
                ? new Date(challenge.dueDate).toLocaleDateString()
                : "No due date";
              return <Link className="challenge-card" to={`/student/challenges/${challenge._id}`} key={challenge._id}>
                <span className="challenge-card-label">CHALLENGE</span>
                <h2>{challenge.title}</h2>
                <p className="challenge-card-description">{challenge.description}</p>
                <div className="challenge-card-meta">
                  <span>{topic || "Topic unavailable"}</span>
                  <span>{dueDate}</span>
                  <strong>{challenge.marks !== undefined && challenge.marks !== null ? `${challenge.marks} points` : "Points unavailable"}</strong>
                </div>
                <section className="challenge-task">
                  <h3>Task</h3>
                  <p>{challenge.instructions}</p>
                </section>
                <footer className="challenge-card-footer"><span>Submitted by</span><strong>{studentName}</strong></footer>
              </Link>;
            })}
          </div>}
        </RequestState>
        {!loading && totalPages > 1 && <div className="flex items-center justify-center gap-3">
          <button type="button" className="page-button-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
          <button type="button" className="page-button-secondary" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>}
      </div>
    </WorkspaceLayout>
  );
}

export function StudentChallengeDetail() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");

  useEffect(() => {
    let active = true;
    getChallenge(id).then((result) => {
      if (active) setChallenge(result);
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load this challenge."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);
  useEffect(() => {
    let active = true;
    getMySubmissions().then((result) => {
      const items = Array.isArray(result) ? result : Array.isArray(result?.submissions) ? result.submissions : [];
      const submission = items.find((item) => String(item.challengeId?._id || item.challengeId) === String(id));
      if (active) setSubmissionStatus(submission?.status || "");
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load your existing submission status."));
    });
    return () => { active = false; };
  }, [id]);

  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  function selectFile(event) {
    const selected = event.target.files?.[0];
    setError("");
    setSuccess("");
    if (!selected) return;
    const supported = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
    if (!supported.includes(selected.type)) {
      setError("Choose a JPG, PNG, WebP, MP4, or WebM file.");
      event.target.value = "";
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      setError("The proof file must be 100 MB or smaller.");
      event.target.value = "";
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function submitProof(event) {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const submitted = await submitChallengeProof(id, file);
      setSubmissionStatus(submitted?.status || "pending");
      setSuccess(submitted?.status ? `Submission received (${submitted.status}).` : "Submission received successfully.");
      setFile(null);
      setPreview("");
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to submit proof."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <Link className="text-sm font-semibold text-emerald-800 hover:underline" to="/student/challenges">← All challenges</Link>
        {error && <div className="page-alert page-alert-error" role="alert">{error}</div>}
        {success && <div className="page-alert page-alert-success" role="status">{success}</div>}
        {loading ? <div className="page-card page-loading">Loading challenge…</div> : challenge && (
          <>
            <PageHeading title={challenge.title} description={challenge.description} />
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              <section className="page-card page-stack">
                <h2>Instructions</h2>
                <p className="m-0 whitespace-pre-wrap text-sm leading-7">{challenge.instructions}</p>
                {challenge.lessonId?.title && <p className="m-0 text-sm">Related lesson: {challenge.lessonId.title}</p>}
                {challenge.marks !== undefined && <span className="page-badge w-fit">{challenge.marks} available marks</span>}
              </section>
              <form className="page-card page-form" onSubmit={submitProof}>
                <h2>Submit your proof</h2>
                {submissionStatus && <span className={`page-badge w-fit ${submissionStatus === "pending" ? "page-badge--warning" : submissionStatus === "approved" ? "page-badge--success" : submissionStatus === "rejected" ? "page-badge--danger" : ""}`}>Latest submission: {submissionStatus}</span>}
                <p className="m-0 text-sm">Upload an image or video showing your own work.</p>
                <div className="page-field">
                  <label htmlFor="proof-file">Proof image or video</label>
                  <input id="proof-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={selectFile} />
                </div>
                {preview && (file?.type.startsWith("video/") ? <video className="page-media aspect-video" controls src={preview} /> : <img className="page-media aspect-video" src={preview} alt="Selected proof preview" />)}
                {file && <p className="m-0 break-all text-xs text-gray-500">{file.name}</p>}
                <button className="page-button w-fit" type="submit" disabled={!file || uploading}><Upload size={16} />{uploading ? "Uploading…" : "Submit proof"}</button>
              </form>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}

export function StudentSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getMySubmissions().then((result) => {
      if (active) setSubmissions(Array.isArray(result) ? result : []);
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load your submissions."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <PageHeading title="My submissions" description="Check review status and feedback returned by the challenge service." />
        <RequestState loading={loading} error={error} empty={submissions.length === 0 && "You have not submitted any challenge proof yet."}>
          <div className="grid gap-3">
            {submissions.map((item) => (
              <article className="page-card flex min-w-0 flex-wrap items-start justify-between gap-4" key={item._id}>
                <div className="min-w-0">
                  <h2 className="break-words">{item.challengeId?.title || "Challenge submission"}</h2>
                  <p className="mb-0 mt-2 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</p>
                  {item.feedback && <p className="mb-0 mt-2 text-sm">{item.feedback}</p>}
                  {item.marks !== undefined && <p className="mb-0 mt-2 text-xs">Marks: {item.marks}</p>}
                </div>
                <span className={`page-badge ${item.status === "rejected" ? "page-badge--danger" : item.status === "pending" ? "page-badge--warning" : ""}`}>{item.status || "pending"}</span>
              </article>
            ))}
          </div>
        </RequestState>
      </div>
    </WorkspaceLayout>
  );
}

function LeaderboardPage({ role }) {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getLeaderboard().then((result) => {
      if (active) setEntries(Array.isArray(result) ? result : []);
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load the leaderboard."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const userId = localStorage.getItem("userId");
  const currentEntry = entries.find((entry) => String(entry.studentId) === userId);
  const visibleEntries = entries.filter((entry) => (entry.name || "").toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <WorkspaceLayout role={role}>
      <div className="page-stack">
        <PageHeading title="Leaderboard" description="Rankings use quiz marks and approved challenge marks from the API." />
        {role === "student" && currentEntry && <div className="page-alert page-alert-success">Your current position: #{currentEntry.rank} · {currentEntry.totalMarks} marks</div>}
        <input className="page-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students…" aria-label="Search leaderboard by student name" />
        <RequestState loading={loading} error={error} empty={entries.length === 0 && "The leaderboard has no entries yet."}>
          {visibleEntries.length === 0 ? <div className="page-card page-empty">No students match your search.</div> : <>
            <section className="podium leaderboard-panel">
              {visibleEntries.filter((entry) => Number(entry.rank) <= 3).map((entry) => (
                <article
                  className={`podium-card podium-card--rank-${entry.rank}${role === "student" && String(entry.studentId) === userId ? " leaderboard-current" : ""}`}
                  key={entry.studentId}
                  aria-current={role === "student" && String(entry.studentId) === userId ? "true" : undefined}
                >
                  <span className="podium-rank">#{entry.rank}</span>
                  <strong>{entry.name || "Name unavailable"}</strong>
                  <span>{entry.totalMarks} total marks</span>
                  {(entry.quizMarks !== undefined || entry.challengeMarks !== undefined) && <span className="mt-1 block text-xs">{entry.quizMarks} quiz · {entry.challengeMarks} challenge</span>}
                </article>
              ))}
            </section>
            {visibleEntries.some((entry) => Number(entry.rank) > 3) && (
              <section className="page-card page-table-wrap leaderboard-results">
                <table className="page-table">
                  <thead><tr><th>Rank</th><th>Student</th><th>Quiz marks</th><th>Challenge marks</th><th>Total</th></tr></thead>
                  <tbody>{visibleEntries.filter((entry) => Number(entry.rank) > 3).map((entry) => (
                  <tr
                    className={role === "student" && String(entry.studentId) === userId ? "leaderboard-current" : undefined}
                    key={entry.studentId}
                    aria-current={role === "student" && String(entry.studentId) === userId ? "true" : undefined}
                  >
                    <td>#{entry.rank}</td><td>{entry.name || "Name unavailable"}</td><td>{entry.quizMarks}</td><td>{entry.challengeMarks}</td><td><strong>{entry.totalMarks}</strong></td>
                  </tr>
                  ))}</tbody>
                </table>
              </section>
            )}
          </>}
        </RequestState>
      </div>
    </WorkspaceLayout>
  );
}

export function StudentLeaderboard() {
  return <LeaderboardPage role="student" />;
}

export function AdminLeaderboard() {
  return <LeaderboardPage role="admin" />;
}

export function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    let active = true;
    getProfile().then((data) => {
      if (active) {
        setProfile(data);
        setForm({ name: data.name || "", email: data.email || "" });
      }
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load your profile."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  async function saveProfile(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateProfile({ name: form.name.trim(), email: form.email.trim() });
      setProfile(updated);
      localStorage.setItem("userName", updated.name);
      setSuccess("Profile updated successfully.");
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update your profile."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <PageHeading title="Profile" description="Review and update the name and email linked to your account." />
        {error && <div className="page-alert page-alert-error" role="alert">{error}</div>}
        {success && <div className="page-alert page-alert-success" role="status">{success}</div>}
        {loading ? <div className="page-card page-loading">Loading profile…</div> : profile && (
          <form className="page-card page-form max-w-2xl" onSubmit={saveProfile}>
            <div className="page-field"><label htmlFor="profile-name">Name</label><input id="profile-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="page-field"><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
            {profile.createdAt && <p className="m-0 text-xs text-gray-500">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>}
            <button className="page-button w-fit" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
          </form>
        )}
      </div>
    </WorkspaceLayout>
  );
}

export function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getNotifications().then((result) => {
      if (active) setNotifications(Array.isArray(result) ? result : []);
    }).catch((requestError) => {
      if (active) setError(getApiError(requestError, "Unable to load notifications."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  async function markRead(id) {
    setError("");
    try {
      const updated = await markNotificationRead(id);
      setNotifications((items) => items.map((item) => item._id === id ? updated : item));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to mark this notification as read."));
    }
  }
  return (
    <WorkspaceLayout role="student">
      <div className="page-stack">
        <PageHeading title="Notifications" description="Updates about your EcoQuest activity and reviews." />
        <RequestState loading={loading} error={error} empty={notifications.length === 0 && "You have no notifications."}>
          <div className="grid gap-3">
            {notifications.map((item) => (
              <article className={`page-card flex min-w-0 flex-wrap items-start justify-between gap-4 ${!item.isRead ? "border-l-4 border-l-violet-500" : ""}`} key={item._id}>
                <div className="min-w-0"><h2>{item.title}</h2><p className="mb-0 mt-2 text-sm">{item.message}</p><p className="mb-0 mt-2 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p></div>
                {!item.isRead && <button type="button" className="page-button-secondary" onClick={() => markRead(item._id)}>Mark as read</button>}
                {item.isRead && <span className="page-badge page-badge--muted">Read</span>}
              </article>
            ))}
          </div>
        </RequestState>
      </div>
    </WorkspaceLayout>
  );
}

import { toast } from "react-toastify";
import { urls } from "./urls";
import { axiosClient } from "./apiClient";
import axios from "axios";

function unwrap(response) {
  const body = response.data;
  if (body?.status === false) {
    throw new Error(body.message || "The request could not be completed.");
  }
  return body?.data ?? body;
}

export function getApiError(error, fallback = "The request could not be completed.") {
  return error.response?.data?.message || error.message || fallback;
}

export async function loginApi(formData) {
  try {
    return unwrap(await axiosClient.post(urls.login, formData));
  } catch (error) {
    toast.error(getApiError(error, "Login failed."));
    return false;
  }
}

export async function registerApi(formData) {
  try {
    return unwrap(await axiosClient.post(urls.register, formData));
  } catch (error) {
    toast.error(getApiError(error, "Registration failed."));
    return false;
  }
}

export async function adminDashboard() {
  return unwrap(await axiosClient.get(urls.AdminDashboardBoard));
}

export async function getLessons() {
  return unwrap(await axiosClient.get(urls.getLesson));
}

export async function getLesson(id) {
  return unwrap(await axiosClient.get(`${urls.getLesson}/${id}`));
}

export async function uploadLessonVideo(file) {
  const payload = new FormData();
  payload.append("video", file);
  return unwrap(await axiosClient.post(`${urls.getLesson}/video`, payload));
}

export async function createLesson(payload) {
  return unwrap(await axiosClient.post(urls.addLesson, payload));
}

export async function updateLesson(id, payload) {
  return unwrap(await axiosClient.patch(`${urls.editLesson}/${id}`, payload));
}

export async function deleteLesson(id) {
  return unwrap(await axiosClient.delete(`${urls.getLesson}/${id}`));
}

export async function getQuizzes() {
  return unwrap(await axiosClient.get(urls.quizzes));
}

export async function getQuiz(id) {
  return unwrap(await axiosClient.get(`${urls.quizzes}/${id}`));
}

export async function createQuiz(payload) {
  return unwrap(await axiosClient.post(urls.quizzes, payload));
}

export async function deleteQuiz(id) {
  return unwrap(await axiosClient.delete(`${urls.quizzes}/${id}`));
}

export async function deleteQuizQuestion(quizId, questionId) {
  return unwrap(await axiosClient.delete(`${urls.quizzes}/${quizId}/question/${questionId}`));
}

export async function submitQuiz(id, answers) {
  return unwrap(await axiosClient.post(`${urls.quizResults}/${id}/submit`, { answers }));
}

export async function getChallenges(page = 1, limit = 25) {
  return unwrap(await axiosClient.get(urls.challenges, { params: { page, limit } }));
}

export async function getChallenge(id) {
  return unwrap(await axiosClient.get(`${urls.challenges}/${id}`));
}

export async function createChallenge(payload) {
  return unwrap(await axiosClient.post(urls.challenges, payload));
}

export async function updateChallenge(id, payload) {
  return unwrap(await axiosClient.patch(`${urls.challenges}/${id}`, payload));
}

export async function deleteChallenge(id) {
  return unwrap(await axiosClient.delete(`${urls.challenges}/${id}`));
}

export async function submitChallengeProof(id, file) {
  const payload = new FormData();
  payload.append("proof", file);
  return unwrap(await axiosClient.post(`${urls.student}/challenges/${id}/submit`, payload));
}

export async function getMySubmissions() {
  return unwrap(await axiosClient.get(`${urls.student}/my-submissions`));
}

export async function getLeaderboard() {
  return unwrap(await axiosClient.get(urls.leaderboard));
}

export async function getStudentDashboard() {
  return unwrap(await axiosClient.get(`${urls.dashboard}/studashboard`));
}

export async function getProfile() {
  return unwrap(await axiosClient.get(`${urls.profile}/profile`));
}

export async function updateProfile(payload) {
  return unwrap(await axiosClient.patch(`${urls.profile}/profile`, payload));
}

export async function getNotifications() {
  return unwrap(await axiosClient.get(urls.notifications));
}

export async function markNotificationRead(id) {
  return unwrap(await axiosClient.patch(`${urls.notifications}/${id}/read`));
}

export async function getSubmissions(page = 1, limit = 10) {
  return unwrap(await axiosClient.get(urls.submissions, { params: { page, limit } }));
}

export async function reviewSubmission(id, payload) {
  return unwrap(await axiosClient.patch(`${urls.submissions}/${id}/review`, payload));
}

export async function getUsers(page = 1, limit = 25) {
  return unwrap(await axiosClient.get(urls.users, { params: { page, limit } }));
}

export async function getUser(id) {
  return unwrap(await axiosClient.get(`${urls.users}/${id}`));
}

export async function updateUser(id, payload) {
  return unwrap(await axiosClient.patch(`${urls.users}/${id}`, payload));
}

export async function deleteUser(id) {
  return unwrap(await axiosClient.delete(`${urls.users}/${id}`));
}

export async function getVideoUploadSignature() {
  return unwrap(
    await axiosClient.post(`${urls.getLesson}/video/signature`));
}

export async function uploadVideoDirectly(file, onProgress) {
  const signedData = await getVideoUploadSignature();
  if (!signedData?.cloudName || !signedData.apiKey || !signedData.signature
    || !signedData.timestamp || !signedData.folder) {
    throw new Error("The video upload signature response is incomplete. Check the Cloudinary server configuration.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signedData.apiKey);
  formData.append("timestamp", signedData.timestamp);
  formData.append("signature", signedData.signature);
  formData.append("folder", signedData.folder);

  let response;
  try {
    response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signedData.cloudName}/video/upload`,
      formData,
      {
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress?.(Math.round((event.loaded / event.total) * 100));
          }
        },
      }
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.error?.message
        || error.response?.data?.message
        || error.message
        || "Cloudinary video upload failed."
    );
  }

  if (typeof response.data?.secure_url !== "string" || !response.data.secure_url.trim()) {
    throw new Error("Cloudinary completed the upload without returning a secure video URL.");
  }
  onProgress?.(100);
  return response.data.secure_url;
}

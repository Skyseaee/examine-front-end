import axios from 'axios';

const api = axios.create({
  baseURL: 'http://49.232.224.116:40000/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCategories = () => api.get('/first/get_first_categories');
export const getFirstExercises = (firstId) => api.get(`/exercise/get_exercise_by_firstID?first_id=${firstId}`);
export const submitReview = (data) => api.post('/examine/insert_first_examine_record', data);

export const searchExercisesAdmin = (params) => api.get('/exercise/admin/search', { params });
export const updateExerciseAdmin = (id, data) => api.put(`/exercise/admin/update/${id}`, data);
export const deleteExerciseAdmin = (id) => api.delete(`/exercise/admin/delete/${id}`);
export const batchUploadExercises = (formData) => api.post('/exercise/batch-upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export {api};

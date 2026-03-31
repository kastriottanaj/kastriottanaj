import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const getPosts = (params) => api.get('/posts/', { params });
export const getPost = (slug) => api.get(`/posts/${slug}/`);
export const getCategories = () => api.get('/categories/');
export const getServices = () => api.get('/services/');
export const getProjects = (params) => api.get('/projects/', { params });
export const getProject = (slug) => api.get(`/projects/${slug}/`);
export const getTestimonials = (params) => api.get('/testimonials/', { params });
export const submitContact = (data) => api.post('/contact/', data);

export default api;

import axios from 'axios'

const api = axios.create({
  baseURL: 'http://49.233.224.116:40000/api',
  timeout: 10000,
})

export const getProvinces = () => api.get('/college/provinces')
export const getCollegesByProvince = (province) => api.get(`/college/colleges/${province}`)
export const getPosts = (category, limit = 10, offset = 0) => 
  api.get('/post/posts', { params: { category, limit, offset } })
export const getPostDetail = (id) => api.get(`/post/posts/${id}`)
export const getHotPosts = (limit = 5) => api.get('/post/posts/hot', { params: { limit } })
export const searchPosts = (keyword, limit = 10) => 
  api.get('/post/posts/search', { params: { keyword, limit } })
export const addComment = (postId, content) => 
  api.post(`/post/posts/${postId}/comments`, { content })

export default api

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/** Axios instance with base configuration */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Accept': 'application/json',
  },
});

/** Request interceptor */
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

/** Response interceptor */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      let message = 'Something went wrong. Please try again.';

      if (status === 400) {
        message = error.response.data?.detail || 'Invalid request. Please check your input.';
      } else if (status === 413) {
        message = 'File is too large. Please upload a smaller image.';
      } else if (status === 422) {
        message = 'Invalid data format or missing required file.';
      } else if (status === 429) {
        message = 'Too many requests. Please wait a moment and try again.';
      } else if (status === 500) {
        message = error.response.data?.detail || 'Server error. Our team has been notified.';
      } else if (status === 502) {
        message = error.response.data?.detail || 'AI service error. Please try again later.';
      } else if (status === 503) {
        message = 'Service temporarily unavailable. Please try again later.';
      }

      error.userMessage = message;
    } else if (error.request) {
      error.userMessage = 'Unable to connect to server. Please check your backend connection.';
    } else {
      error.userMessage = 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

/**
 * Helper: create FormData from image file matching FastAPI parameter 'file'
 */
const createImageFormData = (imageFile, fieldName = 'file') => {
  const formData = new FormData();
  formData.append(fieldName, imageFile);
  return formData;
};

/**
 * Recognize food from an image
 */
export const recognizeFood = async (imageFile) => {
  const formData = createImageFormData(imageFile);
  const response = await apiClient.post('/api/recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Analyze freshness of food from an image
 */
export const analyzeFreshness = async (imageFile) => {
  const formData = createImageFormData(imageFile);
  const response = await apiClient.post('/api/freshness/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Analyze freshness of multiple food images (batch)
 */
export const analyzeFreshnessBatch = async (imageFiles) => {
  const formData = new FormData();
  imageFiles.forEach((file) => {
    formData.append('files', file);
  });
  const response = await apiClient.post('/api/freshness/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Analyze hygiene from a kitchen/restaurant photo
 */
export const analyzeHygiene = async (imageFile) => {
  const formData = createImageFormData(imageFile);
  const response = await apiClient.post('/api/hygiene/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Analyze hygiene from a video frame
 */
export const analyzeHygieneVideoFrame = async (imageFile) => {
  const formData = createImageFormData(imageFile);
  const response = await apiClient.post('/api/hygiene/video-frame', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Get recipe suggestions from a food/ingredient image
 */
export const getRecipeFromImage = async (imageFile) => {
  const formData = createImageFormData(imageFile);
  const response = await apiClient.post('/api/cooking/recipe-from-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Get recipe suggestions from text ingredients
 */
export const getRecipeFromText = async (ingredients, cuisine = 'Any', dietary = []) => {
  const response = await apiClient.post('/api/cooking/recipe-from-text', {
    ingredients,
    cuisine,
    dietary_restrictions: dietary,
  });
  return response.data;
};

/**
 * Generate a personalized nutrition plan
 */
export const getNutritionPlan = async (profile) => {
  const response = await apiClient.post('/api/nutrition/plan', profile);
  return response.data;
};

/**
 * Analyze a meal image for nutrition info
 */
export const analyzeMeal = async (imageFile) => {
  const formData = createImageFormData(imageFile);
  const response = await apiClient.post('/api/nutrition/analyze-meal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Send a chat message to the AI
 */
export const chat = async (endpoint, messages, context = '') => {
  const response = await apiClient.post(endpoint, {
    messages,
    context,
  });
  return response.data;
};

export default apiClient;

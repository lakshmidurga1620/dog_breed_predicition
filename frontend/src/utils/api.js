
import { useAuth } from '@clerk/clerk-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';


export const useAPI = () => {
  const { getToken } = useAuth();

  const makeRequest = async (endpoint, options = {}) => {
    try {
      const token = await getToken();
      
      const headers = {
        ...options.headers,
      };


      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  return {
    // Predict dog breed
    predictBreed: async (imageFile) => {
      const formData = new FormData();
      formData.append('file', imageFile);

      return makeRequest('/predict', {
        method: 'POST',
        body: formData,
      });
    },

    // Get prediction history
    getPredictionHistory: async (limit = 50) => {
      return makeRequest(`/history?limit=${limit}`);
    },

    // Get user statistics
    getUserStats: async () => {
      return makeRequest('/stats');
    },

    // Get all breeds (public)
    getAllBreeds: async () => {
      return makeRequest('/breeds');
    },

    // Get breed details (public)
    getBreedDetails: async (breedName) => {
      return makeRequest(`/breed/${encodeURIComponent(breedName)}`);
    },

    // Update user profile
    updateUserProfile: async () => {
      return makeRequest('/user/profile', {
        method: 'POST',
      });
    },

    // Get user profile
    getUserProfile: async () => {
      return makeRequest('/user/profile');
    },

    // Health check (public)
    healthCheck: async () => {
      return makeRequest('/health');
    },
  };
};

// Non-hook version for use outside components
export const api = {
  predict: async (imageFile, token) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Prediction failed');
    }

    return response.json();
  },

  getBreeds: async () => {
    const response = await fetch(`${API_URL}/breeds`);
    if (!response.ok) throw new Error('Failed to fetch breeds');
    return response.json();
  },

  getBreedDetails: async (breedName) => {
    const response = await fetch(`${API_URL}/breed/${encodeURIComponent(breedName)}`);
    if (!response.ok) throw new Error('Breed not found');
    return response.json();
  },
};
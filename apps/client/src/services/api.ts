import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api', // Your backend API URL
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(config => {
    const authStore = useAuthStore(); // Access store here
    const token = authStore.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Optional: Response interceptor for handling 401 errors (e.g., redirect to login)
apiClient.interceptors.response.use(response => {
    return response;
}, error => {
    if (error.response && error.response.status === 401) {
        const authStore = useAuthStore();
        authStore.logout(); // Clear token and redirect
        // Consider redirecting to login page here using router instance if needed
        console.warn('Unauthorized request, logging out.');
    }
    return Promise.reject(error);
});


export default apiClient;
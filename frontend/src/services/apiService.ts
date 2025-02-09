import axios from "axios";
import { fetchAuthSession, getCurrentUser } from "@aws-amplify/auth";



// Function to get the authentication token from AWS Cognito
const getAuthToken = async (): Promise<string> => {
    try {
        const user = await getCurrentUser(); // Ensure user is authenticated
        if (!user) throw new Error("User not authenticated");

        const session = await fetchAuthSession(); // Fetch authentication session
        return session.tokens?.idToken ?? ""; // Get ID token
    } catch (error) {
        console.error("AWS Amplify Auth Error:", error);
        return ""; // Return empty string if no token is available
    }
};

// Create an axios instance
const apiClient = axios.create({
    headers: {
        "Content-Type": "application/json",
    },
});

// Axios request interceptor to attach authentication token dynamically
apiClient.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Centralized API service
const apiService = {
    // Generic GET request
    get: async (endpoint: string) => {
        try {
            const response = await apiClient.get(endpoint);
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Generic POST request
    post: async (endpoint: string, data: any) => {
        try {
            const response = await apiClient.post(endpoint, data);
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Generic PUT request
    put: async (endpoint: string, data: any) => {
        try {
            const response = await apiClient.put(endpoint, data);
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

    // Generic DELETE request
    delete: async (endpoint: string) => {
        try {
            const response = await apiClient.delete(endpoint);
            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },

};

// Handle API errors globally
const handleApiError = (error: any) => {
    if (error.response) {
        console.error("API Error:", error.response.data);
        if (error.response.status === 401) {
            alert("Unauthorized! Please log in again.");
            window.location.href = "/login"; // Redirect to login page
        }
        return { error: error.response.data };
    } else {
        console.error("Network Error:", error.message);
        return { error: "Network Error. Please try again later." };
    }
};

export default apiService;

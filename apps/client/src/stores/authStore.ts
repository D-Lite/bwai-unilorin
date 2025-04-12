import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../services/api';
import router from '../router';

interface User {
    id: string;
    email: string;
}
interface Group {
    id: string;
    name: string;
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('authToken'));
    const user = ref<User | null>(JSON.parse(localStorage.getItem('authUser') || 'null'));
    const groups = ref<Group[]>(JSON.parse(localStorage.getItem('userGroups') || '[]')); // Store user's groups
    const error = ref<string | null>(null);
    const loading = ref<boolean>(false);

    const isAuthenticated = computed(() => !!token.value);

    function setCredentials(newToken: string, newUser: User, newGroups: Group[]) {
        token.value = newToken;
        user.value = newUser;
        groups.value = newGroups;
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(newUser));
        localStorage.setItem('userGroups', JSON.stringify(newGroups)); // Store groups
        error.value = null;
    }

    function clearCredentials() {
        token.value = null;
        user.value = null;
        groups.value = [];
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('userGroups');
    }

    async function login(email: string, password: string) {
        loading.value = true;
        error.value = null;
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            setCredentials(response.data.token, response.data.user, response.data.groups);
            await router.push('/dashboard'); // Redirect after login
        } catch (err: any) {
            console.error("Login failed:", err);
            error.value = err.response?.data?.message || 'Login failed';
            clearCredentials();
        } finally {
            loading.value = false;
        }
    }

    async function signup(email: string, password: string, groupName: string) {
         loading.value = true;
         error.value = null;
         try {
             const response = await apiClient.post('/auth/signup', { email, password, groupName });
             // Signup might not return groups, just token/user
             // Log in immediately after signup to get groups? Or adjust backend
             // For simplicity, let's just store token/user and redirect to login or dashboard
             token.value = response.data.token;
             user.value = response.data.user;
             localStorage.setItem('authToken', response.data.token);
             localStorage.setItem('authUser', JSON.stringify(response.data.user));
             // Maybe force login after signup or fetch groups separately
             await router.push('/login'); // Redirect to login after signup for now
             // OR: await login(email, password); // Auto-login after signup

         } catch (err: any) {
             console.error("Signup failed:", err);
             error.value = err.response?.data?.message || 'Signup failed';
             clearCredentials();
         } finally {
             loading.value = false;
         }
     }

    function logout() {
        clearCredentials();
        router.push('/login'); // Redirect to login on logout
    }

     // Action to fetch groups if needed separately
     async function fetchGroups() {
         if (!isAuthenticated.value) return;
         loading.value = true;
         try {
             const response = await apiClient.get<Group[]>('/groups');
             groups.value = response.data;
             localStorage.setItem('userGroups', JSON.stringify(response.data));
         } catch (err: any) {
             console.error("Failed to fetch groups:", err);
             // Handle error appropriately
         } finally {
             loading.value = false;
         }
     }


    return { token, user, groups, error, loading, isAuthenticated, login, signup, logout, fetchGroups };
});
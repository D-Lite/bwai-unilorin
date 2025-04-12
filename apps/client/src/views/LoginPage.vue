<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="email" class="block text-gray-700 mb-2">Email</label>
            <input type="email" v-model="email" id="email" class="w-full px-3 py-2 border rounded" required>
          </div>
          <div class="mb-6">
            <label for="password" class="block text-gray-700 mb-2">Password</label>
            <input type="password" v-model="password" id="password" class="w-full px-3 py-2 border rounded" required>
          </div>
          <button type="submit" :disabled="auth.loading" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
            {{ auth.loading ? 'Logging in...' : 'Login' }}
          </button>
          <p v-if="auth.error" class="text-red-500 text-sm mt-4">{{ auth.error }}</p>
        </form>
        <p class="mt-4 text-center text-sm">
          Don't have an account? <router-link to="/signup" class="text-blue-500 hover:underline">Sign up</router-link>
        </p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { useAuthStore } from '../stores/authStore';
  
  const auth = useAuthStore();
  const email = ref('');
  const password = ref('');
  
  const handleLogin = () => {
    auth.login(email.value, password.value);
  };
  </script>
<template>
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <header class="bg-white shadow-sm sticky top-0 z-10">
        <nav class="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="flex-shrink-0 flex items-center">
            <router-link to="/dashboard" class="text-xl font-bold text-blue-600 hover:text-blue-800">
              StudySphere
            </router-link>
          </div>
  
          <!-- User Info & Logout -->
          <div v-if="auth.isAuthenticated && auth.user" class="flex items-center space-x-4">
            <span class="text-gray-600 text-sm hidden sm:inline">Welcome, {{ auth.user.email }}</span>
            <button
              @click="handleLogout"
              class="px-3 py-1 bg-red-500 hover:bg-red-700 text-white text-sm font-medium rounded shadow-sm"
            >
              Logout
            </button>
          </div>
          <div v-else>
             <router-link to="/login" class="text-blue-600 hover:underline">Login</router-link>
          </div>
        </nav>
      </header>
  
      <!-- Main Content Area -->
      <main class="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Router view for nested dashboard routes -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
  
      <!-- Optional Footer -->
      <footer class="bg-white mt-8 py-4 text-center text-gray-500 text-sm">
        © {{ new Date().getFullYear() }} StudySphere. All rights reserved.
      </footer>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAuthStore } from '../stores/authStore';
  import { useRouter } from 'vue-router';
  
  const auth = useAuthStore();
  const router = useRouter();
  
  const handleLogout = () => {
    auth.logout();
    // Router guard should handle redirect, but can force it here too
    // router.push('/login');
  };
  </script>
  
  <style scoped>
  /* Basic fade transition for router view */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  </style>
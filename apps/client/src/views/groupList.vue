<template>
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Your Study Groups</h1>
        <button
          @click="showCreateGroupModal = true"
          class="px-4 py-2 bg-green-500 hover:bg-green-700 text-white font-medium rounded shadow-sm"
        >
          Create New Group
        </button>
      </div>
  
      <!-- Loading State -->
      <div v-if="auth.loading && auth.groups.length === 0" class="text-center text-gray-500 mt-10">
        Loading groups...
      </div>
  
      <!-- Empty State -->
      <div v-else-if="!auth.loading && auth.groups.length === 0" class="text-center text-gray-500 mt-10 bg-white p-6 rounded shadow">
        <p class="mb-4">You haven't joined or created any groups yet.</p>
        <button
          @click="showCreateGroupModal = true"
          class="px-4 py-2 bg-green-500 hover:bg-green-700 text-white font-medium rounded shadow-sm"
        >
          Create Your First Group
        </button>
      </div>
  
      <!-- Group List -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="group in auth.groups"
          :key="group.id"
          class="bg-white p-4 rounded shadow hover:shadow-lg transition-shadow duration-200"
        >
          <router-link :to="{ name: 'GroupView', params: { groupId: group.id } }" class="block">
            <h3 class="text-lg font-semibold text-blue-600 hover:underline">{{ group.name }}</h3>
            <p class="text-sm text-gray-500">ID: {{ group.id }}</p>
            <!-- Add more group info here if needed -->
          </router-link>
        </div>
      </div>
  
      <!-- Create Group Modal (Basic Example) -->
      <div v-if="showCreateGroupModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-20" @click.self="showCreateGroupModal = false">
        <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
          <h3 class="text-xl font-semibold mb-4">Create New Group</h3>
          <form @submit.prevent="handleCreateGroup">
            <div class="mb-4">
              <label for="newGroupName" class="block text-gray-700 mb-2">Group Name</label>
              <input type="text" id="newGroupName" v-model="newGroupName" class="w-full px-3 py-2 border rounded" required>
            </div>
            <p v-if="createGroupError" class="text-red-500 text-sm mb-3">{{ createGroupError }}</p>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="showCreateGroupModal = false" class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">
                Cancel
              </button>
              <button type="submit" :disabled="creatingGroup" class="px-4 py-2 bg-green-500 hover:bg-green-700 text-white rounded disabled:opacity-50">
                {{ creatingGroup ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useAuthStore } from '../stores/authStore';
  import apiClient from '../services/api';
  
  const auth = useAuthStore();
  const showCreateGroupModal = ref(false);
  const newGroupName = ref('');
  const creatingGroup = ref(false);
  const createGroupError = ref<string | null>(null);
  
  const handleCreateGroup = async () => {
    if (!newGroupName.value.trim()) {
      createGroupError.value = "Group name cannot be empty.";
      return;
    }
    creatingGroup.value = true;
    createGroupError.value = null;
    try {
      // API call to create group
      await apiClient.post('/groups', { name: newGroupName.value });
      // Refresh group list from store
      await auth.fetchGroups(); // Make sure this action exists and works
      showCreateGroupModal.value = false;
      newGroupName.value = '';
    } catch (error: any) {
      console.error("Failed to create group:", error);
      createGroupError.value = error.response?.data?.message || "Failed to create group.";
    } finally {
      creatingGroup.value = false;
    }
  };
  
  // Fetch groups on mount if not already loaded (e.g., on page refresh)
  onMounted(() => {
    if (auth.groups.length === 0 && auth.isAuthenticated) {
      auth.fetchGroups();
    }
  });
  </script>
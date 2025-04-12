<template>
    <div class="p-4 md:p-6">
       <h2 class="text-2xl font-semibold mb-4">Group: {{ groupName }} (ID: {{ groupId }})</h2>
  
       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
         <!-- Document Section -->
         <div class="bg-white p-4 rounded shadow">
           <h3 class="text-xl font-semibold mb-3">Documents</h3>
           <DocumentUpload :groupId="groupId" @upload-success="fetchDocuments" />
           <DocumentList :documents="documents" :loading="loadingDocuments" />
         </div>
  
         <!-- Q&A Section -->
         <div class="bg-white p-4 rounded shadow">
           <h3 class="text-xl font-semibold mb-3">Ask Questions</h3>
           <ChatInterface :groupId="groupId" />
         </div>
       </div>
    </div>
   </template>
  
   <script setup lang="ts">
   import { ref, onMounted, computed } from 'vue';
   import { useRoute } from 'vue-router';
   import apiClient from '../services/api';
   import DocumentUpload from '../components/DocumentUpload.vue'; // Create this
   import DocumentList from '../components/DocumentList.vue';   // Create this
   import ChatInterface from '../components/ChatInterface.vue'; // Create this
   import { useAuthStore } from '../stores/authStore'; // To get group name
  
   interface Document {
     id: string;
     filename: string;
     createdAt: string;
     mimetype: string;
   }
  
   const props = defineProps<{ groupId: string }>(); // Get groupId from router props
  
   const route = useRoute();
   const authStore = useAuthStore();
  
   const documents = ref<Document[]>([]);
   const loadingDocuments = ref(false);
  
   // Find group name from stored groups
   const groupName = computed(() => {
      return authStore.groups.find(g => g.id === props.groupId)?.name || 'Loading...';
   });
  
  
   const fetchDocuments = async () => {
     loadingDocuments.value = true;
     try {
       const response = await apiClient.get(`/groups/${props.groupId}/documents`);
       documents.value = response.data;
     } catch (error) {
       console.error("Failed to fetch documents:", error);
       // Handle error display
     } finally {
       loadingDocuments.value = false;
     }
   };
  
   onMounted(() => {
     fetchDocuments();
     // Fetch group name if not already available? Auth store should have it.
     if(authStore.groups.length === 0) {
         authStore.fetchGroups(); // Fetch groups if page reloaded directly
     }
   });
   </script>
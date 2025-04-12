<template>
    <div>
      <h4 class="text-lg font-medium mb-2 text-gray-700">Uploaded Documents</h4>
      <!-- Loading -->
      <div v-if="loading" class="text-center text-gray-500 py-4">
        Loading documents...
      </div>
      <!-- Empty -->
      <div v-else-if="documents.length === 0" class="text-center text-gray-500 py-4 bg-gray-50 rounded">
        No documents uploaded to this group yet.
      </div>
      <!-- List -->
      <ul v-else class="space-y-2">
        <li
          v-for="doc in documents"
          :key="doc.id"
          class="bg-gray-50 p-3 rounded border border-gray-200 flex justify-between items-center"
        >
          <div>
            <span :class="getFileIconClass(doc.mimetype)" class="mr-2"></span>
            <span class="font-medium text-gray-800">{{ doc.filename }}</span>
            <span class="text-xs text-gray-500 ml-2">({{ formatBytes(0) }})</span> <!-- Add size if available -->
          </div>
          <span class="text-xs text-gray-400">{{ formatDate(doc.createdAt) }}</span>
          <!-- Add download/delete buttons later if needed -->
        </li>
      </ul>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps } from 'vue';
  
  interface Document {
    id: string;
    filename: string;
    createdAt: string;
    mimetype: string;
    // size?: number; // Optional size property
  }
  
  const props = defineProps<{
    documents: Document[];
    loading: boolean;
  }>();
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  
  // Helper for basic icons (replace with actual icons later)
  const getFileIconClass = (mimetype: string) => {
    if (mimetype.includes('pdf')) return '📄'; // Emoji for PDF
    if (mimetype.includes('text')) return '📝'; // Emoji for TXT
    return '❓'; // Default
  };
  
  // Placeholder for file size formatting
  const formatBytes = (bytes: number, decimals = 2) => {
     if (bytes === 0) return '0 Bytes'; // Size not available yet
     // Add actual size formatting logic if size is provided by backend
     return '... KB';
  };
  </script>
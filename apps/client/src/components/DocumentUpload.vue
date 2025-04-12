<template>
    <div class="mb-6 border border-dashed border-gray-300 p-4 rounded">
      <form @submit.prevent="handleUpload">
        <label for="document-upload" class="block text-sm font-medium text-gray-700 mb-2">
          Upload a Document (.txt or .pdf)
        </label>
        <div class="flex items-center space-x-3">
           <input
             id="document-upload"
             ref="fileInput"
             type="file"
             @change="onFileSelected"
             accept=".txt,.pdf"
             class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
             :disabled="isUploading"
           />
           <button
             type="submit"
             :disabled="!selectedFile || isUploading"
             class="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {{ isUploading ? 'Uploading...' : 'Upload' }}
           </button>
        </div>
        <p v-if="uploadProgress > 0 && uploadProgress < 100" class="text-sm text-gray-600 mt-2">
          Progress: {{ uploadProgress }}%
        </p>
        <p v-if="uploadError" class="text-red-500 text-xs italic mt-2">{{ uploadError }}</p>
         <p v-if="uploadSuccessMessage" class="text-green-600 text-xs italic mt-2">{{ uploadSuccessMessage }}</p>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import apiClient from '../services/api';
  
  const props = defineProps<{ groupId: string }>();
  const emit = defineEmits(['upload-success']); // To notify parent component
  
  const selectedFile = ref<File | null>(null);
  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const uploadError = ref<string | null>(null);
  const uploadSuccessMessage = ref<string | null>(null);
  const fileInput = ref<HTMLInputElement | null>(null); // Ref for the file input
  
  const onFileSelected = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      selectedFile.value = target.files[0];
      uploadError.value = null; // Clear previous errors
      uploadSuccessMessage.value = null;
    } else {
      selectedFile.value = null;
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile.value) return;
  
    isUploading.value = true;
    uploadError.value = null;
    uploadSuccessMessage.value = null;
    uploadProgress.value = 0;
  
    const formData = new FormData();
    formData.append('document', selectedFile.value); // 'document' must match backend Multer field name
  
    try {
      const response = await apiClient.post(`/groups/${props.groupId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
              uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
  
      uploadSuccessMessage.value = response.data.message || 'Upload successful, processing started.';
      emit('upload-success'); // Notify parent
      // Reset file input
      selectedFile.value = null;
      if(fileInput.value) {
          fileInput.value.value = ''; // Clear the file input visually
      }
  
    } catch (error: any) {
      console.error("Upload failed:", error);
      uploadError.value = error.response?.data?.message || 'Upload failed. Please check file type and size.';
    } finally {
      isUploading.value = false;
      // Reset progress after a short delay unless there was an error
      setTimeout(() => {
          if(!uploadError.value) uploadProgress.value = 0;
      }, 2000);
    }
  };
  </script>
<template>
    <div class="flex flex-col h-[500px]"> <!-- Fixed height container -->
      <!-- Chat History -->
      <div ref="chatHistoryRef" class="flex-grow overflow-y-auto mb-4 p-3 bg-gray-50 border border-gray-200 rounded space-y-4">
         <!-- Welcome Message -->
         <div v-if="chatHistory.length === 0 && !isLoading" class="text-center text-gray-500 p-4">
            Upload some documents and ask a question about their content!
         </div>
  
        <div v-for="(message, index) in chatHistory" :key="index" :class="message.type === 'user' ? 'text-right' : 'text-left'">
          <div
            :class="[
              'inline-block px-4 py-2 rounded-lg max-w-[80%]',
              message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            ]"
          >
            <p class="text-sm whitespace-pre-wrap">{{ message.text }}</p>
          </div>
        </div>
        <!-- Loading Indicator -->
        <div v-if="isLoading" class="text-center py-2">
            <span class="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></span>
            <span class="text-gray-500 ml-2 text-sm">Thinking...</span>
        </div>
      </div>
  
      <!-- Input Area -->
      <form @submit.prevent="sendMessage" class="flex-shrink-0">
        <div class="flex items-center border border-gray-300 rounded bg-white p-1">
          <textarea
            ref="textareaRef"
            v-model="currentQuestion"
            @keydown.enter.exact.prevent="sendMessage"
            rows="1"
            class="flex-grow border-none focus:ring-0 resize-none p-2 text-sm outline-none"
            placeholder="Ask a question based on the documents..."
            :disabled="isLoading"
          ></textarea>
          <button
            type="submit"
            :disabled="isLoading || currentQuestion.trim() === ''"
            class="ml-2 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p v-if="errorMessage" class="text-red-500 text-xs mt-1">{{ errorMessage }}</p>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, nextTick, watch } from 'vue';
  import apiClient from '../services/api';
  
  interface ChatMessage {
    type: 'user' | 'ai';
    text: string;
  }
  
  const props = defineProps<{ groupId: string }>();
  
  const currentQuestion = ref('');
  const chatHistory = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);
  const chatHistoryRef = ref<HTMLElement | null>(null); // Ref for scrolling
  const textareaRef = ref<HTMLTextAreaElement | null>(null); // Ref for textarea
  
  const adjustTextareaHeight = () => {
      if (textareaRef.value) {
          textareaRef.value.style.height = 'auto'; // Reset height
          textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`; // Set to scroll height
      }
  };
  
  watch(currentQuestion, () => {
      nextTick(adjustTextareaHeight);
  });
  
  const scrollToBottom = () => {
    nextTick(() => {
      if (chatHistoryRef.value) {
        chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
      }
    });
  };
  
  const sendMessage = async () => {
    const questionText = currentQuestion.value.trim();
    if (!questionText || isLoading.value) return;
  
    // Add user message to history
    chatHistory.value.push({ type: 'user', text: questionText });
    currentQuestion.value = ''; // Clear input
    adjustTextareaHeight(); // Reset textarea height
    scrollToBottom();
  
    isLoading.value = true;
    errorMessage.value = null;
  
    try {
      const response = await apiClient.post(`/groups/${props.groupId}/ask`, {
        question: questionText,
      });
  
      // Add AI response to history
      chatHistory.value.push({ type: 'ai', text: response.data.answer || "Sorry, I couldn't get a response." });
      scrollToBottom();
  
    } catch (error: any) {
      console.error("Error asking question:", error);
      errorMessage.value = error.response?.data?.message || 'Failed to get an answer.';
      // Optionally add error message to chat history
      // chatHistory.value.push({ type: 'ai', text: `Error: ${errorMessage.value}` });
      scrollToBottom();
    } finally {
      isLoading.value = false;
    }
  };
  
  // Watch chat history changes to scroll down
  watch(chatHistory, scrollToBottom, { deep: true });
  
  </script>
  
  <style scoped>
  /* Optional: Add custom scrollbar styling */
  /* For Webkit browsers */
  div[ref="chatHistoryRef"]::-webkit-scrollbar {
    width: 6px;
  }
  div[ref="chatHistoryRef"]::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  div[ref="chatHistoryRef"]::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
  div[ref="chatHistoryRef"]::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }
  
  /* Basic styles for the textarea to prevent overflow */
  textarea {
      max-height: 150px; /* Limit max height before scrolling */
      overflow-y: auto;
  }
  </style>
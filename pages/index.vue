<template>
  <div class="flex flex-col md:flex-row h-screen font-sans">
    
    <div class="w-full md:w-1/3 lg:w-1/4 bg-white p-6 shadow-lg overflow-y-auto">
      </div>

    <div class="flex-grow bg-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div v-if="isLoading && !imagePreviewUrl" class="flex flex-col items-center text-center">
        </div>

      <div v-else-if="imagePreviewUrl" class="relative w-full h-full flex items-center justify-center">
        <img 
          :src="imagePreviewUrl" 
          ref="patientImage" 
          @load="updateImageDimensions" 
          class="max-w-full max-h-full object-contain"
          :class="{ 'opacity-50': isLoading }"
          alt="Patient Photo"
        >
        
        <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <svg class="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p class="text-white font-semibold">กำลังวิเคราะห์...</p>
        </div>
        
        <div v-if="errorMessage" class="absolute inset-0 flex items-center justify-center bg-red-800 bg-opacity-75 p-4 rounded-lg">
          <div class="text-center text-white">
            <strong class="font-bold text-lg">เกิดข้อผิดพลาด</strong>
            <span class="block mt-2">{{ errorMessage }}</span>
          </div>
        </div>

        <svg v-if="analysisResult && !errorMessage" 
             :width="imageDimensions.width" 
             :height="imageDimensions.height"
             :viewBox="`0 0 ${imageDimensions.naturalWidth} ${imageDimensions.naturalHeight}`"
             class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
             style="overflow: visible;">
          </svg>
      </div>
      
      <div v-else class="text-center">
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ... ส่วน state และ computed เหมือนเดิม ...

// ⭐ จุดที่แก้ไข: ฟังก์ชัน analyzePhoto
const analyzePhoto = async (file: File) => {
    isLoading.value = true;
    errorMessage.value = ''; // รีเซ็ต Error ทุกครั้งที่วิเคราะห์ใหม่
    analysisResult.value = null; // รีเซ็ตผลวิเคราะห์เก่า

    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const data = await $fetch('/api/analyze', {
            method: 'POST',
            body: formData,
        });
        
        if (data && data.length > 0) {
            analysisResult.value = data;
        } else {
            throw new Error('ไม่สามารถตรวจจับใบหน้าในรูปภาพนี้ได้ (API returned empty array)');
        }

    } catch (e: any) {
        // เมื่อเกิด Error ให้กำหนดข้อความ Error แต่ "ไม่ลบ" รูปภาพ
        errorMessage.value = e.data?.message || e.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        // imagePreviewUrl.value = ''; // บรรทัดนี้ถูกเอาออก
        analysisResult.value = null;
    } finally {
        isLoading.value = false;
    }
};

// ... โค้ดส่วนที่เหลือเหมือนเดิมทั้งหมด ...
</script>

<template>
  <div class="flex flex-col md:flex-row h-screen font-sans">
    
    <div class="w-full md:w-1/3 lg:w-1/4 bg-white p-6 shadow-lg overflow-y-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Facial-Sync AI</h1>
        <p class="text-sm text-gray-500">เครื่องมือวิเคราะห์ใบหน้าสำหรับทันตแพทย์</p>
      </div>

      <div class="mb-6">
        <label for="file-upload" class="w-full inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer text-center transition-colors" :class="{ 'opacity-50 cursor-not-allowed': isLoading }">
          <span v-if="!isLoading">เลือกรูปภาพคนไข้</span>
          <span v-else>กำลังประมวลผล...</span>
        </label>
        <input id="file-upload" type="file" class="hidden" @change="handleFileChange" accept="image/png, image/jpeg" :disabled="isLoading">
        <p class="text-xs text-gray-500 mt-2">แนะนำ: รูปถ่ายหน้าตรง ไม่ยิ้ม และไม่เอียง</p>
      </div>

      <div v-if="analysisResult" class="mb-6">
        <h2 class="font-bold text-gray-700 mb-3 border-b pb-2">ควบคุมการแสดงผล</h2>
        <div class="space-y-2">
          <label class="flex items-center">
            <input type="checkbox" v-model="displayOptions.landmarks" class="form-checkbox h-5 w-5 text-blue-600 rounded">
            <span class="ml-2 text-gray-700">แสดงจุด Landmarks</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" v-model="displayOptions.eyeLine" class="form-checkbox h-5 w-5 text-blue-600 rounded">
            <span class="ml-2 text-gray-700">แสดงเส้นระนาบดวงตา</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" v-model="displayOptions.smileLine" class="form-checkbox h-5 w-5 text-blue-600 rounded">
            <span class="ml-2 text-gray-700">แสดงเส้นระนาบรอยยิ้ม</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" v-model="displayOptions.midline" class="form-checkbox h-5 w-5 text-blue-600 rounded">
            <span class="ml-2 text-gray-700">แสดงเส้นกึ่งกลางใบหน้า</span>
          </label>
          
          <div class="pt-2 border-t mt-2">
            <label class="flex items-center">
              <input type="checkbox" v-model="displayOptions.jawLine" class="form-checkbox h-5 w-5 text-indigo-600 rounded">
              <span class="ml-2 text-gray-700">แสดงโครงหน้า (Jawline)</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" v-model="displayOptions.noseLine" class="form-checkbox h-5 w-5 text-indigo-600 rounded">
              <span class="ml-2 text-gray-700">แสดงโครงจมูก</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" v-model="displayOptions.lipLine" class="form-checkbox h-5 w-5 text-indigo-600 rounded">
              <span class="ml-2 text-gray-700">แสดงรูปปาก</span>
            </label>
          </div>
        </div>
      </div>
      
      <div v-if="analysisResult" class="mb-6">
        <h2 class="font-bold text-gray-700 mb-3 border-b pb-2">ข้อมูลการวิเคราะห์</h2>
        <div class="space-y-2 text-sm">
          <div v-if="analysisScores.cant !== null" class="flex justify-between items-center">
            <span class="text-gray-600">ความเอียงของรอยยิ้ม (Cant):</span>
            <span class="font-semibold text-gray-800 bg-gray-200 px-2 py-1 rounded">{{ analysisScores.cant.toFixed(2) }}°</span>
          </div>
        </div>
      </div>

      <div class="mt-auto pt-4 border-t">
        <h2 class="font-bold text-gray-700 mb-3">คำอธิบายสัญลักษณ์</h2>
        <ul class="text-sm space-y-2">
          <li class="flex items-center"><div class="w-4 h-1 bg-blue-500 mr-2"></div> เส้นระนาบดวงตา</li>
          <li class="flex items-center"><div class="w-4 h-1 bg-green-500 mr-2"></div> เส้นระนาบรอยยิ้ม</li>
          <li class="flex items-center"><div class="w-4 h-1 bg-red-500 mr-2 border border-dashed border-red-500"></div> เส้นกึ่งกลางใบหน้า</li>
          <li class="flex items-center"><div class="w-4 h-1 border border-white bg-gray-600 mr-2"></div> เส้นโครงสร้าง</li>
        </ul>
      </div>
    </div>

    <div class="flex-grow bg-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div v-if="isLoading && !imagePreviewUrl" class="flex flex-col items-center text-center">
        <svg class="animate-spin h-8 w-8 text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="text-gray-600 font-semibold">กำลังเริ่มต้น...</p>
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
          
          <g v-if="displayOptions.landmarks">
            <circle v-for="(point, name) in analysisResult[0].faceLandmarks" :key="name" :cx="point.x" :cy="point.y" r="4" fill="rgba(255, 255, 0, 0.7)" stroke="black" stroke-width="1"></circle>
          </g>

          <line v-if="displayOptions.eyeLine" :x1="analysisResult[0].faceLandmarks.pupilLeft.x" :y1="analysisResult[0].faceLandmarks.pupilLeft.y" :x2="analysisResult[0].faceLandmarks.pupilRight.x" :y2="analysisResult[0].faceLandmarks.pupilRight.y" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"></line>
          <line v-if="displayOptions.smileLine" :x1="analysisResult[0].faceLandmarks.mouthLeft.x" :y1="analysisResult[0].faceLandmarks.mouthLeft.y" :x2="analysisResult[0].faceLandmarks.mouthRight.x" :y2="analysisResult[0].faceLandmarks.mouthRight.y" stroke="#22c55e" stroke-width="3" stroke-linecap="round"></line>
          <line v-if="displayOptions.midline && facialMidlinePoints" :x1="facialMidlinePoints.top.x" :y1="facialMidlinePoints.top.y" :x2="facialMidlinePoints.bottom.x" :y2="facialMidlinePoints.bottom.y" stroke="#ef4444" stroke-width="3" stroke-dasharray="8 8" stroke-linecap="round"></line>
          
          <g fill="none" stroke="rgba(255, 255, 255, 0.9)" stroke-width="2">
            <polyline v-if="displayOptions.jawLine" :points="facialOutlines.jawLine" />
            <g v-if="displayOptions.noseLine">
              <polyline :points="facialOutlines.noseBridge" />
              <polyline :points="facialOutlines.noseBottom" />
            </g>
            <g v-if="displayOptions.lipLine">
              <polyline :points="facialOutlines.outerLip" />
              <polyline :points="facialOutlines.innerLip" />
            </g>
          </g>
        </svg>
      </div>
      
      <div v-else class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">เริ่มต้นการวิเคราะห์</h3>
        <p class="mt-1 text-sm text-gray-500">กรุณาอัปโหลดรูปภาพเพื่อเริ่มต้น</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';

// --- Type Definitions for Clarity ---
type Point = { x: number; y: number };
type FaceLandmarks = { [key: string]: Point };
type AnalysisResult = {
  faceLandmarks: FaceLandmarks;
  faceRectangle: { top: number; left: number; width: number; height: number; };
}[];

// --- State Management ---
const isLoading = ref(false);
const errorMessage = ref('');
const imagePreviewUrl = ref('');
const analysisResult = ref<AnalysisResult | null>(null);
const patientImage = ref<HTMLImageElement | null>(null);

const imageDimensions = ref({
    width: 0, height: 0,
    naturalWidth: 0, naturalHeight: 0,
});

const displayOptions = ref({
    landmarks: false,
    eyeLine: true,
    smileLine: true,
    midline: true,
    jawLine: true,
    noseLine: true,
    lipLine: true,
});

// --- Computed Properties ---
const analysisScores = computed(() => {
    if (!analysisResult.value || !analysisResult.value[0]?.faceLandmarks) {
        return { cant: null };
    }
    const landmarks = analysisResult.value[0].faceLandmarks;
    
    const getAngle = (p1: Point, p2: Point) => Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    
    const eyeAngle = getAngle(landmarks.pupilLeft, landmarks.pupilRight);
    const mouthAngle = getAngle(landmarks.mouthLeft, landmarks.mouthRight);
    
    const cant = mouthAngle - eyeAngle;

    return { cant };
});

const facialMidlinePoints = computed(() => {
    if (!analysisResult.value || !analysisResult.value[0]?.faceLandmarks) return null;
    const landmarks = analysisResult.value[0].faceLandmarks;
    
    const midPointBetweenEyesX = (landmarks.pupilLeft.x + landmarks.pupilRight.x) / 2;
    const noseMidlineX = (landmarks.noseRootLeft.x + landmarks.noseRootRight.x) / 2;
    const facialMidlineX = (midPointBetweenEyesX + noseMidlineX + landmarks.noseTip.x) / 3;

    const faceRect = analysisResult.value[0].faceRectangle;
    const topY = faceRect.top - 20;
    const bottomY = faceRect.top + faceRect.height + 20;

    return {
        top: { x: facialMidlineX, y: topY },
        bottom: { x: facialMidlineX, y: bottomY }
    };
});

const facialOutlines = computed(() => {
  if (!analysisResult.value || !analysisResult.value[0]?.faceLandmarks) {
    return { jawLine: '', noseBridge: '', noseBottom: '', outerLip: '', innerLip: '' };
  }
  const landmarks = analysisResult.value[0].faceLandmarks;

  const pointsToString = (points: Point[]) => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  const jawLinePoints: Point[] = [
    landmarks.jawLeftGonion, landmarks.jawLeftAlveolar,
    landmarks.chinGnathion,
    landmarks.jawRightAlveolar, landmarks.jawRightGonion,
  ];

  const noseBridgePoints: Point[] = [
    landmarks.eyebrowLeftInner,
    landmarks.noseRootLeft,
    landmarks.noseTip,
    landmarks.noseRootRight,
    landmarks.eyebrowRightInner
  ];
  const noseBottomPoints: Point[] = [
    landmarks.noseAlaLeft,
    landmarks.noseTip,
    landmarks.noseAlaRight
  ];

  const outerLipPoints: Point[] = [
    landmarks.mouthCornerLeft, landmarks.upperLipLeft, landmarks.upperLipTop, 
    landmarks.upperLipRight, landmarks.mouthCornerRight, landmarks.lowerLipRight,
    landmarks.lowerLipBottom, landmarks.lowerLipLeft, landmarks.mouthCornerLeft
  ];
  const innerLipPoints: Point[] = [
    landmarks.mouthLeft, landmarks.upperLipBottom, landmarks.mouthRight,
    landmarks.lowerLipTop, landmarks.mouthLeft
  ];

  return {
    jawLine: pointsToString(jawLinePoints),
    noseBridge: pointsToString(noseBridgePoints),
    noseBottom: pointsToString(noseBottomPoints),
    outerLip: pointsToString(outerLipPoints),
    innerLip: pointsToString(innerLipPoints),
  };
});

// --- Methods ---
const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || isLoading.value) return;

    // Reset states
    errorMessage.value = '';
    analysisResult.value = null;
    
    // Create a preview URL
    imagePreviewUrl.value = URL.createObjectURL(file);
    
    await analyzePhoto(file);
    
    // Clear the file input so the same file can be re-uploaded
    target.value = '';
};

const analyzePhoto = async (file: File) => {
    isLoading.value = true;
    errorMessage.value = ''; 
    analysisResult.value = null; 

    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const data = await $fetch<AnalysisResult>('/api/analyze', {
            method: 'POST',
            body: formData,
        });
        
        if (data && data.length > 0) {
            analysisResult.value = data;
        } else {
            throw new Error('ไม่สามารถตรวจจับใบหน้าในรูปภาพนี้ได้ (API returned empty array)');
        }

    } catch (e: any) {
        errorMessage.value = e.data?.message || e.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        analysisResult.value = null;
    } finally {
        isLoading.value = false;
    }
};

const updateImageDimensions = () => {
   nextTick(() => {
       if (patientImage.value && patientImage.value.naturalWidth > 0) {
           imageDimensions.value = {
               width: patientImage.value.offsetWidth,
               height: patientImage.value.offsetHeight,
               naturalWidth: patientImage.value.naturalWidth,
               naturalHeight: patientImage.value.naturalHeight,
           };
       }
   });
};

// --- Lifecycle Hooks ---
onMounted(() => {
  window.addEventListener('resize', updateImageDimensions)
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateImageDimensions)
});
</script>

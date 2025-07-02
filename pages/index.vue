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
      </div>

    <div class="flex-grow bg-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div v-else-if="imagePreviewUrl" class="relative w-full h-full flex items-center justify-center">
        <img :src="imagePreviewUrl" ref="patientImage" @load="updateImageDimensions" class="max-w-full max-h-full object-contain" alt="Patient Photo">
        
        <svg v-if="analysisResult" 
             :width="imageDimensions.width" 
             :height="imageDimensions.height"
             :viewBox="`0 0 ${imageDimensions.naturalWidth} ${imageDimensions.naturalHeight}`"
             class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
             style="overflow: visible;">
          
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
      </div>
  </div>
</template>

<script setup lang="ts">
// --- State Management ---
// ... (ส่วน state management เดิม) ...
const displayOptions = ref({
    landmarks: false, // ปิดเป็นค่าเริ่มต้นเพื่อให้ไม่ลายตา
    eyeLine: true,
    smileLine: true,
    midline: true,
    // ⭐ เพิ่ม state สำหรับตัวเลือกใหม่
    jawLine: true,
    noseLine: true,
    lipLine: true,
});

// ... (ส่วน computed properties เดิม: analysisScores, facialMidlinePoints) ...

// ⭐ เพิ่ม computed property สำหรับจัดการพิกัดของเส้นโครงสร้างทั้งหมด
const facialOutlines = computed(() => {
  if (!analysisResult.value || !analysisResult.value[0]?.faceLandmarks) {
    return { jawLine: '', noseBridge: '', noseBottom: '', outerLip: '', innerLip: '' };
  }
  const landmarks = analysisResult.value[0].faceLandmarks;

  // ฟังก์ชันช่วยแปลง object point เป็น string "x,y"
  const pointsToString = (points: {x: number, y: number}[]) => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  // 1. โครงหน้า (Jawline)
  const jawLinePoints = [
    landmarks.jawLeftGonion, landmarks.jawLeftAlveolar,
    // เพิ่มจุดตามแนวกรามซ้าย (ถ้ามี)
    landmarks.chinGnathion,
    // เพิ่มจุดตามแนวกรามขวา (ถ้ามี)
    landmarks.jawRightAlveolar, landmarks.jawRightGonion,
  ];

  // 2. โครงจมูก
  const noseBridgePoints = [
    landmarks.eyebrowLeftInner,
    landmarks.noseRootLeft,
    landmarks.noseTip,
    landmarks.noseRootRight,
    landmarks.eyebrowRightInner
  ];
  const noseBottomPoints = [
    landmarks.noseAlaLeft,
    landmarks.noseTip,
    landmarks.noseAlaRight
  ];

  // 3. รูปปาก (ภายนอกและภายใน)
  const outerLipPoints = [
    landmarks.mouthCornerLeft, landmarks.upperLipLeft, landmarks.upperLipTop, 
    landmarks.upperLipRight, landmarks.mouthCornerRight, landmarks.lowerLipRight,
    landmarks.lowerLipBottom, landmarks.lowerLipLeft, landmarks.mouthCornerLeft
  ];
  const innerLipPoints = [
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


// --- Methods & Lifecycle Hooks ---
// ... (ส่วน methods และ lifecycle hooks ทั้งหมดเหมือนเดิม ไม่ต้องแก้ไข) ...

// ตัวอย่างส่วนที่เหลือเพื่อให้เห็นภาพรวม
const isLoading = ref(false);
const errorMessage = ref('');
const imagePreviewUrl = ref('');
const analysisResult = ref<any>(null);
const patientImage = ref<HTMLImageElement | null>(null);
const imageDimensions = ref({
    width: 0, height: 0,
    naturalWidth: 0, naturalHeight: 0,
});
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
const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || isLoading.value) return;
    analysisResult.value = null;
    errorMessage.value = '';
    imagePreviewUrl.value = URL.createObjectURL(file);
    await analyzePhoto(file);
    target.value = '';
};
const analyzePhoto = async (file: File) => {
    isLoading.value = true;
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
            throw new Error('ไม่สามารถตรวจจับใบหน้าในรูปภาพนี้ได้');
        }
    } catch (e: any) {
        errorMessage.value = e.data?.message || e.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        imagePreviewUrl.value = '';
        analysisResult.value = null;
    } finally {
        isLoading.value = false;
    }
};
onMounted(() => window.addEventListener('resize', updateImageDimensions));
onBeforeUnmount(() => window.removeEventListener('resize', updateImageDimensions));
// จบส่วนที่ไม่ต้องแก้ไข
</script>

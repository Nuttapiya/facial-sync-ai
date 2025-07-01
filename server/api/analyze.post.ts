// server/api/analyze.post.ts

export default defineEventHandler(async (event) => {
  // อ่านค่า Environment Variables จาก Runtime Config
  const config = useRuntimeConfig(event);
  const azureKey = config.azureFaceApiKey;
  const azureEndpoint = config.azureFaceApiEndpoint;

  if (!azureKey || !azureEndpoint) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Azure credentials missing.',
    });
  }

  // อ่านข้อมูล form-data จาก request ที่เข้ามา
  const multipart = await readMultipartFormData(event);
  const imagePart = multipart?.find(part => part.name === 'image');

  if (!imagePart || !imagePart.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No image file uploaded.',
    });
  }

  const imageBuffer = imagePart.data;

  // เตรียม URL สำหรับเรียก Azure Face API
  const cleanEndpoint = azureEndpoint.endsWith('/') ? azureEndpoint.slice(0, -1) : azureEndpoint;
  const azureApiUrl = `${cleanEndpoint}/face/v1.0/detect?returnFaceLandmarks=true&detectionModel=detection_01&returnRecognitionModel=false`;

  try {
    // ส่ง request ไปยัง Azure ด้วย $fetch
    const analysisData = await $fetch(azureApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': azureKey,
      },
      body: imageBuffer,
    });
    
    return analysisData;

  } catch (error: any) {
    console.error("Azure API Error:", error.data);
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.data?.error?.message || 'An error occurred while communicating with the Azure API.',
    });
  }
});
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  runtimeConfig: {
    azureFaceApiKey: process.env.AZURE_FACE_API_KEY,
    azureFaceApiEndpoint: process.env.AZURE_FACE_API_ENDPOINT,
  }
})
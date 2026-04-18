export const featureItems = [
  {
    title: 'Local first',
    body: 'The core transcription flow runs in the browser instead of uploading audio to a remote API.',
  },
  {
    title: 'No account',
    body: 'Use the tool without signups, dashboards, projects, seats, or billing screens.',
  },
  {
    title: 'Reusable model cache',
    body: 'After the first download, supported browsers can reuse the selected model locally.',
  },
  {
    title: 'Exportable text',
    body: 'Copy the result or download a plain text transcript when the job is done.',
  },
] as const

export const resultSteps = [
  'Choose audio',
  'Load local model',
  'Transcribe in browser',
  'Copy or download text',
] as const

export const privacyPolicyItems = [
  {
    title: 'Audio stays local',
    body: 'Your selected file is decoded and transcribed in your browser. PrivateTranscribe.app does not upload it for transcription.',
  },
  {
    title: 'Models are downloaded',
    body: 'The first run downloads speech model files. Your browser may keep them so the app starts faster next time.',
  },
  {
    title: 'Transcript control',
    body: 'Transcript text stays on the page unless you copy or download it. There are no accounts or cloud transcript storage.',
  },
  {
    title: 'Site services',
    body: 'The site may use hosting, model delivery, ads, or basic measurement. Those services may receive normal browser and network details, but not your file or transcript from the transcription flow.',
  },
] as const

export const howItWorksItems = [
  {
    title: 'Pick a file',
    body: 'Choose a supported audio or video file from your device. The app checks the format before transcription starts.',
  },
  {
    title: 'Load a model',
    body: 'Download the local speech model once. You can switch models or delete the cached model from this browser.',
  },
  {
    title: 'Run locally',
    body: 'The browser prepares the audio and sends it to a local worker. The transcript is generated on your device.',
  },
] as const

export const faqItems = [
  {
    question: 'Is it really private?',
    answer:
      'Yes! Your files NEVER leave your device! The speech model is downloaded to the browser, then your audio is processed on your right on your machine!',
  },
  {
    question: 'Why is the first run slower?',
    answer:
      'The browser has to download the selected speech model before it can transcribe. Smaller models start faster; larger models can be more accurate. Usually the smallest model is good enough, but if you are on desktop or decent laptop, you can choose the larger model for slower, better accuracy.',
  },
  {
    question: 'Can I remove the downloaded model?',
    answer:
      "Yes. Use the trash button beside the model selector to remove the selected model from this site's browser cache.",
  },
] as const

export const sitemapItems = [
  ['Tool', '#tool'],
  ['Features', '#features'],
  ['Privacy', '#privacy'],
  ['FAQs', '#faqs'],
] as const

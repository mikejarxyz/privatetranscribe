export const demoTranscript = `Speaker 1: This is a local transcription demo.

Speaker 2: Audio stays in the browser. The model runs on this device, and the finished transcript can be copied or downloaded as text.`

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

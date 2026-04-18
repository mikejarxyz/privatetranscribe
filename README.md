# PrivateTranscribe.app

Private audio and video transcription in your browser. No upload. No account.
Offline-capable after setup.

Source code: <https://github.com/mikejarxyz/privatetranscribe>

## Privacy Model

PrivateTranscribe.app is local-first. Audio is extracted, decoded, and
transcribed in the browser using a Web Worker and browser-side model execution.
The core transcription flow does not upload audio or video files to a hosted
transcription API.

The browser downloads the selected speech model and required runtime assets the
first time they are needed. Supported browsers can reuse cached model files on
later visits. Users can remove the selected cached model from the app UI.

## Model Hosting

The app currently loads ONNX Whisper model files from Hugging Face model repos:

- `onnx-community/whisper-tiny.en`
- `onnx-community/whisper-base.en`
- `onnx-community/whisper-small.en`

Those model files are third-party assets and are governed by their own licenses
and model cards. The app source code in this repository is licensed separately
under AGPL-3.0-only.

## Browser Requirements

PrivateTranscribe.app requires a modern browser with support for WebAssembly,
Web Workers, the Cache API, local storage, and in-browser media decoding.

The first run can be slow because the browser must download the selected model.
Larger models need more memory and disk cache space.

## Deployment

PrivateTranscribe.app is deployed as a static site on Cloudflare Pages.

Cloudflare Pages settings:

- Framework preset: Vite
- Build command: `pnpm run build`
- Build output directory: `dist`
- Production branch: `main`

The production app is available at <https://privatetranscribe.app/>.

The built app includes a large ONNX Runtime WASM asset. Cloudflare Pages has a
single-file static asset limit, so dependency updates should be checked to make
sure the generated WASM file still deploys successfully. Speech model files are
not bundled into the static site for launch; they are loaded from Hugging Face
model repos at runtime.

## Development

```sh
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` starts the Vite dev server.
- `pnpm build` type-checks and builds the static app.
- `pnpm lint` runs ESLint.
- `pnpm test` runs Vitest.

## Product Direction

PrivateTranscribe.app is a local-first transcription utility. The core promise is that audio files are processed locally in the browser without an account or required upload.

The founding product document lives at `docs/PrivateTranscribe_Founding_Document.md`.

## License

PrivateTranscribe.app is licensed under AGPL-3.0-only.

The short version: you can use, study, copy, modify, and share the code. If you
modify the app and make it available to users over a network, those users should
also be able to access the corresponding source code under the same license.

This license choice is intentional. PrivateTranscribe.app makes privacy claims,
and public source makes those claims easier to inspect and verify.

See `LICENSE` for the full license text and `THIRD_PARTY_NOTICES.md` for major
third-party runtime and model references.

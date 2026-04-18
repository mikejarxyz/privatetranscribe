# Third-Party Notices

This file summarizes major third-party software and model assets used by
PrivateTranscribe.app. It is not a complete dependency license report.

## Application Source

The PrivateTranscribe.app source code in this repository is licensed under
AGPL-3.0-only. See `LICENSE`.

## Runtime Dependencies

- React: MIT license.
- `@huggingface/transformers`: Apache-2.0 license.
- `lucide-react`: ISC license.

Other transitive dependencies are listed in `pnpm-lock.yaml` and may have their
own licenses.

## Speech Models

PrivateTranscribe.app currently loads these ONNX model repos through
Transformers.js:

- `onnx-community/whisper-tiny.en`
- `onnx-community/whisper-base.en`
- `onnx-community/whisper-small.en`

These repos provide ONNX weights compatible with Transformers.js and are based
on OpenAI Whisper English checkpoints. The upstream OpenAI Whisper model cards
on Hugging Face list the English Whisper checkpoints under the Apache-2.0
license. Users and deployers should review the current model cards and files for
the exact terms that apply to the downloaded model assets.

Relevant model pages:

- <https://huggingface.co/onnx-community/whisper-tiny.en>
- <https://huggingface.co/onnx-community/whisper-base.en>
- <https://huggingface.co/onnx-community/whisper-small.en>
- <https://huggingface.co/openai/whisper-tiny.en>
- <https://huggingface.co/openai/whisper-base.en>
- <https://huggingface.co/openai/whisper-small.en>

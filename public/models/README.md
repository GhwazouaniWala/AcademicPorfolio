# Bundled model weights

Third-party weights served by the expression demo. Both are committed so the
demo works with no build step and no network call to anyone else's server.

## `enet_b0_8_best_afew.onnx` — 15.3 MB

EfficientNet-B0 trained on AffectNet for 8-class facial expression recognition.

- **Source:** [av-savchenko/face-emotion-recognition](https://github.com/av-savchenko/face-emotion-recognition)
  → `models/affectnet_emotions/onnx/enet_b0_8_best_afew.onnx`
- **Licence:** Apache-2.0 (© Andrey Savchenko)
- **Why this file:** it is the same checkpoint Solace loads in production, via
  EmotiEffLib — see `backend/config.py`, `face_expression_model = "enet_b0_8_best_afew"`.

**Verified I/O** (loaded in ONNX Runtime Web, not assumed):

| | |
|---|---|
| input | `input`, float32 `[1, 3, 224, 224]`, NCHW |
| output | `output`, float32 `[1, 8]` — logits, pre-softmax |
| cold load | ~0.9 s |
| inference | ~200 ms/frame, single-threaded WASM + SIMD |

EmotiEffLib *rewrites* this graph at load time to expose the 1280-d penultimate
features (it needs them for its engagement head) and then applies the final
linear layer in NumPy. We run the file unmodified, so the output is already the
8 class logits — no separate classifier step.

> **Not INT8.** The original brief specified a ~5 MB dynamically-quantised
> export. This is the upstream FP32 file at 15.3 MB, because quantising it needs
> the Python `onnxruntime.quantization` toolchain, which isn't available here.
> It is lazy-loaded on click, so it costs nothing until someone starts the demo.

## `/mediapipe/` — face detection

- `blaze_face_short_range.tflite` (225 KB) and `wasm/vision_wasm_*` (11.5 MB)
- **Source:** Google MediaPipe Tasks Vision, Apache-2.0
- Vendored from `node_modules/@mediapipe/tasks-vision` and the MediaPipe model
  bucket rather than loaded from jsDelivr, which serves
  `vision_wasm_internal.js` as `text/plain` — the browser then refuses to
  execute it and the detector never loads.

## Preprocessing

Every constant that has to match training lives in
`src/components/demos/emotion/constants.js`. Read the warning at the top of that
file before changing any of it — a mismatch does not throw, it just relabels
every prediction.

## `samples/reel.mp4` — the bundled clip

7.2 s, 542 KB, 640×640, looping. **The default way to run this demo**: a
recruiter should see the whole pipeline work without ever being asked for
camera permission.

Built by `scripts/build-demo-reel.mjs` from six StyleGAN faces
(thispersondoesnotexist.com) cross-faded together. **Nobody in it is a real
person**, so no likeness or consent question arises; the UI labels it as
AI-generated. Source frames live in `data/reel-frames/` — outside `public/`,
so 3.5 MB of stills never ship to the browser.

A moving source is the point. Stills could only ever show a handful of fixed
answers; against the clip you can watch inference fire every 3rd frame and the
distribution ease between faces across the 5-frame window. Measured on the
committed reel:

| t | top-1 |
|---|---|
| 0.5 s | Happiness 100% |
| 2.2 s | Disgust 24% (mid cross-fade — genuinely ambiguous) |
| 3.9 s | Happiness 30% |
| 5.6 s | Happiness 100% |
| 7.0 s | Neutral 49% |

The frames were picked by running the classifier over a batch of twelve and
keeping a spread of confident and uncertain reads. Note the skew in that batch:
most StyleGAN portraits read as Happiness, because FFHQ — the dataset it was
trained on — is overwhelmingly smiling faces. That is a property of the source
images, not a defect in the classifier.

Rebuild with `npm run build:reel` (needs ffmpeg on PATH).

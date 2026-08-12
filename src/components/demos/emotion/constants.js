/**
 * Every constant the expression classifier depends on, in one place.
 *
 * ⚠️ A mismatch between these values and the ones used at training time does not
 * throw — it produces confidently wrong predictions. If you swap the model file,
 * re-check every field here against the export before trusting a single number.
 *
 * Provenance: Solace runs EmotiEffLib's `enet_b0_8_best_afew` (EfficientNet-B0,
 * 8 expression classes, ONNX) — see the Solace README, "Face → emotion". The
 * values below follow that model's published preprocessing:
 * 224×224 resize, RGB, ImageNet mean/std, NCHW.
 *
 * VERIFY-ON-SWAP: CLASS_LABELS order, MEAN/STD, INPUT_SIZE, and CROP_MARGIN all
 * come from the upstream recipe rather than from a file in this repo. The class
 * *order* in particular is silent when wrong — it just relabels every output.
 */

export const MODEL_URL = "/models/enet_b0_8_best_afew.onnx";

/** AffectNet-8 label order used by `enet_b0_8_best_afew`. */
export const CLASS_LABELS = [
  "Anger",
  "Contempt",
  "Disgust",
  "Fear",
  "Happiness",
  "Neutral",
  "Sadness",
  "Surprise",
];

export const PREPROCESS = {
  /** Square input edge, in pixels. */
  INPUT_SIZE: 224,
  /** Channel order fed to the network. */
  CHANNEL_ORDER: "RGB",
  /** Tensor layout: batch, channel, height, width. */
  LAYOUT: "NCHW",
  /** Pixels are scaled to [0,1] first, then normalised with these. ImageNet stats. */
  MEAN: [0.485, 0.456, 0.406],
  STD: [0.229, 0.224, 0.225],
  /**
   * Fraction of the detected face box added on every side before cropping.
   * Expression models are trained on loose crops that include brow and jaw;
   * a tight box clips exactly the regions that separate fear from surprise.
   */
  CROP_MARGIN: 0.2,
};

/** Inference cadence and smoothing — matches Solace's production settings. */
export const RUNTIME = {
  /** Classify every Nth camera frame; the rest are preview only. */
  FRAME_STRIDE: 3,
  /** Rolling mean over this many distributions, so a blink cannot flip the label. */
  SMOOTHING_WINDOW: 5,
};

/**
 * The bundled sample clip — the default way to run this demo, and the reason a
 * recruiter never has to grant camera permission to see it work.
 *
 * A moving source matters: stills could only ever show three fixed answers,
 * which hides the temporal half of the pipeline. Against the reel you can watch
 * inference fire every 3rd frame and the distribution ease between faces over
 * the 5-frame window instead of snapping.
 *
 * The faces are StyleGAN outputs — nobody in the clip is a real person, so no
 * likeness or consent question arises. Labelled as synthetic in the UI.
 */
export const SAMPLE_VIDEO = {
  src: "/models/samples/reel.mp4",
  seconds: 7.2,
  label: "Sample clip · AI-generated faces",
};

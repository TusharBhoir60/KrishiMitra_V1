
"""
Phase 3 Training Script — Crop Quality Detection
============================================================
Fine-tunes MobileNetV2 for multi-output crop quality classification.
Outputs:
  - Grade:     A | B | C
  - Freshness: fresh | moderate | stale

Usage:
    python training/train_quality.py --data datasets/crop_images/
    python training/train_quality.py --data datasets/crop_images/ --epochs 30

Dataset folder structure expected:
    datasets/crop_images/
    ├── grade_A/
    ├── grade_B/
    ├── grade_C/
    └── (freshness labels can be embedded in filename: img_fresh_001.jpg)

Output:
    models/saved/quality_model.h5
    models/saved/quality_metrics.json
"""

import argparse
import json
import sys
import os
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

IMG_SIZE     = (224, 224)
BATCH_SIZE   = 32
RANDOM_STATE = 42


# ─────────────────────────────────────────
# Synthetic Data Generator (for demo/testing without real images)
# ─────────────────────────────────────────

def generate_synthetic_image_dataset(n_samples: int = 600):
    """
    Creates synthetic image tensors with dummy labels for smoke-testing.
    Replace with real crop image dataset for production.
    """
    print(f"[DataGen] Generating {n_samples} synthetic image tensors (224×224×3)...")
    rng = np.random.default_rng(RANDOM_STATE)

    X = rng.uniform(0, 1, (n_samples, 224, 224, 3)).astype(np.float32)

    # Grade labels: 0=A, 1=B, 2=C
    grade_labels = rng.integers(0, 3, n_samples)
    # Freshness labels: 0=fresh, 1=moderate, 2=stale
    freshness_labels = rng.integers(0, 3, n_samples)

    return X, grade_labels, freshness_labels


# ─────────────────────────────────────────
# Dataset Loader for Real Image Folders
# ─────────────────────────────────────────

def load_image_dataset(data_dir: str):
    """
    Load images from folder structure.
    Expects subfolders: grade_A, grade_B, grade_C
    Freshness is inferred from filename suffix: _fresh, _moderate, _stale
    """
    try:
        import tensorflow as tf
        from PIL import Image
        import io
    except ImportError:
        raise ImportError("TensorFlow and Pillow required. Run: pip install tensorflow Pillow")

    data_path = Path(data_dir)
    grade_map     = {"grade_A": 0, "grade_B": 1, "grade_C": 2}
    freshness_map = {"fresh": 0, "moderate": 1, "stale": 2}

    X, grade_labels, freshness_labels = [], [], []

    for folder_name, grade_idx in grade_map.items():
        folder = data_path / folder_name
        if not folder.exists():
            print(f"[Warning] Folder not found: {folder} — skipping")
            continue

        image_files = list(folder.glob("*.jpg")) + list(folder.glob("*.png"))
        print(f"[Data] {folder_name}: {len(image_files)} images")

        for img_path in image_files:
            try:
                img = Image.open(img_path).convert("RGB").resize(IMG_SIZE)
                arr = np.array(img, dtype=np.float32) / 255.0
                X.append(arr)
                grade_labels.append(grade_idx)

                # Infer freshness from filename
                stem = img_path.stem.lower()
                if "fresh" in stem and "moderate" not in stem:
                    freshness_labels.append(0)
                elif "moderate" in stem:
                    freshness_labels.append(1)
                elif "stale" in stem:
                    freshness_labels.append(2)
                else:
                    freshness_labels.append(0)   # default: fresh

            except Exception as e:
                print(f"[Warning] Could not load {img_path}: {e}")

    if not X:
        raise ValueError(f"No valid images found in {data_dir}. Check folder structure.")

    return (
        np.array(X, dtype=np.float32),
        np.array(grade_labels),
        np.array(freshness_labels),
    )


# ─────────────────────────────────────────
# Model Architecture
# ─────────────────────────────────────────

def build_quality_model():
    """
    Multi-output MobileNetV2 model.
    Base: MobileNetV2 pretrained on ImageNet (frozen initially)
    Head 1: Grade classification (A/B/C)
    Head 2: Freshness classification (fresh/moderate/stale)
    """
    try:
        import tensorflow as tf
        from tensorflow.keras import layers, Model
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras.optimizers import Adam
    except ImportError:
        raise ImportError("TensorFlow required. Run: pip install tensorflow")

    print("[Model] Building MobileNetV2 transfer learning model...")

    # ── Base model (frozen) ──────────────────────────────────────────────────
    base = MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False   # Freeze base during Phase 1 training

    # ── Shared feature extractor ─────────────────────────────────────────────
    inputs       = tf.keras.Input(shape=(*IMG_SIZE, 3))
    x            = base(inputs, training=False)
    x            = layers.GlobalAveragePooling2D()(x)
    x            = layers.Dense(256, activation="relu")(x)
    x            = layers.Dropout(0.4)(x)
    shared_feats = layers.Dense(128, activation="relu")(x)

    # ── Grade head ───────────────────────────────────────────────────────────
    grade_out = layers.Dense(64, activation="relu")(shared_feats)
    grade_out = layers.Dropout(0.3)(grade_out)
    grade_out = layers.Dense(3, activation="softmax", name="grade")(grade_out)

    # ── Freshness head ───────────────────────────────────────────────────────
    fresh_out = layers.Dense(64, activation="relu")(shared_feats)
    fresh_out = layers.Dropout(0.3)(fresh_out)
    fresh_out = layers.Dense(3, activation="softmax", name="freshness")(fresh_out)

    model = Model(inputs=inputs, outputs=[grade_out, fresh_out])

    model.compile(
        optimizer=Adam(learning_rate=1e-3),
        loss={
            "grade":     "sparse_categorical_crossentropy",
            "freshness": "sparse_categorical_crossentropy",
        },
        loss_weights={"grade": 1.0, "freshness": 0.8},
        metrics={
            "grade":     ["accuracy"],
            "freshness": ["accuracy"],
        },
    )

    return model, base


# ─────────────────────────────────────────
# Fine-Tuning
# ─────────────────────────────────────────

def fine_tune(model, base, X_train, y_grade_train, y_fresh_train, epochs: int = 10):
    """Unfreeze top layers of MobileNetV2 for fine-tuning."""
    try:
        from tensorflow.keras.optimizers import Adam
    except ImportError:
        return model

    print("\n[FineTune] Unfreezing top 30 layers of MobileNetV2 for fine-tuning...")
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss={"grade": "sparse_categorical_crossentropy", "freshness": "sparse_categorical_crossentropy"},
        loss_weights={"grade": 1.0, "freshness": 0.8},
        metrics={"grade": ["accuracy"], "freshness": ["accuracy"]},
    )

    model.fit(
        X_train,
        {"grade": y_grade_train, "freshness": y_fresh_train},
        epochs=epochs,
        batch_size=BATCH_SIZE,
        verbose=1,
    )
    return model


# ─────────────────────────────────────────
# Training Entry Point
# ─────────────────────────────────────────

def train(data_dir: str = None, epochs: int = 20, fine_tune_epochs: int = 10):
    print("\n" + "="*60)
    print("  AgriConnect — Phase 3: Crop Quality Model Training")
    print("="*60)

    try:
        import tensorflow as tf
        print(f"[TF] TensorFlow version: {tf.__version__}")
        tf.random.set_seed(RANDOM_STATE)
    except ImportError:
        print("[Error] TensorFlow not installed. Run: pip install tensorflow")
        sys.exit(1)

    # Load data
    if data_dir and Path(data_dir).exists():
        X, y_grade, y_fresh = load_image_dataset(data_dir)
    else:
        print("[Data] No image dataset path provided — using synthetic tensors.")
        X, y_grade, y_fresh = generate_synthetic_image_dataset()

    print(f"[Data] X shape: {X.shape} | Grades: {np.bincount(y_grade)} | Freshness: {np.bincount(y_fresh)}")

    # Split
    from sklearn.model_selection import train_test_split
    split = int(len(X) * 0.8)
    X_train, X_test     = X[:split], X[split:]
    yg_train, yg_test   = y_grade[:split], y_grade[split:]
    yf_train, yf_test   = y_fresh[:split], y_fresh[split:]

    # Build model
    model, base = build_quality_model()
    model.summary(line_length=80)

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_grade_accuracy", patience=5, restore_best_weights=True, verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, verbose=1
        ),
    ]

    print(f"\n[Train] Phase 1 — Training classification heads ({epochs} epochs)...")
    history = model.fit(
        X_train,
        {"grade": yg_train, "freshness": yf_train},
        validation_data=(X_test, {"grade": yg_test, "freshness": yf_test}),
        epochs=epochs,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1,
    )

    # Fine-tuning phase
    if fine_tune_epochs > 0:
        model = fine_tune(model, base, X_train, yg_train, yf_train, epochs=fine_tune_epochs)

    # Evaluate
    results = model.evaluate(
        X_test,
        {"grade": yg_test, "freshness": yf_test},
        verbose=0,
    )
    metrics_names = model.metrics_names
    eval_dict     = dict(zip(metrics_names, results))

    grade_acc = eval_dict.get("grade_accuracy", 0)
    fresh_acc = eval_dict.get("freshness_accuracy", 0)

    print(f"\n{'─'*40}")
    print(f"  Final Evaluation")
    print(f"{'─'*40}")
    print(f"  Grade Accuracy    : {grade_acc*100:.1f}%")
    print(f"  Freshness Accuracy: {fresh_acc*100:.1f}%")
    print(f"{'─'*40}")

    # Save
    model_path   = MODELS_DIR / "quality_model.h5"
    metrics_path = MODELS_DIR / "quality_metrics.json"

    model.save(str(model_path))
    metrics = {
        "grade_accuracy_pct":     round(grade_acc * 100, 2),
        "freshness_accuracy_pct": round(fresh_acc * 100, 2),
        "n_train":                len(X_train),
        "n_test":                 len(X_test),
        "model_version":          "1.0.0-mobilenetv2",
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[Save] Quality model → {model_path}")
    print("\n✅  Phase 3 training complete!\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",       type=str, default=None, help="Path to crop_images/ folder")
    parser.add_argument("--epochs",     type=int, default=20)
    parser.add_argument("--fine-tune",  type=int, default=10, dest="fine_tune_epochs")
    args = parser.parse_args()
    train(data_dir=args.data, epochs=args.epochs, fine_tune_epochs=args.fine_tune_epochs)
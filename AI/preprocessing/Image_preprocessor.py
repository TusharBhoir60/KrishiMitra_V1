"""
Image Preprocessor — Phase 3 Crop Quality
Handles image resizing, normalization, and tensor preparation for MobileNetV2.
"""

import numpy as np
from PIL import Image
import io


IMG_SIZE   = (224, 224)   # MobileNetV2 input size
MEAN       = np.array([0.485, 0.456, 0.406])   # ImageNet mean (RGB)
STD        = np.array([0.229, 0.224, 0.225])   # ImageNet std  (RGB)


def preprocess_image_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes → normalized (1, 224, 224, 3) float32 numpy array.
    Uses ImageNet normalization to match MobileNetV2 pre-training expectations.

    Args:
        image_bytes: Raw bytes of a JPEG/PNG/WebP image

    Returns:
        np.ndarray of shape (1, 224, 224, 3)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = (arr - MEAN) / STD
    return np.expand_dims(arr, axis=0)   # Add batch dimension


def preprocess_image_path(image_path: str) -> np.ndarray:
    """
    Convenience wrapper for loading from a file path (used during training).
    """
    with open(image_path, "rb") as f:
        return preprocess_image_bytes(f.read())


def augment_image(img_array: np.ndarray) -> list:
    """
    Return augmented versions of a training image.
    Used in training to increase dataset diversity.

    Args:
        img_array: numpy array of shape (H, W, 3)

    Returns:
        list of augmented numpy arrays
    """
    augmented = [img_array]

    # Horizontal flip
    augmented.append(np.fliplr(img_array))

    # Vertical flip
    augmented.append(np.flipud(img_array))

    # Brightness adjustment (+10%)
    bright = np.clip(img_array * 1.1, 0, 1)
    augmented.append(bright)

    # Brightness adjustment (-10%)
    dark = np.clip(img_array * 0.9, 0, 1)
    augmented.append(dark)

    return augmented
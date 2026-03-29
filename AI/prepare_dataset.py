import os
import shutil
import pathlib

# ── CONFIG ──────────────────────────────────────────
SOURCE_DIR  = "Datasets/Vegetable Images/train"
OUTPUT_DIR  = "Datasets/crop_images"
CROPS       = ["Tomato", "Potato", "Brinjal", "Carrot",
               "Cauliflower", "Cabbage", "Cucumber", "Capsicum"]

# Split ratio: 60% A, 25% B, 15% C
SPLITS = {"Grade_A": 0.60, "Grade_B": 0.25, "Grade_C": 0.15}
# ────────────────────────────────────────────────────

FRESHNESS_MAP = {"Grade_A": "fresh", "Grade_B": "moderate", "Grade_C": "stale"}

for grade in SPLITS:
    pathlib.Path(f"{OUTPUT_DIR}/{grade}").mkdir(parents=True, exist_ok=True)

for crop in CROPS:
    crop_folder = pathlib.Path(SOURCE_DIR) / crop
    if not crop_folder.exists():
        print(f"[Skip] {crop} folder not found")
        continue

    images = sorted(crop_folder.glob("*.jpg")) + sorted(crop_folder.glob("*.png"))
    total  = len(images)
    print(f"[{crop}] Found {total} images")

    idx = 0
    for grade, ratio in SPLITS.items():
        count     = int(total * ratio)
        freshness = FRESHNESS_MAP[grade]
        batch     = images[idx: idx + count]

        for i, img_path in enumerate(batch, 1):
            ext      = img_path.suffix
            new_name = f"{crop.lower()}_{freshness}_{i:03d}{ext}"
            dest     = pathlib.Path(OUTPUT_DIR) / grade / new_name
            shutil.copy2(img_path, dest)

        print(f"  → {grade}/: {len(batch)} images")
        idx += count

print("\n✅ Done! Your datasets/crop_images/ folder is ready.")
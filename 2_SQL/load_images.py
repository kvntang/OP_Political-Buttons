import os
import cv2
import numpy as np
from sklearn.cluster import KMeans
import sqlite3

# Function to extract dominant color
def extract_dominant_color(image_path, k=1):
    """Extract the dominant color of an image using K-Means clustering."""
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert BGR to RGB
    img = img.reshape((-1, 3))  # Reshape to list of pixels

    # Use sklearn KMeans instead of cv2.KMeans
    kmeans = KMeans(n_clusters=k, random_state=0, n_init=10)
    kmeans.fit(img)
    dominant_color = kmeans.cluster_centers_[0]  # Most dominant color

    # Convert to HEX format
    return "#{:02x}{:02x}{:02x}".format(int(dominant_color[0]), int(dominant_color[1]), int(dominant_color[2]))

# Function to convert "na" values to None (NULL)
def clean_value(value):
    return None if value.lower() == "na" else value

# Connect to the database
conn = sqlite3.connect("images.db")
cursor = conn.cursor()

# Folder containing images
image_folder = "archive/"

# Loop through images and insert extracted data
for filename in os.listdir(image_folder):
    if filename.endswith(".jpg") or filename.endswith(".png"):
        img_path = os.path.join(image_folder, filename)

        # Extract metadata from filename
        parts = filename.replace(".jpg", "").replace(".png", "").split("_")

        if len(parts) < 4:
            print(f"❌ Skipping {filename} (Invalid format)")
            continue  # Skip files with incorrect format

        title = clean_value(parts[0])
        date = clean_value(parts[1])
        img_type = clean_value(parts[2])
        dimension = clean_value(parts[3])
        color = extract_dominant_color(img_path)

        # Insert into database (NULL stored if value is None)
        cursor.execute("INSERT INTO images (title, date, type, dimension, color) VALUES (?, ?, ?, ?, ?)",
                       (title, date, img_type, dimension, color))

        print(f"✅ Added: {title} | Date: {date} | Type: {img_type} | Dimension: {dimension} | Color: {color}")

# Commit changes
conn.commit()
conn.close()
print("✅ All images loaded into the database!")

from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
import sqlite3
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Set the correct folder where images are stored
IMAGE_FOLDER = os.path.abspath("archive/")  # Change "images/" to "archive/"

# Database connection function
def get_db_connection():
    conn = sqlite3.connect("images.db")
    conn.row_factory = sqlite3.Row  # Allows dict-like row access
    return conn

@app.get("/images")
def get_images(
    min_date: int = Query(None, description="Minimum date (e.g., 1940)"),
    max_date: int = Query(None, description="Maximum date (e.g., 2000)"),
    type: str = Query(
        None,
        description="Filter by image type. Use 'political-campaigns' to show only political campaigns, 'other' to show everything else."
    ),
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Construct query dynamically
    query = "SELECT * FROM images WHERE 1=1"
    params = []

    # 🔹 Date range filtering
    if min_date and max_date:
        query += " AND date BETWEEN ? AND ?"
        params.extend([min_date, max_date])
    elif min_date:
        query += " AND date >= ?"
        params.append(min_date)
    elif max_date:
        query += " AND date <= ?"
        params.append(max_date)

    # 🔹 Type filtering
    if type:
        if type == "political-campaigns":
            query += " AND type = ?"
            params.append("political-campaigns")
        elif type == "other":
            query += " AND type != ?"
            params.append("political-campaigns")
        else:
            # Fallback: filter exactly by the provided type value.
            query += " AND type = ?"
            params.append(type)

    cursor.execute(query, params)
    images = cursor.fetchall()
    conn.close()

    # 🔹 Construct image URLs using the "archive" folder
    image_list = []
    for img in images:
        # Check if dimension is None and replace it with "na"
        dimension_val = img["dimension"] if img["dimension"] is not None else "na"

        # Build filename with the dimension value (or "na" if None)
        filename = f"{img['title']}_{img['date']}_{img['type']}_{dimension_val}.jpg".replace(" ", "-")
        image_path = os.path.join(IMAGE_FOLDER, filename)

        if os.path.exists(image_path):
            image_url = f"http://127.0.0.1:8000/image/{filename}"
        else:
            image_url = None  # If file is missing, return None

        image_list.append({
            "id": img["id"],
            "title": img["title"],
            "date": img["date"],
            "type": img["type"],
            "dimension": dimension_val,  # Use the updated value
            "color": img["color"],
            "image_url": image_url  # ✅ Image URL for frontend
        })

    return image_list

# 🔹 Serve actual images from the "archive" folder
@app.get("/image/{filename}")
def get_image(filename: str):
    image_path = os.path.join(IMAGE_FOLDER, filename)
    
    if os.path.exists(image_path):
        return FileResponse(image_path)
    else:
        return {"error": "Image not found"}

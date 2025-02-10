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

# Set the correct folder where images are stored
IMAGE_FOLDER = os.path.abspath("archive/")  # Change "images/" to "archive/"

def get_db_connection():
    conn = sqlite3.connect("images.db")
    conn.row_factory = sqlite3.Row  # Allows dict-like row access
    return conn

def hex_to_hsl(hex_str: str):
    """
    Convert a hex color string (e.g. "#ff0000") to an HSL tuple.
    Returns a tuple (h, s, l) where:
      - h is the hue in degrees (0 to 360)
      - s and l are in the range [0, 1]
    """
    hex_str = hex_str.lstrip('#')
    if len(hex_str) != 6:
        # Return a default value if invalid format
        return (0, 0, 0)
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0

    max_val = max(r, g, b)
    min_val = min(r, g, b)
    l = (max_val + min_val) / 2

    if max_val == min_val:
        h = 0
        s = 0
    else:
        d = max_val - min_val
        s = d / (2 - max_val - min_val) if l > 0.5 else d / (max_val + min_val)
        if max_val == r:
            h = (g - b) / d + (6 if g < b else 0)
        elif max_val == g:
            h = (b - r) / d + 2
        else:  # max_val == b
            h = (r - g) / d + 4
        h /= 6
    # Convert hue to degrees (0-360)
    return (h * 360, s, l)

@app.get("/images")
def get_images(
    min_date: int = Query(None, description="Minimum date (e.g., 1940)"),
    max_date: int = Query(None, description="Maximum date (e.g., 2000)"),
    apply_date: bool = Query(True, description="Whether to apply the date filter"),
    type: str = Query(
        None,
        description="Filter by image type. Use 'political-campaigns' to show only political campaigns, 'other' to show everything else."
    ),
    color: str = Query(None, description="Selected color in hex (e.g., #ff0000) for hue filtering"),
    hue_tolerance: float = Query(10.0, description="Hue tolerance in degrees")
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Construct query dynamically
    query = "SELECT * FROM images WHERE 1=1"
    params = []

    # Date range filtering: only apply if apply_date is True
    if apply_date:
        if min_date and max_date:
            query += " AND date BETWEEN ? AND ?"
            params.extend([min_date, max_date])
        elif min_date:
            query += " AND date >= ?"
            params.append(min_date)
        elif max_date:
            query += " AND date <= ?"
            params.append(max_date)

    # Type filtering
    if type:
        if type == "political-campaigns":
            query += " AND type = ?"
            params.append("political-campaigns")
        elif type == "other":
            query += " AND type != ?"
            params.append("political-campaigns")
        else:
            query += " AND type = ?"
            params.append(type)

    cursor.execute(query, params)
    images = cursor.fetchall()
    conn.close()

    # Construct image list
    image_list = []
    for img in images:
        title_val = img["title"] if img["title"] is not None else "na"
        date_val = img["date"] if img["date"] is not None else "na"
        type_val = img["type"] if img["type"] is not None else "na"
        dimension_val = img["dimension"] if img["dimension"] is not None else "na"
        filename = f"{title_val}_{date_val}_{type_val}_{dimension_val}.jpg".replace(" ", "-")
        image_path = os.path.join(IMAGE_FOLDER, filename)


        if os.path.exists(image_path):
            image_url = f"http://127.0.0.1:8000/image/{filename}"
        else:
            image_url = None

        image_list.append({
            "id": img["id"],
            "title": img["title"],
            "date": img["date"],
            "type": img["type"],
            "dimension": dimension_val,
            "color": img["color"],
            "image_url": image_url
        })

    # Hue filtering: if a color is provided, filter images by comparing hue difference.
    if color:
        # Normalize the color so it always starts with a single "#"
        color = "#" + color.lstrip("#")
        try:
            selected_hue, _, _ = hex_to_hsl(color)
        except Exception as e:
            print("Error converting selected color:", e)
            selected_hue = None

        if selected_hue is not None:
            filtered_list = []
            for img in image_list:
                img_color = img.get("color")
                if img_color:
                    image_hue, _, _ = hex_to_hsl(img_color)
                    hue_diff = abs(selected_hue - image_hue)
                    if hue_diff > 180:
                        hue_diff = 360 - hue_diff
                    print(f"Image ID {img['id']}: image_hue={image_hue:.2f}, selected_hue={selected_hue:.2f}, hue_diff={hue_diff:.2f}")
                    if hue_diff <= hue_tolerance:
                        filtered_list.append(img)
            image_list = filtered_list

    return image_list

@app.get("/image/{filename}")
def get_image(filename: str):
    image_path = os.path.join(IMAGE_FOLDER, filename)
    if os.path.exists(image_path):
        return FileResponse(image_path)
    else:
        return {"error": "Image not found"}

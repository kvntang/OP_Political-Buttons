import sqlite3

conn = sqlite3.connect("images.db")
cursor = conn.cursor()

# Fetch all images, showing NULL values
cursor.execute("SELECT * FROM images")
images = cursor.fetchall()

for image in images:
    print(image)  # NULL values will appear as None in Python

conn.close()

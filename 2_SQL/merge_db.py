import sqlite3

# Paths to old and new databases
MAIN_DB = "../backend/images.db"
NEW_DB = "../backend/new_images.db"

# Connect to both databases
main_conn = sqlite3.connect(MAIN_DB)
new_conn = sqlite3.connect(NEW_DB)

main_cursor = main_conn.cursor()
new_cursor = new_conn.cursor()

# Attach new database
main_cursor.execute(f"ATTACH DATABASE '{NEW_DB}' AS new_db")

# Insert data from new_db.images into images (avoiding duplicates)
main_cursor.execute("""
    INSERT INTO images SELECT * FROM new_db.images
    WHERE id NOT IN (SELECT id FROM images);
""")

# Commit and close
main_conn.commit()
main_conn.close()
new_conn.close()

print("Databases merged successfully!")

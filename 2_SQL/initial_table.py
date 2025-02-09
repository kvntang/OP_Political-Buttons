import sqlite3

# Connect to database (or create if it doesn't exist)
conn = sqlite3.connect("images.db")
cursor = conn.cursor()

# Create table with only the necessary fields
cursor.execute('''
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date TEXT,
    type TEXT,
    dimension TEXT,
    color TEXT
)
''')

conn.commit()
conn.close()
print("✅ Database and table created!")

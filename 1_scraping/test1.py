import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Define the folder to save images
save_path = os.path.expanduser("~/Desktop/Harvard_Archive_Test")
os.makedirs(save_path, exist_ok=True)

# Setup Chrome options
options = Options()
options.add_argument("--headless")  # Run in background
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")

# Start WebDriver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Harvard Archive Page URL (first page)
url = "https://curiosity.lib.harvard.edu/jacques-burkhardt-scientific-drawings/catalog/33-ARC_209-001"
driver.get(url)

try:
    print("Testing Selenium page access...")

    # Wait for the page to load fully
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    time.sleep(3)  # Allow additional time for JavaScript elements
    print("✅ Page loaded successfully!")

    # Extract full page text
    full_text = driver.execute_script("return document.body.innerText;")
    print("\n📜 FULL PAGE TEXT EXTRACTED:")
    print(full_text[:1000])  # Print first 1000 characters

    # Find the **real downloadable image link** (High Resolution 800x800)
    download_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Medium: 800 x 800 px')]")

    if download_links:
        for idx, link in enumerate(download_links, start=1):
            img_url = link.get_attribute("href")
            print(f"Downloading image {idx}: {img_url}")

            response = requests.get(img_url)
            if response.status_code == 200:
                file_path = os.path.join(save_path, f"harvard_image_{idx}.jpg")
                with open(file_path, "wb") as file:
                    file.write(response.content)
                print(f"✅ Saved: {file_path}")
            else:
                print(f"❌ Failed to download image {idx} (Status Code: {response.status_code})")

    else:
        print("⚠️ No downloadable images found!")

except Exception as e:
    print(f"❌ Error: {e}")

# Close the browser
driver.quit()
print("Test complete.")

import os
import time
import requests
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Function to extract fields
def extract_metadata(text):
    title_match = re.search(r'TITLE\s*(.*)', text)
    date_match = re.search(r'DATE\s*(\d{4})', text)  # Look for a 4-digit year
    extent_match = re.search(r'EXTENT\s*(diameter:\s*[\d\.]+ cm)', text)
    subjects_match = re.search(r'SUBJECTS\s*(.*)', text)

    # Extract values or assign 'na' if not found
    title = title_match.group(1).strip().replace(" ", "-") if title_match else "na"
    date = date_match.group(1).strip() if date_match else "na"
    extent = extent_match.group(1).strip().replace("diameter: ", "").replace(" ", "") if extent_match else "na"
    subjects = subjects_match.group(1).strip().split("\n")[0].replace(" ", "-") if subjects_match else "na"

    # Construct formatted filename
    filename = f"{title}_{date}_{subjects}_{extent}"
    return filename

# Define the folder to save images
save_path = os.path.expanduser("~/Desktop/Harvard_Political_Buttons_round_2")
os.makedirs(save_path, exist_ok=True)

# Setup Chrome options
options = Options()
options.add_argument("--headless")  # Run in background
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")
options.add_argument("--disable-blink-features=AutomationControlled")  # Prevent bot detection

# Start WebDriver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

base_url = "https://curiosity.lib.harvard.edu"
search_url_template = "https://curiosity.lib.harvard.edu/political-buttons/catalog?page={}&per_page=96&search_field=all_fields"

# Loop through all 30 pages
for page_num in range(16, 31):  # Adjust the range if necessary
    search_results_url = search_url_template.format(page_num)
    print(f"\n📄 Scraping page {page_num}: {search_results_url}")
    
    # Step 1: Visit the search results page
    driver.get(search_results_url)
    time.sleep(5)  # Give time for JavaScript to load

    # Step 2: Extract all links on the page
    button_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/political-buttons/catalog/')]")

    # Ensure URLs are formatted correctly
    unique_links = list(set([
        link.get_attribute("href") if link.get_attribute("href").startswith("http") 
        else base_url + link.get_attribute("href") 
        for link in button_links
    ]))

    print(f"🔎 Found {len(unique_links)} unique button pages on page {page_num}!")

    # Step 3: Visit each button page and download the correct 800x800 image
    for idx, button_url in enumerate(unique_links, start=1):
        print(f"\n🔎 Accessing button page {idx}: {button_url}")

        try:
            driver.get(button_url)
            time.sleep(3)  # Small delay for loading
            
            # Check if the page actually loads (handles 404s)
            if "Page Not Found" in driver.page_source:
                print(f"❌ Skipping page {idx} (404 Not Found)")
                continue

            # Wait for the download link to appear
            wait = WebDriverWait(driver, 10)

            # Extract full page text
            full_text = driver.execute_script("return document.body.innerText;")
            formatted_filename = extract_metadata(full_text)
            print(f'Metadata: {formatted_filename}')

            # image link
            download_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(text(), 'Medium: 800 x 800 px')]")))
            img_url = download_link.get_attribute("href")

            print(f"📸 Downloading: {img_url}")

            # Download and save the image
            response = requests.get(img_url, timeout=10)
            if response.status_code == 200:
                file_path = os.path.join(save_path, f"{formatted_filename}.jpg")
                with open(file_path, "wb") as file:
                    file.write(response.content)
                print(f"✅ Saved: {file_path}")
            else:
                print(f"❌ Failed to download image {idx} (Status Code: {response.status_code})")

        except Exception as e:
            print(f"❌ Error on page {idx}: {e}")
            continue  # Skip to next button if there's an error

# Close the browser
driver.quit()
print("✅ All images downloaded!")

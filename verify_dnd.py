from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173", timeout=60000)

            # Wait for content
            print("Waiting for content...")
            # Look for a Day header or "Start your expedition"
            # If mock data is loaded, we should see "Day 1".
            try:
                page.wait_for_selector(".day-header", timeout=10000)
                print("Day headers found.")
            except:
                print("Day headers not found. Maybe no trip?")
                # Check for "No active itinerary" text
                content = page.content()
                if "No active itinerary" in content:
                    print("Found 'No active itinerary'.")
                else:
                    print("Unknown state. Dumping content snippet...")
                    print(content[:500])

            # Take screenshot
            os.makedirs("/home/jules/verification", exist_ok=True)
            screenshot_path = "/home/jules/verification/itinerary.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()

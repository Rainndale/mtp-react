from playwright.sync_api import sync_playwright

def verify_header():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Note: Depending on environment, viewport size might need adjustment for mobile/desktop view
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Wait for server to start (simple sleep or retry logic usually needed, but assume it's up quickly)
        try:
            page.goto("http://localhost:5173/mtp-react/")
            page.wait_for_timeout(3000) # Wait for app to load

            # Screenshot the whole page to see the header and day groups
            page.screenshot(path="verification/header_verification.png")
            print("Screenshot taken")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_header()

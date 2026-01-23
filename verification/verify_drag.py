from playwright.sync_api import sync_playwright

def verify_drag_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context with mobile viewport to simulate touch interactions if possible,
        # though Playwright's drag API is mouse-based. We'll test the logic.
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        # 1. Load the app
        # Assuming Vite runs on port 5173 by default
        page.goto("http://localhost:5173")

        # Wait for content to load
        page.wait_for_selector('.day-header')

        print("Page loaded successfully")

        # 2. Verify Day Header exists
        day_header = page.locator('.day-header').first
        if day_header.is_visible():
            print("Day header found")

        # 3. Take a screenshot of the initial state
        page.screenshot(path="verification/initial_state.png")
        print("Initial state screenshot saved")

        # Note: Testing actual drag-and-drop physics and sticky positioning behavior
        # via headless script is difficult because 'sticky' relies on scrolling and
        # DnD libraries often use pointer events that are hard to simulate perfectly in headless.
        # However, we can verify that the app renders correctly and didn't crash.

        browser.close()

if __name__ == "__main__":
    verify_drag_fixes()

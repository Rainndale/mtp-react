
from playwright.sync_api import sync_playwright

def verify_modals(page):
    page.goto("http://localhost:5173/mtp-react/")

    # Wait for hydration
    page.wait_for_timeout(2000)

    # Open Sidebar
    try:
        page.locator(".fa-bars-staggered").first.click() # Header toggle
    except:
        print("Could not open sidebar")

    page.wait_for_timeout(1000)

    # Click New Expedition in Sidebar
    try:
        # Use simple text matching
        page.get_by_text("New Expedition").click()
    except:
        print("Could not find New Expedition")

    page.wait_for_timeout(1000)

    # 2. Trigger Validation Error in Trip Modal
    try:
        page.get_by_role("button", name="Save", exact=True).click()
    except:
        page.locator("button:has-text('Save')").last.click()

    page.wait_for_timeout(1000)

    # Screenshot 1: Trip Validation Alert
    page.screenshot(path="verification/1_trip_validation.png")

    # Close Alert (OK button)
    page.get_by_role("button", name="OK").click()
    page.wait_for_timeout(500)

    # 3. Create a Dummy Trip
    page.locator("input").first.fill("Test Trip")

    days = page.locator(".cursor-pointer")
    if days.count() > 5:
        days.nth(10).click() # Start
        days.nth(12).click() # End

    page.get_by_role("button", name="Save", exact=True).click()
    page.wait_for_timeout(1000)

    # 4. Open Plan Modal
    # Use generic plus icon finding in the main area
    # The first plus icon in the main view (after header/sidebar)
    try:
        # Assuming the trip loaded and we see DayGroups.
        # DayGroup headers usually have a plus.
        page.locator(".fa-plus").nth(2).click() # 0: sidebar, 1: something else?
        # Or look for text "Add Plan"? No text usually.
    except:
        # Fallback
        page.locator("i.fa-plus").last.click()

    page.wait_for_timeout(1000)

    # 5. Trigger Validation Error in Plan Modal
    page.get_by_role("button", name="Save", exact=True).click()
    page.wait_for_timeout(1000)

    # Screenshot 2: Plan Validation Alert
    page.screenshot(path="verification/2_plan_validation.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 375, "height": 812})
        try:
            verify_modals(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

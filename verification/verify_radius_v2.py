
from playwright.sync_api import sync_playwright
import time

def verify_plan_item(page):
    page.goto("http://localhost:5173/mtp-react/")

    # 1. Open Sidebar
    # The header has a button with fa-bars-staggered
    # It might be an icon inside a button.
    # Selector: button:has(i.fa-bars-staggered)
    try:
        page.wait_for_selector("i.fa-bars-staggered", timeout=5000)
        page.locator("button:has(i.fa-bars-staggered)").click()
    except Exception as e:
        print(f"Could not open sidebar: {e}")
        page.screenshot(path="verification/error_sidebar.png")
        return

    # 2. Click "New Expedition" in sidebar
    try:
        page.click("text=New Expedition")
    except Exception as e:
        print(f"Could not find New Expedition button: {e}")
        page.screenshot(path="verification/error_new_expedition.png")
        return

    # 3. Fill Trip Modal
    try:
        # Trip Name
        page.fill("input[placeholder='e.g., Summer in Paris']", "Verification Trip")

        # Start Date / End Date
        # Assume two date inputs
        date_inputs = page.locator("input[type='date']")
        if date_inputs.count() >= 2:
            date_inputs.nth(0).fill("2023-05-01")
            date_inputs.nth(1).fill("2023-05-05")

        # Click "Create Trip"
        # It might be "Save Trip" or "Create Trip"
        # Look for button in the modal footer
        page.click("button:has-text('Create Trip')")

        # Wait for trip to be active. Header should show "Verification Trip"
        page.wait_for_selector("text=Verification Trip")

    except Exception as e:
        print(f"Error filling trip modal: {e}")
        page.screenshot(path="verification/error_trip_modal.png")
        return

    # 4. Add a Plan
    try:
        # Click "Tap here to add new plan" on Day 1
        # There might be multiple. Click the first one.
        page.locator("text=Tap here to add new plan").first.click()

        # Plan Modal
        # Activity Title
        page.fill("input[placeholder='e.g., Visit the Louvre']", "Test Activity Radius")

        # Save Plan
        page.click("button:has-text('Save Plan')")

        # Wait for plan item to appear
        page.wait_for_selector("text=Test Activity Radius")

        # 5. Screenshot
        # We want to clearly see the border radius.
        # Find the plan item container.
        # The text "Test Activity Radius" is inside an h5.
        # h5 parent is div. div parent is div (PlanItem container).

        # Let's verify the PlanItem container class has overflow-hidden
        # We can evaluate js to check, but visual check is key.

        plan_item = page.locator(".day-group .relative.rounded-lg").first

        # Ensure we wait for animations
        time.sleep(1)

        plan_item.screenshot(path="verification/plan_item_fixed.png")

        print("Verification screenshot saved to verification/plan_item_fixed.png")

    except Exception as e:
        print(f"Error adding plan: {e}")
        page.screenshot(path="verification/error_adding_plan.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_plan_item(page)
        finally:
            browser.close()

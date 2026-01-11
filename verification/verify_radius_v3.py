
from playwright.sync_api import sync_playwright
import time

def verify_plan_item(page):
    page.goto("http://localhost:5173/mtp-react/")

    # 1. Open Sidebar
    try:
        page.wait_for_selector("i.fa-bars-staggered", timeout=5000)
        page.locator("button:has(i.fa-bars-staggered)").click()
    except Exception as e:
        print(f"Could not open sidebar: {e}")
        return

    # 2. Click "New Expedition"
    try:
        page.click("text=New Expedition")
    except Exception as e:
        print(f"Could not find New Expedition: {e}")
        return

    # 3. Fill Trip Modal
    try:
        # Fill Name (first input)
        page.locator("input[type='text']").first.fill("Radius Test Trip")

        # Select Dates (Click day 10 and 15)
        # We need to make sure we click the day in the calendar grid.
        # The days are divs with text.
        page.click("div.grid.grid-cols-7.content-start >> text=10")
        time.sleep(0.2)
        page.click("div.grid.grid-cols-7.content-start >> text=15")

        # Click Save
        page.click("button:has-text('Save')")

        # Wait for trip header
        page.wait_for_selector("text=Radius Test Trip")

    except Exception as e:
        print(f"Error creating trip: {e}")
        page.screenshot(path="verification/error_create_trip.png")
        return

    # 4. Add a Plan
    try:
        # Click "Tap here to add new plan" on first day
        page.locator("text=Tap here to add new plan").first.click()

        # Fill Plan Modal
        # "Activity Title" label or placeholder?
        # PlanModal usually has "Activity Title" label in FloatingInput?
        # Let's assume first input is title.
        page.locator("input[type='text']").first.fill("Round Corner Activity")

        # Save Plan
        page.click("button:has-text('Save Plan')")

        # Wait for plan
        page.wait_for_selector("text=Round Corner Activity")

        # 5. Screenshot
        time.sleep(1) # Wait for animation

        # Find the plan item container to screenshot
        # It's inside a DayGroup.
        # We can screenshot the specific item.
        # Locator: div containing "Round Corner Activity" -> parent -> parent?
        # Let's just screenshot the whole page and a specific region.

        page.screenshot(path="verification/full_page.png")

        # Locate the plan item card specifically
        # The card has `bg-[var(--card-bg)]` and `rounded-lg`
        card = page.locator("div.day-group div.relative.rounded-lg").first
        if card.is_visible():
            card.screenshot(path="verification/plan_item_card.png")
            print("Captured verification/plan_item_card.png")

    except Exception as e:
        print(f"Error adding plan: {e}")
        page.screenshot(path="verification/error_add_plan.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_plan_item(page)
        finally:
            browser.close()

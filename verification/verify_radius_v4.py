
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
        # Trip Name
        page.locator("input[type='text']").first.fill("Radius Test Trip")

        # Select Dates (Click day 10 and 15)
        # Using exact selector for the day number inside the grid.
        # Ensure we wait for the calendar to render.
        page.wait_for_selector("div.grid.grid-cols-7.content-start")
        # Click "10" (assuming it's available)
        page.click("div.grid.grid-cols-7.content-start >> text=10")
        time.sleep(0.2)
        page.click("div.grid.grid-cols-7.content-start >> text=15")

        # Click Save (Exact text match)
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
        # "Activity Title" is the label. The input is inside FloatingInput.
        # It's the first input in the modal.
        # Wait for modal.
        page.wait_for_selector("text=NEW PLAN")

        # Locate the input.
        page.locator("input").first.fill("Round Corner Activity")

        # Click Save
        # There is a Save button.
        page.click("button:has-text('Save')")

        # Wait for plan item
        page.wait_for_selector("text=Round Corner Activity")

        # 5. Screenshot
        time.sleep(1) # Wait for animation

        # Screenshot the whole page first
        page.screenshot(path="verification/full_page.png")

        # Locate the plan item card specifically
        # The card containing the text.
        # Structure: div.day-group -> div -> SortableContext -> PlanItem -> div
        # Find element with text "Round Corner Activity"
        # Go up to the container div with class "relative h-16"
        card = page.locator("h5:has-text('Round Corner Activity')").locator("xpath=../..").first

        # This locator might target the inner div.
        # PlanItem return: <div ... className="relative h-16 ..."> {content} </div>
        # Inside content: <div className="flex-grow ..."> <h5>Text</h5> ... </div>
        # So ../.. is likely correct.

        if card.is_visible():
            card.screenshot(path="verification/plan_item_card.png")
            print("Captured verification/plan_item_card.png")
        else:
            print("Card not visible for specific screenshot")

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

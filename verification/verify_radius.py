
from playwright.sync_api import sync_playwright
import time

def verify_plan_item(page):
    # Wait for the app to load
    page.goto("http://localhost:5173/mtp-react/")

    # Wait for content to appear (TripModal or ItineraryList)
    # The app starts with a "No active itinerary" or a Trip Modal.
    # We might need to create a trip or mock state.
    # Looking at App.jsx might be needed, but assuming default state or mocked state.
    # Actually, ItineraryList renders "No active itinerary" if !activeTrip.

    # Let's try to add a trip quickly to see PlanItems.
    # Or we can check if there is a default state.

    # Wait for the "New Trip" button or "No active itinerary" text.
    try:
        page.wait_for_selector("text=No active itinerary", timeout=5000)
        # Create a new trip
        page.click("button:has-text('New Trip')") # Assuming there is a button or we need to find how to create one.
        # Actually, let's look at the UI structure. The header usually has a "New Trip" button?
        # Or just "Create Trip" in the modal.
    except:
        pass

    # If a modal is open (TripModal), fill it.
    try:
        if page.is_visible("text=Create New Trip"):
            page.fill("input[placeholder='e.g., Summer in Paris']", "Test Trip")
            page.fill("input[type='date']", "2023-01-01") # Start Date
            # End Date needs to be filled too
            # Find the second date input.
            date_inputs = page.locator("input[type='date']")
            date_inputs.nth(0).fill("2023-01-01")
            date_inputs.nth(1).fill("2023-01-02")

            page.click("button:has-text('Create Trip')")
            time.sleep(1)
    except Exception as e:
        print(f"Error creating trip: {e}")

    # Now we should be on the itinerary list.
    # We need to add a plan to see a PlanItem.
    try:
        # Click "Tap here to add new plan" on the first day
        page.click("text=Tap here to add new plan")

        # Plan Modal should appear.
        # Fill title.
        page.fill("input[placeholder='e.g., Visit the Louvre']", "Test Activity")
        # Save.
        page.click("button:has-text('Save Plan')")

        # Wait for the plan item to appear.
        page.wait_for_selector("text=Test Activity")

        # Take a screenshot of the plan item.
        # We want to zoom in or crop to the item to check the radius.
        item = page.locator("text=Test Activity").locator("xpath=../..").first
        # The structure is complicated, let's just screenshot the whole list.
        page.screenshot(path="verification/verification.png")

        # Also try to take a specific screenshot of the element
        # PlanItem container has "bg-[var(--card-bg)]"
        # Let's find the element containing "Test Activity"
        # The text is in an h5. The parent is a div. The parent of that is the PlanItem container?
        # PlanItem structure:
        # <div ... className="... rounded-lg ..."> ... content ... </div>

        # Locator for the plan item container
        plan_item = page.locator(".day-group .relative.rounded-lg").first
        if plan_item.count() > 0:
            plan_item.screenshot(path="verification/plan_item_detail.png")

    except Exception as e:
        print(f"Error adding plan: {e}")
        page.screenshot(path="verification/error.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_plan_item(page)
        finally:
            browser.close()

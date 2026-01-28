
from playwright.sync_api import sync_playwright, expect

def test_trip_save_confirmation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use desktop viewport to ensure sidebar or elements are visible
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            # 1. Load the app
            page.goto("http://localhost:5173")

            # Wait for Header to be visible
            expect(page.locator("header")).to_be_visible()

            # 2. Open Sidebar
            page.locator("header button").first.click()

            # Wait for sidebar text "My Journeys"
            expect(page.get_by_text("My Journeys")).to_be_visible()

            # 3. Click "New Expedition" (found in Sidebar.jsx as "New Expedition")
            # This is a button with text "New Expedition"
            page.get_by_role("button", name="New Expedition").click()

            # Expect Trip Modal
            expect(page.get_by_text("New Journey")).to_be_visible()

            # Fill in new trip details
            # Trip Name
            page.locator("div").filter(has_text="Trip Name").locator("input").fill("Test Confirmation Trip")

            # Start Date
            page.locator("div").filter(has_text="15").last.click() # Click day 15
            page.locator("div").filter(has_text="20").last.click() # Click day 20

            # Now save - Click the "Save" button in the TripModal
            # There are two "Save" buttons now: one in TripModal footer, one in Confirmation Modal.
            # At this point only one is visible.
            page.get_by_role("button", name="Save").click()

            # Expect "Save Changes?" modal
            expect(page.get_by_text("Save Changes?")).to_be_visible()

            # Take screenshot of Save Confirmation
            page.screenshot(path="verification/1_save_confirmation.png")
            print("Screenshot 1: Save Confirmation captured")

            # Confirm Save
            # Now there are TWO "Save" buttons visible (the underlying one and the confirmation one).
            # We want to click the one in the active modal (ConfirmationModal).
            # The ConfirmationModal is usually the last one in DOM or on top.
            # Or we can target it by container text "Save Changes?"
            # Or use .nth(1) or .last
            page.get_by_role("button", name="Save", exact=True).last.click()

            # Wait for modal to close
            expect(page.get_by_text("Save Changes?")).not_to_be_visible()
            expect(page.get_by_text("New Journey")).not_to_be_visible()

            # 4. Open Sidebar again to find the trip and edit
            page.locator("header button").first.click() # Open Menu again
            expect(page.get_by_text("My Journeys")).to_be_visible()

            # Find the trip item container
            trip_item = page.locator("div").filter(has_text="Test Confirmation Trip").last

            # Click the edit button (pen-to-square icon)
            trip_item.locator("button").click()

            # 5. Modify Title
            expect(page.get_by_text("Edit Journey")).to_be_visible()
            page.locator("div").filter(has_text="Trip Name").locator("input").fill("Test Confirmation Trip Modified")

            # 6. Try to Cancel
            page.get_by_role("button", name="Cancel").click()

            # Expect "Discard Changes?" modal
            expect(page.get_by_text("Discard Changes?")).to_be_visible()

            # Take screenshot of Discard Confirmation
            page.screenshot(path="verification/2_discard_confirmation.png")
            print("Screenshot 2: Discard Confirmation captured")

            # Cancel the discard (Keep Editing)
            page.get_by_role("button", name="Keep Editing").click()

            # 7. Save modifications
            page.get_by_role("button", name="Save").click()

            # Expect "Save Changes?" modal
            expect(page.get_by_text("Save Changes?")).to_be_visible()

            # Confirm Save
            page.get_by_role("button", name="Save", exact=True).last.click()

            # Verify close
            expect(page.get_by_text("Edit Journey")).not_to_be_visible()
            print("Verification successful!")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    test_trip_save_confirmation()

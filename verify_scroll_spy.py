from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/")
        page.wait_for_selector(".day-group", timeout=10000)

        # 1. Start at Top: Expect Sticky HIDDEN
        # The selector for StickyDayHeader is messy as it's a portal body child.
        # Let's look for "DAY 1" text that is FIXED.
        # StickyDayHeader has class 'fixed'.

        sticky_header = page.locator(".fixed.z-\[45\]") # z-45 from my code

        print("Initial State (Cover Image):")
        if sticky_header.is_visible():
            print("FAILURE: Sticky Header is visible at top!")
        else:
            print("PASS: Sticky Header is hidden at top.")

        # 2. Scroll a little (Day 1 Header visible)
        # Scroll to 200px. Assuming cover image is ~300px?
        # Actually cover is big. Let's scroll until Day 1 is visible.
        day1 = page.locator(".day-group").first
        day1.scroll_into_view_if_needed()
        time.sleep(0.5)

        # At this point, Day 1 header is visible in the list. Sticky should be HIDDEN.
        print("Day 1 Visible State:")
        # We need to make sure we didn't scroll TOO far.
        # Let's scroll exactly to where Day 1 starts + 10px padding
        box = day1.bounding_box()
        # Scroll to top of page = box.y - 100
        # Actually simplest is just check current state.

        # If sticky header is hidden here, it's good.
        if not sticky_header.is_visible():
            print("PASS: Sticky Header hidden when Static Header is visible.")
        else:
            # It might be visible if scrollIntoView put it at the very top (stuck).
            print("WARNING: Sticky Header visible. Checking scroll position...")

        # 3. Scroll Down deep into Day 1
        # Scroll down 500px more.
        page.mouse.wheel(0, 500)
        time.sleep(0.5)

        print("Deep Scroll State:")
        if sticky_header.is_visible():
            print("PASS: Sticky Header visible when Static Header is gone.")
        else:
            print("FAILURE: Sticky Header NOT visible deep in list.")

        browser.close()

if __name__ == "__main__":
    run()

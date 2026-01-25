import re
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # Enable console logs
        page.on("console", lambda msg: print(f"BROWSER: {msg.text}"))

        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")

        plan_title = page.locator("h5", has_text="Land at HKIA").first

        # Day 2 Body
        day2_group = page.locator(".day-group").nth(1)
        day2_bbox = day2_group.bounding_box()

        print("Dragging...")
        plan_title.hover()
        page.mouse.down()
        page.wait_for_timeout(200)

        # Target: 150px down into Day 2
        target_x = day2_bbox["x"] + day2_bbox["width"] / 2
        target_y = day2_bbox["y"] + 150
        page.mouse.move(target_x, target_y, steps=20)
        page.wait_for_timeout(500)
        page.mouse.up()

        page.wait_for_timeout(1000)

        day2_text = day2_group.inner_text()

        if "Land at HKIA" in day2_text:
            print("SUCCESS: Plan migrated to Day 2")
        else:
            print("FAILURE")
            raise Exception("Test Failed")

        browser.close()

if __name__ == "__main__":
    run()

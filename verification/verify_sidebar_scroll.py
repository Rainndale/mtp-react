
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to app
    page.goto("http://localhost:5173/")

    # Header uses fa-bars-staggered
    page.wait_for_selector(".fa-bars-staggered")
    page.click(".fa-bars-staggered")

    # Wait for sidebar to open (transition)
    page.wait_for_timeout(1000)

    # Check body overflow style
    body_overflow = page.evaluate("document.body.style.overflow")
    print(f"Body overflow: {body_overflow}")

    if body_overflow != "hidden":
        print("FAIL: Body overflow is not hidden")
    else:
        print("SUCCESS: Body overflow is hidden")

    # Take screenshot
    page.screenshot(path="verification/sidebar_open.png")

    # Close sidebar
    # There is a close button in sidebar: <i className="fa-solid fa-xmark text-xl"></i>
    page.click(".fa-xmark")

    # Wait for transition
    page.wait_for_timeout(1000)

    # Check body overflow again
    body_overflow_closed = page.evaluate("document.body.style.overflow")
    print(f"Body overflow after close: {body_overflow_closed}")

    if body_overflow_closed != "":
        # Note: original style was likely empty string
        print(f"FAIL: Body overflow is not restored (got '{body_overflow_closed}')")
    else:
        print("SUCCESS: Body overflow is restored")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

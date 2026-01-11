import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Wait for the server to be ready
  await page.waitForTimeout(5000);

  try {
    await page.goto('http://localhost:5173/');

    // Verify the page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Verify offline fonts
    // Check if Inter font is loaded and applied
    const fontBody = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
    });
    console.log('Body Font Family:', fontBody);

    // Check if FontAwesome icon is visible (e.g. the calendar icon in the header)
    // There is an icon <i className="fa-solid fa-calendar-days mr-2"></i>
    // We can check if it has the correct font family
    const iconFont = await page.evaluate(() => {
        const icon = document.querySelector('.fa-calendar-days');
        return icon ? window.getComputedStyle(icon).fontFamily : 'Icon not found';
    });
    console.log('Icon Font Family:', iconFont);

    // Screenshot
    await page.screenshot({ path: 'verification/verification.png' });
    console.log('Screenshot saved to verification/verification.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
  
  await page.goto('http://localhost:62147'); // wait, the user's dev server is on port 62147? Oh wait, tests/ui.test.js says 62147. We will try 62147.
  
  await browser.close();
})();

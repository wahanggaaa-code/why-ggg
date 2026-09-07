const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    recordVideo: { dir: '/home/user/why-ggg/test/', size: { width: 1280, height: 800 } }
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });

  console.log('Loading home...');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2500); // let loader finish
  console.log('Home loaded, waiting a beat then clicking About...');

  await page.waitForTimeout(500);

  // Click about link
  console.log('Clicking About...');
  await page.locator('nav a[href="about.html"]').first().click({ timeout: 5000 });

  // Wait for about page to load and entry animation to finish
  await page.waitForURL('**/about.html', { timeout: 8000 });
  await page.waitForTimeout(1500);

  // Then click Home
  console.log('On About, clicking Home...');
  await page.locator('nav a[href="./"]').first().click({ timeout: 5000 });
  await page.waitForURL('**/', { timeout: 8000 });
  await page.waitForTimeout(1500);

  console.log('Done. Closing...');
  if(errors.length) console.log('ERRORS:', errors);
  await context.close();
  await browser.close();
  console.log('Video saved in /home/user/why-ggg/test/');

  // List files
  const fs = require('fs');
  fs.readdirSync('/home/user/why-ggg/test/').forEach(f => console.log(' ', f, fs.statSync('/home/user/why-ggg/test/'+f).size, 'bytes'));
})();

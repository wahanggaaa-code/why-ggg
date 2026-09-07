const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  // Collect console messages and errors
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', req => logs.push(`[netfail] ${req.url()}: ${req.failure()?.errorText}`));

  console.log('--- Navigating to /');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500); // let loader finish

  // Screenshot home after load
  await page.screenshot({ path: '/home/user/why-ggg/debug-01-home.png', fullPage: false });
  console.log('Screenshot: debug-01-home.png');

  // Check transition.js is loaded
  const jsLoaded = await page.evaluate(() => {
    return typeof window !== 'undefined' && document.querySelector('script[src="transition.js"]') !== null;
  });
  console.log('transition.js script tag present:', jsLoaded);

  // Intercept navigation attempt by our script by listening to events
  // Before clicking, set up a trace.
  console.log('--- Clicking About link');

  // Start recording console around the click
  logs.length = 0;

  const aboutLink = page.locator('nav a[href="about.html"]');
  console.log('About link visible:', await aboutLink.isVisible());

  // We will click but PREVENT navigation so we can see the overlay/transition state
  // Use evaluate to override location.href temporarily for debugging
  let navCalled = null;
  await page.evaluate(() => {
    // Hook into performTransition via observation: listen for DOM changes
    window.__wglDebug = { overlaySeen: false, canvasSeen: false };
    const mo = new MutationObserver(muts => {
      for(const m of muts){
        m.addedNodes.forEach(n => {
          if(n.id === 'wgl-overlay') { window.__wglDebug.overlaySeen = true; }
          if(n.tagName === 'CANVAS' && n.parentElement?.id === 'wgl-overlay') { window.__wglDebug.canvasSeen = true; }
        });
      }
    });
    mo.observe(document.body, {childList:true, subtree:true});
    // Watch location changes
    window.__wglNavUrl = null;
    const origAssign = window.location.assign.bind(window.location);
    // can't fully override location.href setter, but we can watch beforeunload
    window.addEventListener('beforeunload', () => { window.__wglNavUrl = 'beforeunload fired'; });
  });

  await aboutLink.click();

  // Wait for overlay to appear (max 3s)
  await page.waitForTimeout(200);
  let dbg = await page.evaluate(() => window.__wglDebug);
  console.log('After 200ms — overlay seen:', dbg.overlaySeen, 'canvas seen:', dbg.canvasSeen);

  // Screenshot mid-transition (if possible; if navigation already happened this may be about page)
  await page.screenshot({ path: '/home/user/why-ggg/debug-02-200ms.png', fullPage: false });

  await page.waitForTimeout(600);
  dbg = await page.evaluate(() => window.__wglDebug).catch(() => ({overlaySeen:false,canvasSeen:false}));
  console.log('After 800ms — overlay seen:', dbg.overlaySeen, 'canvas seen:', dbg.canvasSeen);

  await page.screenshot({ path: '/home/user/why-ggg/debug-03-800ms.png', fullPage: false }).catch(e=>console.log('screenshot failed',e.message));

  await page.waitForTimeout(800);
  await page.screenshot({ path: '/home/user/why-ggg/debug-04-1600ms.png', fullPage: false }).catch(e=>console.log('screenshot failed',e.message));

  // Print logs
  console.log('--- Console logs during/after click:');
  logs.forEach(l => console.log(l));

  // Current URL
  console.log('Final URL:', page.url());

  await browser.close();
})();

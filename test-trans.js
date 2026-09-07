const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });

  // Inject a script early to disable the transition on the new page so we
  // can capture mid-transition frames on the OUTGOING page only
  await page.addInitScript(() => {
    // On first load this has no effect. On the next page (about), we kill
    // the session flag right before our script reads it, so the arrival
    // animation doesn't run and we can screenshot the curtain on the way out.
    Object.defineProperty(window, '__wglBlockEntry', {value:true, writable:false});
    const origGet = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key){
      if(key === '__wgl_a') return null;
      return origGet.call(this, key);
    };
  });

  console.log('Loading home...');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout:15000 });
  await page.waitForTimeout(2500); // wait for crystal loader
  await page.screenshot({ path: '/home/user/why-ggg/test/00-home.png' });
  console.log('  home captured');

  console.log('Clicking About...');
  const aboutLink = page.locator('nav a[href="about.html"]').first();
  await aboutLink.dispatchEvent('click'); // use dispatchEvent so we don't wait for nav

  for(let i=0;i<20;i++){
    await page.waitForTimeout(40);
    try{
      await page.screenshot({path:`/home/user/why-ggg/test/out-${String(i).padStart(2,'0')}.png`});
    }catch(e){}
  }

  await page.waitForTimeout(2000);
  await page.screenshot({path:'/home/user/why-ggg/test/99-about.png'}).catch(()=>{});
  console.log('Final URL:', page.url());
  if(errors.length) console.log('ERRORS:', errors);
  else console.log('No JS errors');
  await browser.close();
  console.log('Done');
})();

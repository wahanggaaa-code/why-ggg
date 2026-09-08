const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  async function run(vp, mobile, tag) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1.5, isMobile: !!mobile, hasTouch: !!mobile });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(tag + ' PAGEERROR: ' + String(e).slice(0, 200)));
    page.on('console', m => { if (m.type() === 'error') errors.push(tag + ': ' + m.text().slice(0, 160)); });
    await page.goto('http://localhost:8080/index.html');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/home/user/shots/r-${tag}-loader.png` });
    await page.waitForTimeout(3600);
    await page.screenshot({ path: `/home/user/shots/r-${tag}-hero.png` });
    console.log(tag, 'video hero playing:', await page.evaluate(() => { const v = document.querySelector('.hero-bg video'); return v ? !v.paused : null; }),
      '| loader gone:', await page.evaluate(() => document.getElementById('loader').classList.contains('gone')));
    await ctx.close();
  }
  await run({ width: 1440, height: 900 }, false, 'd');
  await run({ width: 390, height: 844 }, true, 'm');
  console.log('ERRORS:', errors.length ? errors.join('\n') : '(none)');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

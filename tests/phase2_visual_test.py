"""Phase 2 acceptance: visual layouts + every new action; offline React harness only."""
import asyncio,sys
from pathlib import Path
from playwright.async_api import async_playwright
from offline_browser_test import single_html
OUT=Path('/mnt/data')
async def main():
 errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
  page.on('pageerror',lambda err:errors.append(str(err)))
  await page.goto('about:blank')
  await page.set_content(single_html(),wait_until='domcontentloaded')
  assert await page.locator('.splash-stage').count()==1
  await page.get_by_role('button',name='Skip intro').click()
  assert await page.locator('.splash-stage').count()==0
  assert await page.locator('.hero-phase2').count()==1
  await page.wait_for_timeout(850)
  assert await page.locator('.journey-step').count()==3
  assert await page.locator('.editorial-showcase').count()==1
  # page visual
  await page.screenshot(path=str(OUT/'SpongeCheck_Phase2_Mobile_Landing.png'),full_page=True)
  for width in [320,360,390,430,768,1024,1440]:
   await page.set_viewport_size({'width':width,'height':880})
   assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),f'landing overflow {width}'
  await page.set_viewport_size({'width':1440,'height':900})
  await page.screenshot(path=str(OUT/'SpongeCheck_Phase2_Desktop_Landing.png'),full_page=True)
  await page.get_by_role('button',name='Take the three-step tour').click()
  assert await page.get_by_text('Three little steps.').count()==1
  await page.get_by_role('button',name='2. Create a report').click()
  assert await page.get_by_text('Tell us what you noticed').count()==1
  await page.get_by_role('button',name='3. Review updates').click()
  await page.get_by_role('button',name='Explore demo',exact=True).last.click()
  assert await page.get_by_text('Make yourself',exact=False).count()>0
  await page.get_by_role('button',name='Continue as inspector').click()
  await page.screenshot(path=str(OUT/'SpongeCheck_Phase2_Desktop_Dashboard.png'),full_page=True)
  assert await page.locator('.dashboard-action-band').count()==1
  await page.get_by_role('button',name='Places',exact=True).click()
  assert await page.locator('.place-type-card').count()==4
  await page.locator('.place-type-card').filter(has_text='Wetlands').click()
  assert await page.locator('.place-card').count()==2
  await page.locator('.place-type-card').filter(has_text='Ponds').click()
  assert await page.locator('.place-card').count()==1
  await page.get_by_role('button',name='All',exact=True).click()
  await page.locator('.place-type-card').filter(has_text='Outlets').click()
  assert await page.locator('.place-card').count()==2
  await page.get_by_role('button',name='All',exact=True).click()
  await page.screenshot(path=str(OUT/'SpongeCheck_Phase2_Desktop_Places.png'),full_page=True)
  await page.locator('.place-card').first.click()
  old=await page.locator('.page-header h1').inner_text()
  await page.get_by_role('button',name='Next place').click()
  assert await page.locator('.page-header h1').inner_text()!=old
  await page.set_viewport_size({'width':390,'height':844})
  await page.get_by_role('button',name='Home',exact=True).click()
  await page.screenshot(path=str(OUT/'SpongeCheck_Phase2_Mobile_Dashboard.png'),full_page=True)
  await page.get_by_role('button',name='Browse places').click()
  assert await page.get_by_text('Explore places').count()>0
  for width in [320,360,390,430,768,1024,1440]:
   await page.set_viewport_size({'width':width,'height':880})
   assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),f'places overflow {width}'
  assert not errors,errors
  print('PASS: intro skip, landing sections, responsive widths, tour, category shortcuts, next-place, dashboard CTA, no page errors')
  await browser.close()
if __name__=='__main__':asyncio.run(main())

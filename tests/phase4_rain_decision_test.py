"""Phase 4 browser regression + deterministic scenario/evidence acceptance, offline React harness."""
import asyncio, re, json, io
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
from offline_browser_test import single_html
ROOT=Path(__file__).parents[1]
OUT=Path('/mnt/data')

def photo_bytes():
    b=io.BytesIO(); Image.new('RGB',(350,280),(78,95,112)).save(b,format='PNG'); return b.getvalue()

async def open_app(page):
    await page.goto('about:blank')
    await page.set_content(single_html(),wait_until='domcontentloaded',timeout=30000)
    if await page.get_by_role('button',name='Skip intro').count():await page.get_by_role('button',name='Skip intro').click()
    await page.get_by_role('button',name='Explore the demo',exact=True).click()
    await page.get_by_role('button',name=re.compile('Continue as inspector')).click()

async def main():
  errors=[]
  async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    page=await browser.new_page(viewport={'width':390,'height':844})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_default_timeout(5500)
    await open_app(page)
    await page.get_by_role('button',name='Try the rain simulator').click()
    assert await page.get_by_role('heading',name='Rain simulator').count()==1
    assert 'Demo rainfall only' in await page.locator('.rain-disclaimer').inner_text()
    assert await page.locator('.rain-queue-card').count()==6
    assert 'dry' in (await page.locator('.rain-control-visual').inner_text()).lower()
    # A-01 begins check soon and escalates to urgent with heavy scenario.
    row=page.locator('.rain-queue-card').filter(has_text='A-01')
    assert 'Check soon' in await row.inner_text(),await row.inner_text()
    await page.get_by_role('button',name='Heavy',exact=True).click()
    row=page.locator('.rain-queue-card').filter(has_text='A-01')
    assert 'Urgent inspection' in await row.inner_text(),await row.inner_text()
    assert await page.get_by_text('65 mm / sample period').count()==1
    await page.get_by_label('Compare with dry conditions').check()
    assert 'Dry: Check soon' in await row.inner_text(),await row.inner_text()
    # Priority engine matches X-Ray factors (same module), independent action review logic.
    await row.click()
    assert await page.get_by_role('heading',name='Why this needs attention').count()==1
    assert 'Demo priority points: 9' in await page.locator('.risk-result').first.inner_text()
    assert 'Heavy rain scenario' in await page.locator('.decision-factors').inner_text()
    assert await page.locator('.decision-factor').count()==4
    assert 'No work proposed' in await page.locator('.risk-result').nth(1).inner_text()
    await page.locator('#proposed-action').select_option('clear_vegetation')
    assert 'Specialist review needed' in await page.locator('.risk-result').nth(1).inner_text()
    assert await page.locator('.approval-info').count()==1
    await page.locator('.mini-scenarios').get_by_role('button',name='Dry').click()
    assert 'Demo priority points: 6' in await page.locator('.risk-result').first.inner_text()
    assert 'Specialist review needed' in await page.locator('.risk-result').nth(1).inner_text()
    await page.screenshot(path=str(OUT/'SpongeCheck_Phase4_Mobile_Decision.png'),full_page=True)
    # B-02 dense vegetation, even for loose debris maintenance, must require specialist review.
    await page.get_by_role('button',name='All decisions').click()
    await page.locator('.decision-tile').filter(has_text='B-02').click()
    await page.locator('#proposed-action').select_option('remove_debris')
    assert 'Specialist review needed' in await page.locator('.risk-result').nth(1).inner_text()
    # reset changes both ranking and storage, and comparison uses real sorted decision engine.
    await page.get_by_role('button',name='Open rain simulator').click()
    await page.get_by_role('button',name='Moderate',exact=True).click()
    assert 'moderate' in (await page.locator('.rain-control-visual').inner_text()).lower()
    await page.get_by_role('button',name='Reset',exact=True).click()
    assert await page.locator('.rain-toggle button[aria-pressed=true]').inner_text()=='Dry'
    assert await page.locator('.rain-queue-card').count()==6
    await page.get_by_role('button',name='Needs attention',exact=True).click()
    assert await page.locator('.rain-queue-card').count()<6
    await page.get_by_role('button',name='All places').click()
    await page.get_by_role('button',name='Heavy',exact=True).click()
    await page.screenshot(path=str(OUT/'SpongeCheck_Phase4_Mobile_Rain.png'),full_page=True)
    # Previous phase report wizard still creates a case; new decision details use its observations.
    await page.get_by_role('button',name='Report',exact=True).click()
    await page.locator('#report-place').select_option('C-03')
    await page.locator('#report-photo').set_input_files({'name':'sample-inspection.png','mimeType':'image/png','buffer':photo_bytes()})
    await page.get_by_role('button',name='Continue',exact=True).click()
    assert 'MANUAL' in (await page.locator('.analysis-banner').inner_text()).upper()
    await page.locator('#observation-debris').select_option('visible')
    await page.locator('#observation-sediment').select_option('none')
    await page.locator('#observation-vegetation').select_option('dense')
    await page.get_by_role('checkbox').check()
    await page.get_by_role('button',name='Continue',exact=True).click()
    await page.locator('#report-notes').fill('Verified example visual debris and dense vegetation around this sample area.')
    await page.get_by_role('button',name='Save practice report').click()
    assert await page.get_by_text('Report saved',exact=True).count()==1
    await page.get_by_role('button',name='Why this needs attention').click()
    assert 'Inspector-confirmed report' in await page.locator('.decision-factors').inner_text()
    assert 'Visible debris' in await page.locator('.decision-factors').inner_text()
    await page.locator('#proposed-action').select_option('remove_debris')
    assert 'Specialist review needed' in await page.locator('.risk-result').nth(1).inner_text()
    # Test incomplete/uncertain observations from a confirmed report yield 'More information needed'.
    await page.get_by_role('button',name='Back to report').click()
    await page.get_by_role('button',name='View this place').click()
    await page.get_by_role('button',name='Report an issue').last.click()
    await page.get_by_role('button',name='Use example photo').click()
    await page.get_by_role('button',name='Continue',exact=True).click()
    await page.locator('#observation-debris').select_option('unsure')
    await page.locator('#observation-sediment').select_option('unsure')
    await page.get_by_role('checkbox').check()
    await page.get_by_role('button',name='Continue',exact=True).click()
    await page.locator('#report-notes').fill('Conditions could not be confirmed from the available photograph.')
    await page.get_by_role('button',name='Save practice report').click()
    await page.get_by_role('button',name='Why this needs attention').click()
    assert 'More information needed' in await page.locator('.risk-result').first.inner_text()
    # Responsive widths across simulator and decision, 7 breakpoints; ensure no horizontal overflow.
    for width in [320,360,390,430,768,1024,1440]:
      await page.set_viewport_size({'width':width,'height':900})
      await page.wait_for_timeout(70)
      info=await page.evaluate('({w:innerWidth,scroll:document.documentElement.scrollWidth})')
      assert info['scroll']<=info['w']+1,('decision',width,info)
      if width==1440:await page.screenshot(path=str(OUT/'SpongeCheck_Phase4_Desktop_Decision.png'),full_page=True)
    await page.get_by_role('button',name='Open rain simulator').click()
    for width in [320,360,390,430,768,1024,1440]:
      await page.set_viewport_size({'width':width,'height':900})
      await page.wait_for_timeout(60)
      info=await page.evaluate('({w:innerWidth,scroll:document.documentElement.scrollWidth})')
      assert info['scroll']<=info['w']+1,('rain',width,info)
      if width==1440:await page.screenshot(path=str(OUT/'SpongeCheck_Phase4_Desktop_Rain.png'),full_page=True)
    assert not errors,errors
    await browser.close()
    print('PHASE 4 END-TO-END AND RESPONSIVE TESTS PASSED; 7 WIDTHS; NO PAGE ERRORS')

if __name__=='__main__': asyncio.run(main())

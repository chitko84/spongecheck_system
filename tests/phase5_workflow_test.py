"""Phase 5 end-to-end local browser smoke test. Uses embedded React UMD preview (not Vite build)."""
import asyncio, io, re, sys, json
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
from offline_browser_test import single_html

def photo(color):
    b=io.BytesIO();Image.new('RGB',(320,200),color).save(b,'PNG');return b.getvalue()

async def main():
  errs=[]
  async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    page=await browser.new_page(viewport={'width':390,'height':844})
    page.set_default_timeout(7000)
    page.on('pageerror',lambda e:errs.append(str(e)))
    await page.goto('about:blank'); await page.set_content(single_html(),wait_until='domcontentloaded',timeout=30000)
    if await page.get_by_role('button',name='Skip intro').count():await page.get_by_role('button',name='Skip intro').click()
    await page.get_by_role('button',name='Explore the demo',exact=True).click()
    await page.get_by_role('button',name=re.compile('Continue as inspector')).click()
    await page.get_by_role('button',name='Report',exact=True).click()
    await page.locator('#report-place').select_option('B-02')
    await page.get_by_role('button',name='Use example photo').click()
    await page.get_by_role('button',name='Continue',exact=True).click()
    await page.get_by_role('checkbox').check()
    await page.get_by_role('button',name='Continue',exact=True).click()
    await page.locator('#report-notes').fill('Dense vegetation observed near the wetland outlet, needs careful assessment.')
    await page.get_by_role('button',name='Save practice report').click()
    assert await page.get_by_text('Report saved',exact=True).count()==1
    await page.get_by_role('button',name='Manage work').click()
    assert await page.get_by_role('heading',name='Manage work').count()==1
    await page.locator('#work-action').select_option('clear_vegetation')
    assert 'Specialist must review' in await page.locator('.work-preview').first.inner_text()
    await page.get_by_role('button',name='Save maintenance proposal').click()
    assert 'Waiting for specialist review' in await page.locator('.workflow-banner').inner_text()
    await page.screenshot(path='/mnt/data/SpongeCheck_Phase5_Mobile_Manage_Work.png',full_page=True)
    assert await page.get_by_role('button',name='Assign work').count()==0
    # cannot see reviewer actions as inspector
    assert await page.get_by_role('button',name='Approve this action').count()==0
    # test validation and reviewer role
    await page.get_by_label('Demo role').select_option('Reviewer')
    await page.get_by_role('button',name='Approve this action').click()
    assert 'at least 8 characters' in await page.locator('[role=alert]').inner_text()
    await page.locator('#review-reason').fill('I reviewed the vegetation sensitivity and the proposed limited work.')
    await page.get_by_role('button',name='Approve this action').click()
    assert 'Ready to assign' in await page.locator('.workflow-banner').inner_text()
    await page.get_by_label('Demo role').select_option('Manager')
    await page.locator('#assign-crew').fill('Field Crew North')
    await page.get_by_role('button',name='Assign work').click()
    assert 'Assigned' in await page.locator('.workflow-banner').inner_text()
    await page.get_by_label('Demo role').select_option('Inspector')
    await page.get_by_role('button',name='Mark work as started').click()
    assert 'In progress' in await page.locator('.workflow-banner').inner_text()
    await page.get_by_role('button',name='Submit for verification').click()
    assert 'Add an after-work photograph' in await page.locator('[role=alert]').inner_text()
    await page.locator('#work-after').set_input_files({'name':'after.png','mimeType':'image/png','buffer':photo((175,125,113))})
    await page.locator('#completion-note').fill('We cleared specified material and documented the area for a reviewer.')
    await page.get_by_role('button',name='Submit for verification').click()
    assert 'Waiting for verification' in await page.locator('.workflow-banner').inner_text()
    await page.get_by_role('button',name='Compare before & after').click()
    assert await page.get_by_role('heading',name='Before & after').count()==1
    await page.get_by_label('Compare before and after photos').fill('72')
    assert await page.get_by_label('Compare before and after photos').input_value()=='72'
    await page.screenshot(path='/mnt/data/SpongeCheck_Phase5_Mobile_Verification.png',full_page=True)
    assert await page.get_by_role('button',name='Verify documented work').count()==0
    await page.get_by_label('Demo role').select_option('Manager')
    await page.locator('#verification-note').fill('Evidence matches the documented work in the practice record.')
    await page.get_by_role('button',name='Verify documented work').click()
    assert 'Work verified' in await page.locator('.workflow-banner').inner_text()
    assert 'verified' in (await page.locator('.work-preview').inner_text()).lower()
    report_count=await page.evaluate("JSON.parse(localStorage.getItem('sc-reports')).length")
    assert report_count==1,report_count
    event_types=await page.evaluate("JSON.parse(localStorage.getItem('sc-reports'))[0].events.map(x=>x.type)")
    assert event_types==['report_created','propose','approve','assign','start','complete','verify'],event_types
    # activity history navigation and browser report record
    await page.get_by_role('button',name='Manage work').click()
    await page.get_by_role('button',name='See all activity').click()
    assert await page.get_by_role('heading',name='Activity history').count()==1
    assert await page.locator('.timeline-row').count()==7
    # role restrictions are simulated but they still matter for demo UI
    await page.get_by_role('button',name='My reports').click() if await page.get_by_role('button',name='My reports').count() else None
    for w in [320,360,390,430,768,1024,1440]:
      await page.set_viewport_size({'width':w,'height':900})
      info=await page.evaluate('({sw:document.documentElement.scrollWidth,iw:innerWidth})')
      assert info['sw']<=info['iw']+1,(w,info)
      if w==1440:await page.screenshot(path='/mnt/data/SpongeCheck_Phase5_Desktop_Activity.png',full_page=True)
    # reviewer queue retains prior approval
    await page.get_by_role('button',name='Approvals').click()
    assert await page.locator('.workflow-case-card').count()==1
    await page.screenshot(path='/mnt/data/SpongeCheck_Phase5_Desktop_Approvals.png',full_page=True)
    assert errs==[],errs
    await browser.close()
    print('PHASE 5 BROWSER FULL HAPPY-PATH + PERMISSIONS + PERSISTENCE + RESPONSIVE: PASS')

if __name__=='__main__':asyncio.run(main())

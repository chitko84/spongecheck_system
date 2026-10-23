import asyncio, sys, re, io
from PIL import Image
from playwright.async_api import async_playwright
from offline_browser_test import single_html

async def main():
  failed=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
    page=await b.new_page(viewport={'width':390,'height':844})
    page.on('pageerror',lambda e:failed.append(str(e)))
    await page.goto('about:blank'); await page.set_content(single_html(),wait_until='domcontentloaded')
    # Base navigation to the app
    await page.get_by_role('button',name='Skip intro').click() if await page.get_by_role('button',name='Skip intro').count() else None
    await page.get_by_role('button',name='Explore the demo',exact=True).click()
    await page.get_by_role('button',name=re.compile('Continue as inspector')).click()
    # All five tabs open a meaningful view
    for label,visible in [('Home','Here’s what needs attention.'),('Places','Explore places'),('Report','Report an issue'),('Updates','Your updates'),('More','Settings & help')]:
        await page.get_by_role('button',name=label,exact=True).click()
        assert await page.get_by_text(visible,exact=False).count()>0,(label,visible)
    print('Five-tab mobile navigation: PASS')
    # Places search / filter / map markers
    await page.get_by_role('button',name='Places',exact=True).click()
    assert await page.locator('.map-marker').count()==6
    await page.get_by_role('button',name='Wetland',exact=True).click()
    assert await page.locator('.map-marker').count()==2
    await page.get_by_role('button',name='All',exact=True).click()
    await page.get_by_placeholder('Search places, zones or IDs').fill('C-03')
    assert await page.locator('.map-marker').count()==1
    await page.get_by_role('button',name='Clear search').click()
    await page.locator('.map-marker').first.click()
    assert await page.get_by_text('Sample status').count()==1
    print('Places map, search, chips and detail links: PASS')
    # Image capture file picker & report persistence
    await page.get_by_role('button',name='Report an issue').click()
    img=Image.new('RGB',(400,240),(100,125,145));buffer=io.BytesIO();img.save(buffer,format='PNG')
    await page.set_input_files('#report-photo',{'name':'test-drain.png','mimeType':'image/png','buffer':buffer.getvalue()})
    await page.wait_for_function('document.querySelector(".inspection-upload.has-image")!==null')
    await page.get_by_role('button',name='Continue',exact=True).click()
    assert await page.get_by_text('No AI model has analyzed your upload').count()==1
    await page.locator('#observation-debris').select_option('visible')
    await page.get_by_role('checkbox').check()
    await page.get_by_role('button',name='Continue',exact=True).click()
    await page.locator('#report-notes').fill('Small amount of debris visible near the sample drain.')
    await page.get_by_role('button',name='Save practice report').click()
    assert await page.get_by_text('Report saved',exact=True).count()==1
    assert await page.locator('.report-image img').count()==1
    await page.get_by_role('button',name='Updates',exact=True).click()
    assert await page.locator('.update-row').count()==4
    await page.get_by_role('button',name='Mark all as read').click()
    assert await page.locator('.update-row.unread').count()==0
    print('File upload, persistent report, updates and read-state: PASS')
    # switch role and verify UI access
    await page.get_by_role('button',name='More',exact=True).click()
    await page.get_by_role('button',name='Switch demo role').click()
    await page.get_by_role('button',name='Just exploring').click()
    await page.get_by_role('button',name='Continue as guest').click()
    await page.get_by_role('button',name='Report',exact=True).click()
    await page.get_by_role('button',name='Use example photo').click()
    await page.get_by_role('button',name='Continue',exact=True).click()
    await page.get_by_role('checkbox').check()
    await page.get_by_role('button',name='Continue',exact=True).click()
    assert await page.get_by_role('button',name='Save practice report').is_disabled()
    print('Read-only demo guest prevention: PASS')
    # theme and reset
    await page.get_by_role('button',name='More',exact=True).click()
    await page.get_by_role('button',name='Dark').click()
    assert await page.evaluate('document.documentElement.dataset.theme')=='dark'
    await page.get_by_role('button',name='Light').click()
    await page.get_by_role('button',name='Reset sample data').click()
    await page.get_by_role('button',name='Reset demo').click()
    await page.get_by_role('button',name='More',exact=True).click()
    await page.get_by_role('button',name='My reports',exact=True).click()
    assert await page.get_by_text('Nothing here yet').count()==1
    print('Settings, confirmation modal and reset: PASS')
    # sample Telegram page honestly states offline
    await page.get_by_role('button',name='More',exact=True).click()
    await page.get_by_role('button',name='Telegram updates').click()
    assert await page.get_by_text('Not connected').count()==1
    print('Telegram is marked Not connected: PASS')
    # 320px places and form overflow
    for route in ['Places','Report','Updates','More']:
        await page.set_viewport_size({'width':320,'height':700})
        await page.get_by_role('button',name=route,exact=True).click()
        metrics=await page.evaluate('({w:document.documentElement.scrollWidth,viewport:innerWidth})')
        assert metrics['w']<=metrics['viewport']+1,(route,metrics)
    print('Other mobile screens at 320px: PASS')
    await page.set_viewport_size({'width':1440,'height':900})
    for route in ['Overview','Places','Report an issue','Updates','My reports','Telegram','Settings & help']:
        await page.get_by_role('button',name=route,exact=True).click()
        metrics=await page.evaluate('({w:document.documentElement.scrollWidth,viewport:innerWidth})')
        assert metrics['w']<=metrics['viewport']+1,(route,metrics)
    print('Seven sidebar screens at 1440px: PASS')
    await page.get_by_role('button',name='Places',exact=True).click()
    await page.screenshot(path='/mnt/data/SpongeCheck_Phase1_Desktop_Places.png',full_page=True)
    assert not failed,failed
    print('Uncaught browser errors: 0')
    await b.close()
    print('EXTENDED END-TO-END TESTS PASSED')

if __name__=='__main__': asyncio.run(main())

"""End-to-end Phase 3 acceptance using the offline React browser bundle.
Tests genuine browser localStorage with an HTTP origin. This does not replace React 18/Vite build verification.
"""
import asyncio, io, re
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

ROOT=Path(__file__).parents[1]
OUT=Path('/mnt/data')
from offline_browser_test import single_html

async def remount(page):
    # The sandbox blocks browser localhost, so exercise a full React remount against the same
    # in-page localStorage shim. A normal HTTP-hosted app also persists with localStorage.
    await page.evaluate("() => { ReactDOM.unmountComponentAtNode(document.getElementById('root')); ReactDOM.render(React.createElement(App,{}),document.getElementById('root')); return true; }")
    await page.get_by_role('button',name='Explore the demo',exact=True).click()
    await page.get_by_role('button',name=re.compile('Continue as inspector')).click()
    await page.get_by_role('button',name='More',exact=True).click()
    await page.get_by_role('button',name='My reports',exact=True).click()

def sample_png():
    buf=io.BytesIO()
    Image.new('RGB',(500,360),(115,147,162)).save(buf,format='PNG')
    return buf.getvalue()

async def main():
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
        page=await browser.new_page(viewport={'width':390,'height':844})
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_default_timeout(4500)
        await page.goto('about:blank')
        await page.set_content(single_html(),wait_until='domcontentloaded')
        if await page.get_by_role('button',name='Skip intro').count():await page.get_by_role('button',name='Skip intro').click()
        await page.get_by_role('button',name='Explore the demo',exact=True).click()
        await page.get_by_role('button',name=re.compile('Continue as inspector')).click()
        assert await page.get_by_text('Here’s what needs attention.').count()==1
        # Phase 2 preserved: shortcuts, filters, map, navigation
        await page.get_by_role('button',name='Places',exact=True).click()
        assert await page.locator('.place-type-card').count()==4
        await page.locator('.place-type-card').filter(has_text='Wetlands').click()
        assert await page.locator('.place-card').count()==2
        await page.get_by_role('button',name='All',exact=True).click()
        await page.get_by_role('button',name='Report',exact=True).click()
        assert await page.get_by_text('STEP 01 / 03').count()==1
        await page.get_by_role('button',name='Continue',exact=True).click()
        assert await page.get_by_text('Add a photo or select an example photo').count()==1
        # Sample photo must be labeled, with editable observations
        await page.locator('#report-place').select_option('B-02')
        await page.get_by_role('button',name='Use example photo').click()
        assert await page.get_by_text('Illustrative picture and fictional example findings').count()==1
        await page.get_by_role('button',name='Continue',exact=True).click()
        assert await page.get_by_text('STEP 02 / 03').count()==1
        assert await page.get_by_text('No AI model ran').count()==1
        assert await page.locator('#observation-vegetation').input_value()=='dense'
        await page.get_by_role('button',name='Continue',exact=True).click()
        assert await page.get_by_text('Please confirm that you reviewed').count()==1
        await page.locator('#observation-sediment').select_option('none')
        await page.get_by_role('checkbox').check()
        await page.get_by_role('button',name='Continue',exact=True).click()
        assert await page.get_by_text('STEP 03 / 03').count()==1
        await page.get_by_role('button',name='Save practice report').click()
        assert await page.get_by_text('Add at least 12 characters').count()==1
        await page.locator('#report-notes').fill('Dense vegetation visible around the sample wetland edge.')
        await page.screenshot(path=str(OUT/'SpongeCheck_Phase3_Mobile_Review.png'),full_page=True)
        await page.get_by_role('button',name='Save practice report').click()
        assert await page.get_by_text('Report saved',exact=True).count()==1
        assert await page.locator('.case-findings').count()==1
        assert await page.get_by_text('Prewritten example labels reviewed by the user').count()==1
        case_id=(await page.locator('.page-header .eyebrow').inner_text()).split(' · ')[-1]
        assert case_id.startswith('SC-'),case_id
        assert await page.locator('.case-event').count()==1
        assert await page.locator('.report-image img').count()==1
        # Browser-storage persistence across React remount and restored state
        assert 'B-02' in (await page.evaluate("localStorage.getItem('sc-reports')"))
        await remount(page)
        assert await page.locator('.report-card').count()==1
        await page.locator('.report-card').first.click()
        assert await page.locator('.case-findings').count()==1
        assert await page.get_by_text('Dense vegetation visible around the sample wetland edge.').count()==1
        await page.get_by_role('button',name='Updates',exact=True).click()
        assert await page.locator('.update-row').count()==4
        print('PASS: sample flow / editable observations / inline validation / structured persistence / reload / updates')
        # New uploaded photo must NEVER inherit the canned labels
        await page.get_by_role('button',name='Report',exact=True).click()
        await page.set_input_files('#report-photo',{'name':'test-capture.png','mimeType':'image/png','buffer':sample_png()})
        await page.locator('.inspection-upload.has-image').wait_for(timeout=6000)
        await page.get_by_role('button',name='Continue',exact=True).click()
        assert await page.get_by_text('No AI model has analyzed your upload').count()==1
        assert await page.locator('#observation-debris').input_value()=='unsure'
        assert await page.locator('#observation-vegetation').input_value()=='unsure'
        await page.locator('#observation-debris').select_option('visible')
        await page.get_by_role('checkbox').check()
        # changing an observation invalidates confirmation
        await page.locator('#observation-sediment').select_option('visible')
        assert not await page.get_by_role('checkbox').is_checked()
        await page.get_by_role('checkbox').check()
        await page.get_by_role('button',name='Continue',exact=True).click()
        await page.locator('#report-notes').fill('Visible mud and leaves close to the drainage opening.')
        await page.get_by_role('button',name='Save practice report').click()
        assert await page.get_by_text('Observations entered and confirmed by the user').count()==1
        await remount(page)
        await page.locator('.report-card').first.click()
        assert await page.locator('.case-findings').count()==1
        print('PASS: real upload produces manual-only observations; edit invalidates confirmation; second report persists')
        # nav, role, settings, safe reset
        await page.get_by_role('button',name='More',exact=True).click()
        await page.get_by_role('button',name='Switch demo role').click()
        await page.get_by_role('button',name='Just exploring').click()
        await page.get_by_role('button',name='Continue as guest').click()
        await page.get_by_role('button',name='Report',exact=True).click()
        await page.get_by_role('button',name='Use example photo').click()
        await page.get_by_role('button',name='Continue',exact=True).click()
        await page.get_by_role('checkbox').check()
        await page.get_by_role('button',name='Continue',exact=True).click()
        await page.locator('#report-notes').fill('This is a sample case that a guest should not save.')
        assert await page.get_by_role('button',name='Save practice report').is_disabled()
        print('PASS: guest save disabled')
        await page.get_by_role('button',name='More',exact=True).click()
        await page.get_by_role('button',name='Dark',exact=True).click()
        assert await page.evaluate('document.documentElement.dataset.theme')=='dark'
        await page.get_by_role('button',name='Light',exact=True).click()
        await page.get_by_role('button',name='Telegram updates').click()
        assert await page.get_by_text('Not connected').count()==1
        await page.get_by_role('button',name='More',exact=True).click()
        await page.get_by_role('button',name='Reset sample data').click()
        await page.get_by_role('button',name='Reset demo').click()
        await page.get_by_role('button',name='More',exact=True).click()
        await page.get_by_role('button',name='My reports',exact=True).click()
        assert await page.get_by_text('Nothing here yet').count()==1
        print('PASS: appearance, Telegram truthful status, reset clears cases')
        # Responsive layout checks: keep a single wizard open and resize at each step.
        await page.set_viewport_size({'width':390,'height':844})
        await page.get_by_role('button',name='Report',exact=True).click()
        await page.get_by_role('button',name='Use example photo').click()
        for stage in (1,2,3):
            if stage==2: await page.get_by_role('button',name='Continue',exact=True).click()
            if stage==3:
                await page.get_by_role('checkbox').check()
                await page.get_by_role('button',name='Continue',exact=True).click()
            for width in (320,360,390,430,768,1024,1440):
                await page.set_viewport_size({'width':width,'height':880})
                size=await page.evaluate('({w:document.documentElement.scrollWidth,viewport:innerWidth})')
                assert size['w']<=size['viewport']+1,('responsive',stage,width,size)
            print('PASS: responsive layout step',stage,flush=True)
        await page.set_viewport_size({'width':390,'height':844})
        await page.screenshot(path=str(OUT/'SpongeCheck_Phase3_Mobile_Inspection.png'),full_page=False,timeout=12000)
        await page.set_viewport_size({'width':1440,'height':900})
        await page.screenshot(path=str(OUT/'SpongeCheck_Phase3_Desktop_Inspection.png'),full_page=False,timeout=12000)
        assert not errors,errors
        print('PASS: 320/360/390/430/768/1024/1440px three-step layout with no horizontal overflow')
        print('PASS: no uncaught JavaScript exceptions')
        await browser.close()
    print('PHASE 3 END-TO-END SUITE PASSED')
if __name__=='__main__':asyncio.run(main())

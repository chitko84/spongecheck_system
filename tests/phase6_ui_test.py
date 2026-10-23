"""Phase 6 browser workflow using a mocked HTTPS backend; no real Telegram credentials."""
import asyncio,base64,re
from pathlib import Path
from playwright.async_api import async_playwright
from offline_browser_test import single_html
ROOT=Path(__file__).parents[1]

async def main():
    html=single_html();issues=[]
    photo='data:image/png;base64,'+base64.b64encode((ROOT/'tests/fixture-photo.png').read_bytes()).decode()
    cases=[{'id':'SC-TG-000006','placeId':'A-01','placeName':'Wetland Outlet','note':'Photo near outlet for human review.',
            'photoData':photo,'createdAt':'2026-10-22T01:00:00.000Z','status':'Awaiting inspector review','source':'telegram',
            'observations':{'debris':'unsure','sediment':'unsure','vegetation':'unsure','analysisMode':'manual_only','inspectorConfirmed':False},'events':[]}]
    async with async_playwright() as p:
      browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
      page=await browser.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e:issues.append(str(e)))
      async def mock(route):
        req=route.request
        if req.url.endswith('/api/telegram/status'):
          await route.fulfill(status=200,content_type='application/json',body='{"configured":true,"connected":false,"botUsername":"spongecheck_example_bot","message":"Backend configured; Telegram delivery is not yet verified."}')
        elif req.url.endswith('/api/telegram/cases'):
          if req.headers.get('authorization')=='Bearer dashboard-secret':
            import json
            await route.fulfill(status=200,content_type='application/json',body=json.dumps({'cases':cases}))
          else:
            await route.fulfill(status=401,content_type='application/json',body='{"error":"unauthorized"}')
        else:await route.abort()
      await page.route('https://sample-api.test/**',mock)
      await page.goto('about:blank');await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
      if await page.get_by_role('button',name='Skip intro').count():await page.get_by_role('button',name='Skip intro').click()
      await page.get_by_role('button',name='Explore the demo').click()
      await page.get_by_role('button',name=re.compile('Continue as inspector')).click()
      await page.get_by_role('button',name='More',exact=True).click()
      await page.get_by_role('button',name='Telegram updates').click()
      assert await page.get_by_text('Not connected',exact=True).count()==1
      await page.get_by_role('button',name='See example conversation').click()
      assert await page.get_by_text('Example only',exact=False).count()>0
      await page.get_by_role('button',name='Hide example conversation').click()
      await page.locator('#telegram-base').fill('https://sample-api.test')
      await page.get_by_role('button',name='Check connection').click()
      await page.get_by_text('Bot backend configured').wait_for()
      await page.locator('#telegram-key').fill('incorrect')
      await page.get_by_role('button',name='Load Telegram reports').click()
      await page.get_by_text('Access key not accepted',exact=False).wait_for()
      await page.locator('#telegram-key').fill('dashboard-secret')
      await page.get_by_role('button',name='Load Telegram reports').click()
      await page.get_by_text('SC-TG-000006',exact=False).first.wait_for()
      await page.screenshot(path='/mnt/data/SpongeCheck_Phase6_Mobile_Telegram.png',full_page=True)
      await page.locator('.telegram-incoming-card').first.click()
      await page.get_by_text('Photo near outlet for human review.').wait_for()
      assert await page.get_by_text('read-only',exact=False).count()>=1
      await page.screenshot(path='/mnt/data/SpongeCheck_Phase6_Mobile_Telegram_Case.png',full_page=True)
      await page.get_by_role('button',name='Back to Telegram').first.click()
      for width in (320,360,390,430,768,1024,1440):
        await page.set_viewport_size({'width':width,'height':860 if width<1024 else 900})
        await page.wait_for_timeout(70)
        sizes=await page.evaluate('({sw:document.documentElement.scrollWidth,iw:innerWidth})')
        assert sizes['sw']<=sizes['iw']+1,(width,sizes)
      await page.set_viewport_size({'width':1440,'height':900})
      await page.screenshot(path='/mnt/data/SpongeCheck_Phase6_Desktop_Telegram.png',full_page=True)
      await page.get_by_role('button',name='Overview').click()
      await page.get_by_text('1 Telegram report received').wait_for()
      await page.get_by_role('button',name='Set up Telegram').click() if await page.get_by_role('button',name='Set up Telegram').count() else await page.get_by_role('button',name='View reports').click()
      await page.get_by_role('button',name='Disconnect').click()
      assert await page.locator('.telegram-incoming-card').count()==0
      assert not issues,issues
      print('PHASE 6 UI TEST PASSED: disconnected, mock preview, bad key, incoming photo, case detail, responsive widths, dashboard, disconnect. Page errors:',issues)
      await browser.close()

if __name__=='__main__':asyncio.run(main())

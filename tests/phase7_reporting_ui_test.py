"""Phase 7 acceptance: exported PDF/HTML/CSV/JSON, UI action responses, media and viewport widths. Offline React UMD harness, NOT a verified Vite production build."""
import asyncio,re,json
from pathlib import Path
from playwright.async_api import async_playwright
from offline_browser_test import single_html
OUT=Path('/mnt/data/phase7work/qa');OUT.mkdir(parents=True,exist_ok=True)

async def run():
    errs=[]
    async with async_playwright() as p:
      browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
      ctx=await browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
      page=await ctx.new_page();page.set_default_timeout(9500)
      page.on('pageerror',lambda e:errs.append(str(e)))
      await page.goto('about:blank');await page.set_content(single_html(),wait_until='domcontentloaded',timeout=30000)
      if await page.get_by_role('button',name='Skip intro').count():await page.get_by_role('button',name='Skip intro').click()
      await page.get_by_role('button',name='Explore the demo',exact=True).click()
      await page.get_by_role('button',name=re.compile('Continue as inspector')).click()
      # No images should depend on remote hosts on the core UI.
      await page.get_by_role('button',name='Report',exact=True).click()
      await page.locator('#report-place').select_option('B-02')
      await page.get_by_role('button',name='Use example photo').click()
      await page.get_by_role('button',name='Continue',exact=True).click()
      await page.get_by_role('checkbox').check()
      await page.get_by_role('button',name='Continue',exact=True).click()
      await page.locator('#report-notes').fill('Dense vegetation and sediment noticed during this clearly synthetic test scenario.')
      await page.get_by_role('button',name='Save practice report').click()
      assert await page.get_by_role('heading',name='Report saved').count()
      await page.screenshot(path=str(OUT/'Phase7_Mobile_Report_Exports.png'),full_page=True)
      async def get_download(button, file_name):
        async with page.expect_download(timeout=12000) as ev: await page.get_by_role('button',name=button,exact=True).click()
        d=await ev.value;dest=OUT/file_name;await d.save_as(str(dest));assert dest.exists() and dest.stat().st_size>80,(dest,d.suggested_filename);return dest
      pdf=await get_download('Download PDF','inspection.pdf')
      html=await get_download('Evidence with photos','evidence.html')
      structured=await get_download('Export case data','case.json')
      payload=json.loads(structured.read_text());assert payload['case']['observations']['vegetation']=='dense';assert 'DEMONSTRATION ONLY' in payload['demoNotice']
      assert 'data:image' in html.read_text() and 'Activity history' in html.read_text()
      assert pdf.read_bytes().startswith(b'%PDF-1.4'),pdf.read_bytes()[:32]
      # Test real UI of the report-insights page, not just raw functions.
      await page.get_by_role('button',name='My reports').click()
      await page.get_by_role('button',name='Reports & insights').click()
      assert await page.get_by_role('heading',name='Reports & insights').count()==1
      assert await page.get_by_text('Saved reports').count()
      assert '1' in await page.locator('.insights-stats').inner_text()
      await page.screenshot(path=str(OUT/'Phase7_Mobile_Insights.png'),full_page=True)
      summary=await get_download('Download summary PDF','summary.pdf')
      csv=await get_download('Download CSV','summary.csv')
      assert summary.read_bytes().startswith(b'%PDF')
      assert 'Reed Habitat' in csv.read_text(encoding='utf-8-sig')
      await page.locator('#insights-period').select_option('week')
      assert '1' in await page.locator('.insights-stats').inner_text()
      # interactions still responsive on seven sizes.
      for width in (320,360,390,430,768,1024,1440):
        await page.set_viewport_size({'width':width,'height':900})
        await page.wait_for_timeout(50)
        size=await page.evaluate('({sw:document.documentElement.scrollWidth,iw:innerWidth})')
        print('viewport',width,size);assert size['sw']<=size['iw']+1,(width,size)
      await page.screenshot(path=str(OUT/'Phase7_Desktop_Insights.png'),full_page=True)
      await page.get_by_role('button',name='Rain simulator').first.click()
      await page.get_by_role('button',name='Heavy').first.click()
      assert 'Heavy conditions' in await page.locator('.rain-control-visual').inner_text()
      await page.get_by_role('button',name='Approvals').first.click()
      assert await page.get_by_role('heading',name='Approvals').count()==1
      await page.get_by_role('button',name='Telegram').first.click()
      assert await page.get_by_text('Meet SpongeBot.').count()==1
      await page.get_by_role('button',name='Settings & help').first.click()
      assert await page.get_by_role('button',name='Reports & insights').count()>=1
      assert not errs,errs
      print('PHASE 7 REPORTING AND REGRESSION PASS')
      await browser.close()

if __name__=='__main__': asyncio.run(run())

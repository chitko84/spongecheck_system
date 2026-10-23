"""Browser integration tests for dependency-free offline React preview.
Runs without npm/network by embedding locally available React 16 UMD + transpiled UI.
The shipping Vite source targets React 18; tests here validate navigation and UI behavior,
not a real npm build, and are labeled accordingly.
"""
import asyncio, base64, json, re
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).parents[1]
PRE = ROOT/'offline-preview'

def single_html():
    css=(PRE/'styles.css').read_text()
    css='\n'.join(css.splitlines()[1:])  # remove remote font import line fully
    css=css.replace('@tailwind base;','').replace('@tailwind components;','').replace('@tailwind utilities;','')
    js=(PRE/'app.bundle.js').read_text()
    js=js.replace("route: window.location.pathname", "route: '/'")
    js=js.replace("window.history.pushState({}, '', route);", "/* offline browser harness: route updated via state */",1)
    for f in list((PRE/'assets').rglob('*.svg'))+list((PRE/'assets').rglob('*.webp'))+list((PRE/'assets').rglob('*.jpg')):
        mime='image/jpeg' if f.suffix=='.jpg' else ('image/webp' if f.suffix=='.webp' else 'image/svg+xml')
        data='data:'+mime+';base64,'+base64.b64encode(f.read_bytes()).decode('ascii')
        js=js.replace('/assets/'+str(f.relative_to(PRE/'assets')).replace('\\','/'),data)
    # Remote stock images are shown as locally bundled original illustrative art in offline tests.
    fallback='data:image/png;base64,'+base64.b64encode((ROOT/'tests/fixture-photo.png').read_bytes()).decode('ascii')
    js=re.sub(r'https://images\.pexels\.com/photos/[^\'\"]+',lambda m:fallback,js)
    react=(PRE/'react.js').read_text()
    dom=(PRE/'react-dom.js').read_text()
    shim = """<script>(function(){var bag={};var store={getItem:function(k){return Object.prototype.hasOwnProperty.call(bag,k)?bag[k]:null;},setItem:function(k,v){bag[k]=String(v);},removeItem:function(k){delete bag[k];},clear:function(){bag={};}};try{window.localStorage.setItem('__test','x');window.localStorage.removeItem('__test');}catch(e){Object.defineProperty(window,'localStorage',{configurable:true,value:store});}})();</script>"""
    return f'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"/><style>{css}</style></head><body><div id="root"></div>{shim}<script>{react}</script><script>React.Fragment="div";</script><script>{dom}</script><script>{js}</script></body></html>'

async def run():
    html=single_html()
    print('Self-contained preview size',len(html))
    errors=[]
    async with async_playwright() as p:
      browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
      page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
      page.on('pageerror',lambda error:errors.append(str(error)))
      await page.goto('about:blank')
      await page.set_content(html,wait_until='domcontentloaded',timeout=30000)
      await page.wait_for_timeout(250)
      print('Root sample:',(await page.locator('#root').inner_text())[:430]);print('Errors',errors[:3]);
      if not await page.get_by_text('Every drop.',exact=False).count():
          raise Exception('Landing not rendered')
      await page.screenshot(path='/mnt/data/SpongeCheck_Phase1_Mobile_Landing.png',full_page=True)
      await page.get_by_role('button',name='Skip intro').click() if await page.get_by_role('button',name='Skip intro').count() else None
      await page.get_by_role('button',name='Explore the demo',exact=True).click()
      assert await page.get_by_text('Make yourself',exact=False).count()
      await page.get_by_role('button',name='Field inspector').click()
      await page.get_by_role('button',name=re.compile('Continue as inspector')).click()
      assert await page.get_by_text('Here’s what needs attention.').count()
      await page.screenshot(path='/mnt/data/SpongeCheck_Phase1_Mobile_Dashboard.png',full_page=True)
      for w in [320,360,390,430]:
          await page.set_viewport_size({'width':w,'height':844})
          await page.wait_for_timeout(60)
          info=await page.evaluate('({sw:document.documentElement.scrollWidth,iw:innerWidth})')
          print('viewport',w,info)
          assert info['sw']<=info['iw']+1, f'horizontal overflow at {w}'
      # places listing, list/map filters, navigation, report
      await page.get_by_role('button',name='Places',exact=True).click()
      assert await page.get_by_text('Explore places').count()
      await page.get_by_role('button',name='List',exact=True).click()
      await page.get_by_role('button',name='Wetland',exact=True).click()
      assert await page.locator('.place-card').count()==2
      await page.get_by_role('button',name='All',exact=True).click()
      await page.locator('.place-card').first.click()
      assert await page.get_by_text('Sample status').count()
      await page.get_by_role('button',name='Report an issue').click()
      await page.get_by_role('button',name='Use example photo').click()
      await page.get_by_role('button',name='Continue',exact=True).click()
      await page.get_by_role('checkbox').check()
      await page.get_by_role('button',name='Continue',exact=True).click()
      await page.locator('#report-notes').fill('There are leaves near the drainage opening and water looks slow.')
      await page.get_by_role('button',name='Save practice report').click()
      assert await page.get_by_text('Report saved').count()
      await page.get_by_role('button',name='My reports').click() if await page.get_by_role('button',name='My reports').count() else None
      await page.get_by_role('button',name='Updates',exact=True).click()
      assert await page.get_by_text('Your updates').count()
      # mobile settings
      await page.get_by_role('button',name='More').click()
      await page.get_by_role('button',name='Dark').click()
      assert await page.evaluate("document.documentElement.dataset.theme")=='dark'
      await page.get_by_role('button',name='Light').click()
      # check screenshot desktop
      await page.set_viewport_size({'width':1440,'height':900})
      await page.get_by_role('button',name='Overview').click()
      await page.screenshot(path='/mnt/data/SpongeCheck_Phase1_Desktop_Dashboard.png',full_page=True)
      print('final errors',errors[:5])
      assert len(errors)==0,errors
      await browser.close()
      print('BROWSER UI SMOKE TEST PASSED')

if __name__=='__main__': asyncio.run(run())

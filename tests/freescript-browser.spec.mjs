import {test,expect} from '@playwright/test';

test('FreeScript is searchable and opens its complete project case',async({page})=>{
 await page.goto('/work/');
 await page.locator('#project-browser-search').fill('FreeScript');
 const card=page.locator('[data-project-id="FreeScript"]');
 await expect(card).toBeVisible();
 await expect(page.locator('#project-browser-count')).toHaveText('1 of 13 projects');
 await card.getByRole('link',{name:'See how it works: FreeScript'}).first().click();
 await expect(page).toHaveURL(/\/work\/freescript\/$/);
 await expect(page.getByRole('heading',{level:1})).toHaveText('FreeScript');
});

test('FreeScript videos play, captions load and brand downloads are available',async({page,request})=>{
 await page.goto('/work/freescript/');
 await expect(page.locator('.project-page-frame')).toHaveCount(12);
 await expect(page.locator('#project-promotion video')).toHaveCount(2);
 for(const [index,duration]of [[0,31],[1,15]]){
  const video=page.locator('#project-promotion video').nth(index);
  await expect(video).toHaveAttribute('preload','none');
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(el=>{el.muted=true;el.load();});
  await expect.poll(()=>video.evaluate(el=>Number.isFinite(el.duration)?Math.round(el.duration):0)).toBe(duration);
  await video.evaluate(el=>el.play());
  await expect.poll(()=>video.evaluate(el=>el.currentTime)).toBeGreaterThan(.1);
  await video.evaluate(el=>el.pause());
  const track=await video.locator('track').getAttribute('src');
  const response=await request.get(new URL(track,page.url()).href);
  expect(response.ok()).toBe(true);expect(await response.text()).toContain('WEBVTT');
 }
 const zip=page.getByRole('link',{name:'Complete brand & promotional kit (ZIP)'});
 const url=new URL(await zip.getAttribute('href'),page.url());
 const download=await request.get(url.href);expect(download.ok()).toBe(true);expect((await download.body()).subarray(0,2).toString()).toBe('PK');
 await expect(page.locator('.project-release-status')).toHaveText('Signed Mac release · Not notarized');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('FreeScript remains readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/work/freescript/');
 await expect(page.getByRole('heading',{level:1})).toHaveText('FreeScript');
 await expect(page.locator('video[controls]')).toHaveCount(2);
 await expect(page.getByRole('link',{name:'Complete brand & promotional kit (ZIP)'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});

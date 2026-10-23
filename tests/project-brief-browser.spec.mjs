import { test, expect } from '@playwright/test';
const route='/project-brief/';
const endpoint='**/functions/v1/project-brief';
const draftKey='4u-digital-project-brief-v1';
const minimum={projectType:'website',contactName:'Jordan Client',contactEmail:'jordan@example.com'};
async function start(page,type='website') { await page.goto(route); await page.locator(`[name=projectType][value=${type}]`).check(); }
async function next(page){await page.locator('#brief-next').click();}
async function finish(page){await page.locator('#brief-review-early').click();await page.locator('#brief-contactName').fill(minimum.contactName);await next(page);await page.locator('#brief-contactEmail').fill(minimum.contactEmail);await next(page);await expect(page.locator('#brief-review')).toBeVisible();}
async function restore(page,answers,question){await page.addInitScript(({draftKey,answers,question})=>localStorage.setItem(draftKey,JSON.stringify({version:1,answers,question,step:0})),{draftKey,answers,question});await page.goto(route);}
async function fit(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
function payload(req){return JSON.parse(req.postData().match(/name="brief"\r\n\r\n([\s\S]*?)\r\n--/)[1]);}
test('one question at a time, website audience, back and no preference survive review and sending',async({page})=>{
 let sent;await page.route(endpoint,async r=>{sent=payload(r.request());await r.fulfill({status:201,json:{ok:true,status:'sent',reference:'4U-TEST'}});});
 await page.goto(route);await next(page);await expect(page.locator('#brief-status')).toContainText('choose an option');
 await page.locator('[name=projectType][value=website]').check();await next(page);
 await expect(page.locator('[data-field-container]:visible')).toHaveCount(1);
 await page.screenshot({path:`/tmp/4u-planner-question-${test.info().project.name}.png`,fullPage:true});await page.getByRole('checkbox',{name:'A comedian',exact:true}).check();await page.getByRole('checkbox',{name:'My business or services',exact:true}).check();await next(page);
 await page.locator('#brief-businessName').fill('Comedy Company');await page.locator('#brief-back').click();await expect(page.getByRole('checkbox',{name:'A comedian',exact:true})).toBeChecked();await next(page);await expect(page.locator('#brief-businessName')).toHaveValue('Comedy Company');await next(page);
 await page.locator('#brief-no-preference').click();await page.locator('#brief-back').click();await expect(page.locator('#brief-idea')).toHaveValue('No preference — help me decide');
 await finish(page);await expect(page.locator('#brief-review-content')).toContainText('A comedian');await expect(page.locator('#brief-review-content')).toContainText('No preference');await page.locator('#brief-consent').check();await page.locator('#brief-send').click();await expect(page.locator('#brief-success')).toBeVisible();const emailLink=await page.locator('#brief-success-media-email').getAttribute('href');expect(emailLink).toMatch(/^mailto:admin@customtechbuilt4u.com/);expect(decodeURIComponent(emailLink)).toContain('4U-TEST');expect(decodeURIComponent(emailLink)).toContain('Comedy Company');expect(sent.answers.websiteFor).toEqual(['comedian','business']);expect(sent.answers.idea).toContain('No preference');await fit(page);
});
test('changing project type hides website questions and removes their answers from submission',async({page})=>{
 await start(page);await next(page);await page.getByRole('checkbox',{name:'A comedian',exact:true}).check();await page.locator('#brief-back').click();await page.locator('[name=projectType][value=app]').check();await next(page);await expect(page.locator('#brief-businessName')).toBeVisible();await finish(page);await expect(page.locator('#brief-review-content')).not.toContainText('A comedian');
});
test('draft restores the active question and saved answers, without exposing multiple questions',async({page})=>{
 await restore(page,{...minimum,websiteFor:['comedian'],businessName:'My stage name'},'businessName');await expect(page.locator('#brief-businessName')).toBeVisible();await expect(page.locator('#brief-businessName')).toHaveValue('My stage name');await expect(page.locator('[data-field-container]:visible')).toHaveCount(1);await page.locator('#brief-back').click();await expect(page.getByRole('checkbox',{name:'A comedian',exact:true})).toBeChecked();await fit(page);
});
test('required contact details cannot be skipped and invalid email is explained',async({page})=>{
 await start(page);await page.locator('#brief-review-early').click();await expect(page.locator('#brief-no-preference')).toBeHidden();await next(page);await expect(page.locator('#brief-contactName')).toBeFocused();await page.locator('#brief-contactName').fill('Client');await next(page);await page.locator('#brief-contactEmail').fill('bad');await next(page);await expect(page.locator('#brief-status')).toContainText('valid email');
});
test('URL questions accept no preference and optional details can be skipped',async({page})=>{
 await restore(page,minimum,'businessWebsite');await expect(page.locator('#brief-businessWebsite')).toBeVisible();await page.locator('#brief-no-preference').click();await page.locator('#brief-skip').click();await expect(page.locator('#brief-review-content')).toContainText('No preference');
});
test('visual palette and client notes remain available and preserved',async({page})=>{
 await restore(page,minimum,'colors');await page.locator('[data-brief-palette]').first().click();await page.locator('#brief-colors').fill('Keep the background light');await page.locator('#brief-back').click();await next(page);await expect(page.locator('#brief-colors')).toHaveValue('Keep the background light');await expect(page.locator('#brief-selected-palette')).toBeVisible();await fit(page);
});
test('uploads stay optional and keep original image preview',async({page})=>{
 await restore(page,minimum,'__files');await expect(page.locator('#brief-files')).toBeAttached();await page.locator('#brief-files').setInputFiles({name:'reference.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6XcAAAAASUVORK5CYII=','base64')});await expect(page.locator('#brief-file-list img')).toBeVisible();await page.locator('#brief-back').click();await next(page);await expect(page.locator('#brief-file-list img')).toBeVisible();await fit(page);
});
test('interrupted send preserves answers and retries the same request identity',async({page})=>{
 const ids=[];await page.route(endpoint,async r=>{ids.push(payload(r.request()).requestId);if(ids.length===1)await r.abort();else await r.fulfill({status:202,json:{ok:true,status:'received',reference:'4U-RETRY',delivery:'queued'}});});await start(page);await finish(page);await page.locator('#brief-consent').check();await page.locator('#brief-send').click();await expect(page.locator('#brief-status')).toContainText('interrupted');await page.locator('#brief-send').click();await expect(page.locator('#brief-success-title')).toHaveText('Your brief is safely received.');expect(ids[0]).toBe(ids[1]);
});
test('320px layout and keyboard navigation keep the visible question readable',async({page})=>{
 await page.setViewportSize({width:320,height:740});await start(page);await page.locator('#brief-next').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-field-container=websiteFor]')).toBeFocused();await fit(page);await expect(page.locator('[data-field-container]:visible')).toHaveCount(1);
});

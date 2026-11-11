import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { briefEndpoint } from '../project-brief-config.js';
const route='/project-brief/';
const endpoint=`**${briefEndpoint}`;
const draftKey='4u-digital-project-brief-v1';
const minimum={projectType:'website',contactName:'Jordan Client',contactEmail:'jordan@example.com'};
async function start(page,type='website') { await page.goto(route); await page.locator(`[name=projectType][value=${type}]`).check(); }
async function next(page){await page.locator('#brief-next').click();}
async function finish(page){await page.locator('#brief-review-early').click();await page.locator('#brief-contactName').fill(minimum.contactName);await next(page);await page.locator('#brief-contactEmail').fill(minimum.contactEmail);await next(page);await expect(page.locator('#brief-review')).toBeVisible();}
async function restore(page,answers,question){await page.addInitScript(({draftKey,answers,question})=>localStorage.setItem(draftKey,JSON.stringify({version:1,answers,question,step:0})),{draftKey,answers,question});await page.goto(route);}
async function fit(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
function payload(req){return JSON.parse(req.postData().match(/name="brief"\r\n\r\n([\s\S]*?)\r\n--/)[1]);}
test('one question at a time, website audience, back and no preference survive review and sending',async({page})=>{
 let sent;await page.route(endpoint,async r=>{
  expect(r.request().method()).toBe('POST');
  expect(new URL(r.request().url()).origin).toBe(new URL(page.url()).origin);
  expect(r.request().headers()).not.toHaveProperty('apikey');
  sent=payload(r.request());await r.fulfill({status:200,json:{ok:true,status:'sent',reference:'4U-TEST'}});
 });
 await page.goto(route);await next(page);await expect(page.locator('#brief-status')).toContainText('choose an option');
 await page.locator('[name=projectType][value=website]').check();await next(page);
 await expect(page.locator('[data-field-container]:visible')).toHaveCount(1);
 await page.screenshot({path:`/tmp/4u-planner-question-${test.info().project.name}.png`,fullPage:true});await page.getByRole('checkbox',{name:'A comedian',exact:true}).check();await page.getByRole('checkbox',{name:'My business or services',exact:true}).check();await next(page);
 await page.locator('#brief-businessName').fill('Comedy Company');await page.locator('#brief-back').click();await expect(page.getByRole('checkbox',{name:'A comedian',exact:true})).toBeChecked();await next(page);await expect(page.locator('#brief-businessName')).toHaveValue('Comedy Company');await next(page);
 await page.locator('#brief-no-preference').click();await page.locator('#brief-back').click();await expect(page.locator('#brief-idea')).toHaveValue('No preference — help me decide');
 await finish(page);await expect(page.locator('#brief-review-content')).toContainText('A comedian');await expect(page.locator('#brief-review-content')).toContainText('No preference');await page.locator('#brief-consent').check();await page.getByRole('button',{name:'Send my project brief'}).click();await expect(page.locator('#brief-success')).toBeVisible();await expect(page.locator('#brief-success-message')).toContainText('accepted your brief for delivery');const emailLink=await page.locator('#brief-success-media-email').getAttribute('href');expect(emailLink).toMatch(/^mailto:admin@customtechbuilt4u.com/);expect(decodeURIComponent(emailLink)).toContain('Please attach photos and videos to this email before sending.');expect(decodeURIComponent(emailLink)).toContain('4U-TEST');expect(decodeURIComponent(emailLink)).toContain('Comedy Company');expect([...sent.answers.websiteFor].sort()).toEqual(['business','comedian']);expect(sent.answers.idea).toContain('No preference');await fit(page);
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
test('review edits return directly with notes intact and validate required contact details without sending', async ({page}) => {
 await page.setViewportSize({width:320,height:740});
 let submissions=0, popups=0;
 await page.route(endpoint, async request => { submissions++; await request.abort(); });
 page.on('popup', () => { popups++; });
 const notes={businessName:'Harbor Coffee',idea:'A simple way to manage subscriptions.',colors:'Keep the background light.',securityPrivacy:'Discuss staff access before building.'};
 await restore(page,{...minimum,...notes},'colors');
 await expect(page.locator('#brief-return-review')).toBeHidden();
 await finish(page);
 await page.locator('[data-brief-edit="0"]').click();
 const returnToReview=page.getByRole('button',{name:'Back to review',exact:true});
 await expect(returnToReview).toBeVisible();
 await next(page);
 await expect(page.locator('[data-field-container="websiteFor"]')).toBeVisible();
 await next(page);
 await page.locator('#brief-businessName').fill('Harbor Coffee subscriptions');
 await page.locator('#brief-back').click();
 await expect(returnToReview).toBeVisible();
 await next(page);
 await expect(page.locator('#brief-businessName')).toHaveValue('Harbor Coffee subscriptions');
 await returnToReview.click();
 await expect(page.locator('#brief-review')).toBeVisible();
 await expect(page.locator('#brief-review-title')).toBeFocused();
 await expect(page.locator('#brief-return-review')).toBeHidden();
 await expect(page.locator('#brief-review-content')).toContainText('Harbor Coffee subscriptions');
 for (const note of [notes.idea,notes.colors,notes.securityPrivacy]) await expect(page.locator('#brief-review-content')).toContainText(note);
 await page.getByRole('button',{name:'Edit Where can I reply?',exact:true}).click();
 await page.locator('#brief-contactName').fill('');
 await returnToReview.click();
 await expect(page.locator('#brief-contactName')).toBeFocused();
 await expect(page.locator('#brief-contactName')).toHaveAttribute('aria-invalid','true');
 await expect(returnToReview).toBeVisible();
 await expect(page.locator('#brief-review')).toBeHidden();
 await page.locator('#brief-contactName').fill('Jordan Updated');
 await next(page);
 await page.locator('#brief-contactEmail').fill('bad');
 await returnToReview.click();
 await expect(page.locator('#brief-contactEmail')).toBeFocused();
 await expect(page.locator('#brief-contactEmail')).toHaveAttribute('aria-invalid','true');
 await expect(page.locator('#brief-status')).toContainText('valid email');
 await expect(returnToReview).toBeVisible();
 await page.locator('#brief-contactEmail').fill('jordan.updated@example.com');
 await returnToReview.click();
 await expect(page.locator('#brief-review')).toBeVisible();
 await expect(page.locator('#brief-review-content')).toContainText('Jordan Updated');
 await expect(page.locator('#brief-review-content')).toContainText('jordan.updated@example.com');
 for (const note of [notes.idea,notes.colors,notes.securityPrivacy]) await expect(page.locator('#brief-review-content')).toContainText(note);
 await expect(page.locator('#brief-success')).toBeHidden();
 expect(submissions).toBe(0);expect(popups).toBe(0);
 await expect(page).toHaveURL(/\/project-brief\/$/);
 await fit(page);
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
test('a network retry keeps its request identity and only a sent receipt confirms delivery', async ({ page }) => {
  const ids = [];
  await page.route(endpoint, async route => {
    ids.push(payload(route.request()).requestId);
    if (ids.length === 1) return route.abort();
    if (ids.length === 2) return route.fulfill({ status: 202, json: { ok: true, status: 'queued', reference: '4U-RETRY' } });
    return route.fulfill({ status: 200, json: { ok: true, status: 'sent', reference: '4U-RETRY' } });
  });
  await start(page);
  await finish(page);
  await page.locator('#brief-consent').check();
  const send = page.getByRole('button', { name: 'Send my project brief' });
  await send.click();
  await expect(page.locator('#brief-status')).toContainText('interrupted');
  await send.click();
  await expect(page.locator('#brief-status')).toContainText('could not confirm delivery');
  await expect(page.locator('#brief-success')).toBeHidden();
  await send.click();
  await expect(page.locator('#brief-success-title')).toHaveText('Your brief is on its way.');
  expect(ids).toHaveLength(3);
  expect(new Set(ids).size).toBe(1);
});
test('an email draft is ready before an online attempt and preserves the complete brief when delivery is restricted', async ({ page }) => {
  const idea = 'Build a way for customers to track orders.';
  let submittedBody;
  await page.route(endpoint, route => {
    if (submittedBody) return route.fulfill({ status: 503, contentType: 'text/html', body: '<h1>Upstream unavailable</h1>' });
    submittedBody = route.request().postData();
    return route.fulfill({ status: 503, json: { ok: false, message: 'We could not confirm email delivery. If you email your brief, mention that you already tried sending it online.' } });
  });
  await restore(page, { ...minimum, idea }, '__files');
  await page.locator('#brief-files').setInputFiles({ name: 'reference.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await page.locator('[data-file-caption]').fill('Example layout');
  await finish(page);
  const email = page.getByRole('link', { name: 'Email my brief' });
  await expect(page.getByRole('button', { name: 'Send my project brief' })).toHaveClass(/brief-button-primary/);
  await expect(email).toHaveClass(/brief-button-secondary/);
  const draft = new URL(await email.getAttribute('href'));
  expect(draft.pathname).toBe('admin@customtechbuilt4u.com');
  expect(draft.searchParams.get('body')).toContain(idea);
  expect(draft.searchParams.get('body')).toContain('reference.pdf — Example layout');
  await page.locator('#brief-consent').check();
  await page.locator('#brief-send').click();
  await expect(page.locator('#brief-status')).toContainText('mention that you already tried sending it online');
  expect(submittedBody).toContain('filename="reference.pdf"');
  expect(submittedBody).toContain('Example layout');
  await expect(email).toHaveAttribute('href', draft.href);
  await expect(page.locator('#brief-success')).toBeHidden();
  await expect(page.locator('#brief-email-files-note')).toBeVisible();
  await page.locator('#brief-send').click();
  await expect(page.locator('#brief-status')).toContainText('Online delivery is temporarily unavailable');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download full brief' }).click();
  const download = await downloadPromise;
  expect(await readFile(await download.path(), 'utf8')).toContain('reference.pdf — Example layout');
  await fit(page);
});
test('the static mirror uses the business email draft without requesting online submission', async ({ page, baseURL }) => {
  const mirrorOrigin = 'https://taylordrew4u2.github.io';
  const mirrorPrefix = '/taylorworkexamples-';
  let submissions = 0;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'POST') { submissions++; return route.abort(); }
    if (url.origin !== mirrorOrigin || !url.pathname.startsWith(`${mirrorPrefix}/`)) return route.abort();
    const response = await route.fetch({ url: new URL(url.pathname.slice(mirrorPrefix.length) + url.search, baseURL).href });
    return route.fulfill({ response });
  });
  await page.goto(`${mirrorOrigin}${mirrorPrefix}${route}`);
  await page.locator('[name=projectType][value=website]').check();
  await finish(page);
  await expect(page.locator('#brief-send')).toBeHidden();
  await expect(page.locator('#brief-consent')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Email my brief' })).toHaveAttribute('href', /^mailto:admin@customtechbuilt4u.com/);
  await page.locator('#project-brief-form').evaluate(form => form.requestSubmit());
  expect(submissions).toBe(0);
});

test('large briefs keep the draft short and make the full text downloadable', async ({ page }) => {
  const idea = 'Keep this complete idea. '.repeat(100).trim();
  await restore(page, { ...minimum, idea }, 'idea');
  await finish(page);
  const href = await page.getByRole('link', { name: 'Email my brief' }).getAttribute('href');
  expect(href.length).toBeLessThan(1900);
  await expect(page.locator('#brief-email-attachment-note')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download full brief' }).click();
  expect(await readFile(await (await downloadPromise).path(), 'utf8')).toContain(idea);
});
test('320px layout and keyboard navigation keep the visible question readable',async({page})=>{
 await page.setViewportSize({width:320,height:740});await start(page);await page.locator('#brief-next').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-field-container=websiteFor]')).toBeFocused();await fit(page);await expect(page.locator('[data-field-container]:visible')).toHaveCount(1);
});

test('every optional section opens a question even when extra details are off', async ({page}) => {
  await start(page);
  for (let index = 0; index < 9; index++) {
    await page.locator('.brief-section-menu summary').click();
    await page.locator(`[data-brief-go="${index}"]`).click();
    await expect(page.locator('[data-field-container]:visible')).toHaveCount(1);
  }
});

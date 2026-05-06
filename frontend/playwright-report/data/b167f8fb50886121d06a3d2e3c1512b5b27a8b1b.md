# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard and Navigation >> should navigate via sidebar correctly
- Location: tests\e2e\dashboard.spec.ts:18:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Submit Complaint')
    - locator resolved to <a href="/submit" class="block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-white transition">Submit Complaint</a>
  - attempting click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying
    - locator resolved to <a href="/submit" class="block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-white transition">Submit Complaint</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    54 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e8]: SISPAA Intelligent Router
          - generic [ref=e9]: admin
        - generic [ref=e10]:
          - generic [ref=e11]: Admin
          - button "Logout" [ref=e12] [cursor=pointer]
    - main [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - heading "Admin Dashboard" [level=1] [ref=e16]
          - paragraph [ref=e17]: System overview and management
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: Total Complaints
            - generic [ref=e21]: "24"
          - generic [ref=e22]:
            - generic [ref=e23]: Pending Cases
            - generic [ref=e24]: "1"
          - generic [ref=e25]:
            - generic [ref=e26]: In Progress
            - generic [ref=e27]: "0"
          - generic [ref=e28]:
            - generic [ref=e29]: Completed
            - generic [ref=e30]: "0"
        - generic [ref=e31]:
          - heading "Quick Actions" [level=2] [ref=e32]
          - generic [ref=e33]:
            - button "Manage Users" [ref=e34] [cursor=pointer]
            - button "View Analytics" [ref=e35] [cursor=pointer]
        - generic [ref=e36]:
          - generic [ref=e37]:
            - generic [ref=e38]: Recent Complaints
            - textbox "Search by id/category/agency" [ref=e39]
          - table [ref=e41]:
            - rowgroup [ref=e42]:
              - row "ID Category Agency Status Timestamp" [ref=e43]:
                - columnheader "ID" [ref=e44]
                - columnheader "Category" [ref=e45]
                - columnheader "Agency" [ref=e46]
                - columnheader "Status" [ref=e47]
                - columnheader "Timestamp" [ref=e48]
            - rowgroup [ref=e49]:
              - row "bc4cbc7f… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:30:05 AM" [ref=e50]:
                - cell "bc4cbc7f…" [ref=e51]
                - cell "Infrastructure Damage" [ref=e52]
                - cell "DBKL" [ref=e53]
                - cell "COMPLETED" [ref=e54]
                - cell "5/6/2026, 8:30:05 AM" [ref=e55]
              - row "454ab3ab… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:30:00 AM" [ref=e56]:
                - cell "454ab3ab…" [ref=e57]
                - cell "Infrastructure Damage" [ref=e58]
                - cell "DBKL" [ref=e59]
                - cell "COMPLETED" [ref=e60]
                - cell "5/6/2026, 8:30:00 AM" [ref=e61]
              - row "1ee64d3c… Public Transport Issue APAD COMPLETED 5/6/2026, 8:29:59 AM" [ref=e62]:
                - cell "1ee64d3c…" [ref=e63]
                - cell "Public Transport Issue" [ref=e64]
                - cell "APAD" [ref=e65]
                - cell "COMPLETED" [ref=e66]
                - cell "5/6/2026, 8:29:59 AM" [ref=e67]
              - row "13a574db… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:29:56 AM" [ref=e68]:
                - cell "13a574db…" [ref=e69]
                - cell "Infrastructure Damage" [ref=e70]
                - cell "DBKL" [ref=e71]
                - cell "COMPLETED" [ref=e72]
                - cell "5/6/2026, 8:29:56 AM" [ref=e73]
              - row "cb9230e1… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:29:51 AM" [ref=e74]:
                - cell "cb9230e1…" [ref=e75]
                - cell "Infrastructure Damage" [ref=e76]
                - cell "DBKL" [ref=e77]
                - cell "COMPLETED" [ref=e78]
                - cell "5/6/2026, 8:29:51 AM" [ref=e79]
              - row "626317bd… Public Transport Issue APAD COMPLETED 5/6/2026, 8:29:51 AM" [ref=e80]:
                - cell "626317bd…" [ref=e81]
                - cell "Public Transport Issue" [ref=e82]
                - cell "APAD" [ref=e83]
                - cell "COMPLETED" [ref=e84]
                - cell "5/6/2026, 8:29:51 AM" [ref=e85]
              - row "234be40d… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:29:03 AM" [ref=e86]:
                - cell "234be40d…" [ref=e87]
                - cell "Infrastructure Damage" [ref=e88]
                - cell "DBKL" [ref=e89]
                - cell "COMPLETED" [ref=e90]
                - cell "5/6/2026, 8:29:03 AM" [ref=e91]
              - row "70315340… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:28:57 AM" [ref=e92]:
                - cell "70315340…" [ref=e93]
                - cell "Infrastructure Damage" [ref=e94]
                - cell "DBKL" [ref=e95]
                - cell "COMPLETED" [ref=e96]
                - cell "5/6/2026, 8:28:57 AM" [ref=e97]
              - row "608534bd… Public Transport Issue APAD COMPLETED 5/6/2026, 8:28:56 AM" [ref=e98]:
                - cell "608534bd…" [ref=e99]
                - cell "Public Transport Issue" [ref=e100]
                - cell "APAD" [ref=e101]
                - cell "COMPLETED" [ref=e102]
                - cell "5/6/2026, 8:28:56 AM" [ref=e103]
              - row "73e0195b… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:28:54 AM" [ref=e104]:
                - cell "73e0195b…" [ref=e105]
                - cell "Infrastructure Damage" [ref=e106]
                - cell "DBKL" [ref=e107]
                - cell "COMPLETED" [ref=e108]
                - cell "5/6/2026, 8:28:54 AM" [ref=e109]
              - row "4b00f1d6… Public Transport Issue APAD COMPLETED 5/6/2026, 8:28:49 AM" [ref=e110]:
                - cell "4b00f1d6…" [ref=e111]
                - cell "Public Transport Issue" [ref=e112]
                - cell "APAD" [ref=e113]
                - cell "COMPLETED" [ref=e114]
                - cell "5/6/2026, 8:28:49 AM" [ref=e115]
              - row "ff8e4f59… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:28:48 AM" [ref=e116]:
                - cell "ff8e4f59…" [ref=e117]
                - cell "Infrastructure Damage" [ref=e118]
                - cell "DBKL" [ref=e119]
                - cell "COMPLETED" [ref=e120]
                - cell "5/6/2026, 8:28:48 AM" [ref=e121]
              - row "a2b299c9… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:25:43 AM" [ref=e122]:
                - cell "a2b299c9…" [ref=e123]
                - cell "Infrastructure Damage" [ref=e124]
                - cell "DBKL" [ref=e125]
                - cell "COMPLETED" [ref=e126]
                - cell "5/6/2026, 8:25:43 AM" [ref=e127]
              - row "f69abfa9… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:25:38 AM" [ref=e128]:
                - cell "f69abfa9…" [ref=e129]
                - cell "Infrastructure Damage" [ref=e130]
                - cell "DBKL" [ref=e131]
                - cell "COMPLETED" [ref=e132]
                - cell "5/6/2026, 8:25:38 AM" [ref=e133]
              - row "3e21d735… Public Transport Issue APAD COMPLETED 5/6/2026, 8:25:37 AM" [ref=e134]:
                - cell "3e21d735…" [ref=e135]
                - cell "Public Transport Issue" [ref=e136]
                - cell "APAD" [ref=e137]
                - cell "COMPLETED" [ref=e138]
                - cell "5/6/2026, 8:25:37 AM" [ref=e139]
              - row "825481fc… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:25:33 AM" [ref=e140]:
                - cell "825481fc…" [ref=e141]
                - cell "Infrastructure Damage" [ref=e142]
                - cell "DBKL" [ref=e143]
                - cell "COMPLETED" [ref=e144]
                - cell "5/6/2026, 8:25:33 AM" [ref=e145]
              - row "11417076… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:25:28 AM" [ref=e146]:
                - cell "11417076…" [ref=e147]
                - cell "Infrastructure Damage" [ref=e148]
                - cell "DBKL" [ref=e149]
                - cell "COMPLETED" [ref=e150]
                - cell "5/6/2026, 8:25:28 AM" [ref=e151]
              - row "7febb211… Public Transport Issue APAD COMPLETED 5/6/2026, 8:25:28 AM" [ref=e152]:
                - cell "7febb211…" [ref=e153]
                - cell "Public Transport Issue" [ref=e154]
                - cell "APAD" [ref=e155]
                - cell "COMPLETED" [ref=e156]
                - cell "5/6/2026, 8:25:28 AM" [ref=e157]
              - row "5aaccddb… Infrastructure Damage DBKL COMPLETED 5/6/2026, 8:25:00 AM" [ref=e158]:
                - cell "5aaccddb…" [ref=e159]
                - cell "Infrastructure Damage" [ref=e160]
                - cell "DBKL" [ref=e161]
                - cell "COMPLETED" [ref=e162]
                - cell "5/6/2026, 8:25:00 AM" [ref=e163]
              - row "09400410… Infrastructure Damage DBKL COMPLETED 5/6/2026, 7:43:51 AM" [ref=e164]:
                - cell "09400410…" [ref=e165]
                - cell "Infrastructure Damage" [ref=e166]
                - cell "DBKL" [ref=e167]
                - cell "COMPLETED" [ref=e168]
                - cell "5/6/2026, 7:43:51 AM" [ref=e169]
              - row "3cbb5b0d… Infrastructure Damage DBKL COMPLETED 5/6/2026, 7:43:31 AM" [ref=e170]:
                - cell "3cbb5b0d…" [ref=e171]
                - cell "Infrastructure Damage" [ref=e172]
                - cell "DBKL" [ref=e173]
                - cell "COMPLETED" [ref=e174]
                - cell "5/6/2026, 7:43:31 AM" [ref=e175]
              - row "0954cfe9… Infrastructure Damage DBKL COMPLETED 5/6/2026, 7:43:14 AM" [ref=e176]:
                - cell "0954cfe9…" [ref=e177]
                - cell "Infrastructure Damage" [ref=e178]
                - cell "DBKL" [ref=e179]
                - cell "COMPLETED" [ref=e180]
                - cell "5/6/2026, 7:43:14 AM" [ref=e181]
              - row "239144f8… Infrastructure Damage DBKL COMPLETED 5/6/2026, 7:42:59 AM" [ref=e182]:
                - cell "239144f8…" [ref=e183]
                - cell "Infrastructure Damage" [ref=e184]
                - cell "DBKL" [ref=e185]
                - cell "COMPLETED" [ref=e186]
                - cell "5/6/2026, 7:42:59 AM" [ref=e187]
              - row "91f7d6ca… — — RECEIVED 5/6/2026, 7:42:49 AM" [ref=e188]:
                - cell "91f7d6ca…" [ref=e189]
                - cell "—" [ref=e190]
                - cell "—" [ref=e191]
                - cell "RECEIVED" [ref=e192]
                - cell "5/6/2026, 7:42:49 AM" [ref=e193]
              - row "f7aeec68… Healthcare Service KKM COMPLETED 5/5/2026, 10:15:22 PM" [ref=e194]:
                - cell "f7aeec68…" [ref=e195]
                - cell "Healthcare Service" [ref=e196]
                - cell "KKM" [ref=e197]
                - cell "COMPLETED" [ref=e198]
                - cell "5/5/2026, 10:15:22 PM" [ref=e199]
  - alert [ref=e200]
  - generic [ref=e203] [cursor=pointer]:
    - img [ref=e204]
    - generic [ref=e206]: 1 error
    - button "Hide Errors" [ref=e207]:
      - img [ref=e208]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard and Navigation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.addInitScript(() => {
  6  |       window.localStorage.setItem("token", "dummy");
  7  |       window.localStorage.setItem("user_id", "dummy");
  8  |       window.localStorage.setItem("role", "admin");
  9  |     });
  10 |     await page.goto('/dashboard');
  11 |   });
  12 | 
  13 |   test('should load the dashboard successfully', async ({ page }) => {
  14 |     await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
  15 |     await expect(page.locator('table')).toBeVisible();
  16 |   });
  17 | 
  18 |   test('should navigate via sidebar correctly', async ({ page }) => {
  19 |     // Navigate to Submit Complaint
> 20 |     await page.click('text=Submit Complaint');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  21 |     await expect(page).toHaveURL(/\/submit/);
  22 | 
  23 |     // Navigate to Work Orders
  24 |     await page.click('text=Work Orders');
  25 |     await expect(page).toHaveURL(/\/work-orders/);
  26 | 
  27 |     // Navigate to Logs
  28 |     await page.click('text=Logs');
  29 |     await expect(page).toHaveURL(/\/logs/);
  30 |   });
  31 | 
  32 |   test('dashboard stats update dynamically', async ({ page }) => {
  33 |     // Since we mock or test live, we just verify the stat cards exist
  34 |     await expect(page.locator('text=Total Complaints')).toBeVisible();
  35 |     await expect(page.locator('text=Pending Cases')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('responsiveness of dashboard', async ({ page, isMobile }) => {
  39 |     if (isMobile) {
  40 |       // In mobile, sidebar is hidden
  41 |       await expect(page.locator('text=Submit Complaint').first()).toBeHidden();
  42 |     }
  43 |   });
  44 | });
  45 | 
```
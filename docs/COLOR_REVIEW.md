# PathPilot color-system review

October 8, 2026. Direction C is the selected local default. Nothing has been committed, pushed, or deployed.

## Decision

| Direction | Tested treatment | Assessment |
| --- | --- | --- |
| A · Current | Original blue/white tokens and original dark tokens, unchanged when explicitly selected | Familiar and clear, but selection, action, and progress are too similar. Essential input boundaries are faint. |
| B · Refined blue | Warm near-white, desaturated blue action, cool ink, neutral surfaces, green progress | Strong low-risk refinement. Familiarity is its advantage; it remains less distinctive than C. |
| C · PathPilot | Warm off-white, deep ink, navy action, muted teal selection, restrained green progress/success | Selected. The neutral majority feels calmer; color distinguishes doing, choosing, and progressing. It preserves the existing type, spacing, and product composition. |

This is a design judgment informed by rendered screens and contrast measurements, not evidence from a student preference study or a claim that color alone creates trust. C's first dark neutral ramp looked too green; it was revised toward neutral navy/ink before selection.

## Research

- [Atlassian color foundations](https://atlassian.design/foundations/color/): semantic roles, separate light/dark neutrals, distinct focus and selection, and non-color cues. Adapted the role-based approach, not its brand colors.
- [Todoist](https://www.todoist.com/): inspected the rendered product homepage. Its warm near-white foundation, dark text, and sparing action accent demonstrate that warmth does not need large colored surfaces.
- [Xello](https://xello.world/en/): inspected the rendered education homepage. Its institutional audience and broader green/multicolor treatment are useful context, but not the calm product direction chosen here.
- Official [Notion](https://www.notion.com/product), [Linear](https://linear.app/), [Headspace](https://www.headspace.com/), and the education/career sources in [landing research](LANDING_RESEARCH.md) informed the broader category review. Not every source was visually verified: Khan Academy returned a client challenge; the captured Linear hero was still in its entrance state. Neither capture was used as visual evidence for the final palette.

## Real-screen comparison

All three directions were rendered in light and dark on Home, Workspace, Opportunities, Roadmap, Discovery, Portfolio/Projects, Goals, Mentor, Settings, sign-in, and shared feedback/control states. These are the existing React components, not replacement dashboards.

The application screens use test-only query/auth fixtures during server rendering. They contain illustrative records and are unhydrated/read-only. They do not prove authenticated live-service behavior. Requests and mutations are blocked in the test harness, and no student data is used.

- [A control](http://localhost:3014/home.html?palette=A&theme=light)
- [B refined blue](http://localhost:3014/home.html?palette=B&theme=light)
- [C selected](http://localhost:3014/home.html?palette=C&theme=light)
- Use the Screen and Theme selectors to compare the same component/data state.
- [Interactive shared controls](http://localhost:3015/palette-controls.html?palette=C&theme=dark): actual buttons, tabs, dialog, inputs, loading, and feedback primitives. No API calls.
- [Actual running application](http://localhost:3003/): the selected default and functional public demos.

Desktop captures are in `/private/tmp/pathpilot-palette-{A|B|C}-{light|dark}-{screen}.png`. The initial Workspace captures use `workspace` as the screen name. Generated review HTML lives in `/private/tmp/pathpilot-palette-review`; neither it nor the screenshots are shipped in the app.

To regenerate after a production build:

```sh
PALETTE_REVIEW_OUTPUT=/private/tmp/pathpilot-palette-review pnpm exec vitest run tests/palette-preview.test.ts
```

The controls HTML is a development-only Vite entry. The app's Express fallback deliberately serves its main shell, so use a separate local Vite preview for that entry; do not change API routing to serve it.

## Selected token contract

| Role / CSS token | Light | Dark |
| --- | --- | --- |
| background | #F7F5F0 | #151C22 |
| foreground, card-foreground, popover-foreground | #202B32 | #EBEFE9 |
| card | #FDFCF9 | #1D272E |
| popover | #FFFDF9 | #26323A |
| primary | #284B63 | #ADC8DB |
| primary-foreground | #FFFFFF | #162631 |
| secondary, muted | #EDEDE6 | #29363C |
| secondary-foreground | #35413F | #E1E9E4 |
| muted-foreground | #596360 | #AFBBB9 |
| accent | #E4EEE9 | #28463F |
| accent-foreground, selection-foreground, ring | #285F58 | #A5D9C9 |
| selection | #E1EDE8 | #28463F |
| border | #D4D9D2 | #41544F |
| input | #788980 | #7B9289 |
| progress | #337367 | #82C5AC |
| success | #276044 | #9BCCAB |
| success-subtle | #E5EFE6 | #263D32 |
| warning | #795515 | #E3C182 |
| warning-subtle | #F8EED9 | #473D2C |
| destructive | #A3373E | #F0A0A5 |
| destructive-foreground | #FFFFFF | #36171B |

Legacy slate utility ramp, 50 → 950: #F7F5F0, #EEECE6, #DDDCD4, #C9CBC6, #A2AAA7, #6B7979, #516268, #3B4E58, #293A45, #1E2B35, #14212A. Existing dark variants continue to select the appropriate end of that ramp. Chart roles use primary, progress, selection foreground, muted foreground, and warning rather than retaining unrelated blues.

The source of truth is `client/src/color-system.css`, imported once by `index.css`. Semantic roles are exposed through Tailwind. Compatibility rules cover existing slate/blue/emerald/amber/red utilities and older white surfaces without rewriting application behavior. Explicit `data-palette=A` preserves the control; B remains available for comparison. No new end-user preference is persisted.

## Meaning and accessibility

Actions remain navy in light mode. Selected navigation has teal text, a border, and an inset marker; selected tabs have an underline as well as color. Progress has a label/value; completion uses text/checkmarks. Errors have text/icons and recovery actions. Warning, success, and failure are never represented only by hue.

Measured ratios (rounded; text relative to its specified surface):

| Pair | A light / dark | B light / dark | C light / dark |
| --- | --- | --- | --- |
| Body text / background | 17.26 / 16.58 | 13.88 / 14.62 | 13.26 / 14.79 |
| Muted text / secondary | 5.49 / 6.42 | 5.36 / 6.41 | 5.29 / 6.30 |
| Button text / primary | 6.63 / 7.91 | 7.77 / 7.83 | 9.22 / 8.90 |
| Input boundary / background | 1.29 / 1.51 | 3.24 / 4.91 | 3.39 / 5.17 |
| Error text / card | 5.39 / 3.49 | 6.65 / 7.36 | 6.45 / 7.44 |

C selection text: 6.09 / 6.56. Success: 6.27 / 6.47. Warning: 5.83 / 6.20. Focus ring/background: 6.72 / 10.95. Progress/secondary: 4.71 / 6.24.

The candidate token tests require 4.5:1 for tested normal text pairs and 3:1 for essential boundaries/focus/progress. The original dark error text falls below the normal-text target; faint original borders are also a visibility concern when they are the essential control boundary. Soft decorative dividers do not need the same contrast as controls. Disabled states are distinguished by disabled semantics and opacity, not treated as normal enabled-text contrast.

This is not a WCAG conformance certification. Token checks cannot prove every composited/translucent surface, screenshot, assistive-technology flow, or future content state. Keyboard and responsive reviews supplement them.

## Scope

No model, prompts, provider configuration, auth behavior, database schema, rate limit, backend, API routing, or deployment setting changed. Existing product/marketing work is preserved. The landing changes and research are listed separately in LANDING_RESEARCH.md.

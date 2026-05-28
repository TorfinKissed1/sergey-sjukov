# Repository Guidelines

## Project Structure & Module Organization

This repository is a static landing page with no build step or external libraries. The layout is intended to be migrated to WordPress later, so keep markup, class names, assets, and interaction hooks easy to transfer into theme templates.

- `index.html` contains the page content, semantic markup, navigation, form, and section structure.
- `assets/css/styles.css` contains the full visual system, responsive rules, animation styles, and CSS variables.
- `assets/js/app.js` contains vanilla JavaScript for the preloader, sticky services stage, reveal motion, parallax, mobile menu, and form interactions.
- `assets/img/` stores image and SVG assets. Use lowercase, hyphenated filenames such as `construction-ghost.svg`.
- `README.md` summarizes the current site behavior and publication notes.

## WordPress Handoff Notes

Future implementation will likely be split into WordPress template parts or blocks. Keep section boundaries clear and semantic (`header`, `main`, `section`, `footer`) and preserve stable `id` anchors for navigation. Do not couple visible content to CSS or JavaScript; text, links, phone numbers, cards, and form labels should remain readable and editable in HTML so they can later become WordPress fields.

Use BEM classes as the public styling contract. Avoid renaming existing blocks, elements, or modifiers unless the task requires it and all references are updated. Use `data-*` attributes only for behavior hooks, not styling. When adding repeated content such as services, steps, benefits, or contacts, structure it so it can map cleanly to WordPress loops, custom fields, or reusable blocks.

Do not introduce a frontend build system, CSS framework, animation library, icon package, or WordPress-specific PHP without an explicit task-driven reason. If WordPress integration is requested later, prefer a small custom theme approach that reuses the existing static markup and CSS before considering a page builder.

## Build, Test, and Development Commands

There is no package manager setup and no compilation step.

```powershell
py -m http.server 8000
```

Runs a local static server from the repository root. Open `http://localhost:8000` to preview the site.

```powershell
Get-ChildItem -Recurse -File
```

Lists the full file tree when checking asset paths before edits.

For quick checks, opening `index.html` directly in a browser is acceptable, but use a local server when validating relative assets and browser behavior.

## Coding Style & Naming Conventions

Use 2-space indentation in HTML, CSS, and JavaScript. Keep the project dependency-free unless there is a strong reason to change that architecture. Use modern HTML5 semantics and accessible attributes. CSS follows a BEM-oriented naming style (`block__element--modifier`) and should prefer existing custom properties in `:root` before introducing new hardcoded values. JavaScript is plain browser JavaScript inside the existing strict IIFE; prefer `const`/`let`, explicit guards, small functions, and event delegation where it keeps future WordPress output simpler.

Keep visible site copy in Russian unless the task explicitly changes localization.

## Testing Guidelines

No automated test framework is configured. Before submitting UI changes, manually verify desktop and mobile behavior around the documented breakpoints: `1440`, `1240`, `1024`, `768`, `480`, and `360` px. Check the mobile menu, sticky services section, preloader, form behavior, keyboard focus, and `prefers-reduced-motion`. Confirm text does not overlap or overflow.

## Commit & Pull Request Guidelines

This checkout does not include Git history, so no project-specific commit pattern can be inferred. Use short imperative commits, for example `Update landing copy` or `Fix mobile menu focus state`.

Pull requests should include a brief change summary, screenshots or a short recording for visual changes, tested viewports/browsers, and any publication notes such as contact number or form-handler updates.

## Security & Configuration Tips

Do not commit secrets, analytics keys, or production form endpoints directly in source. The current phone number is a placeholder; replace it before publication and verify all `tel:` links match.

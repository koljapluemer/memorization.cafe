## Essential Tech Stack

- dexie with dexie-cloud (one db per user, cloud sync optional)
- tailwind + Daisy UI. Actually use daisy components. Avoid manual CSS when possible.
- lucide icons (via the vue package)
- vue router
- NO global store (dexie SSOt)

## Architecture

Do NOT!! adhere to the classic folder-by-type architecture Vue comes with.
Instead, use the following folder structure (inspired by Feature-Sliced Design)

- `app`: Stuff that MUST be global, e.g. the vue boilerplate holding the router view. Can import from anywhere, if it must. Should contain little logic.
- `dumb`: collection of simple, reusable stuff. no business logic. may not import from ANY other high-level folder. may cross-import within the folder. put assets here (if needed)
- `entities`: models/entities. One entity, one folder. In that, specifiy how to interact with the dexie db in question. An entity folder may NOT, NOT EVER, import another entity folder. If entities refer to one another, do so via string references to their uid. Inject repositories into pages via a function in `app/`, then pass them to features or meta-features
- `features`: ways of interacting with entities. one folder per feature. may NOT import one another. may ONLY import from `dumb` or `entities`.
- `meta-features`: for complex features interacting in turn with multiple `features`. One folder per meta-feature. May only import from below, and not from other meta-features
- `pages`: One folder per page (a page is something used by the `router.ts` file). If functionality is ONLY used on a given page, put it in the page folder, do not create features or meta-features that are only used by one single page.

## Guidelines

- Keep design lean. Use cards, wrapper divs and containers ONLY when necessary
- Keep style consistent across the code base
- Setup eslint and ensure green linter (not by disabling it, but by writing clean code)
- Keep files, functions and classes short, with a single purpose, on one abstraction layer. Split complex functionality when called for.
- Do not hallucinate features I did not ask for
- Keep copy and micro-copy short and to the point. Avoid waffling, avoid marketing speak, and avoid labelling everything with triple redundancy.
- make sure UI looks neat. Always put a form input BELOW the label in a new line. Responsive design.

## UI Design

- Use Tailwind and Daisy.UI components
- Understand [App.vue](src/app/App.vue): Note that the router view is already wrapped with a container and a flex layout. Do not wrap a page into another container or flex layout for no reason.
- In general (barring special cases where it makes no sense), every page should have a `h1` on top
- Do not add classes to headings
- Use wrapping components and especially cards sparingly, and only when needed.
- When using a card, give it classes `card` and `shadow`. Nothing else. No variation unless called for.
- If a card must have an hover effect because it's clickable, give it `transition-hover` and `hover:shadow-md`
- A `card` always must have a `card-body` where the content lives (this is Daisy UI syntax)
- A `card-title`, if existing, must be within `card-body`
- Prefer clean `grid` and `flex` layouts over `space-*`
- Use standard buttons unless special case calls for customization. Do not vary the size randomly unless called for
- Do not use gray text. If text must be dis-emphasized, use only and consistently `text-light`. Do not give it an `sm` size.
- Do not use excessive subheadings, redundant labels or little information widgets that the user does not care about. 
- Before implementing a component, look for similar components and copy their styles and/or approach.
- When setting margins, paddings, gaps and so on, prefer the size `1`, `2`, `4`, and `6`
- For recurring complex styles, use `@apply` in `App.vue`.
- User color sparingly, and only for primary/important elements or those that must use color to communicate (e.g. a warning)
- Make sure any given layout works well on mobile and desktop!

- Use this pattern for form inputs:

```
<fieldset class="fieldset">
  <label for="page-title" class="label">Page title</label>
  <input
    type="text"
    name="page-title"
    class="input"
    placeholder="My awesome page"
  />
</fieldset>
```

- KEEP. IT. SIMPLE.

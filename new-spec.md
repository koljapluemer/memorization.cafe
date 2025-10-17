## Entities

### Collection

- has `id`, `name` and optional `description`
- nothing else. used to hold learning items, who all must refer to exactly one collecton by id

### Learning-Item-Style Entities

Each learning-item entity should come with the following files:
- `repo`, interacting with the dexie db
- `contract`, an interface with all available functions that `repo` must implement
- `Row.vue`, a very simple <span> showcasing CORE information of the entity in a way that fits in a table row
- `Edit.vue`, a nicely rendered form allowing to edit all data for the object
- `Practice.vue`, a potentially more complex component allowing the user to practice a given learning-item object according to its variation's needs
- `Preview.vue`, allowing the user to see vaguely how the practice exercise will look without forcing them to go through the whole flow

For now, we want the following entities (more to follow):

#### Simple Flashcard

- has a `front` and a `back` prop
- both are edited via textarea and rendered as markdown.

- practice works as follows: 
 1. show just the front and a reveal button
 2. once reveal is clicked show front, horizontal dashed line, back, and four ts-frs standard buttons
- do not color the buttons, just use standard button
- for `Preview.vue`, show front+dashed line+back
- for `Row`, just show "$front | $back", truncate each if longer than 20 chars with "..."

We want to track learning progress via `ts-fsrs`:

- see [README](https://raw.githubusercontent.com/open-spaced-repetition/ts-fsrs/refs/heads/main/README.md)
- therefore, `contract`/`repo` getRandomDue and getRandomNew should be handled in the obvious way by `ts-fsrs` `Card` data (see [type file](https://raw.githubusercontent.com/open-spaced-repetition/ts-fsrs/4ace9c75e28d56d4ca3f4724322654bc546ec366/src/fsrs/models.ts))

However, there is a data-model consideration.
Later on (not now!) we want to allow users to share collections with learning items to other users,
whereby of course they shouldn't share their learning progress together with these items nor allow access to it. UNDERSTAND how [access control](https://dexie.org/cloud/docs/access-control) is handled in dexie-cloud, then propose a plan for how to implement progress tracking via `Card`


#### Elaborative Interrogation Concept

- has a `name` and an optional `description`
- edited with a form
- practice renders name and descriptions (markdown) a randomly picked question and offers the user a textarea to answer
  - for now, choose from the questions: "When does this concept apply?", "When does this concept not apply?" and "What problem does this concept solve?" and "Explain this concept to five year old" (make this easily extendable)
- answers should be persisted also, but the same problem of sharing the learning items without sharing the progress data applies as described above
- track when the last answer was (ideally persist an array where each item is answer+timestamp)
- how to pick a new random item of this type is obvious, due items are any that have not been answered in the last hour

- `Row` should simply be the name + truncated description if exists (with the name bold)

## Global Components

### AppHeader

- add an `AppHeader.vue` linking to the 3 main pages
  - Practice
  - Manage
  - Settings
- on desktop, show these buttons as icon + page name
- on mobile, just show the icon
- highlight currently active route

## Pages

### Practice

Very minimal page.
Should not do much except:
  - pick a random learning-item style
  - try to get a *random* (yes, *random*. make a shared array utils file) due item from this style via the relevant repo(s)
  - if none exist, get an *random unseen* item (via matching the learning progress)
  - if none exist, try the next learning-item style with the same pattern
  - if nothing yields anything, show a short message
  - otherwise, render the `Practice.vue` component from that item, wait for completion, load next


- offer a FAB in the bottom right for a filter modal. in it, allow selecting/deselecting collections and learning item styles. add buttons select/deselect all for either. make sure these settings are honored in the practice.

DO NOt!!!!!!!! spam the ui with progress bars, redundant labels and extra info that is not fucking mentioned in this spec!

### Manage

This should, at heart, be a tabbed view.
Each tab should be a collection, and when opened, allow CRUD operations for the learning items in this collection.
The "rightmosts tabs" should be a button to open a collection and one to create a new one (via modal)

Within the page, at the top, show buttons to add a new learning item for every type "+ Flashcard" "+ Elaborative Interrogation Concept" (via modal)

Below that, show the `Row.vue` components of all learning items in this collection
For each, add icon-buttons for view, edit, delete, preview 

### Settings

- leave as placeholder for now


## General Instructions

- do not get confused by previously existing files or instructions. We're doing a major change, this document is your source of truth.

### Architecture

Do NOT!! adhere to the classic folder-by-type architecture Vue comes with.
Instead, use the following folder structure (inspired by Feature-Sliced Design)

- `app`: Stuff that MUST be global, e.g. the vue boilerplate holding the router view. Can import from anywhere, if it must. Should contain little logic.
- `dumb`: collection of simple, reusable stuff. no business logic. may not import from ANY other high-level folder. may cross-import within the folder. put assets here (if needed)
- `entities`: models/entities. One entity, one folder. In that, specifiy how to interact with the dexie db in question. An entity folder may NOT, NOT EVER, import another entity folder. If entities refer to one another, do so via string references to their uid. Inject repositories into pages via a function in `app/`, then pass them to features or meta-features
- `features`: ways of interacting with entities. one folder per feature. may NOT import one another. may ONLY import from `dumb` or `entities`.
- `meta-features`: for complex features interacting in turn with multiple `features`. One folder per meta-feature. May only import from below, and not from other meta-features
- `pages`: One folder per page (a page is something used by the `router.ts` file). If functionality is ONLY used on a given page, put it in the page folder, do not create features or meta-features that are only used by one single page.

### Stack

- dexie with dexie-cloud (one db per user, cloud sync optional)
- tailwind + Daisy UI. Actually use daisy components. Avoid manual CSS when possible.
- lucide icons (via the vue package)
- vue router
- NO global store (dexie SSOt)

### Guidelines


- Keep design lean. Use cards, wrapper divs and containers ONLY when necessary
- Keep style consistent across the code base
- Setup eslint and ensure green linter (not by disabling it, but by writing clean code)
- Keep files, functions and classes short, with a single purpose, on one abstraction layer. Split complex functionality when called for.
- Do not hallucinate features I did not ask for
- Keep copy and micro-copy short and to the point. Avoid waffling, avoid marketing speak, and avoid labelling everything with triple redundancy.
- make sure UI looks neat.
- Responsive design.
- DaisyUI has some insane opinions about forms. Use the following pattern to generate a correct, nice-looking text-input in any kind of form:

```
<div class="form-control w-full max-w-xs">
  <label for="username" class="label">
    <span class="label-text">Username</span>
  </label>
  <input
    id="username"
    type="text"
    placeholder="Type here"
    class="input input-bordered w-full"
  />
</div>
```

### Make Dexie-Cloud Compatible

- use dexie as source of truth, do not layer extra state (except local state with no need of persistence)
- do NOT use pinia
- use `@id` so ids are autogenerated by dexie.
- use a single database that all entities access

## Clarification Questions

1. **Elaborative Interrogation completion**: How does the user complete/submit their answer during practice? Should there be a "Submit" or "Done" button, or should answers auto-save as they type?

"Done" button

2. **Manage page actions**: The spec mentions both "view" and "preview" icon-buttons for each learning item row. What's the intended difference between these two actions?

Kick the "view" button, not needed

3. **Practice filter persistence**: Should the filter settings (selected collections and learning item styles) persist across browser sessions, or reset each time?

make them persist via localstorage

4. **Collection deletion**: What should happen when attempting to delete a collection that contains learning items? Should deletion be prevented, or should it cascade-delete all items in the collection?

warn and cascade delete. hide the function in a collapsible within the collection tab, together with an "edit" button that via modal allows editing the collection's name and description.

5. **Learning progress storage approach**: For the ts-fsrs `Card` data and Elaborative Interrogation answers - given the future requirement to share collections without sharing progress - should these be stored in completely separate Dexie tables/entities with appropriate access control, or is there a different approach you'd prefer? (Note: requires understanding Dexie Cloud access control first)

**Proposed Solution** (based on Dexie Cloud access control docs):

Create a separate `learning-progress` entity/table that:
- Has a `learningItemId` field referencing the learning item
- Has an `owner` field set to the current user's ID (this grants full control regardless of realm)
- Has `realmId` pointing to the user's private realm (matching their user ID)
- Stores the ts-fsrs `Card` object for flashcards
- Stores the answers array (with timestamps) for Elaborative Interrogation items

This way:
- Learning items (flashcards, concepts) can have `realmId` set to a shared realm for sharing
- Progress records always stay in the user's private realm with explicit `owner` control
- When querying for practice, join learning items with progress by `learningItemId`
- New users seeing shared collections automatically get no progress records (start fresh)

Does this approach work for you, or would you prefer a different pattern?
You see here a basic vite-vue-ts app, freshly generated. Let's build an MVP.

This should become an app for various memorization/learning flows.

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

## MVP Features

Define a global header in `app/` with a nav allowing to go to these pages.

### Settings

Allow setting up dexie cloud sync.

### Dashboard

A neat little overview showing the user the different learn modes/techniques they can do on this page.

### Basic Flashcards

- allow CRUD operations (including reasonable list view using a dexie table) for a basic flashcard entity
- `Flashcard` has front and back, essentially
- front and back are edited via just textareas, but intepreted/rendered as markdown
- install `ts-fsrs` and use it for a queue/learn feature, where the user can practice their flashcards:
  - check for due flashcards first, only if none, pick an unseen/new flashcard
  - show front and a reveal button, after reveal show front+back and a row with the fsrs buttons
  - make sure to understand the ACtUAL, latest, non-hallucinated version of ts-fsrs
  - use a state machine for the queue

### Verbatim Memorization

- allow CRUD and list view for an entity VerbatimItem
- Verbatim item has 3 core fields: preExercise, toMemorize*, postExercise (all three text areas, interpreted as markdown)
- make a similar queue as described above, using ts-fsrs also
  - generate a cloze exercise, replacing a random word from `toMemorize` with '＿＿'
  - show preExercise (if exists) and the clozed exercise, and "reveal"
  - after reveal, show preExercise, the complete exercise with the previously clozed part pragmatically marked, and the score buttons
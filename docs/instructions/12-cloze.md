Let's create a new learning type `cloze`.

First, read [this](new-spec.md) and [this](docs/instructions/11-lists.md) IN DETAIL for reference.
Keep the guideliens of `/new-spec.md` in mind. Heed the design and architecture guidelines.

Clozes, at their essence are verbatim memorized items, and the learning works via replacing parts of the content with ＿, like "> Fear is the ＿".

## Entity

The `cloze` entity should have the following props:

- `preExercise`, an optional text rendered as markdown that gets displayed before/above the exercise
- `postExercise`, optional text (md) rendered after the exercise
- `content`, the main text that should be clozed
- `clozeStrategy`, which can be `atSpace` (default), `atEveryCharacter` , or `split` (more on that later)
- `indices`, an array of numbers with different meaning depending on the cloze strategy

## Row.vue

simply show the content, with a random possible cloze (described below)

## Edit.vue

- `pre`/`postExercise` should be textareas in a flex row (break on mobile)
- below that, a textarea for the `content`
- below that, a 3-way toggle (3 buttons directly next to each other, active one marked) for `clozeStrategy`

Now, some fancy UI depending on the `clozeStrategy`

### atEveryCharacter

if this is activated, show a live copy of the text in the `content` box.
each character can be "toggled" to be a possible cloze or not.
Highlight possible cloze characters. state can be switched by simply clicking on the character. cloze-able character indicies are persisted in `indices`.

By default, set every character as a possible cloze that ISN'T a space or tab (EXACTLY this condition).

Below the whole UI, show a preview with max. 3 random example clozes based on the generation described below (disregarding the percentages, and ofc not showing pre/post) with `card-xs`

### atSpace

Works as above, only not every character can be individually toggled, but instead all characters between spaces are considered as one unit.
The `indices` then refer not to character positions, but to the index of the word or character progression.

By default, set every character progression that has more than 3 characters as clozeable.

Below the whole UI, show a preview with max. 3 random example clozes based on the generation described below (disregarding the percentages, and ofc not showing pre/post) with `card-xs`


### split

Here, instead of toggling characters, we can introduce "split markers" between any characters. these should be a red vertical line between two characters with a triangle above it. Clicking on the line or triangle deletes the marker. By default, create one marker in the middle. 
`indices` persist the character indices *after a which* a marker is set.

Below the whole UI, show a preview with max. 3 random example clozes based on the generation described below (disregarding the percentages, and ofc not showing pre/post) with `card-xs`


## Practice

The practice again depends on the `clozeStrategy`.
Any given cloze learning item may generate a large number of possible clozes.

In general, due should be calculated with ts-fsrs just like `src/entities/simple-flashcard`.

UI-wise, practice works as follows:

Show `preExercise` and the clozed `content` (for the devious cloze logic, see below) and a reveal button. After reveal button, show `preExercise`, `content` completely but with the stuff that was clozed highlighted (marker style), `postExercise` and the fsrs buttons (again, like simple-flashcard)

### atSpace 

Here, every word/character progression marked in the `indicies` may be clozed. Pick this randomly.

If the retrievability percentage according to ebisu is more than 70% (make this easily adjustable via a context), allow randomly picking two valid consecutive indices to clozes. E.g.:

content: "> Fear is the mind-killer"
indicies: [1, 3, 4]

we have one pair of consecutive indices, 3 and 4. 
They may form a cloze like: "> Fear is ＿ ＿" 

When above 80%, allow also picking 3 consecutive indices (this would in the example above not be possible).

When above 90%, allow also clozing every single clozeable index.
When above 95%, always cloze all.

### atEveryCharacter

Works exactly as above, only of course the split and index interpretation is at character level.

### split

Randomly choose a marker.
Then, simply cloze everything after that with a single cloze marker.
E.g.:

content: "Nympholepsy"
indices: [4]

result: "Nympho＿"

## Preview

Show `pre`, max. 3 random example clozes, `post`


## General

- expose the necessary functions and basic CRUD in repo/contract
- integrate properly in [practice](src/pages/practice/PracticePage.vue)
- integrate properly into [manage page](src/pages/manage/ManagePage.vue) 
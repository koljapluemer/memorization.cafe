Let's make a new entity (`src/entities`): `list`.
It should be learning item style entity; read `new-spec.md` (IN DETAIL!) to understand what that is.

`list`s should have a name and then a number of items, simply strings.
Both rendered as [markdown](src/dumb/MarkdownText.vue).

Also, they should have a toggle `isOrderedList`.

Lists should be integrated into [the manage page](src/pages/manage/ManagePage.vue) and editable/addable via [the modal](src/pages/manage/LearningItemEditModal.vue)


- `repo`/`contract` should offer basic CRUD and other relevant methods, checkk other repos for reference

- `Row.vue` should show the name in bold and then if it's an unordered list just "$item; $item" (truncated like other rows) and if its ordered "1) $item 2) $item " (also truncated)
- `Edit.vue` should have a smart meta form starting with two text inputs for the list items and always add one in such a way that there is always at least one empty text box. should of course also possible to remove items. if `isOrderedList` is toggled, show the numbers infront of the text boxes and to the right of the input show up/down icon buttons to change the order. If it's not ordered, [randomize](src/dumb/array-utils.ts) the order or the list items. Apart from that, follow the guidelines in `new-spec.md`.
- `Practice` should show the name and let the user free-text input items, with a similar meta-form like in the edit. Below that there should be a reveal button. Once revealed, hide the text input, instead show a table aligning the user-input items and the correct list items. add a checkbox in the cell for the correct list items where the user can select which items of the original they remember. If you find a literal match between one of the inputs and an item, pre-select the checkbbox
- `Preview`: just nicely render name + list, according to whether it's ordered or not


Propose how to adapt learningProgress to persist the user's answers for this novel learning type. We want to use [ebisu.js](https://raw.githubusercontent.com/fasiha/ebisu.js/refs/heads/gh-pages/README.md) (ACTUALLY FETCH!!) with the default model, passing in the percentage of the list items correctly remembered, for determining due list learning items. A recall probability of 90 percent or is not considered due.
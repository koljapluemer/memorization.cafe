Let's do various improvements around `src/pages/practice/PracticePage.vue`.

- The "Add a note on how you will remember this" is unused. Remove it, including from the respective db models and all references across the app.
- We are currently implementing that items that are new must come up again within a certain amount of exercises. This is badly implemented (see [this old spec](docs/special-treatments-of-new-learning-items.md) for context). Remove it and replace it with the feature described below 
- For previously unseen items (where we removed the "add a note"), instead add two buttons "I will remember" and "Already Know This"
- At "I will remember", create learning progress object and also, within the PracticePage state, add a reference to this item to a `hot_list`, and go to next item
- At "Already Know This", create the learning progress object but don't add to list
- When picking a new exercise, and hot_list is not empty, with 50% chance pick an item from the hot list
- however, do also still stick to the hard rule that an item MAY NOT come up twice in a row
- Once an exercise is picked (by the hot_list picker or otherwise), it should be removed from the hot list.
- Implement cleanly and extensible, keeping to [THE GUIDELINES](developer-guidelines.md)


- Start a [documentation](docs/publish/practice.md) how practicing works. Split into chapters: For end users and for developers. Avoid marketing speech  
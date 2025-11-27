
- New `Cloze` items should immediately be revealed, showing what is usually shown after the user presses Reveal. There should be an optional `helperNote` field and a button "I will try to remember" instead of "Done" or the SR-Response buttons
- New `List` items should immediately be revealed, showing the list title and all items, without any checkbox selection of course. There should be an optional `helperNote` field and a button "I will try to remember" instead of "Done" or the SR-Response buttons
- New `SimpleFlashcard` items should immediately be revealed, showing what is usually shown after the user presses Reveal, namely front and back of the flashcard. There should be an optional `helperNote` field and a button "I will try to remember" instead of "Done" or the SR-Response buttons
- New `Concept` items should not be treated differently than concept items are usually treated

A `src/entities/learning-progress/LearningProgress.ts` object is created and attached after this UI is done.
After a new learning item is introduced, it should come up in its normal form within the next 10 exercises, always (but not directly as the next exercise after introduction, such doubling-up is forbidden). This does not apply for `Concept` items.
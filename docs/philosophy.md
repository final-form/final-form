# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/philosophy). Links may not work on Github.com.

# Philosophy

For several years, I ([@erikras](https://twitter.com/erikras)) actively maintained the first big form library in the React community, [Redux Form](https://redux-form.com). During those years, I learned many lessons, about open source and React, and saw hundreds of forms use cases from around the world. As Redux Form grew in popularity (and bundle size), I received a lot of feedback from the community. Final Form is my answer the concerns of the community.

## Talk

In this talk, I explain the journey through Redux Form to the conception and creation of React Final Form.

[Next Generation Forms with React Final Form – React Alicante 2018, Alicante, Spain](https://youtu.be/WoSzy-4mviQ)

## Goals

Final Form strives to meet the following goals:

### Framework Agnostic

Final Form is **framework agnostic**, meaning that the core form state management engine is entirely self contained in _pure javascript with zero dependencies_.

Since its release, the community have built [companion libraries](companion-libraries) on top of Final Form to work with React, Vue, Web Components, and more.

Because of its framework independence, Final Form could potentially outlast whatever frontend framework you are currently using. Take [React Hooks](https://reactjs.org/docs/hooks-intro.html), for example; Hooks were introduced after Final Form was released, reimagining component state management. Only the wrapper for React, [React Final Form](/react), had to be modified to support the new Hooks philosophy.

### Strongly Typed

Final Form provides strong typing via both [Flow](https://flow.org) and [Typescript](https://www.typescriptlang.org) to allow you to catch common bugs _at coding time_.

### Modularity

Just because some forms can be complex doesn't mean that your users should need to download all that code for a simple form! Final Form and React Final Form, break out complex functionality into separate packages, so the form state management core doesn't get bloated by complicated use cases. This allows you to _build the form library you need_ for every use case.

Also, this allows for...

### Minimal Bundle Size

Final Form also has _zero dependencies_. A form library shouldn't require that you install `lodash`.

### High Performance

Final Form utilizes the well-known [Observer pattern](https://en.wikipedia.org/wiki/Observer_pattern) to subscribe to updates about specific portions of state.

If you're familiar with Redux, it's a little bit like how you can use "selectors" in Redux to specify exactly which "slice" of state you want your component to be notified about.

The result is that you can streamline your form for maximum performance.

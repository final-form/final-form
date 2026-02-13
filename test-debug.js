const createForm = require('./dist/final-form.cjs.js').default

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function test() {
  const form = createForm({ onSubmit: () => {} })

  const callsA = []
  const callsB = []
  
  const spyA = (state) => {
    console.log('SpyA called:', state.error, 'validating:', state.validating)
    callsA.push(state)
  }
  const spyB = (state) => {
    console.log('SpyB called:', state.error, 'validating:', state.validating)
    callsB.push(state)
  }

  form.registerField('a', spyA, { error: true, validating: true }, {
    getValidator: () => async (value) => {
      console.log('Validator A starting for:', value)
      await sleep(50)
      console.log('Validator A finished for:', value)
      return value === 'err' ? 'A-error' : undefined
    },
    validateFields: []
  })

  form.registerField('b', spyB, { error: true, validating: true }, {
    getValidator: () => async (value) => {
      console.log('Validator B starting for:', value)
      await sleep(20)
      console.log('Validator B finished for:', value)
      return value === 'err' ? 'B-error' : undefined
    },
    validateFields: []
  })

  console.log('\n=== Changing A to err ===')
  form.change('a', 'err')
  
  await sleep(5)
  
  console.log('\n=== Changing B to err ===')
  form.change('b', 'err')

  await sleep(200)
  
  console.log('\n=== Final state ===')
  console.log('A calls:', callsA.length, 'Last error:', callsA[callsA.length-1]?.error)
  console.log('B calls:', callsB.length, 'Last error:', callsB[callsB.length-1]?.error)
}

test().catch(console.error)

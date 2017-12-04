import publishFieldState from './publishFieldState'

const check = (error, initial, value) => {
  // mock placeholder values to check ===
  const active = {}
  const blur = {}
  const change = {}
  const focus = {}
  const name = 'foo'
  const submitFailed = {}
  const submitSucceeded = {}
  const result = publishFieldState(
    {
      initialValues: {
        foo: initial
      },
      submitFailed,
      submitSucceeded,
      values: {
        foo: value
      }
    },
    {
      active,
      blur,
      change,
      error,
      focus,
      initial,
      name,
      value
    }
  )
  expect(result.active).toBe(active)
  expect(result.blur).toBe(blur)
  expect(result.change).toBe(change)
  expect(result.focus).toBe(focus)
  expect(result.name).toBe(name)
  expect(result.error).toBe(error)
  expect(result.initial).toBe(initial)
  expect(result.value).toBe(value)
  expect(result.dirty).toBe(initial !== value)
  expect(result.pristine).toBe(initial === value)
  expect(result.submitFailed).toBe(submitFailed)
  expect(result.submitSucceeded).toBe(submitSucceeded)
  expect(result.valid).toBe(!error)
  expect(result.invalid).toBe(!!error)
}

describe('publishFieldState', () => {
  it('should show valid when no error', () => {
    check(undefined, undefined, undefined)
  })

  it('should show invalid when no error', () => {
    check('some error', undefined, undefined)
  })

  it('should show pristine when value same as initial', () => {
    check('some error', 42, 42)
    check(undefined, 42, 42)
    check('some error', 'apples', 'apples')
    check(undefined, 'apples', 'apples')
  })

  it('should show dirty when value different from initial', () => {
    check('some error', 42, 43)
    check(undefined, 42, 43)
    check('some error', 'apples', 'oranges')
    check(undefined, 'apples', 'oranges')
  })
})

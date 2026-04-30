import createForm from './FinalForm'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('FinalForm.submission - Issue #247', () => {
  it('should clear field validating flag after submit completes when submitted during async validation', async () => {
    const onSubmit = jest.fn(async (values) => {
      await sleep(10)
    })

    const form = createForm({ onSubmit })

    let fieldState: any
    const spy = jest.fn((state) => {
      fieldState = state
    })

    // Register field with async validator
    form.registerField(
      'test',
      spy,
      { value: true, validating: true },
      {
        getValidator: () => async (value: any) => {
          // Simulate long async validation
          await sleep(100)
          return undefined // No error
        },
      }
    )

    // Change value to trigger async validation
    form.change('test', 'value1')

    // Wait for validation to start
    await sleep(10)

    // validating should be true while async validation is running
    expect(fieldState.validating).toBe(true)

    // Submit while async validation is still running
    const submitPromise = form.submit()

    // Wait for submit to complete
    await submitPromise

    // Wait a bit more to ensure async validation completes
    await sleep(150)

    // BUG: validating flag should be false after everything completes
    // but it stays true
    expect(fieldState.validating).toBe(false)
  })
})

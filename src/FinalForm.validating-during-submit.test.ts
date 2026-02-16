import createForm from './FinalForm'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('FinalForm.validating-during-submit', () => {
  it('should clear validating flag after submit with pending async field validation', async () => {
    const form = createForm({
      onSubmit: async () => {
        await sleep(10)
      }
    })

    const spy = jest.fn()
    form.subscribe(spy, { validating: true })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].validating).toBe(false)

    // Register field with slow async validator
    const unregister = form.registerField(
      'testField',
      jest.fn(),
      { value: true, error: true, validating: true },
      {
        getValidator: () => async (value: any) => {
          await sleep(100) // Slow validation
          return value === 'bad' ? 'error' : undefined
        }
      }
    )

    // Change field to trigger async validation
    form.change('testField', 'test')

    // Wait a bit for async validation to start
    await sleep(10)
    expect(spy.mock.calls[spy.mock.calls.length - 1][0].validating).toBe(true)

    // Submit WHILE async validation is running
    const submitPromise = form.submit()

    // Check that form becomes validating during submit
    expect(spy.mock.calls[spy.mock.calls.length - 1][0].validating).toBe(true)

    // Wait for everything to complete
    await submitPromise

    // BUG: validating should be false after submit completes
    expect(spy.mock.calls[spy.mock.calls.length - 1][0].validating).toBe(false)

    unregister()
  })
})

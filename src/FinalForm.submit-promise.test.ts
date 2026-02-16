import createForm from './FinalForm'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('FinalForm.submit-promise', () => {
  it('should return a Promise from submit() even with pending async field validations', async () => {
    const onSubmit = jest.fn(async () => {
      await sleep(10)
    })
    
    const form = createForm({ onSubmit })

    // Register field with async validator
    form.registerField(
      'testField',
      jest.fn(),
      { value: true },
      {
        getValidator: () => async (value: any) => {
          await sleep(50) // Slow async validation
          return undefined // No error
        }
      }
    )

    // Change field to trigger async validation
    form.change('testField', 'test')

    // Submit IMMEDIATELY while async validation is still pending
    const submitResult = form.submit()

    // BUG in #420: This should be a Promise, not undefined
    expect(submitResult).toBeInstanceOf(Promise)

    // Wait for everything to complete
    await submitResult

    // Verify onSubmit was actually called
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('should return a Promise from submit() when async validations have not started', async () => {
    const onSubmit = jest.fn(async () => {
      await sleep(10)
    })
    
    const form = createForm({ onSubmit })

    // Register field with async validator but DON'T trigger it yet
    form.registerField(
      'testField',
      jest.fn(),
      { value: true },
      {
        getValidator: () => async (value: any) => {
          await sleep(50)
          return undefined
        }
      }
    )

    // Set initial value (no change yet, so no async validation triggered)
    form.change('testField', 'test')
    
    // Wait for async validation to complete
    await sleep(60)

    // Now submit - async validations are NOT pending
    const submitResult = form.submit()

    expect(submitResult).toBeInstanceOf(Promise)
    await submitResult
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

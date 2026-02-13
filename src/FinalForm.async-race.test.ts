import createForm from './FinalForm'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Final Form async validation race conditions (issue #509)', () => {
  describe('Scenario 1: Suppressed errors with validateFields=[]', () => {
    it('should preserve both field errors when concurrent async validators run with validateFields=[]', async () => {
      const form = createForm({ onSubmit: () => {} })

      const spyA = jest.fn()
      const spyB = jest.fn()

      // Register field A with async validator (50ms delay)
      form.registerField(
        'a',
        spyA,
        { error: true },
        {
          getValidator: () => async (value) => {
            await sleep(50)
            return value === 'err' ? 'A-error' : undefined
          },
          validateFields: []
        }
      )

      // Register field B with async validator (20ms delay)
      form.registerField(
        'b',
        spyB,
        { error: true },
        {
          getValidator: () => async (value) => {
            await sleep(20)
            return value === 'err' ? 'B-error' : undefined
          },
          validateFields: []
        }
      )

      // Clear initial calls
      spyA.mockClear()
      spyB.mockClear()

      // Start A validation, then shortly after start B
      form.change('a', 'err')
      await sleep(5)
      form.change('b', 'err')

      // Wait for both validators to complete
      await sleep(200)

      // Debug output
      console.log('SpyA call count:', spyA.mock.calls.length)
      console.log('SpyB call count:', spyB.mock.calls.length)
      
      if (spyA.mock.calls.length > 0) {
        console.log('Last A state:', spyA.mock.calls[spyA.mock.calls.length - 1][0])
      }
      if (spyB.mock.calls.length > 0) {
        console.log('Last B state:', spyB.mock.calls[spyB.mock.calls.length - 1][0])
      }

      // Both fields should have errors
      expect(spyA.mock.calls.length).toBeGreaterThan(0)
      expect(spyB.mock.calls.length).toBeGreaterThan(0)
      
      const lastA = spyA.mock.calls[spyA.mock.calls.length - 1][0]
      const lastB = spyB.mock.calls[spyB.mock.calls.length - 1][0]

      expect(lastA.error).toBe('A-error')
      expect(lastB.error).toBe('B-error')
    })
  })

  describe('Scenario 2: Incorrect validating flag with overlapping validations', () => {
    it('should keep validating=true until all async validations complete', async () => {
      const form = createForm({ onSubmit: () => {} })

      const spy = jest.fn()

      form.registerField(
        'username',
        spy,
        { error: true, validating: true },
        {
          getValidator: () => async (value) => {
            if (value === 'first') {
              await sleep(150)
              return 'first-error'
            }
            if (value === 'second') {
              await sleep(20)
              return 'second-error'
            }
            return undefined
          }
        }
      )

      spy.mockClear()

      // Start first long validation
      form.change('username', 'first')
      await sleep(10)

      // Start second short validation while first is still running
      form.change('username', 'second')

      // Check mid-state after short validation completes but long one is still running
      await sleep(40)
      const midState = spy.mock.calls[spy.mock.calls.length - 1][0]

      // validating should STILL be true because first validation is still running
      expect(midState.validating).toBe(true)

      // Wait for long validation to complete
      await sleep(200)
      const finalState = spy.mock.calls[spy.mock.calls.length - 1][0]

      // Now validating should be false
      expect(finalState.validating).toBe(false)
      // And we should have the error from the most recent validation
      expect(finalState.error).toBe('first-error')
    })
  })
})

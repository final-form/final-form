import createForm, { FORM_ERROR } from './FinalForm'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const onSubmitMock = (values, callback) => {}

describe('FinalForm', () => {
  describe('FinalForm.creation', () => {
    it('should throw an error if no config is provided', () => {
      expect(() => createForm()).toThrowError(/No config/)
    })

    it('should throw an error if no onSubmit is provided', () => {
      expect(() => createForm({})).toThrowError(/No onSubmit/)
    })

    it('should create a form with no initial values', () => {
      const form = createForm({ onSubmit: onSubmitMock })
      expect(form.getState().initialValues).toBeFalsy()
      expect(form.getState().values).toEqual({})
    })

    it('should create a form with initial values', () => {
      const initialValues = {
        foo: 'bar',
        cat: 42
      }
      const form = createForm({ onSubmit: onSubmitMock, initialValues })
      expect(form.getState().initialValues).not.toBe(initialValues)
      expect(form.getState().initialValues).toEqual(initialValues)
      expect(form.getState().values).not.toBe(initialValues)
      expect(form.getState().values).toEqual(initialValues)
    })

    it('should create a form that is pristine upon creation', () => {
      const form = createForm({ onSubmit: onSubmitMock })
      expect(form.getState().pristine).toBe(true)
      expect(form.getState().dirty).toBe(false)
    })
  })

  describe('FinalForm.debugging', () => {
    it('should allow debug callback on every change', () => {
      const debug = jest.fn()
      const form = createForm({ onSubmit: onSubmitMock, debug })

      form.registerField('foo', () => {})
      expect(debug).toHaveBeenCalledTimes(1)

      form.change('foo', 'bar')

      expect(debug).toHaveBeenCalledTimes(3)
    })
  })

  describe('FinalForm.subscribing', () => {
    const prepareFormSubscriber = (fieldName, subscription, config = {}) => {
      const form = createForm({ onSubmit: onSubmitMock, ...config })
      const spy = jest.fn()
      form.subscribe(spy, subscription)
      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)

      let blur
      let change
      let focus
      form.registerField(
        fieldName,
        fieldState => {
          blur = fieldState.blur
          change = fieldState.change
          focus = fieldState.focus
        },
        {}
      )
      return { blur, change, focus, spy }
    }

    it('should throw an error if no callback is given', () => {
      const form = createForm({ onSubmit: onSubmitMock })
      expect(() => form.subscribe()).toThrowError(/No callback/)
    })

    it('should throw an error if no subscription is given', () => {
      const form = createForm({ onSubmit: onSubmitMock })
      expect(() => form.subscribe(() => {})).toThrowError(/No subscription/)
    })

    it('should no longer send form updates after unsubscribing', () => {
      const form = createForm({ onSubmit: onSubmitMock })

      const formSpy = jest.fn()
      const fieldSpy = jest.fn()
      const unsubscribe = form.subscribe(formSpy, { values: true })
      form.registerField('foo', fieldSpy, { value: true })

      // called with initial state
      expect(formSpy).toHaveBeenCalledTimes(1)
      expect(formSpy.mock.calls[0][0].values.foo).toBeUndefined()
      expect(fieldSpy).toHaveBeenCalledTimes(1)
      expect(fieldSpy.mock.calls[0][0].value).toBeUndefined()

      // update field value
      form.change('foo', 'bar')

      // form subscriber notified
      expect(formSpy).toHaveBeenCalledTimes(2)
      expect(formSpy.mock.calls[1][0].values.foo).toBe('bar')
      expect(fieldSpy).toHaveBeenCalledTimes(2)
      expect(fieldSpy.mock.calls[1][0].value).toBe('bar')

      // unsubscribe
      unsubscribe()

      // change value again
      form.change('foo', 'baz')

      // form listener NOT called again
      expect(formSpy).toHaveBeenCalledTimes(2)

      // field still called
      expect(fieldSpy).toHaveBeenCalledTimes(3)
      expect(fieldSpy.mock.calls[2][0].value).toBe('baz')
    })

    it('should no longer send field updates after unsubscribing', () => {
      const form = createForm({ onSubmit: onSubmitMock })

      const spy = jest.fn()
      const unsubscribe = form.registerField('foo', spy, { value: true })

      // called with initial state
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].value).toBeUndefined()

      // update field value
      form.change('foo', 'bar')

      // field got new value
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].value).toBe('bar')

      // unsubscribe
      unsubscribe()

      // change value again
      form.change('foo', 'baz')

      // field listener NOT called again
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('should allow subscribing to form active', () => {
      const { spy, blur, change, focus } = prepareFormSubscriber('foo', {
        active: true
      })

      change('bar')

      // no change to active
      expect(spy).toHaveBeenCalledTimes(1)

      change('baz')

      // still no change to active
      expect(spy).toHaveBeenCalledTimes(1)

      focus()

      // active changed!
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].active).toBe('foo')

      change('cat')

      // no change to active
      expect(spy).toHaveBeenCalledTimes(2)

      blur()

      // active changed!
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].active).toBeUndefined()
    })

    it('should allow subscribing to form dirty', () => {
      const { spy, change } = prepareFormSubscriber('foo', {
        dirty: true
      })

      // one call with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].dirty).toBe(false)

      change('bar')

      // form is now dirty
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].dirty).toBe(true)

      change('baz')

      // form is still dirty, so no need to call back
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // form is now pristine
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].dirty).toBe(false)
    })

    it('should allow subscribing to form pristine', () => {
      const { spy, change } = prepareFormSubscriber('foo', {
        pristine: true
      })

      // one call with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].pristine).toBe(true)

      change('bar')

      // form is now dirty
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].pristine).toBe(false)

      change('baz')

      // form is still dirty, so no need to call back
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // form is now pristine
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].pristine).toBe(true)
    })

    it('should allow subscribing to form error', () => {
      const { spy, change } = prepareFormSubscriber(
        'foo',
        {
          error: true
        },
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors[FORM_ERROR] = 'Why no foo?'
            }
            return errors
          }
        }
      )

      // one call with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBe('Why no foo?')

      change('bar')

      // form no longer has error
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBeUndefined()

      change('baz')

      // form error hasn't changed
      expect(spy).toHaveBeenCalledTimes(2)

      change('')

      // form has error again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBe('Why no foo?')
    })

    it('should allow validation function to return null', () => {
      const { spy } = prepareFormSubscriber(
        'foo',
        {
          error: true
        },
        {
          validate: values => {}
        }
      )

      // one call with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBeUndefined()
    })

    it('should never return undefined values', () => {
      const { spy, change } = prepareFormSubscriber('foo', {
        values: true
      })

      // one call with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].values).toEqual({})

      change('bar')

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].values).toEqual({ foo: 'bar' })

      change(undefined)

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].values).toEqual({})
    })

    it('should allow subscribing to form invalid with form-wide error', () => {
      const { spy, change } = prepareFormSubscriber(
        'foo',
        {
          invalid: true
        },
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors[FORM_ERROR] = 'Why no foo?'
            }
            return errors
          }
        }
      )

      // one call with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].invalid).toBe(true)

      change('bar')

      // form is no longer invalid
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].invalid).toBe(false)

      change('baz')

      // form's invalid state hasn't changed
      expect(spy).toHaveBeenCalledTimes(2)

      change('')

      // form is invalid again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].invalid).toBe(true)
    })

    it('should allow subscribing to form invalid with field errors', () => {
      const { spy, change } = prepareFormSubscriber(
        'foo',
        {
          invalid: true
        },
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors.foo = 'Required'
            }
            return errors
          }
        }
      )

      // form is initially NOT invalid, because field was not registered yet
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[0][0].invalid).toBe(false)

      // but then a field matching the error was registered, making whole form invalid
      expect(spy.mock.calls[1][0].invalid).toBe(true)

      change('bar')

      // form is no longer invalid
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].invalid).toBe(false)

      change('baz')

      // form invalid state hasn't changed
      expect(spy).toHaveBeenCalledTimes(3)

      change('')

      // form is invalid again
      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy.mock.calls[3][0].invalid).toBe(true)
    })

    it('should allow subscribing to form submitting', async () => {
      const onSubmit = async values => await sleep(2)
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        submitting: true
      })
      form.registerField('foo', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        submitting: false
      })

      form.change('foo', 'bar')

      expect(spy).toHaveBeenCalledTimes(1)

      const promise = form.submit()

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        submitting: true
      })

      await promise

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenCalledWith({
        submitting: false
      })
    })

    it('should allow subscribing to form submitFailed', () => {
      const onSubmit = values => ({ foo: 'Bad foo' })
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        submitFailed: true
      })
      form.registerField('foo', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        submitFailed: false
      })

      form.change('foo', 'bar')

      expect(spy).toHaveBeenCalledTimes(1)

      form.submit()

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        submitFailed: true
      })
    })

    it('should allow subscribing to form submitSucceeded', () => {
      const onSubmit = () => {}
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        submitSucceeded: true
      })
      form.registerField('foo', () => {})
      form.registerField('foo2', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        submitSucceeded: false
      })

      form.change('foo', 'bar')
      form.change('foo2', 'baz')

      expect(spy).toHaveBeenCalledTimes(1)

      form.submit()

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        submitSucceeded: true
      })
    })

    it('should allow subscribing to form valid with form-wide error', () => {
      const { spy, change } = prepareFormSubscriber(
        'foo',
        {
          valid: true
        },
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors[FORM_ERROR] = 'Why no foo?'
            }
            return errors
          }
        }
      )

      // first call is not valid
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].valid).toBe(false)

      change('bar')

      // form is now valid
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].valid).toBe(true)

      change('baz')

      // form valid state hasn't changed
      expect(spy).toHaveBeenCalledTimes(2)

      change('')

      // form is no longer valid again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].valid).toBe(false)
    })

    it('should allow subscribing to form valid with field errors', () => {
      const { spy, change } = prepareFormSubscriber(
        'foo',
        {
          valid: true
        },
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors.foo = 'Required'
            }
            return errors
          }
        }
      )

      // form initially IS valid, because field was not registered yet
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[0][0].valid).toBe(true)

      // but then a field matching the error was registered, making whole form invalid
      expect(spy.mock.calls[1][0].valid).toBe(false)

      change('bar')

      // form is valid
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].valid).toBe(true)

      change('baz')

      // form still valid
      expect(spy).toHaveBeenCalledTimes(3)

      change('')

      // form has is invalid again
      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy.mock.calls[3][0].valid).toBe(false)
    })

    it('should allow subscribing to validating', async () => {
      const delay = 2
      const { spy, change } = prepareFormSubscriber(
        'foo',
        { validating: true },
        {
          validate: async values => {
            await sleep(delay)
            const errors = {}
            if (values.foo > 3) {
              errors.foo = 'Too many'
            }
            return errors
          }
        }
      )

      // should be validating initially
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].validating).toBe(true)

      await sleep(2 * delay)

      // then initial validation finishes
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].validating).toBe(false)

      change('Dog')

      // validating starts
      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy.mock.calls[1][0].validating).toBe(true)

      await sleep(2 * delay)

      // validating stops
      expect(spy).toHaveBeenCalledTimes(5)
      expect(spy.mock.calls[2][0].validating).toBe(false)
    })

    it('should allow subscribing to form values', () => {
      const { spy, change } = prepareFormSubscriber('foo', { values: true })

      expect(spy).toHaveBeenCalledTimes(1)

      change('bar')

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].values).not.toBeUndefined()
      expect(spy.mock.calls[1][0].values.foo).toBe('bar')

      // let's change it again, just for fun
      change('baz')
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].values).not.toBeUndefined()
      expect(spy.mock.calls[2][0].values.foo).toBe('baz')

      // and clear it out?
      change(undefined)
      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy.mock.calls[3][0].values).toEqual({})
    })

    it('should allow subscribing to active in form', () => {
      const { spy, focus, blur } = prepareFormSubscriber('foo', {
        active: true
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].active).toBeUndefined()

      focus()

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].active).not.toBeUndefined()
      expect(spy.mock.calls[1][0].active).toBe('foo')

      blur()

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].active).toBeUndefined()
    })
  })

  describe('Field.subscribing', () => {
    const prepareFieldSubscribers = (
      formSubscription,
      fieldSubscriptions,
      fieldValidation = {},
      config = {}
    ) => {
      const form = createForm({ onSubmit: onSubmitMock, ...config })
      const formSpy = jest.fn()
      form.subscribe(formSpy, formSubscription)
      expect(formSpy).toHaveBeenCalled()
      expect(formSpy).toHaveBeenCalledTimes(1)
      expect(formSpy.mock.calls[0][0].values).toBeUndefined()

      return {
        ...Object.keys(fieldSubscriptions).reduce((result, name) => {
          const spy = jest.fn()
          form.registerField(
            name,
            spy,
            fieldSubscriptions[name],
            fieldValidation[name]
          )
          expect(spy).toHaveBeenCalled()
          expect(spy).toHaveBeenCalledTimes(1)
          const { blur, change, focus } = spy.mock.calls[0][0]
          result[name] = { blur, change, focus, spy }
          return result
        }, {}),
        form,
        formSpy
      }
    }

    it('should allow subscribing to active', () => {
      const { foo: { blur, focus, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { active: true }
        }
      )

      // should initialize to not active
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].active).toBe(false)

      blur()

      // blur does nothing, still inactive
      expect(spy).toHaveBeenCalledTimes(1)

      focus()

      // field is now active
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].active).toBe(true)

      focus()

      // another focus changes nothing
      expect(spy).toHaveBeenCalledTimes(2)

      blur()

      // field is now inactive
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].active).toBe(false)
    })

    it('should allow subscribing to dirty', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { dirty: true }
        }
      )

      // should initialize to not be dirty
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].dirty).toBe(false)

      change('bar')

      // field is now dirty
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].dirty).toBe(true)

      change('baz')

      // field is still dirty, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // field is now pristine again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].dirty).toBe(false)
    })

    it('should allow subscribing to error with whole-record validation', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { error: true }
        },
        {},
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors.foo = 'Required'
            }
            return errors
          }
        }
      )

      // should initialize with error
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBe('Required')

      change('bar')

      // field is now valid: no error
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBeUndefined()

      change('baz')

      // still valid, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // invalid again: have error
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBe('Required')
    })

    it('should allow subscribing to error with field-level validation', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { error: true }
        },
        {
          foo: value => (value ? undefined : 'Required')
        }
      )

      // should initialize with error
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBe('Required')

      change('bar')

      // field is now valid: no error
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBeUndefined()

      change('baz')

      // still valid, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // invalid again: have error
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBe('Required')
    })

    it('should allow subscribing to initial', () => {
      const { form, foo: { spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { initial: true }
        },
        {},
        {
          initialValues: {
            foo: 'bar'
          }
        }
      )

      // should initialize with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].initial).toBe('bar')

      form.reset()

      // same initial value, duh
      expect(spy).toHaveBeenCalledTimes(1)

      form.initialize({ foo: 'baz' })

      // new initial value
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].initial).toBe('baz')
    })

    it('should allow reseting even if never initialized', () => {
      const { form, foo: { spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { initial: true }
        },
        {},
        {}
      )

      // should initialize with initial value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].initial).toBeUndefined()

      form.reset()

      // same initial value, duh
      expect(spy).toHaveBeenCalledTimes(1)

      form.initialize({ foo: 'baz' })

      // new initial value
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].initial).toBe('baz')
    })

    it('should allow subscribing to invalid with whole-record validation', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { invalid: true }
        },
        {},
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors.foo = 'Required'
            }
            return errors
          }
        }
      )

      // should initialize as invalid
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].invalid).toBe(true)

      change('bar')

      // field is now valid
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].invalid).toBe(false)

      change('baz')

      // still valid, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // invalid again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].invalid).toBe(true)
    })

    it('should allow subscribing to invalid with field-level validation', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { invalid: true }
        },
        {
          foo: value => (value ? undefined : 'Required')
        }
      )

      // should initialize as invalid
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].invalid).toBe(true)

      change('bar')

      // field is now valid
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].invalid).toBe(false)

      change('baz')

      // still valid, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // invalid again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].invalid).toBe(true)
    })

    it('should allow subscribing to pristine', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { pristine: true }
        }
      )

      // should initialize to be pristine
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].pristine).toBe(true)

      change('bar')

      // field is now dirty
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].pristine).toBe(false)

      change('baz')

      // field is still dirty, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // field is now pristine again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].pristine).toBe(true)
    })

    it('should allow subscribing to touched', () => {
      const { foo: { blur, focus, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { touched: true }
        }
      )

      // should initialize to not touched
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].touched).toBe(false)

      focus()

      // field is visited, but not yet touched
      expect(spy).toHaveBeenCalledTimes(1)

      blur()

      // field is now touched
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].touched).toBe(true)

      // no amount of focusing and bluring will change the touched flag
      focus()
      blur()
      focus()
      blur()
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('should allow subscribing to valid with whole-record validation', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { valid: true }
        },
        {},
        {
          validate: values => {
            const errors = {}
            if (!values.foo) {
              errors.foo = 'Required'
            }
            return errors
          }
        }
      )

      // should initialize as invalid
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].valid).toBe(false)

      change('bar')

      // field is now valid
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].valid).toBe(true)

      change('baz')

      // still valid, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // invalid again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].valid).toBe(false)
    })

    it('should allow subscribing to valid with field-level validation', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { valid: true }
        },
        {
          foo: value => (value ? undefined : 'Required')
        }
      )

      // should initialize as invalid
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].valid).toBe(false)

      change('bar')

      // field is now valid
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].valid).toBe(true)

      change('baz')

      // still valid, no change
      expect(spy).toHaveBeenCalledTimes(2)

      change(undefined)

      // invalid again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].valid).toBe(false)
    })

    it('should allow subscribing to value', () => {
      const { foo: { change, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { value: true }
        }
      )

      // should initialize with undefined value
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].value).toBeUndefined()

      change('bar')

      // field has new value
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].value).toBe('bar')

      change('bar')

      // value didn't change
      expect(spy).toHaveBeenCalledTimes(2)

      change('baz')

      // value changed again
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].value).toBe('baz')
    })

    it('should allow subscribing to visited', () => {
      const { foo: { blur, focus, spy } } = prepareFieldSubscribers(
        {},
        {
          foo: { visited: true }
        }
      )

      // should initialize to not visited
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].visited).toBe(false)

      focus()

      // field is visited
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].visited).toBe(true)

      // no amount of focusing and bluring will change the touched flag
      blur()
      focus()
      blur()
      focus()
      blur()
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Field.validation', () => {
    it('should validate on change when validateOnBlur is false', () => {
      const validate = jest.fn(values => {
        const errors = {}
        if (!values.foo) {
          errors.foo = 'Required'
        }
        return errors
      })
      const form = createForm({
        onSubmit: onSubmitMock,
        validate
      })

      expect(validate).toHaveBeenCalledTimes(1)

      const spy = jest.fn()
      form.registerField('foo', spy, { error: true })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBe('Required')
      expect(validate).toHaveBeenCalledTimes(2)

      form.focus('foo')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(validate).toHaveBeenCalledTimes(2) // not called on focus
      form.change('foo', 't')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBeUndefined()
      expect(validate).toHaveBeenCalledTimes(3)
      form.change('foo', 'ty')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(4)
      form.change('foo', 'typ')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(5)
      form.change('foo', 'typi')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(6)
      form.change('foo', 'typin')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(7)
      form.change('foo', 'typing')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(8)
      form.blur('foo')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(8) // not called on blur

      // now user goes to empty the field
      form.focus('foo')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(8)
      form.change('foo', '')
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBe('Required')
      expect(validate).toHaveBeenCalledTimes(9)
      form.blur('foo')
      expect(validate).toHaveBeenCalledTimes(9)
    })

    it('should validate on blur when validateOnBlur is true', () => {
      const validate = jest.fn(values => {
        const errors = {}
        if (!values.foo) {
          errors.foo = 'Required'
        }
        return errors
      })
      const form = createForm({
        onSubmit: onSubmitMock,
        validate,
        validateOnBlur: true
      })

      expect(validate).toHaveBeenCalledTimes(1)

      const spy = jest.fn()
      form.registerField('foo', spy, { error: true })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBe('Required')
      expect(validate).toHaveBeenCalledTimes(2)

      form.focus('foo')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(validate).toHaveBeenCalledTimes(2) // not called on focus
      form.change('foo', 't')
      expect(spy).toHaveBeenCalledTimes(1) // error not updated
      expect(validate).toHaveBeenCalledTimes(2)
      form.change('foo', 'ty')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(validate).toHaveBeenCalledTimes(2)
      form.change('foo', 'typ')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(validate).toHaveBeenCalledTimes(2)
      form.change('foo', 'typi')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(validate).toHaveBeenCalledTimes(2)
      form.change('foo', 'typin')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(validate).toHaveBeenCalledTimes(2)
      form.change('foo', 'typing')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(validate).toHaveBeenCalledTimes(2)
      form.blur('foo')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBeUndefined()
      expect(validate).toHaveBeenCalledTimes(3) // called on blur

      // now user goes to empty the field
      form.focus('foo')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(3)
      form.change('foo', '')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(validate).toHaveBeenCalledTimes(3)
      form.blur('foo')
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBe('Required')
      expect(validate).toHaveBeenCalledTimes(4)
    })

    it("should return first subscribed field's error first", () => {
      const form = createForm({ onSubmit: onSubmitMock })
      const spy1 = jest.fn()
      const unsubscribe1 = form.registerField(
        'foo',
        spy1,
        { error: true },
        value => (value ? undefined : 'Required')
      )

      const spy2 = jest.fn()
      form.registerField(
        'foo',
        spy2,
        { error: true },
        value => (value !== 'correct' ? 'Incorrect value' : undefined)
      )

      // both called with first error
      expect(spy1).toHaveBeenCalledTimes(1)
      expect(spy1.mock.calls[0][0].error).toBe('Required')
      expect(spy2).toHaveBeenCalledTimes(1)
      expect(spy2.mock.calls[0][0].error).toBe('Required')

      const { change } = spy1.mock.calls[0][0]
      change('hello')

      // both called with second error
      expect(spy1).toHaveBeenCalledTimes(2)
      expect(spy1.mock.calls[1][0].error).toBe('Incorrect value')
      expect(spy2).toHaveBeenCalledTimes(2)
      expect(spy2.mock.calls[1][0].error).toBe('Incorrect value')

      change('correct')

      // both called with no error
      expect(spy1).toHaveBeenCalledTimes(3)
      expect(spy1.mock.calls[2][0].error).toBeUndefined()
      expect(spy2).toHaveBeenCalledTimes(3)
      expect(spy2.mock.calls[2][0].error).toBeUndefined()

      change(undefined)

      // back to original state
      expect(spy1).toHaveBeenCalledTimes(4)
      expect(spy1.mock.calls[3][0].error).toBe('Required')
      expect(spy2).toHaveBeenCalledTimes(4)
      expect(spy2.mock.calls[3][0].error).toBe('Required')

      // unregister first field
      unsubscribe1()

      // only second one called with its error
      expect(spy1).toHaveBeenCalledTimes(4)
      expect(spy2).toHaveBeenCalledTimes(5)
      expect(spy2.mock.calls[4][0].error).toBe('Incorrect value')
    })

    it("should update a field's error if it was changed by another field's value change (record-level)", () => {
      const form = createForm({
        onSubmit: onSubmitMock,
        validate: values => {
          const errors = {}
          if (values.password !== values.confirm) {
            errors.confirm = 'Does not match'
          }
          return errors
        }
      })
      const password = jest.fn()
      form.registerField('password', password)
      const confirm = jest.fn()
      form.registerField('confirm', confirm, { error: true })

      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(1)
      const changePassword = password.mock.calls[0][0].change
      const changeConfirm = confirm.mock.calls[0][0].change

      // confirm does not have error
      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(1)
      expect(confirm.mock.calls[0][0].error).toBeUndefined()

      // user enters password into password field
      changePassword('secret')

      // password not updated because not subscribing to anything
      expect(password).toHaveBeenCalledTimes(1)

      // confirm now has error
      expect(confirm).toHaveBeenCalledTimes(2)
      expect(confirm.mock.calls[1][0].error).toBe('Does not match')

      changeConfirm('secret')

      // confirm no longer has error
      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(3)
      expect(confirm.mock.calls[2][0].error).toBeUndefined()

      changePassword('not-secret')

      // confirm has error again
      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(4)
      expect(confirm.mock.calls[3][0].error).toBe('Does not match')
    })

    it("should update a field's error if it was changed by another field's value change (field-level)", () => {
      const form = createForm({ onSubmit: onSubmitMock })
      const password = jest.fn()
      form.registerField('password', password)
      const confirm = jest.fn()
      form.registerField(
        'confirm',
        confirm,
        { error: true },
        (value, allValues) =>
          value === allValues.password ? undefined : 'Does not match'
      )

      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(1)
      const changePassword = password.mock.calls[0][0].change
      const changeConfirm = confirm.mock.calls[0][0].change

      // confirm does not have error
      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(1)
      expect(confirm.mock.calls[0][0].error).toBeUndefined()

      // user enters password into password field
      changePassword('secret')

      // password not updated because not subscribing to anything
      expect(password).toHaveBeenCalledTimes(1)

      // confirm now has error
      expect(confirm).toHaveBeenCalledTimes(2)
      expect(confirm.mock.calls[1][0].error).toBe('Does not match')

      changeConfirm('secret')

      // confirm no longer has error
      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(3)
      expect(confirm.mock.calls[2][0].error).toBeUndefined()

      changePassword('not-secret')

      // confirm has error again
      expect(password).toHaveBeenCalledTimes(1)
      expect(confirm).toHaveBeenCalledTimes(4)
      expect(confirm.mock.calls[3][0].error).toBe('Does not match')
    })

    it('should use field level error over record level error', () => {
      const form = createForm({
        onSubmit: onSubmitMock,
        validate: values => {
          const errors = {}
          if (!values.foo || values.foo.length < 3) {
            errors.foo = 'Too short'
          }
          return errors
        }
      })
      const spy = jest.fn()
      form.registerField(
        'foo',
        spy,
        { error: true },
        value => (value ? undefined : 'Required')
      )

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBe('Required')

      const { change } = spy.mock.calls[0][0]

      change('hi')

      // error now changes to record level
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBe('Too short')

      change('hi there')

      // no errors
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBeUndefined()

      change('')

      // error goes back to field level
      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy.mock.calls[3][0].error).toBe('Required')
    })

    it('should allow record-level async validation via promises', async () => {
      const delay = 2
      const form = createForm({
        onSubmit: onSubmitMock,
        validate: async values => {
          const errors = {}
          if (values.username === 'erikras') {
            errors.username = 'Username taken'
          }
          sleep(delay)
          return errors
        }
      })
      const spy = jest.fn()
      form.registerField('username', spy, { error: true })
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBeUndefined()

      const { change } = spy.mock.calls[0][0]

      await sleep(delay * 2)

      // error hasn't changed
      expect(spy).toHaveBeenCalledTimes(1)

      change('bob')

      await sleep(delay * 2)

      // error hasn't changed
      expect(spy).toHaveBeenCalledTimes(1)

      change('erikras')

      // still hasn't updated because validation has not yet returned
      expect(spy).toHaveBeenCalledTimes(1)

      // wait for validation to return
      await sleep(delay * 2)

      // we have an error now!
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBe('Username taken')

      change('another')

      // spy called because sync validation passed
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBeUndefined()

      // wait for validation to return
      await sleep(delay * 2)

      // spy not called because sync validation already cleared error
      expect(spy).toHaveBeenCalledTimes(3)
    })

    it('should allow field-level async validation via promise', async () => {
      const delay = 10
      const form = createForm({ onSubmit: onSubmitMock })
      const spy = jest.fn()
      form.registerField(
        'username',
        spy,
        { error: true },
        async (value, allErrors) => {
          const error = value === 'erikras' ? 'Username taken' : undefined
          await sleep(delay)
          return error
        }
      )
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0].error).toBeUndefined()

      const { change } = spy.mock.calls[0][0]

      await sleep(delay * 2)

      // error hasn't changed
      expect(spy).toHaveBeenCalledTimes(1)

      change('bob')

      await sleep(delay * 2)

      // error hasn't changed
      expect(spy).toHaveBeenCalledTimes(1)

      change('erikras')

      // still hasn't updated because validation has not yet returned
      expect(spy).toHaveBeenCalledTimes(1)

      // wait for validation to return
      await sleep(delay * 2)

      // we have an error now!
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[1][0].error).toBe('Username taken')

      change('another')

      // sync validation ran and cleared the error
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy.mock.calls[2][0].error).toBeUndefined()

      // wait for validation to return
      await sleep(delay * 2)

      // not called after async validation finished because it was already und
      expect(spy).toHaveBeenCalledTimes(3)
    })
  })

  describe('FinalForm.submission', () => {
    it('should not submit if form has validation errors', () => {
      const onSubmit = jest.fn()
      const form = createForm({
        onSubmit,
        validate: values => {
          const errors = {}
          if (!values.username) {
            errors.username = 'Required'
          }
          return errors
        }
      })
      const username = jest.fn()
      const password = jest.fn()
      form.registerField('username', username, { error: true })
      form.registerField('password', password, { touched: true })
      expect(username).toHaveBeenCalledTimes(1)
      expect(username.mock.calls[0][0].error).toBe('Required')
      expect(password).toHaveBeenCalledTimes(1)
      expect(password.mock.calls[0][0].touched).toBe(false)

      const { change } = username.mock.calls[0][0]

      expect(onSubmit).not.toHaveBeenCalled()
      form.submit()
      expect(onSubmit).not.toHaveBeenCalled()
      expect(password).toHaveBeenCalledTimes(2)
      expect(password.mock.calls[1][0].touched).toBe(true)

      change('erikras')

      // form is valid now, so submit should work
      expect(onSubmit).not.toHaveBeenCalled()
      form.submit()
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toBeDefined()
      expect(onSubmit.mock.calls[0][0].username).toBe('erikras')
    })

    it('should call onSubmit when form.submit() is called', () => {
      const onSubmit = jest.fn()
      const form = createForm({ onSubmit })
      form.registerField('foo', () => {})
      form.registerField('foo2', () => {})

      form.change('foo', 'bar')
      form.change('foo2', 'baz')

      expect(onSubmit).not.toHaveBeenCalled()
      form.submit()
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })
    })

    it('should support synchronous submission with errors', () => {
      const onSubmit = jest.fn(values => {
        const errors = {}
        if (values.foo === 'bar') {
          errors.foo = 'Sorry, "bar" is an illegal value'
        }
        return errors
      })
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        valid: true,
        submitSucceeded: true,
        submitFailed: true
      })
      form.registerField('foo', () => {})
      form.registerField('foo2', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: false,
        submitFailed: false
      })

      form.change('foo', 'bar')
      form.change('foo2', 'baz')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(onSubmit).not.toHaveBeenCalled()

      form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        valid: false,
        submitSucceeded: false,
        submitFailed: true
      })

      form.change('foo', 'notbar')
      form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(2)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: true,
        submitFailed: false
      })
    })

    it('should support synchronous submission with errors via callback', () => {
      const onSubmit = jest.fn((values, callback) => {
        const errors = {}
        if (values.foo === 'bar') {
          errors.foo = 'Sorry, "bar" is an illegal value'
        }
        callback(errors)
      })
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        valid: true,
        submitSucceeded: true,
        submitFailed: true
      })
      form.registerField('foo', () => {})
      form.registerField('foo2', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: false,
        submitFailed: false
      })

      form.change('foo', 'bar')
      form.change('foo2', 'baz')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(onSubmit).not.toHaveBeenCalled()

      form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        valid: false,
        submitSucceeded: false,
        submitFailed: true
      })

      form.change('foo', 'notbar')
      form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(2)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: true,
        submitFailed: false
      })
    })

    it('should support synchronous submission with errors via callback', () => {
      const onSubmit = jest.fn((values, callback) => {
        const errors = {}
        if (values.foo === 'bar') {
          errors.foo = 'Sorry, "bar" is an illegal value'
        }
        callback(errors)
      })
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        valid: true,
        submitSucceeded: true,
        submitFailed: true
      })
      form.registerField('foo', () => {})
      form.registerField('foo2', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: false,
        submitFailed: false
      })

      form.change('foo', 'bar')
      form.change('foo2', 'baz')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(onSubmit).not.toHaveBeenCalled()

      form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        valid: false,
        submitSucceeded: false,
        submitFailed: true
      })

      form.change('foo', 'notbar')
      form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(2)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: true,
        submitFailed: false
      })
    })

    it('should support asynchronous submission with errors via callback', async () => {
      const onSubmit = jest.fn((values, callback) => {
        setTimeout(() => {
          const errors = {}
          if (values.foo === 'bar') {
            errors.foo = 'Sorry, "bar" is an illegal value'
          }
          callback(errors)
        }, 2) // no need to wait too long!
      })
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        valid: true,
        submitSucceeded: true,
        submitFailed: true
      })
      form.registerField('foo', () => {})
      form.registerField('foo2', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: false,
        submitFailed: false
      })

      form.change('foo', 'bar')
      form.change('foo2', 'baz')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(onSubmit).not.toHaveBeenCalled()

      await form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        valid: false,
        submitSucceeded: false,
        submitFailed: true
      })

      form.change('foo', 'notbar')
      const promise = form.submit()

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: false,
        submitFailed: false
      })

      await promise

      expect(onSubmit).toHaveBeenCalledTimes(2)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: true,
        submitFailed: false
      })
    })

    it('should support asynchronous submission with errors via promise', async () => {
      const onSubmit = jest.fn(async values => {
        await sleep(2) // no need to wait too long!
        const errors = {}
        if (values.foo === 'bar') {
          errors.foo = 'Sorry, "bar" is an illegal value'
        }
        return errors
      })
      const form = createForm({ onSubmit })
      const spy = jest.fn()
      expect(spy).not.toHaveBeenCalled()
      form.subscribe(spy, {
        valid: true,
        submitSucceeded: true,
        submitFailed: true
      })
      form.registerField('foo', () => {})
      form.registerField('foo2', () => {})

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: false,
        submitFailed: false
      })

      form.change('foo', 'bar')
      form.change('foo2', 'baz')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(onSubmit).not.toHaveBeenCalled()

      await form.submit()

      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({
        valid: false,
        submitSucceeded: false,
        submitFailed: true
      })

      form.change('foo', 'notbar')
      const promise = form.submit()

      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: false,
        submitFailed: false
      })

      expect(onSubmit).toHaveBeenCalledTimes(2)
      expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

      await promise

      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy).toHaveBeenCalledWith({
        valid: true,
        submitSucceeded: true,
        submitFailed: false
      })
    })
  })

  describe('FinalForm.batching', () => {
    it('should not call form or field listeners during batch update', () => {
      const form = createForm({ onSubmit: onSubmitMock })
      const formListener = jest.fn()
      const firstField = jest.fn()
      const secondField = jest.fn()
      form.subscribe(formListener, { values: true })
      form.registerField('firstField', firstField, { value: true })
      form.registerField('secondField', secondField, { value: true })

      expect(formListener).toHaveBeenCalledTimes(1)
      expect(firstField).toHaveBeenCalledTimes(1)
      expect(secondField).toHaveBeenCalledTimes(1)

      // not in batch DOES notify
      form.change('firstField', 'foo')
      expect(formListener).toHaveBeenCalledTimes(2)
      expect(firstField).toHaveBeenCalledTimes(2)
      expect(secondField).toHaveBeenCalledTimes(1)

      form.batch(() => {
        // Do a bunch of stuff
        form.focus('firstField')
        form.change('firstField', 'what')
        form.blur('firstField')

        form.focus('secondField')
        form.change('secondField', 'bar')
        form.blur('secondField')

        // No listeners called
        expect(formListener).toHaveBeenCalledTimes(2)
        expect(firstField).toHaveBeenCalledTimes(2)
        expect(secondField).toHaveBeenCalledTimes(1)
      })

      // NOW listeners are called
      expect(formListener).toHaveBeenCalledTimes(3)
      expect(firstField).toHaveBeenCalledTimes(3)
      expect(secondField).toHaveBeenCalledTimes(2)

      // not in batch DOES notify
      form.change('secondField', 'cat')

      expect(formListener).toHaveBeenCalledTimes(4)
      expect(firstField).toHaveBeenCalledTimes(3)
      expect(secondField).toHaveBeenCalledTimes(3)
    })

    it('should only call listeners that need to be called after batch', () => {
      const form = createForm({ onSubmit: onSubmitMock })
      const formListener = jest.fn()
      const firstField = jest.fn()
      const secondField = jest.fn()
      form.subscribe(formListener, { values: true })
      form.registerField('firstField', firstField, { value: true })
      form.registerField('secondField', secondField, { value: true })

      expect(formListener).toHaveBeenCalledTimes(1)
      expect(firstField).toHaveBeenCalledTimes(1)
      expect(secondField).toHaveBeenCalledTimes(1)

      form.batch(() => {
        // only change one field
        form.focus('firstField')
        form.change('firstField', 'what')
        form.blur('firstField')

        // No listeners called
        expect(formListener).toHaveBeenCalledTimes(1)
        expect(firstField).toHaveBeenCalledTimes(1)
        expect(secondField).toHaveBeenCalledTimes(1)
      })

      // only listeners that need to be are called
      expect(formListener).toHaveBeenCalledTimes(2)
      expect(firstField).toHaveBeenCalledTimes(2)
      expect(secondField).toHaveBeenCalledTimes(1) // not called
    })
  })
})

import createForm from './FinalForm'
import { FORM_ERROR } from './constants'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const onSubmitMock = (values, callback) => {}

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

  it('should allow form.change() to change any value, not just registered fields', () => {
    const form = createForm({ onSubmit: onSubmitMock })

    const formSpy = jest.fn()
    form.subscribe(formSpy, { values: true })

    // called with initial state
    expect(formSpy).toHaveBeenCalledTimes(1)
    expect(formSpy.mock.calls[0][0].values.foo).toBeUndefined()

    // update field value
    form.change('foo', 'bar')

    // form subscriber notified
    expect(formSpy).toHaveBeenCalledTimes(2)
    expect(formSpy.mock.calls[1][0].values).toEqual({ foo: 'bar' })

    // update field again, just for good measure
    form.change('foo', 'baz')

    expect(formSpy).toHaveBeenCalledTimes(3)
    expect(formSpy.mock.calls[2][0].values).toEqual({ foo: 'baz' })
  })

  it('should not overwrite lastFormState every time a form subscriber is added', () => {
    // this is mostly for code coverage
    const form = createForm({ onSubmit: onSubmitMock })
    const spy1 = jest.fn()
    const spy2 = jest.fn()
    form.subscribe(spy1, { values: true })
    form.subscribe(spy2, { values: true })
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

  it('should allow subscribing to touched', () => {
    const { spy, blur, focus } = prepareFormSubscriber('foo', {
      touched: true
    })

    // called twice, once with initial {} and again when field is registered
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].touched).toEqual({})
    expect(spy.mock.calls[1][0].touched).toEqual({ foo: false })

    focus('bar')

    // not touched yet
    expect(spy).toHaveBeenCalledTimes(2)

    blur('bar')

    // foo is now touched
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].touched).toEqual({ foo: true })
  })

  it('should allow subscribing to visited', () => {
    const { spy, focus } = prepareFormSubscriber('foo', {
      visited: true
    })

    // called twice, once with initial {} and again when field is registered
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].visited).toEqual({})
    expect(spy.mock.calls[1][0].visited).toEqual({ foo: false })

    focus('bar')

    // foo is now visited
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].visited).toEqual({ foo: true })
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

  it('should allow subscribing to all errors', () => {
    const { spy, change } = prepareFormSubscriber(
      'foo',
      {
        errors: true
      },
      {
        validate: values => {
          const errors = {}
          if (!values.foo) {
            errors.foo = 'Why no foo?'
          }
          return errors
        }
      }
    )

    // one call with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].errors).toEqual({ foo: 'Why no foo?' })

    change('bar')

    // form no longer has error
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].errors).toEqual({})

    change('baz')

    // form error hasn't changed
    expect(spy).toHaveBeenCalledTimes(2)

    change('')

    // form has error again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].errors).toEqual({ foo: 'Why no foo?' })
  })

  it('should allow subscribing to hasValidationErrors', () => {
    const { spy, change } = prepareFormSubscriber(
      'foo',
      {
        hasValidationErrors: true
      },
      {
        validate: values => {
          const errors = {}
          if (!values.foo) {
            errors.foo = 'Why no foo?'
          }
          return errors
        }
      }
    )

    // one call with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].hasValidationErrors).toBe(true)

    change('bar')

    // form no longer has error
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].hasValidationErrors).toBe(false)

    change('baz')

    // form error hasn't changed
    expect(spy).toHaveBeenCalledTimes(2)

    change('')

    // form has error again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].hasValidationErrors).toBe(true)
  })

  it('should allow subscribing to all submit errors', () => {
    const onSubmit = jest.fn(values => {
      const errors = {}
      if (!values.foo) {
        errors.foo = 'Why no foo?'
      }
      return errors
    })
    const form = createForm({ onSubmit })
    const spy = jest.fn()
    form.subscribe(spy, { submitErrors: true })
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].submitErrors).toBeUndefined()

    expect(onSubmit).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit).toHaveBeenCalled()

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].submitErrors).toEqual({ foo: 'Why no foo?' })
  })

  it('should allow subscribing to hasSubmitErrors', () => {
    const onSubmit = jest.fn(values => {
      const errors = {}
      if (!values.foo) {
        errors.foo = 'Why no foo?'
      }
      return errors
    })
    const form = createForm({ onSubmit })
    const spy = jest.fn()
    form.subscribe(spy, { hasSubmitErrors: true })
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].hasSubmitErrors).toBe(false)

    expect(onSubmit).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit).toHaveBeenCalled()

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].hasSubmitErrors).toBe(true)
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

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].invalid).toBe(true)

    change('bar')

    // form is no longer invalid
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].invalid).toBe(false)

    change('baz')

    // form invalid state hasn't changed
    expect(spy).toHaveBeenCalledTimes(2)

    change('')

    // form is invalid again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].invalid).toBe(true)
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

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].valid).toBe(false)

    change('bar')

    // form is valid
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].valid).toBe(true)

    change('baz')

    // form still valid
    expect(spy).toHaveBeenCalledTimes(2)

    change('')

    // form has is invalid again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].valid).toBe(false)
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
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].validating).toBe(true)

    await sleep(2 * delay)

    // then initial validation finishes
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].validating).toBe(false)

    change('Dog')

    // validating starts
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].validating).toBe(true)

    await sleep(2 * delay)

    // validating stops
    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy.mock.calls[3][0].validating).toBe(false)
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

  it('should not allow focusing of unsubscribed field', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const spy = jest.fn()
    form.subscribe(spy, { active: true })
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)

    form.registerField('foo', () => {}, {})
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].active).toBeUndefined()

    form.focus('notFoo')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should not allow blurring of unsubscribed field', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const spy = jest.fn()
    form.subscribe(spy, { active: true })
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)

    form.registerField('foo', () => {}, {})
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].active).toBeUndefined()

    form.blur('notFoo')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should be invalid even if field with error is not registered', () => {
    const { spy } = prepareFormSubscriber(
      'foo',
      {
        valid: true
      },
      {
        validate: values => {
          const errors = {}
          if (!values.anotherField) {
            errors.anotherField = 'Some error'
          }
          return errors
        }
      }
    )
    // one call with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].valid).toBe(false)
  })

  it('should schedule form notifications for after current notifications are complete', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const subscriber1 = jest.fn(({ values }) => {
      if (values.foo && values.foo % 2 === 1) {
        // increment foo to make it even
        form.change('foo', values.foo + 1)
      }
    })
    const subscriber2 = jest.fn()
    form.subscribe(subscriber1, { values: true })
    form.subscribe(subscriber2, { values: true })
    expect(subscriber1).toHaveBeenCalled()
    expect(subscriber1).toHaveBeenCalledTimes(1)
    expect(subscriber1.mock.calls[0][0].values).toEqual({})
    expect(subscriber2).toHaveBeenCalled()
    expect(subscriber2).toHaveBeenCalledTimes(1)
    expect(subscriber2.mock.calls[0][0].values).toEqual({})
    form.registerField('foo', () => {}, {})

    form.change('foo', 1)

    expect(subscriber1).toHaveBeenCalledTimes(3)
    expect(subscriber1.mock.calls[1][0].values).toEqual({ foo: 1 })
    expect(subscriber1.mock.calls[2][0].values).toEqual({ foo: 2 })

    expect(subscriber2).toHaveBeenCalledTimes(3)
    expect(subscriber2.mock.calls[1][0].values).toEqual({ foo: 1 })
    expect(subscriber2.mock.calls[2][0].values).toEqual({ foo: 2 })
  })
})

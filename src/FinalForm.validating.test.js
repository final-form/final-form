import createForm from './FinalForm'
import { ARRAY_ERROR } from './constants'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const onSubmitMock = (values, callback) => {}

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
      { getValidator: () => value => (value ? undefined : 'Required') }
    )

    const spy2 = jest.fn()
    form.registerField(
      'foo',
      spy2,
      { error: true },
      {
        getValidator: () => value =>
          value !== 'correct' ? 'Incorrect value' : undefined
      }
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
      {
        getValidator: () => (value, allValues) =>
          value === allValues.password ? undefined : 'Does not match'
      }
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

  it('should not mind if getValidator returns nothing', () => {
    // this is mostly for code coverage
    const form = createForm({ onSubmit: onSubmitMock })
    const spy = jest.fn()
    form.registerField(
      'foo',
      spy,
      { error: true },
      { getValidator: () => undefined }
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].error).toBeUndefined()
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
      { getValidator: () => value => (value ? undefined : 'Required') }
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
      {
        getValidator: () => async (value, allErrors) => {
          const error = value === 'erikras' ? 'Username taken' : undefined
          await sleep(delay)
          return error
        }
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

  it('should not fall over if a field has been unregistered during async validation', async () => {
    const delay = 10
    const form = createForm({ onSubmit: onSubmitMock })
    const spy = jest.fn()
    const unregister = form.registerField(
      'username',
      spy,
      { error: true },
      {
        getValidator: () => async (value, allErrors) => {
          const error = value === 'erikras' ? 'Username taken' : undefined
          await sleep(delay)
          return error
        }
      }
    )
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].error).toBeUndefined()

    const { change } = spy.mock.calls[0][0]

    await sleep(delay * 2)

    // error hasn't changed
    expect(spy).toHaveBeenCalledTimes(1)

    change('erikras')

    // unregister field
    unregister()

    await sleep(delay * 2)

    // spy not called again
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should remove field-level validation errors when a field is unregistered', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const spy = jest.fn()
    form.subscribe(spy, { errors: 1 })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].errors).toEqual({})

    const unregister = form.registerField(
      'username',
      () => {},
      { errors: true },
      {
        getValidator: () => value => (value ? undefined : 'Required')
      }
    )
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].errors).toEqual({ username: 'Required' })

    unregister()

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].errors).toEqual({})
  })

  it('should not remove record-level validation errors when a field is unregistered', () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      validate: values => ({ username: 'Required by record-level' })
    })
    const spy = jest.fn()
    form.subscribe(spy, { errors: 1 })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].errors).toEqual({
      username: 'Required by record-level'
    })

    const unregister = form.registerField(
      'username',
      () => {},
      { errors: true },
      {
        getValidator: () => value => (value ? undefined : 'Required')
      }
    )
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].errors).toEqual({ username: 'Required' })

    unregister()

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].errors).toEqual({
      username: 'Required by record-level'
    })
  })

  it('should allow field-level for array fields', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const array = jest.fn()
    const validate = jest.fn(
      value =>
        value &&
        value.map(customer => {
          const errors = {}
          if (!customer.firstName) {
            errors.firstName = 'Required'
          }
          return errors
        })
    )
    const spy = jest.fn()
    form.subscribe(spy, { errors: true })
    form.registerField(
      'customers',
      array,
      { error: true },
      {
        getValidator: () => validate,
        validateFields: []
      }
    )
    expect(validate).toHaveBeenCalledTimes(1)
    expect(validate.mock.calls[0][0]).toBeUndefined()
    expect(array).toHaveBeenCalledTimes(1)
    expect(array.mock.calls[0][0].error).toBeUndefined()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].errors).toEqual({})

    // add an empty customer
    form.change('customers', [{}])

    expect(validate).toHaveBeenCalledTimes(2)
    expect(validate.mock.calls[1][0]).toEqual([{}])
    expect(array).toHaveBeenCalledTimes(2)
    expect(array.mock.calls[1][0].error).toEqual([{ firstName: 'Required' }])
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].errors).toEqual({
      customers: [{ firstName: 'Required' }]
    })

    // adding the customer registers a new field
    const firstName0 = jest.fn()
    form.registerField('customers[0].firstName', firstName0, { error: true })

    expect(validate).toHaveBeenCalledTimes(3)
    expect(validate.mock.calls[2][0]).toEqual([{}])
    expect(array).toHaveBeenCalledTimes(3)
    expect(array.mock.calls[2][0].error).toEqual([{ firstName: 'Required' }])
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].errors).toEqual({
      customers: [{ firstName: 'Required' }]
    })
    expect(firstName0).toHaveBeenCalled()
    expect(firstName0).toHaveBeenCalledTimes(1)
    expect(firstName0.mock.calls[0][0].error).toBe('Required')

    // add another empty customer
    form.change('customers', [{}, {}])

    expect(validate).toHaveBeenCalledTimes(4)
    expect(validate.mock.calls[3][0]).toEqual([{}, {}])
    expect(array).toHaveBeenCalledTimes(4)
    expect(array.mock.calls[3][0].error).toEqual([
      { firstName: 'Required' },
      { firstName: 'Required' }
    ])
    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy.mock.calls[3][0].errors).toEqual({
      customers: [{ firstName: 'Required' }, { firstName: 'Required' }]
    })
    expect(firstName0).toHaveBeenCalledTimes(1) // no need to call this again

    // adding the customer registers a new field
    const firstName1 = jest.fn()
    form.registerField('customers[1].firstName', firstName1, { error: true })

    expect(validate).toHaveBeenCalledTimes(5)
    expect(validate.mock.calls[4][0]).toEqual([{}, {}])
    expect(array).toHaveBeenCalledTimes(5)
    expect(array.mock.calls[4][0].error).toEqual([
      { firstName: 'Required' },
      { firstName: 'Required' }
    ])
    expect(spy).toHaveBeenCalledTimes(5)
    expect(spy.mock.calls[4][0].errors).toEqual({
      customers: [{ firstName: 'Required' }, { firstName: 'Required' }]
    })
    expect(firstName1).toHaveBeenCalled()
    expect(firstName1).toHaveBeenCalledTimes(1)
    expect(firstName1.mock.calls[0][0].error).toBe('Required')
  })

  it('should only validate changed field when validateFields is empty', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const foo = jest.fn()
    const bar = jest.fn()
    const baz = jest.fn()
    const required = value => (value ? undefined : false)
    const validateFoo = jest.fn(required)
    const validateBar = jest.fn(required)
    const validateBaz = jest.fn(required)
    const spy = jest.fn()
    form.subscribe(spy, { errors: true })
    form.registerField(
      'foo',
      foo,
      { error: true },
      { getValidator: () => validateFoo, validateFields: [] }
    )
    form.registerField(
      'bar',
      bar,
      { error: true },
      { getValidator: () => validateBar }
    )
    form.registerField(
      'baz',
      baz,
      { error: true },
      { getValidator: () => validateBaz }
    )

    expect(validateFoo).toHaveBeenCalledTimes(3)
    expect(validateFoo.mock.calls[0][0]).toBeUndefined()
    expect(validateFoo.mock.calls[1][0]).toBeUndefined()
    expect(validateFoo.mock.calls[2][0]).toBeUndefined()

    expect(validateBar).toHaveBeenCalledTimes(2)
    expect(validateBar.mock.calls[0][0]).toBeUndefined()
    expect(validateBar.mock.calls[1][0]).toBeUndefined()

    expect(validateBaz).toHaveBeenCalledTimes(1)
    expect(validateBaz.mock.calls[0][0]).toBeUndefined()

    // changing bar calls validate on every field
    form.change('bar', 'hello')

    expect(validateFoo).toHaveBeenCalledTimes(4)
    expect(validateFoo.mock.calls[3][0]).toBeUndefined()
    expect(validateBar).toHaveBeenCalledTimes(3)
    expect(validateBar.mock.calls[2][0]).toBe('hello')
    expect(validateBaz).toHaveBeenCalledTimes(2)
    expect(validateBaz.mock.calls[1][0]).toBeUndefined()

    // changing foo ONLY calls validate on foo
    form.change('foo', 'world')

    expect(validateFoo).toHaveBeenCalledTimes(5)
    expect(validateFoo.mock.calls[4][0]).toBe('world')
    expect(validateBar).toHaveBeenCalledTimes(3)
    expect(validateBaz).toHaveBeenCalledTimes(2)
  })

  it('should only validate specified validateFields', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const foo = jest.fn()
    const bar = jest.fn()
    const baz = jest.fn()
    const required = value => (value ? undefined : false)
    const validateFoo = jest.fn(required)
    const validateBar = jest.fn(required)
    const validateBaz = jest.fn(required)
    const spy = jest.fn()
    form.subscribe(spy, { errors: true })
    form.registerField(
      'foo',
      foo,
      { error: true },
      { getValidator: () => validateFoo, validateFields: ['baz'] }
    )
    form.registerField(
      'bar',
      bar,
      { error: true },
      { getValidator: () => validateBar }
    )
    form.registerField(
      'baz',
      baz,
      { error: true },
      { getValidator: () => validateBaz }
    )

    expect(validateFoo).toHaveBeenCalledTimes(3)
    expect(validateFoo.mock.calls[0][0]).toBeUndefined()
    expect(validateFoo.mock.calls[1][0]).toBeUndefined()
    expect(validateFoo.mock.calls[2][0]).toBeUndefined()

    expect(validateBar).toHaveBeenCalledTimes(2)
    expect(validateBar.mock.calls[0][0]).toBeUndefined()
    expect(validateBar.mock.calls[1][0]).toBeUndefined()

    expect(validateBaz).toHaveBeenCalledTimes(1)
    expect(validateBaz.mock.calls[0][0]).toBeUndefined()

    // changing bar calls validate on every field
    form.change('bar', 'hello')

    expect(validateFoo).toHaveBeenCalledTimes(4)
    expect(validateFoo.mock.calls[3][0]).toBeUndefined()
    expect(validateBar).toHaveBeenCalledTimes(3)
    expect(validateBar.mock.calls[2][0]).toBe('hello')
    expect(validateBaz).toHaveBeenCalledTimes(2)
    expect(validateBaz.mock.calls[1][0]).toBeUndefined()

    // changing foo ONLY calls validate on foo and baz
    form.change('foo', 'world')

    expect(validateFoo).toHaveBeenCalledTimes(5)
    expect(validateFoo.mock.calls[4][0]).toBe('world')
    expect(validateBar).toHaveBeenCalledTimes(3) // NOT called
    expect(validateBaz).toHaveBeenCalledTimes(3)
    expect(validateBaz.mock.calls[2][0]).toBeUndefined()
  })

  it('should allow validation to be paused', () => {
    const validate = jest.fn()
    const form = createForm({ onSubmit: onSubmitMock, validate })
    expect(validate).toHaveBeenCalledTimes(1)

    const fooValidate = jest.fn()
    const barValidate = jest.fn()
    const bazValidate = jest.fn()
    expect(form.isValidationPaused()).toBe(false)
    form.pauseValidation()
    expect(form.isValidationPaused()).toBe(true)
    form.registerField(
      'foo',
      () => {},
      { error: true },
      { getValidator: () => fooValidate }
    )
    form.registerField(
      'bar',
      () => {},
      { error: true },
      { getValidator: () => barValidate }
    )
    form.registerField(
      'baz',
      () => {},
      { error: true },
      { getValidator: () => bazValidate }
    )

    expect(validate).toHaveBeenCalledTimes(1)
    expect(fooValidate).not.toHaveBeenCalled()
    expect(barValidate).not.toHaveBeenCalled()
    expect(bazValidate).not.toHaveBeenCalled()

    form.resumeValidation()
    expect(form.isValidationPaused()).toBe(false)

    expect(validate).toHaveBeenCalledTimes(2)
    expect(fooValidate).toHaveBeenCalledTimes(1)
    expect(barValidate).toHaveBeenCalledTimes(1)
    expect(bazValidate).toHaveBeenCalledTimes(1)
  })

  it('should not fire validation on resume if it is not needed', () => {
    const validate = jest.fn()
    const form = createForm({ onSubmit: onSubmitMock, validate })
    expect(validate).toHaveBeenCalledTimes(1)

    const fooValidate = jest.fn()
    form.registerField(
      'foo',
      () => {},
      { error: true },
      { getValidator: () => fooValidate }
    )

    expect(validate).toHaveBeenCalledTimes(2)
    expect(fooValidate).toHaveBeenCalledTimes(1)

    form.pauseValidation()
    form.resumeValidation()

    expect(validate).toHaveBeenCalledTimes(2)
    expect(fooValidate).toHaveBeenCalledTimes(1)
  })

  it('should allow for array fields to both have errors and for the array itself to have an error', () => {
    const validate = jest.fn(values => {
      const errors = {}
      errors.items = values.items.map(value => (value ? undefined : 'Required'))
      errors.items[ARRAY_ERROR] = 'Need more items'
      return errors
    })

    const form = createForm({
      onSubmit: onSubmitMock,
      validate,
      initialValues: {
        items: ['Dog', '']
      }
    })
    expect(validate).toHaveBeenCalledTimes(1)

    const items = jest.fn()
    const items0 = jest.fn()
    const items1 = jest.fn()
    form.registerField('items', items, { error: true })
    expect(items).toHaveBeenCalled()
    expect(items).toHaveBeenCalledTimes(1)
    expect(items.mock.calls[0][0].error).toBe('Need more items')

    form.registerField('items[0]', items0, { error: true })
    expect(items0).toHaveBeenCalled()
    expect(items0).toHaveBeenCalledTimes(1)
    expect(items0.mock.calls[0][0].error).toBeUndefined()

    form.registerField('items[1]', items1, { error: true })
    expect(items1).toHaveBeenCalled()
    expect(items1).toHaveBeenCalledTimes(1)
    expect(items1.mock.calls[0][0].error).toBe('Required')

    expect(validate).toHaveBeenCalledTimes(4)

    form.change('items[1]', 'Cat')
    expect(validate).toHaveBeenCalledTimes(5)
    expect(items).toHaveBeenCalledTimes(1)
    expect(items0).toHaveBeenCalledTimes(1)
    expect(items1).toHaveBeenCalledTimes(2)
    expect(items1.mock.calls[1][0].error).toBeUndefined()
  })

  it('should not blow away all field-level validation errors when one is remedied and no validateFields', () => {
    // https://github.com/final-form/final-form/issues/75
    const form = createForm({ onSubmit: onSubmitMock })
    const config = {
      getValidator: () => value => (value ? undefined : 'Required'),
      validateFields: []
    }

    const foo = jest.fn()
    const bar = jest.fn()
    form.registerField('foo', foo, { error: true }, config)
    form.registerField('bar', bar, { error: true }, config)

    expect(foo).toHaveBeenCalled()
    expect(foo).toHaveBeenCalledTimes(1)
    expect(foo.mock.calls[0][0].error).toBe('Required')

    expect(bar).toHaveBeenCalled()
    expect(bar).toHaveBeenCalledTimes(1)
    expect(bar.mock.calls[0][0].error).toBe('Required')

    form.change('bar', 'hi')

    expect(foo).toHaveBeenCalledTimes(1)
    expect(bar).toHaveBeenCalledTimes(2)
    expect(bar.mock.calls[1][0].error).toBeUndefined()
  })

  it('should mark the form as valid when all required fields are completed', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const config = {
      getValidator: () => value => (value ? undefined : 'Required'),
      validateFields: []
    }

    const foo = jest.fn()
    const bar = jest.fn()

    form.registerField('foo', foo, { error: true }, config)
    form.registerField('bar', bar, { error: true })

    expect(foo).toHaveBeenCalled()
    expect(foo).toHaveBeenCalledTimes(1)
    expect(foo.mock.calls[0][0].error).toBe('Required')

    form.change('foo', 'hi')

    expect(foo).toHaveBeenCalledTimes(2)
    expect(foo.mock.calls[1][0].error).toBe(undefined)

    expect(form.getState().invalid).toBe(false)
  })

  it('should not blow away all field-level validation errors when one is remedied and one validateFields', () => {
    const form = createForm({ onSubmit: onSubmitMock })

    const foo = jest.fn()
    const bar = jest.fn()
    form.registerField(
      'foo',
      foo,
      { error: true },
      {
        getValidator: () => value => (value ? undefined : 'Required'),
        validateFields: ['baz']
      }
    )
    form.registerField(
      'bar',
      bar,
      { error: true },
      {
        getValidator: () => value => (value ? undefined : 'Required'),
        validateFields: ['baz']
      }
    )
    form.registerField('baz', () => {}, {})

    expect(foo).toHaveBeenCalled()
    expect(foo).toHaveBeenCalledTimes(1)
    expect(foo.mock.calls[0][0].error).toBe('Required')

    expect(bar).toHaveBeenCalled()
    expect(bar).toHaveBeenCalledTimes(1)
    expect(bar.mock.calls[0][0].error).toBe('Required')

    form.change('bar', 'hi')

    expect(foo).toHaveBeenCalledTimes(1)
    expect(bar).toHaveBeenCalledTimes(2)
    expect(bar.mock.calls[1][0].error).toBeUndefined()
  })

  it('should show form as invalid if has field-level validation errors', () => {
    // Created while debugging https://github.com/final-form/react-final-form/issues/196
    const form = createForm({ onSubmit: onSubmitMock })
    const spy = jest.fn()
    form.subscribe(spy, { invalid: true })
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].invalid).toBe(false)

    const foo = jest.fn()
    form.registerField(
      'foo',
      foo,
      { error: true, invalid: true },
      { getValidator: () => value => (value ? undefined : 'Required') }
    )

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].invalid).toBe(true)
    expect(foo).toHaveBeenCalled()
    expect(foo).toHaveBeenCalledTimes(1)
    expect(foo.mock.calls[0][0].error).toBe('Required')
    expect(foo.mock.calls[0][0].invalid).toBe(true)

    form.change('foo', 'hi')

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].invalid).toBe(false)
    expect(foo).toHaveBeenCalledTimes(2)
    expect(foo.mock.calls[1][0].error).toBeUndefined()
    expect(foo.mock.calls[1][0].invalid).toBe(false)
  })
})

import createForm from './FinalForm'

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

  it('should not fall over if a field has been unregistered during async validation', async () => {
    const delay = 10
    const form = createForm({ onSubmit: onSubmitMock })
    const spy = jest.fn()
    const unregister = form.registerField(
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

    change('erikras')

    // unregister field
    unregister()

    await sleep(delay * 2)

    // spy not called again
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

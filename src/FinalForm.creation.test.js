import createForm from './FinalForm'

const onSubmitMock = (values, callback) => {}

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

  it('should allow a change to an not-yet-registered field when validation is present', () => {
    const form = createForm({ onSubmit: onSubmitMock, validate: () => {} })
    form.registerField('whatever', () => {}, { value: true })
    form.change('foo', 'bar')
  })

  it('should allow initial values to come from field when registered', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const foo = jest.fn()
    const cat = jest.fn()
    form.registerField(
      'foo',
      foo,
      { pristine: true, initial: true, value: true },
      { initialValue: 'bar' }
    )
    expect(form.getState().initialValues).toEqual({ foo: 'bar' })
    expect(form.getState().values).toEqual({ foo: 'bar' })
    form.registerField(
      'cat',
      cat,
      { pristine: true, initial: true, value: true },
      { initialValue: 42 }
    )
    expect(form.getState().initialValues).toEqual({ foo: 'bar', cat: 42 })
    expect(form.getState().values).toEqual({ foo: 'bar', cat: 42 })

    expect(foo).toHaveBeenCalledTimes(1)
    expect(foo.mock.calls[0][0]).toMatchObject({
      value: 'bar',
      initial: 'bar',
      pristine: true
    })
    expect(cat).toHaveBeenCalledTimes(1)
    expect(cat.mock.calls[0][0]).toMatchObject({
      value: 42,
      initial: 42,
      pristine: true
    })
  })

  it('should allow default value to come from field when registered', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    const foo = jest.fn()
    const cat = jest.fn()
    form.registerField(
      'foo',
      foo,
      { pristine: true, initial: true, value: true },
      { initialValue: 'bar', defaultValue: 'fubar' }
    )
    expect(form.getState().initialValues).toEqual({ foo: 'bar' })
    expect(form.getState().values).toEqual({ foo: 'fubar' })
    form.registerField(
      'cat',
      cat,
      { pristine: true, initial: true, value: true },
      { defaultValue: 42 }
    )
    expect(form.getState().initialValues).toEqual({ foo: 'bar' })
    expect(form.getState().values).toEqual({ foo: 'fubar', cat: 42 })

    expect(foo).toHaveBeenCalledTimes(1)
    expect(foo.mock.calls[0][0]).toMatchObject({
      value: 'fubar',
      initial: 'bar',
      pristine: false
    })
    expect(cat).toHaveBeenCalledTimes(1)
    expect(cat.mock.calls[0][0]).toMatchObject({
      value: 42,
      initial: undefined,
      pristine: false
    })
  })

  it('should create a form with name ', () => {
    const name = 'carefullyThoughtOutFormName'
    const form = createForm({ onSubmit: onSubmitMock, name })
    expect(form.getFormName()).toBe('carefullyThoughtOutFormName')
  })
})

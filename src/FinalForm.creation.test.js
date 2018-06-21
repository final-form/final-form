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
})

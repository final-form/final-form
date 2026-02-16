import createForm from './FinalForm'

describe('FinalForm.keepDirtyOnReinitialize - Issue #366', () => {
  it('should update pristine array child fields when keepDirtyOnReinitialize is true', () => {
    const form = createForm({
      onSubmit: () => {},
      initialValues: {
        customers: [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
        ],
      },
      keepDirtyOnReinitialize: true,
    })

    // Register array field (like final-form-arrays does)
    form.registerField('customers', () => {}, { value: true })

    // Register individual child fields
    let firstName0State: any
    form.registerField('customers[0].firstName', (state) => {
      firstName0State = state
    }, { value: true })

    let lastName1State: any
    form.registerField('customers[1].lastName', (state) => {
      lastName1State = state
    }, { value: true })

    // Modify one child field
    form.change('customers[0].firstName', 'Modified')
    expect(firstName0State.value).toBe('Modified')

    // Initialize with new data
    form.initialize({
      customers: [
        { firstName: 'NewJohn', lastName: 'NewDoe' },
        { firstName: 'NewJane', lastName: 'NewSmith' },
      ],
    })

    // The modified field should keep its dirty value
    expect(firstName0State.value).toBe('Modified')

    // But the pristine field should update to new initial value
    expect(lastName1State.value).toBe('NewSmith')
  })
})

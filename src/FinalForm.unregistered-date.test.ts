import { runInNewContext } from "vm";
import { createForm } from "./index";

const ForeignDate = runInNewContext("Date") as DateConstructor;

it.each([
  [new ForeignDate(0), new ForeignDate(1)],
  [new ForeignDate(0), new ForeignDate(0)],
])(
  "compares unregistered cross-realm dates by reference %#",
  (initial, value) => {
    const form = createForm({
      onSubmit: () => {},
      initialValues: { date: initial },
    });
    const listener = jest.fn();
    form.subscribe(listener, { dirty: true });

    form.change("date", value);
    expect(form.getState().values.date).toBe(value);
    expect(form.getState().dirty).toBe(true);

    form.reset();
    expect(form.getState().values.date).toBe(initial);
    expect(listener.mock.calls.map(([state]) => state.dirty)).toEqual([
      false,
      true,
      false,
    ]);
  },
);

it.each([
  [
    [1, 2],
    [1, 2],
    [1, 3],
  ],
  [{ name: "Ada" }, { name: "Ada" }, { name: "Grace" }],
])(
  "keeps shallow comparison for ordinary values %#",
  (initial, equal, changed) => {
    const form = createForm<{ value: unknown }>({
      onSubmit: () => {},
      initialValues: { value: initial },
    });

    form.change("value", equal);
    expect(form.getState().pristine).toBe(true);
    form.change("value", changed);
    expect(form.getState().dirty).toBe(true);
  },
);

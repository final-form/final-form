import createForm from "./FinalForm";

const onSubmitMock = (values: any) => { };

describe("FinalForm.async", () => {
  it("should register field synchronously by default", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const spy = jest.fn();

    form.registerField("foo", spy, { value: true });

    // Should be called immediately (synchronously)
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].value).toBeUndefined();
  });

  it("should defer field callback when async: true", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const spy = jest.fn();

    form.registerField("foo", spy, { value: true }, { async: true });

    // Should not be called immediately
    expect(spy).toHaveBeenCalledTimes(0);

    // Should be called after next tick
    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].value).toBeUndefined();
      done();
    }, 10);
  });

  it("should use custom callback scheduler when provided", (done) => {
    const customScheduler = jest.fn((callback: () => void) => {
      setTimeout(callback, 5);
    });

    const form = createForm({
      onSubmit: onSubmitMock,
      callbackScheduler: customScheduler
    });
    const spy = jest.fn();

    form.registerField("foo", spy, { value: true }, { async: true });

    // Should not be called immediately
    expect(spy).toHaveBeenCalledTimes(0);
    expect(customScheduler).toHaveBeenCalledTimes(1);

    // Should be called after custom scheduler delay
    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      done();
    }, 10);
  });

  it("should batch multiple async callbacks", (done) => {
    const customScheduler = jest.fn((callback: () => void) => {
      setTimeout(callback, 5);
    });

    const form = createForm({
      onSubmit: onSubmitMock,
      callbackScheduler: customScheduler
    });
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    form.registerField("foo", spy1, { value: true }, { async: true });
    form.registerField("bar", spy2, { value: true }, { async: true });

    // Should not be called immediately
    expect(spy1).toHaveBeenCalledTimes(0);
    expect(spy2).toHaveBeenCalledTimes(0);
    // Should only schedule once for batching
    expect(customScheduler).toHaveBeenCalledTimes(1);

    // Both should be called after scheduler runs
    setTimeout(() => {
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
      done();
    }, 10);
  });

  it("should allow setting callback scheduler via setCallbackScheduler", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const customScheduler = jest.fn((callback: () => void) => {
      setTimeout(callback, 5);
    });

    form.setCallbackScheduler(customScheduler);

    const spy = jest.fn();
    form.registerField("foo", spy, { value: true }, { async: true });

    expect(customScheduler).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      done();
    }, 10);
  });

  it("should allow setting callback scheduler via setConfig", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const customScheduler = jest.fn((callback: () => void) => {
      setTimeout(callback, 5);
    });

    form.setConfig("callbackScheduler", customScheduler);

    const spy = jest.fn();
    form.registerField("foo", spy, { value: true }, { async: true });

    expect(customScheduler).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      done();
    }, 10);
  });

  it("should preserve execution order for async callbacks", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const callOrder: string[] = [];

    const spy1 = jest.fn(() => callOrder.push("foo"));
    const spy2 = jest.fn(() => callOrder.push("bar"));
    const spy3 = jest.fn(() => callOrder.push("baz"));

    form.registerField("foo", spy1, { value: true }, { async: true });
    form.registerField("bar", spy2, { value: true }, { async: true });
    form.registerField("baz", spy3, { value: true }, { async: true });

    setTimeout(() => {
      expect(callOrder).toEqual(["foo", "bar", "baz"]);
      done();
    }, 10);
  });

  it("should work with field validation in async mode", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const spy = jest.fn();

    form.registerField(
      "foo",
      spy,
      { error: true, value: true },
      {
        async: true,
        getValidator: () => (value: any) => value ? undefined : "Required"
      }
    );

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].error).toBe("Required");
      expect(spy.mock.calls[0][0].value).toBeUndefined();
      done();
    }, 10);
  });

  it("should work with initialValue in async mode", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const spy = jest.fn();

    form.registerField(
      "foo",
      spy,
      { value: true },
      {
        async: true,
        initialValue: "test"
      }
    );

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].value).toBe("test");
      done();
    }, 10);
  });

  it("should handle mixed sync and async field registrations", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const syncSpy = jest.fn();
    const asyncSpy = jest.fn();

    form.registerField("sync", syncSpy, { value: true });
    form.registerField("async", asyncSpy, { value: true }, { async: true });

    // Sync should be called immediately
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(asyncSpy).toHaveBeenCalledTimes(0);

    setTimeout(() => {
      // Async should be called after delay
      expect(asyncSpy).toHaveBeenCalledTimes(1);
      done();
    }, 10);
  });
}); 
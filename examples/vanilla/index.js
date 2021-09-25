import "./styles.css";
import { createForm } from "final-form";

const onSubmit = (values) => window.alert(JSON.stringify(values, undefined, 2));

const form = createForm({
  onSubmit,
  initialValues: {
    color: "#0000FF",
  },
  validate: (values) => {
    const errors = {};
    if (!values.firstName) {
      errors.firstName = "Required";
    }
    if (!values.lastName) {
      errors.lastName = "Required";
    }
    if (values.color === "#00FF00") {
      errors.color = "Gross! Not green! 🤮";
    }
    return errors;
  },
});

document.getElementById("form").addEventListener("submit", (event) => {
  event.preventDefault();
  form.submit();
});
document.getElementById("reset").addEventListener("click", () => form.reset());

const registered = {};

function registerField(input) {
  const { name } = input;
  form.registerField(
    name,
    (fieldState) => {
      const { blur, change, error, focus, touched, value } = fieldState;
      const errorElement = document.getElementById(name + "_error");
      if (!registered[name]) {
        // first time, register event listeners
        input.addEventListener("blur", () => blur());
        input.addEventListener("input", (event) =>
          change(
            input.type === "checkbox"
              ? event.target.checked
              : event.target.value,
          ),
        );
        input.addEventListener("focus", () => focus());
        registered[name] = true;
      }

      // update value
      if (input.type === "checkbox") {
        input.checked = value;
      } else {
        input.value = value === undefined ? "" : value;
      }

      // show/hide errors
      if (errorElement) {
        if (touched && error) {
          errorElement.innerHTML = error;
          errorElement.style.display = "block";
        } else {
          errorElement.innerHTML = "";
          errorElement.style.display = "none";
        }
      }
    },
    {
      value: true,
      error: true,
      touched: true,
    },
  );
}

[...document.forms[0]].forEach((input) => {
  if (input.name) {
    registerField(input);
  }
});

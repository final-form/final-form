const { setIn, getIn } = require('./dist/final-form.cjs.js');

// Simulate async validation returning errors with ARRAY_ERROR
const asyncErrors = {
  items: {
    [Symbol.for('ARRAY_ERROR')]: "Need more items",
    0: "Required",
    1: undefined
  }
};

let merged = {};

// First forEachError - set errors for each field
console.log("Step 1: Set error for 'items'");
const itemsError = asyncErrors.items;
console.log("itemsError:", itemsError);
merged = setIn(merged, "items", itemsError) || {};
console.log("merged after setting items:", JSON.stringify(merged, null, 2));

console.log("\nStep 2: Set error for 'items[0]'");
merged = setIn(merged, "items[0]", "Required") || {};
console.log("merged after setting items[0]:", JSON.stringify(merged, null, 2));

console.log("\nStep 3: Set error for 'items[1]'");
merged = setIn(merged, "items[1]", undefined) || {};
console.log("merged after setting items[1]:", JSON.stringify(merged, null, 2));

console.log("\nStep 4: Handle ARRAY_ERROR");
const existing = getIn(merged, "items");
console.log("existing:", existing);
console.log("Is array?", Array.isArray(existing));

if (existing && !Array.isArray(existing)) {
  console.log("ERROR: existing is not an array, cannot spread!");
}

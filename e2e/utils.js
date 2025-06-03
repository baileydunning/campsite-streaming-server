export function runTest(name, fn) {
  try {
    fn();
    console.log(`Passed: ${name}`);
  } catch (err) {
    console.error(`Failed: ${name}\n  ${err.message}`);
  }
}

export function handleResponse(data, testName, validate) {
  try {
    const result = JSON.parse(data);

    // If the server returned an error field, fail immediately
    if (result && result.error) {
      throw new Error(`Server error: ${result.error}`);
    }

    // Otherwise, treat any non‐error JSON (array or object) as valid input to the validator
    runTest(testName, () => validate(result));
  } catch (err) {
    console.error(`Failed: ${testName}`);
    console.error(`  ${err.message}`);
  }
}


## How Does the Accessibility Testing Work?
The program does not rely on a single testing tool. Instead, it sequentially orchestrates three established open-source solutions:
1. **Pa11y**
2. **Axe-core**
3. **Lighthouse**

**The Filtering and Combination Process:**
After all three tools have analyzed the specified website, the script collects the raw data. Then, a custom logic (located in `core/errorFilter.js`) is applied:
* The errors found by the tools are mapped and standardized to the respective **WCAG criterion** (e.g., WCAG 1.1.1 for missing alt texts).
* The **CSS selectors** of the faulty HTML elements are normalized to make them comparable.
* The program then cross-references the data to see which errors were found on the exact same elements by multiple tools independently (overlaps).

## Local Setup & Execution

### Prerequisites
* You need to have **Node.js** installed on your system.

### 1. Installation
Open a terminal in the root directory of the project (where the `package.json` file is located) and download the required dependencies:

```bash
npm install
```

### 2. Configure the URL to Test (Optional)
By default, the script tests a W3C demo page, which is used for testing. To test your own page:
1. Open the `index.js` file.
2. Change the value of the `testUrl` variable (line 9) to your desired web address:
```javascript
const testUrl = 'https://your-desired-url.com';
```

### 3. Start the Test Run
Once everything is installed and configured, run the script via the terminal to actually start the accessibility tests:

```bash
node index.js
```

## Interpreting the Results
Once the tests are completed, a folder named `results` is created automatically. Inside, you will find three JSON files that are crucial for the subsequent benchmarking:

* **`combined-raw-results.json`**: An unfiltered list of all errors found across all tools.
* **`multi-tool-overlaps.json`**: **Almost Confirmed errors**. These errors were detected by at least two tools on the same element (high probability that this is a genuine accessibility barrier).
* **`single-tool-errors.json`**: **Exclusive errors**. These were found by only a single tool (potential false positives or very tool-specific findings).

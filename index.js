const runPa11y = require('./tools/pa11yRunner');
const runAxe = require('./tools/axeRunner');
const runLighthouse = require('./tools/lighthouseRunner');
const getOverlappingErrors = require('./core/errorFilter');
const saveAllResults = require('./core/fileManager');

async function runTest() {
    console.log("Starting automated accessibility test...");
    const testUrl = 'https://www.w3.org/WAI/demos/bad/before/home.html';
    let allCleanData = [];

    try {
        console.log("Running Pa11y...");
        const pa11yClean = await runPa11y(testUrl);
        allCleanData = allCleanData.concat(pa11yClean);
        console.log(`   -> Pa11y found ${pa11yClean.length} errors.`);

        console.log("Running Axe-core...");
        const axeClean = await runAxe(testUrl);
        allCleanData = allCleanData.concat(axeClean);
        console.log(`   -> Axe-core found ${axeClean.length} errors.`);

        console.log("Running Lighthouse...");
        const lighthouseClean = await runLighthouse(testUrl);
        allCleanData = allCleanData.concat(lighthouseClean);
        console.log(`   -> Lighthouse found ${lighthouseClean.length} errors.`);

        console.log(`\nTotal errors collected (Unfiltered/Raw): ${allCleanData.length}`);

        const allCategorizedErrors = getOverlappingErrors(allCleanData);
        const multiToolErrors = allCategorizedErrors.filter(e => e.foundByTools.length >= 2);
        const singleToolErrors = allCategorizedErrors.filter(e => e.foundByTools.length === 1);

        saveAllResults(allCleanData, multiToolErrors, singleToolErrors);

        console.log(`\n--- SUMMARY ---`);
        console.log(`Highly confirmed errors (confirmed by >= 2 tools): ${multiToolErrors.length} categories`);
        console.log(`Exclusive errors (found by only 1 tool): ${singleToolErrors.length} categories`);

        if (multiToolErrors.length > 0) {
            const multiTableData = multiToolErrors.map(error => ({
                "WCAG Kriterium": error.issueCategory,
                "Tools": error.foundByTools.join(', '),
                "Häufigkeit": error.totalOccurrences,
                "Element (CSS)": error.cssSelector.substring(0, 50) + (error.cssSelector.length > 50 ? '...' : '')
            }));
            console.log("\n--- KRITISCHE FEHLER (VON MEHREREN TOOLS GEFUNDEN) ---");
            console.table(multiTableData);
        }

        if (singleToolErrors.length > 0) {
            const singleTableData = singleToolErrors.map(error => ({
                "WCAG Kriterium": error.issueCategory,
                "Tool": error.foundByTools[0], // Da es hier immer nur ein Tool ist, reicht der erste Eintrag
                "Häufigkeit": error.totalOccurrences,
                "Element (CSS)": error.cssSelector.substring(0, 50) + (error.cssSelector.length > 50 ? '...' : '')
            }));
            console.log("\n--- SPEZIFISCHE FEHLER (NUR VON EINEM TOOL GEFUNDEN) ---");
            console.table(singleTableData);
        }

        console.log("\nTesting completed successfully! All files saved to 'results' folder.");

    } catch (error) {
        console.error("An error occurred during execution:", error);
    }
}

runTest();
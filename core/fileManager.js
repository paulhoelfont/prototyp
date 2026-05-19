const fs = require('fs');
const path = require('path');

function saveAllResults(allCleanData, multiToolErrors, singleToolErrors) {
    const resultsDir = path.join(__dirname, '../results');

    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(resultsDir, 'combined-raw-results.json'), JSON.stringify(allCleanData, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'multi-tool-overlaps.json'), JSON.stringify(multiToolErrors, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'single-tool-errors.json'), JSON.stringify(singleToolErrors, null, 2));

    generateBrajnikVigoCSV(allCleanData, path.join(resultsDir, 'evaluation-framework-brajnik.csv'));

    generateMultiToolOverlapCSV(multiToolErrors, path.join(resultsDir, 'multi-tool-overlaps.csv'));
}

function getWcagLabel(criterion) {
    const code = (criterion || "").toLowerCase();

    const pa11yMatch = code.match(/([1-4])_([1-9])_([0-9]{1,2})/);
    if (pa11yMatch) return `WCAG ${pa11yMatch[1]}.${pa11yMatch[2]}.${pa11yMatch[3]}`;

    const axeMatch = code.match(/wcag(\d)(\d)(\d{1,2})/);
    if (axeMatch) return `WCAG ${axeMatch[1]}.${axeMatch[2]}.${axeMatch[3]}`;

    const rules = {
        'image-alt': 'WCAG 1.1.1',
        'color-contrast': 'WCAG 1.4.3',
        'html-has-lang': 'WCAG 3.1.1',
        'landmark-one-main': 'WCAG 1.3.1',
        'region': 'WCAG 1.3.1',
        'link-name': 'WCAG 2.4.4',
        'select-name': 'WCAG 4.1.2',
        'target-size': 'WCAG 2.5.5'
    };

    return rules[code] || code;
}

function generateBrajnikVigoCSV(allErrors, filename) {
    if (!allErrors || allErrors.length === 0) return;

    const header = "ID;Tool;WCAG Kriterium;CSS Selektor (Element);Tool-Fehlermeldung;Manuelle Pruefung (TP/FP/FN);Begruendung\n";

    const rows = allErrors.map((error, index) => {
        const id = index + 1;
        const tool = error.toolName;
        const wcag = getWcagLabel(error.wcagCriterion);
        const selector = `"${(error.cssSelector || '').replace(/"/g, '""')}"`;
        const message = `"${(error.errorMessage || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const manualCheck = "";
        const reasoning = "";

        return `${id};${tool};${wcag};${selector};${message};${manualCheck};${reasoning}`;
    }).join("\n");

    fs.writeFileSync(filename, header + rows);
    console.log(`\n---> Brajnik & Vigo Evaluierungs-Tabelle erstellt: ${filename}`);
}

function generateMultiToolOverlapCSV(overlaps, filename) {
    if (!overlaps || overlaps.length === 0) {
        console.log(`\n---> Keine Multi-Tool Overlaps gefunden (CSV wird übersprungen).`);
        return;
    }

    const header = "WCAG Kriterium,Tools,Häufigkeit,CSS Selektor\n";

    const rows = overlaps.map(overlap => {
        const wcag = overlap.issueCategory || "";

        const tools = `"${(overlap.foundByTools || []).join(', ')}"`;

        const frequency = overlap.totalOccurrences || 0;

        const selector = `"${(overlap.cssSelector || '').replace(/"/g, '""')}"`;

        return `${wcag},${tools},${frequency},${selector}`;
    }).join("\n");

    fs.writeFileSync(filename, header + rows);
    console.log(`\n---> Multi-Tool Overlaps CSV erstellt: ${filename}`);
}

module.exports = saveAllResults;
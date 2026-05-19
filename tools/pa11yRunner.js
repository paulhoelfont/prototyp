const pa11y = require('pa11y');

function mapPa11yResults(pa11yRawData) {
    return pa11yRawData.issues.map(issue => ({
        toolName: 'Pa11y',
        wcagCriterion: issue.code,
        cssSelector: issue.selector,
        errorMessage: issue.message,
    }));
}

async function runPa11y(url) {
    const raw = await pa11y(url);
    return mapPa11yResults(raw);
}

module.exports = runPa11y;
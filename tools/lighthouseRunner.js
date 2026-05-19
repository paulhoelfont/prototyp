function mapLighthouseResults(lighthouseRawData) {
    let cleanResults = [];
    const audits = lighthouseRawData.lhr.audits;

    for (let auditId in audits) {
        const audit = audits[auditId];
        if(audit.score === 0 && audit.details && audit.details.type === 'table') {
            audit.details.items.forEach(item => {
                cleanResults.push({
                    toolName: 'Lighthouse',
                    wcagCriterion: auditId,
                    cssSelector: item.node ? item.node.selector : 'N/A',
                    errorMessage: audit.title + ": " + audit.description,
                });
            });
        }
    }
    return cleanResults;
}

async function runLighthouse(url) {
    const { default: lighthouse } = await import('lighthouse');
    const chromeLauncher = await import('chrome-launcher');

    const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
    const lighthouseOptions = {
        logLevel: 'silent',
        output: 'json',
        onlyCategories: ['accessibility'],
        port: chrome.port
    };

    const lighthouseRaw = await lighthouse(url, lighthouseOptions);
    const cleanData = mapLighthouseResults(lighthouseRaw);

    try {
        await chrome.kill();
    } catch (killError) {
        console.log("   -> Info: OS blocked deleting the temp directory, testing continues anyway.");
    }

    return cleanData;
}

module.exports = runLighthouse;
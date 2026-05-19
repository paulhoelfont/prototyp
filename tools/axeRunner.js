const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

function mapAxeResults(axeRawData) {
    let cleanResults = [];
    axeRawData.violations.forEach(violation => {
        violation.nodes.forEach(node => {
            cleanResults.push({
                toolName: 'Axe-core',
                wcagCriterion: violation.id,
                cssSelector: node.target.join(', '),
                errorMessage: node.failureSummary || violation.help
            });
        });
    });
    return cleanResults;
}

async function runAxe(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const axeRaw = await new AxePuppeteer(page).analyze();
    await browser.close();

    return mapAxeResults(axeRaw);
}

module.exports = runAxe;
function determineWcagCriterion(error) {
    const code = (error.wcagCriterion || "").toLowerCase();

    const pa11yMatch = code.match(/([1-4])_([1-9])_([0-9]{1,2})/);
    if (pa11yMatch) {
        return `WCAG ${pa11yMatch[1]}.${pa11yMatch[2]}.${pa11yMatch[3]}`;
    }

    const axeMatch = code.match(/wcag(\d)(\d)(\d{1,2})/);
    if (axeMatch) {
        return `WCAG ${axeMatch[1]}.${axeMatch[2]}.${axeMatch[3]}`;
    }

    const ruleMapping = {
        'image-alt': 'WCAG 1.1.1',
        'area-alt': 'WCAG 1.1.1',
        'input-image-alt': 'WCAG 1.1.1',
        'object-alt': 'WCAG 1.1.1',
        'role-img-alt': 'WCAG 1.1.1',
        'image-redundant-alt': 'WCAG 1.1.1',

        'empty-heading': 'WCAG 1.3.1',
        'heading-order': 'WCAG 1.3.1',
        'p-as-heading': 'WCAG 1.3.1',
        'list': 'WCAG 1.3.1',
        'listitem': 'WCAG 1.3.1',
        'dlitem': 'WCAG 1.3.1',
        'definition-list': 'WCAG 1.3.1',
        'layout-table': 'WCAG 1.3.1',
        'td-headers-attr': 'WCAG 1.3.1',
        'th-has-data-cells': 'WCAG 1.3.1',
        'landmark-one-main': 'WCAG 1.3.1',
        'region': 'WCAG 1.3.1',

        'link-in-text-block': 'WCAG 1.4.1',

        'color-contrast': 'WCAG 1.4.3',

        'meta-viewport': 'WCAG 1.4.4',

        'blink': 'WCAG 2.2.2',
        'marquee': 'WCAG 2.2.2',

        'bypass': 'WCAG 2.4.1',
        'frame-title': 'WCAG 2.4.1',

        'document-title': 'WCAG 2.4.2',

        'tabindex': 'WCAG 2.4.3',

        'link-name': 'WCAG 2.4.4',

        'html-has-lang': 'WCAG 3.1.1',
        'html-xml-lang-mismatch': 'WCAG 3.1.1',

        'valid-lang': 'WCAG 3.1.2',

        'label': 'WCAG 3.3.2',

        'duplicate-id': 'WCAG 4.1.1',
        'duplicate-id-active': 'WCAG 4.1.1',

        'button-name': 'WCAG 4.1.2',
        'select-name': 'WCAG 4.1.2',
        'aria-roles': 'WCAG 4.1.2',
        'aria-valid-attr': 'WCAG 4.1.2',
        'aria-valid-attr-value': 'WCAG 4.1.2',
        'aria-allowed-attr': 'WCAG 4.1.2',
        'aria-required-attr': 'WCAG 4.1.2',
        'aria-required-children': 'WCAG 4.1.2',
        'aria-required-parent': 'WCAG 4.1.2',

        'target-size': 'WCAG 2.5.5'
    };

    if (ruleMapping[code]) {
        return ruleMapping[code];
    }

    return `Unmapped Rule: ${code}`;
}

function normalizeSelector(selector) {
    if (!selector || selector === 'N/A') return 'unknown-element';
    return selector.trim().toLowerCase().replace(/\s+/g, ' ');
}

function removePseudoClasses(selector) {
    return selector.replace(/:nth-child\(\d+\)/g, '').replace(/:nth-of-type\(\d+\)/g, '');
}

function getTargetElementTag(selector) {
    const parts = selector.split('>');
    const lastPart = parts[parts.length - 1].trim();
    return lastPart.split('[')[0].split('.')[0].split('#')[0];
}

function doSelectorsMatch(sel1, sel2) {
    if (sel1 === sel2) return true;
    if (sel1 === 'unknown-element' || sel2 === 'unknown-element') return false;

    const idMatch1 = sel1.match(/#[a-z0-9_-]+/i);
    const idMatch2 = sel2.match(/#[a-z0-9_-]+/i);

    if (idMatch1 && idMatch2 && idMatch1[0] !== idMatch2[0]) {
        return false;
    }

    if (idMatch1 && idMatch2 && idMatch1[0] === idMatch2[0]) {
        return true;
    }

    const tag1 = getTargetElementTag(sel1);
    const tag2 = getTargetElementTag(sel2);
    if (tag1 && tag2 && tag1 !== tag2 && tag1 !== '*' && tag2 !== '*') {
        return false;
    }

    const cleanSel1 = removePseudoClasses(sel1);
    const cleanSel2 = removePseudoClasses(sel2);

    if ((cleanSel1.includes(cleanSel2) && cleanSel2.length > 3) ||
        (cleanSel2.includes(cleanSel1) && cleanSel1.length > 3)) {
        return true;
    }

    const attrMatch1 = sel1.match(/\[(.*?)\]/);
    const attrMatch2 = sel2.match(/\[(.*?)\]/);
    if (attrMatch1 && attrMatch2 && attrMatch1[0] === attrMatch2[0]) {
        return true;
    }

    return false;
}

function getOverlappingErrors(allErrors) {
    const aggregated = [];

    allErrors.forEach((error) => {
        const wcagCategory = determineWcagCriterion(error);
        const normalizedSelector = normalizeSelector(error.cssSelector);

        const existingMatch = aggregated.find(item =>
            item.issueCategory === wcagCategory &&
            doSelectorsMatch(normalizeSelector(item.cssSelector), normalizedSelector)
        );

        if (!existingMatch) {
            aggregated.push({
                issueCategory: wcagCategory,
                cssSelector: error.cssSelector,
                foundByTools: [error.toolName],
                toolCounts: { [error.toolName]: 1 },
                totalOccurrences: 1
            });
        } else {
            existingMatch.totalOccurrences++;

            if (!existingMatch.foundByTools.includes(error.toolName)) {
                existingMatch.foundByTools.push(error.toolName);
            }

            existingMatch.toolCounts[error.toolName] = (existingMatch.toolCounts[error.toolName] || 0) + 1;
        }
    });

    return aggregated;
}

module.exports = getOverlappingErrors;
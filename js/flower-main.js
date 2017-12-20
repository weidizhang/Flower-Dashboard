/*
 * @author Weidi Zhang
 */

const arrowUp = '&#9650;';
const arrowDown = '&#9660;';

$(document).ready(function() {
    loadPortfolio();

    $('[data-asset]').click(assetTabClick);
})

function loadPortfolio() {
    $baseTab = $('[data-asset="dashboard:Total"]');

    $.each(portfolioData, function(asset, data) {
        const [assetType, assetName] = asset.split(':');

        $newTab = $baseTab.clone();

        $newTab.attr('data-asset', assetType + ':' + assetName);
        $newTab.find('.asset-name').text(assetName);

        $('#' + assetType).append($newTab);
    });
}

function assetTabClick() {
    setActiveTab($(this));

    const [assetType, assetName] = $(this).data('asset').split(':');

    switch (assetType) {
        case 'dashboard':
            flipToOverview();
            break;

        case 'cryptocurrency':
        case 'stock':
            flipToAsset(assetType, assetName);
            break;

        default:
            break;
    }
}

function flipToOverview() {
    setHeaderText('Overview');
}

function flipToAsset(type, name) {
    const prettyType = type[0].toUpperCase() + type.substr(1);
    setHeaderText(prettyType + ': ' + name);
}

function setHeaderText(text) {
    $('.navbar-header').text(text)
}

function setActiveTab($tab) {
    $('[data-asset] li').attr('class', 'inactive');
    $tab.children('li').attr('class', 'active');
}

function setTvChartSymbol(symbol) {
    const chartUrl = new URL($('iframe').attr('src'));

    const newSymbol = encodeURIComponent(symbol);
    const newUrlSearch = '?symbol=' + newSymbol + chartUrl.search.substr(chartUrl.search.indexOf('&'));

    const newChartUrl = chartUrl.origin + chartUrl.pathname + newUrlSearch;
    
    $('iframe').attr('src', newChartUrl);
}
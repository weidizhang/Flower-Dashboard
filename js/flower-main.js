/*
 * @author Weidi Zhang
 */

const arrowUp = '&#9650;';
const arrowDown = '&#9660;';

let timeBeforePriceUpdateDS = 0; // DS = Decisecond

$(document).ready(() => {
    loadPortfolioTabs();

    priceRefreshTicker();
    setInterval(priceRefreshTicker, 100);

    $('[data-asset]').click(assetTabClick);
})

function loadPortfolioTabs() {
    $baseTab = $('[data-asset="dashboard:Total"]');

    $.each(portfolioData, (asset, data) => {
        const [assetType, assetName] = asset.split(':');

        $newTab = $baseTab.clone();

        $newTab.attr('data-asset', asset);
        $newTab.find('li').attr('class', 'inactive');
        $newTab.find('.asset-name').text(assetName);

        $('#' + assetType).append($newTab);
    });
}

function updatePrices() { // increase efficiency/merge redundant code from this?
    $.each(portfolioData, (asset, data) => {
        const [assetType, assetName] = asset.split(':');

        let priceObj;
        if (assetType == 'cryptocurrency') {
            priceObj = new CoinMarketCap(data.cmc_name);
        }
        else if (assetType == 'stock') {
            priceObj = new GoogleFinance(assetName);
        }

        if (priceObj !== undefined) {
            const priceDataPromise = getPriceData(priceObj);
            priceDataPromise.then((data) => {
                const $assetTab = $('[data-asset="' + asset + '"]');
                
                $assetTab.find('.asset-value').text('$' + data.price);

                percentChange = parseFloat(data.percent);
                $assetArrow = $assetTab.find('asset-arrow');
                $assetArrow.html(arrowUp);
                if (percentChange < 0) {
                    $assetArrow.html(arrowDown);
                    percentChange *= -1;
                }

                $assetTab.find('.asset-percentage').text(percentChange.toFixed(2) + '%');
            });
        }
    });
}

function priceRefreshTicker() {
    timeBeforePriceUpdateDS -= 1;

    if (timeBeforePriceUpdateDS <= 0) {
        updatePrices();
        timeBeforePriceUpdateDS = settingsData.price_update_interval * 10;
    }

    timeBeforePriceUpdateSecs = (timeBeforePriceUpdateDS / 10).toFixed(0);
    $('.refresh-time').text(timeBeforePriceUpdateSecs  + 's');

    const progressBarWidth = (timeBeforePriceUpdateDS / (settingsData.price_update_interval * 10)) * 100;
    $('.refresh-bar-inside').width(progressBarWidth + '%');
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

    tvSymbol = portfolioData[type + ':' + name].tv_chart;
    setTvChartSymbol(tvSymbol);
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
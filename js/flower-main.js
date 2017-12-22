/*
 * @author Weidi Zhang
 */

const arrowUp = '&#9650;';
const arrowDown = '&#9660;';

let timeBeforePriceUpdateDS = 0; // DS = Decisecond

let assetPrices = {};

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

                let percentChange = parseFloat(data.percent);
                let movementClass = 'movement-up';

                $assetArrow = $assetTab.find('.asset-arrow');
                $assetArrow.html(arrowUp);
                if (percentChange < 0) {
                    $assetArrow.html(arrowDown);
                    percentChange *= -1;
                    movementClass = 'movement-down';
                }

                $assetTab.find('.asset-change').removeClass('movement-up').removeClass('movement-down').addClass(movementClass);
                $assetTab.find('.asset-percentage').text(percentChange.toFixed(2) + '%');

                assetPrices[asset] = data.price;
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

    const tvSymbol = portfolioData[type + ':' + name].tv_chart;
    setTvChartSymbol(tvSymbol);

    loadTransactions(type, name);
}

function loadTransactions(type, name) {
    const txData = portfolioData[type + ':' + name].transactions;
    const $baseTx = $('#tx-template');

    $('.asset-tx').remove();

    $.each(txData, (index, tx) => {
        const $newTx = $baseTx.clone();

        $newTx.removeAttr('id').addClass('asset-tx');
        $newTx.attr('data-txindex', index);

        const formattedAmt = (type == 'cryptocurrency') ? tx.amt.toFixed(8) : tx.amt.toFixed(3);

        const cost = tx.amt * tx.cost_per;
        const value = tx.amt * assetPrices[type + ':' + name];
        const profitLoss = value - cost;

        $newTx.find('.tx-type').text(tx.type);
        $newTx.find('.tx-amt').text(formattedAmt);
        $newTx.find('.tx-cps').text('$' + roundDollarValue(tx.cost_per));
        $newTx.find('.tx-cost').text('$' + roundDollarValue(cost));
        $newTx.find('.tx-value').text('$' + roundDollarValue(value));
        $newTx.find('.tx-pl').text('$' + roundDollarValue(profitLoss) + ' (' + calcPercentPL(value, cost) + ')');

        $('#table-total').before($newTx);
    });
}

function calcPercentPL(value, cost) {
    const pl = ((value - cost) / cost) * 100;
    return pl.toFixed(2) + '%';
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

function roundDollarValue(value) {
    if (value < 1) {
        return value.toFixed(4);
    }
    return value.toFixed(2);
}
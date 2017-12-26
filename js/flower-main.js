/*
 * @author Weidi Zhang
 */

const arrowUp = '&#9650;';
const arrowDown = '&#9660;';
const mDash = '&mdash;';

let holdingsChart;

let timeBeforePriceUpdateDS = 0; // DS = Decisecond
let assetPrices = {};

$(document).ready(() => {
    loadPortfolioTabs();
    createHoldingsChart();

    priceRefreshTicker();
    setInterval(priceRefreshTicker, 100);

    $('[data-asset]').click(assetTabClick);
})

function createHoldingsChart() {
    const ctx = $('#holdings-chart')[0].getContext('2d');
    holdingsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{ data: [] }],
            labels: []
        },
        options: {
            tooltips: {
                // Label callback adapted from Quince: https://stackoverflow.com/questions/37257034/chart-js-2-0-doughnut-tooltip-percentages
                callbacks: {
                    label: (tooltipItem, data) => {
                        const dataset = data.datasets[tooltipItem.datasetIndex];
                        const total = dataset.data.reduce((previousValue, currentValue, currentIndex, array) => {
                            return previousValue + currentValue;
                        });

                        const currentValue = dataset.data[tooltipItem.index];
                        const precentage = (currentValue / total) * 100;
                        return ' $' + roundDollarValue(currentValue) + ' (' + precentage.toFixed(1) + '%)';
                    }
                }
            }
        }
    });
}

function updateHoldingsChart(labels, data, colors) {
    holdingsChart.data.labels = labels;
    holdingsChart.data.datasets[0].data = data;
    holdingsChart.data.datasets[0].backgroundColor = colors;
    holdingsChart.update();
}

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
    $('.refresh-time').text(timeBeforePriceUpdateSecs + 's');

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
    $('.nav-pills').hide();
    $('.tab-content').hide();
    $('#overview').show();

    const holdingData = getTotalHoldingData();
    const totalCost = sumKeyName(holdingData, 'cost');
    const totalValue = sumKeyName(holdingData, 'value');

    setHeaderText('Overview - Cost: ' + totalCost + ' - Value: ' + totalValue);

    const chartData = makeDataChartFriendly(holdingData);
    updateHoldingsChart(chartData.labels, chartData.data, chartData.colors);
}

function makeDataChartFriendly(data) {
    let labels = [];
    let dataValues = [];
    let colors = [];

    $.each(data, (asset, innerData) => {
        const prettyAssetName = (asset[0].toUpperCase() + asset.substr(1)).split(':').join(' - ');

        labels.push(prettyAssetName);
        dataValues.push(innerData.value);

        const seededColor = new SeededColor(asset);
        const assetColor = rgbToHex(seededColor.red(), seededColor.green(), seededColor.blue());

        colors.push(assetColor);
    });

    return {
        labels: labels,
        data: dataValues,
        colors: colors
    };
}

/* Start: componentToHex and rgbToHex from Tim Down: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
/* End */

function sumKeyName(data, key) {
    let sum = 0;
    $.each(data, (index, obj) => {
        sum += obj[key];
    });

    return sum;
}

function getTotalHoldingData() { // to-do: cost
    let holdingData = {}

    $.each(portfolioData, (asset, data) => {
        holdingData[asset] = {
            amt: 0,
            cost: 0
        };

        $.each(data.transactions, (index, txData) => {
            let txAmt = txData.amt;
            let txCost = txData.cost_per * txAmt;
            if (txData.type == 'Sell') {
                txAmt *= -1;
                txCost *= -1;
            }

            holdingData[asset].amt += txAmt;
            holdingData[asset].cost += txCost;
        });

        holdingData[asset].value = holdingData[asset].amt * assetPrices[asset];
    });

    return holdingData;
}

function flipToAsset(type, name) {
    $('.nav-pills').show();
    $('.tab-content').show();
    $('#overview').hide();
    adjustTabContentHeight();

    const prettyType = type[0].toUpperCase() + type.substr(1);
    setHeaderText(prettyType + ': ' + name);

    const tvSymbol = portfolioData[type + ':' + name].tv_chart;
    setTvChartSymbol(tvSymbol);

    loadTransactions(type, name);
}

function loadTransactions(type, name) { // to-do: reload current tx's when price updates.
    const txData = portfolioData[type + ':' + name].transactions;
    const assetPrice = assetPrices[type + ':' + name];
    const $baseTx = $('#tx-template');

    $('.asset-tx').remove();

    let totalAmt = totalCost = 0;

    $.each(txData, (index, tx) => {
        const $newTx = $baseTx.clone();
        const txIsBuy = tx.type == 'Buy';

        $newTx.removeAttr('id').addClass('asset-tx');
        $newTx.attr('data-txindex', index);

        const formattedAmt = formatHoldingAmt(type, tx.amt);

        const cost = tx.amt * tx.cost_per;
        const costSign = txIsBuy ? '' : '-';
        const formattedCost = '$' + roundDollarValue(cost);

        const value = tx.amt * assetPrice;
        const profitLoss = value - cost;

        $newTx.find('.tx-type').text(tx.type);
        $newTx.find('.tx-amt').text(formattedAmt);
        $newTx.find('.tx-cps').text('$' + roundDollarValue(tx.cost_per));
        $newTx.find('.tx-cost').text(costSign + formattedCost);
        $newTx.find('.tx-value').html(txIsBuy ? '$' + roundDollarValue(value) : mDash);
        $newTx.find('.tx-pl').html(txIsBuy ? '$' + roundDollarValue(profitLoss) + ' (' + calcPercentPL(value, cost) + ')' : formattedCost);

        $('#table-total').before($newTx);

        if (txIsBuy) {
            totalCost += cost;
            totalAmt += tx.amt;
        }
        else {
            totalCost -= cost;
            totalAmt -= tx.amt;
        }
    });

    const avgCps = totalCost / totalAmt;
    const totalValue = totalAmt * assetPrice;
    const avgPL = totalValue - totalCost;

    $('#total-amt').text(totalAmt);
    $('#avg-cps').text('$' + roundDollarValue(avgCps));
    $('#total-cost').text('$' + roundDollarValue(totalCost));
    $('#total-value').text('$' + roundDollarValue(totalValue));
    $('#avg-pl').text('$' + roundDollarValue(avgPL) + ' (' + calcPercentPL(totalValue, totalCost) + ')');
}

function calcPercentPL(value, cost) {
    const pl = ((value - cost) / cost) * 100;
    return pl.toFixed(2) + '%';
}

function formatHoldingAmt(type, amt) {
    return (type == 'cryptocurrency') ? amt.toFixed(8) : amt.toFixed(3);
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
    if (value > 0 && value < 1) {
        return value.toFixed(4);
    }
    return value.toFixed(2);
}
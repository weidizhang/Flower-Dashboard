/*
 * @author Weidi Zhang
 */

const arrowUp = '&#9650;';
const arrowDown = '&#9660;';
const mDash = '&mdash;';

const dataStorage = new LocalStorage();

let holdingsChart;
let portfolioData, settingsData;
let initialLoad = true;

let timeBeforePriceUpdateDS = 0; // DS = Decisecond
let assetPrices = {};

$(document).ready(() => {
    loadPortfolio();
    loadSettings();

    loadPortfolioTabs();
    createHoldingsChart();

    attachTxDatePicker();

    $('[data-asset]').click(assetTabClick);

    $('#settings').click(settingsClick);
    $('#save-settings').click(saveSettingsClick);

    $('#manage').click(manageClick);

    $('#add-item').click(addItemClick);
    $('#save-add-asset').click(saveAssetClick);
    $('#add-asset-type').change(onAssetTypeChange);

    $('#save-add-tx').click(saveTxClick);

    priceRefreshTicker();
    setInterval(priceRefreshTicker, 100);
})

function loadPortfolio() {
    portfolioData = dataStorage.getPortfolioData();

    if (Object.keys(portfolioData).length <= 0) {
        $('#welcome').show();
        $('#holdings-chart').hide();
    }
}

function loadSettings() {
    settingsData = dataStorage.getSettingsData();
    $('#price-update-interval').val(settingsData.price_update_interval);
}

function attachTxDatePicker() {
    $('#add-tx-date').datepicker({
        autoclose: true,
        format: 'mm/dd/yyyy',
        todayHighlight: true
    });
}

function addItemClick() {
    const currentAsset = getCurrentAsset();
    if (currentAsset == 'dashboard:Total') {
        $('#add-asset-modal').modal('show');
    }
    else {
        $('#add-tx-modal').modal('show');
    }
}

function saveAssetClick() {
    const type = $('#add-asset-type').val();
    const name = $('#add-asset-name').val().toUpperCase();

    const isCryptocurrency = type == 'cryptocurrency';

    let tvChartSymbol = name;
    let cmcName;
    if (isCryptocurrency) {
        tvChartSymbol = $('#add-asset-tv').val().toUpperCase();
        cmcName = $('#add-asset-cmc').val().toLowerCase().replace(' ', '-');
    }

    const assetKey = type + ':' + name;
    portfolioData[assetKey] = {
        tv_chart: tvChartSymbol,
        transactions: []
    };

    if (isCryptocurrency && cmcName !== undefined) {
        portfolioData[assetKey].cmc_name = cmcName;
    }

    const isValidCryptocurrency = isCryptocurrency && tvChartSymbol && cmcName;
    if (type && name && (isValidCryptocurrency || !isCryptocurrency)) {
        dataStorage.setPortfolioData(portfolioData);
        alert('Success: The asset has been added.');
        location.reload();
    }
    else {
        alert('Error: The form was not completed correctly.');
    }
}

function saveTxClick() {
    const date = $('#add-tx-date').val();
    const type = $('#add-tx-type').val();
    const amt = parseFloat($('#add-tx-amt').val());
    const cost_per = parseFloat($('#add-tx-cps').val());

    const isValidType = type == 'Buy' || type == 'Sell';
    if (isValidDate(date) && isValidType && isValidNumber(amt) && isValidNumber(cost_per)) {
        const currentAsset = getCurrentAsset();
        portfolioData[currentAsset].transactions.push({
            date: date,
            type: type,
            amt: amt,
            cost_per: cost_per
        });

        portfolioData[currentAsset].transactions.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        dataStorage.setPortfolioData(portfolioData);

        alert('Success: The transaction has been added.');
        updateCurrentAsset();

        $('#add-tx-date').val('');
        $('#add-tx-type').val('Buy');
        $('#add-tx-amt').val('');
        $('#add-tx-cps').val('');
        $('#add-tx-modal').modal('hide');
    }
    else {
        alert('Error: The form was not completed correctly.');
    }
}

function isValidDate(date) {
    const dateParts = date.split('/');
    if (dateParts.length == 3) {
        const month = parseInt(dateParts[0]);
        const day = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);

        return isInClosedInterval(month, 1, 12) && isInClosedInterval(day, 1, 31) && isValidNumber(year);
    }
    return false;
}

function isInClosedInterval(number, min, max) {
    return number >= min && number <= max;
}

function isValidNumber(number) {
    return typeof(number) === 'number' && !isNaN(number);
}

function onAssetTypeChange() {
    $('#tv-symbol-form').toggle();
    $('#cmc-name-form').toggle();
}

function settingsClick() {
    $('#settings-modal').modal('show');
}

function saveSettingsClick() {
    settingsData.price_update_interval = parseInt($('#price-update-interval').val());
    dataStorage.setSettingsData(settingsData);
    $('#settings-modal').modal('hide');
}

function manageClick() {
    $('#manage-modal').modal('show');
}

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
    const $baseTab = $('[data-asset="dashboard:Total"]');
    let cryptoEmpty = stocksEmpty = true;

    $.each(portfolioData, (asset, data) => {
        const [assetType, assetName] = asset.split(':');

        if (assetType == 'cryptocurrency') {
            cryptoEmpty = false;
        }
        else if (assetType == 'stock') {
            stocksEmpty = false;
        }

        $newTab = $baseTab.clone();

        $newTab.attr('data-asset', asset);
        $newTab.find('li').attr('class', 'inactive');
        $newTab.find('.asset-name').text(assetName);

        $('#' + assetType).append($newTab);
    });

    if (cryptoEmpty) {
        $('#crypto-placeholder').show();
    }

    if (stocksEmpty) {
        $('#stock-placeholder').show();
    }
}

function onInitialLoadComplete() {
    initialLoad = false;

    $('#loading-screen').hide();
    $('.wrapper').show();
}

function updatePrices() {
    const numAssets = Object.keys(portfolioData).length;
    let completedPromises = 0;

    if (initialLoad && numAssets == 0) {
        onInitialLoadComplete();
        return;
    }

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

                assetPrices[asset] = {
                    price: data.price,
                    percent_change: percentChange
                };

                completedPromises++;
                if (completedPromises >= numAssets) {
                    if (initialLoad) {
                        onInitialLoadComplete();
                    }
                    updateOverview();
                    updateCurrentAsset();
                }
            });
        }
    });
}

function updateCurrentAsset() {
    const $tabElement = $('.list-unstyled .active').parent();
    assetTabClick($tabElement);
}

function getCurrentAsset() {
    return $('.list-unstyled .active').parent().data('asset');
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

function assetTabClick($tabElement) {
    let $tab = $tabElement;
    if ('type' in $tabElement) { // if $tabElement is a click event object
        $tab = $(this);
    }

    setActiveTab($tab);
    const [assetType, assetName] = $tab.data('asset').split(':');

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

    const formattedValue = $('[data-asset="dashboard:Total"] .asset-value').text();
    setHeaderText('Overview - Total Portfolio Value: ' + formattedValue);
}

function updateOverview() {
    const holdingData = getTotalHoldingData();
    const totalCost = sumKeyName(holdingData, 'cost'); // unused
    const totalValue = sumKeyName(holdingData, 'value');
    const totalValue24hAgo = sumKeyName(holdingData, 'value_24h_ago');

    const formattedValue = '$' + roundDollarValue(totalValue);

    const chartData = makeDataChartFriendly(holdingData);
    updateHoldingsChart(chartData.labels, chartData.data, chartData.colors);

    let changeArrow = arrowUp;
    let movementClass = 'movement-up';
    let overallPL = calcPercentPL(totalValue, totalValue24hAgo);
    const floatOverallPL = parseFloat(overallPL.substr(0, overallPL.length - 1));
    if (floatOverallPL < 0) {
        changeArrow = arrowDown;
        movementClass = 'movement-down';
        overallPL = overallPL.substr(1);
    }

    const $overviewAsset = $('[data-asset="dashboard:Total"]');
    $overviewAsset.find('.asset-value').text(formattedValue);
    $overviewAsset.find('.asset-percentage').text(overallPL);
    $overviewAsset.find('.asset-arrow').html(changeArrow);
    $overviewAsset.find('.asset-change').removeClass('movement-up').removeClass('movement-down').addClass(movementClass);
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

function getTotalHoldingData() {
    let holdingData = {}

    $.each(portfolioData, (asset, data) => {
        const assetPrice = assetPrices[asset].price;
        const assetChange = assetPrices[asset].percent_change;

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

        const price24hAgo = assetPrice / (1 + (assetChange / 100));

        holdingData[asset].value = holdingData[asset].amt * assetPrice;
        holdingData[asset].value_24h_ago = holdingData[asset].amt * price24hAgo;
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

function loadTransactions(type, name) {
    const txData = portfolioData[type + ':' + name].transactions;
    const assetPrice = assetPrices[type + ':' + name].price;
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

        $newTx.find('.tx-date').text(tx.date);
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
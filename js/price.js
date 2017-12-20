/*
 * @author Weidi Zhang
 */

async function getPriceData(priceObj) {
    const response = await fetch(priceObj.apiEndpoint());
    const jsonData = await response.json();

    return {
        price: priceObj.getPrice(jsonData),
        percent: priceObj.getPercentChange(jsonData)
    };
}

class CoinMarketCap {
    constructor(tickerFullName) {
        this.name = tickerFullName;
    }

    apiEndpoint() {
        return 'https://api.coinmarketcap.com/v1/ticker/' + this.name + '/';
    }

    getPrice(jsonData) {
        const priceUsd = parseFloat(jsonData[0].price_usd);
        if (priceUsd < 1) {
            return priceUsd.toFixed(4);
        }
        return priceUsd.toFixed(2);
    }

    getPercentChange(jsonData) {
        return jsonData[0].percent_change_24h;
    }
}

class GoogleFinance {
    constructor(tickerSymbol) {
        this.symbol = tickerSymbol;
    }

    apiEndpoint() {
        return 'https://finance.google.com/finance?q=' + this.symbol + '&output=json';
    }

    getPrice(jsonData) {
        return jsonData[0].l;
    }

    getPercentChange(jsonData) {
        return jsonData[0].cp;
    }
}
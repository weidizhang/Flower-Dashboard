/*
 * @author Weidi Zhang
 */

const portfolioData = {
    ETH: {
        type: 'cryptocurrency',
        price_source: 'Coinbase',
        tv_chart: 'COINBASE:ETHUSD',
        transactions: [
            {
                type: 'Buy',
                amt: 1,
                cost_per: 400
            }
        ]
    },
    NEO: {
        type: 'cryptocurrency',
        price_source: 'Bittrex',
        tv_chart: 'BITTREX:NEOUSDT',
        transactions: [
            {
                type: 'Buy',
                amt: 15,
                cost_per: 20
            },
            {
                type: 'Sell',
                amt: 5,
                cost_per: 50
            }
        ]
    },
    XLF: {
        type: 'stock',
        price_source: '',
        tv_chart: 'XLF',
        transactions: [
            {
                type: 'Buy',
                amt: 30,
                cost_per: 25
            }
        ]
    }
};
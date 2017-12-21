/*
 * @author Weidi Zhang
 */

const portfolioData = {
    'cryptocurrency:ETH': {
        tv_chart: 'COINBASE:ETHUSD',
        cmc_name: 'ethereum',
        transactions: [
            {
                type: 'Buy',
                amt: 1,
                cost_per: 400
            }
        ]
    },
    'cryptocurrency:NEO': {
        tv_chart: 'BITTREX:NEOUSDT',
        cmc_name: 'neo',
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
    'stock:XLF': {
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

const settingsData = {
    price_update_interval: 60
}
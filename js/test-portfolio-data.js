/*
 * @author Weidi Zhang
 */

const portfolioData = {
    cryptocurrency: [
        {
            name: 'ETH',
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
        {
            name: 'NEO',
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
        }
    ],
    stock: [
        {
            name: 'XLF',
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
    ]
};
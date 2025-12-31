import { convertFromUSD } from './src/modules/currency/currency.service.js';

async function testCurrency() {
    console.log('Testing convertFromUSD...');
    try {
        const amountUSD = 100;

        const eur = await convertFromUSD(amountUSD, 'EUR');
        console.log(`100 USD to EUR: ${eur}`);

        const cny = await convertFromUSD(amountUSD, 'CNY');
        console.log(`100 USD to CNY: ${cny}`);

        const usd = await convertFromUSD(amountUSD, 'USD');
        console.log(`100 USD to USD: ${usd}`);

        if (eur === 100) console.error('FAIL: EUR should not equal USD amount (unless parity)');
        if (cny === 100) console.error('FAIL: CNY should not equal USD amount');
        if (usd !== 100) console.error('FAIL: USD should equal USD amount');

        console.log('Done.');
    } catch (e) {
        console.error('Error:', e);
    }
}

testCurrency();

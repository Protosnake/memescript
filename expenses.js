const fs = require('fs');
const moment = require('moment');
const csv = require('csv-parser');
const csvWriter = require('csv-write-stream');
const path = __dirname + '/expenses.csv';

function run() {
    let investment = 0;
    let ad_revenue = 0;
    let total_expenses = 0;
    // ['оп','дата','сумма','валюта','статус','название']
    fs.createReadStream(path).pipe(csv({separator: ';', skipLines: 4})).on('data', row => {
        if(row['+/-'] == '+') {
            if (row['name'].includes('Пополнение с карты ****1321')) investment += parseInt(row['amount'])
            else ad_revenue += parseInt(row['amount']);
        } else if(row['+/-'] == '-') {
            total_expenses += parseInt(row['amount']);
        }
    })
    .on('end', () => {
        console.log(`Расходы за месяц ${total_expenses} руб`)
        console.log(`Доходы от рекламы за месяц составили ${ad_revenue} руб`)
        console.log(`Инвестировано за месяц ${investment} руб`);
    })
    .on('error', error => console.log(error));
}

run()
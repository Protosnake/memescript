const fs = require('fs');
const moment = require('moment');
const csv = require('csv-parser');
const csvWriter = require('csv-write-stream');
const { exception } = require('console');
// const path = __dirname + '/expenses.csv';

function run() {
    let path = process.argv.slice(2)[0];
    if (!path) throw new exception("No CSV passed");
    let investment = 0;
    let ad_revenue = 0;
    let total_expenses = 0;
    fs.createReadStream(path).pipe(csv({separator: ';', skipLines: 4})).on('data', row => {
        if(row['+/-'] == '+') {
            if (row['name'].includes('Пополнение с карты ****1321')) investment += parseInt(row['amount'])
            else ad_revenue += parseInt(row['amount']);
        } else if(row['+/-'] == '-') {
            if(!(row['name'].includes('списание по операции') || row['name'].includes('банкомате'))) total_expenses += parseInt(row['amount']);
        }
    })
    .on('end', () => {
        console.log(`Расходы за месяц: ${total_expenses} руб`)
        console.log(`Доходы от рекламы за месяц составили: ${ad_revenue} руб`)
        console.log(`Инвестировано за месяц: ${investment} руб`);
        console.log(`Прибыль за месяц: ${ad_revenue - total_expenses}`)
    })
    .on('error', error => console.log(error));
}

run()
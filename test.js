const fs = require('fs');
const csv = require('csv-parser');

const threadIds = [];
// fs.createReadStream(__dirname + '/threadIds.csv')
//     .pipe(csv())
//     .on('data', (row) => {
//         threadIds.push(row.threadId);
//     })
//     .on('end', () => console.log(threadIds))


let file = fs.readFileSync(__dirname + '/threadIds.csv');

console.log(file)
// console.log(fs.readFileSync(__dirname + '/threadIds.csv'));
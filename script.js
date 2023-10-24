var lcy = "S$"

const dailySpendLimit = 45;

const dbName = "YAET"
const dbStoreName = "expenses"

if (!('indexedDB' in window)) {
    console.log("This browser doesn't support IndexedDB");
    document.getElementsByTagName('body')[0].innerHTML = "This browser doesn't support IndexedDB";
}

const dbPromise = idb.openDB(dbName, 1, {
    upgrade(db) {
        const objectStore = db.createObjectStore(dbStoreName, { keyPath: '_id', });
        objectStore.createIndex("_id", "_id", { unique: true });
    },
});

let yearlyList = [ ]
let monthlyList = [ ]
let dailyList = [ ]

let monthlyListGroup = [ ]
let dailyListGroup = [ ]

function displayTasks() {
    document.getElementById("tblBody").innerHTML = ""

    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readonly');
        const store = tx.objectStore(dbStoreName);
        return store.getAll();
    }).then(expenses => {
        expenses.sort(function(a,b){
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.expenseInputDateTime) - new Date(a.expenseInputDateTime);
        });

        var ytdValue = 0;
        var mtdValue = 0;
        var dailyValue = 0;

        var today = new Date()
        var todayDd = String(today.getDate()).padStart(2, '0');
        var todayMm = String(today.getMonth() + 1).padStart(2, '0');
        var todayYyyy = today.getFullYear();
        var todayStr =  todayDd + '/' + todayMm + '/' + todayYyyy;
        
        expenses.forEach(element => {
            var expenseDate = new Date(element.expenseDate)
            var expenseDateStr =  String(expenseDate.getDate()).padStart(2, '0') + '/' + String(expenseDate.getMonth() + 1).padStart(2, '0') + '/' + expenseDate.getFullYear();

            if(expenseDateStr == todayStr){ 
                dailyValue += parseFloat(element.expenseValue) 
            }
            if(todayMm == String(expenseDate.getMonth() + 1).padStart(2, '0')){ 
                mtdValue += parseFloat(element.expenseValue) 
                dailyList.push({
                    label: expenseDateStr.substr(0, 2),
                    dataValue: parseFloat(element.expenseValue)
                })
            }
            if(todayYyyy == expenseDate.getFullYear()){ 
                ytdValue += parseFloat(element.expenseValue)
                monthlyList.push({
                    label: expenseDateStr.substr(3),
                    dataValue: parseFloat(element.expenseValue)
                })
            }

            let _tmp = ""
            _tmp += "<tr>"
            _tmp += `<td>${element.expenseDate}</td>`
            _tmp += `<td>${lcy} ${element.expenseValue}</td>`
            _tmp += `<td>${element.expenseTypes.join(", ")}<br>${element.expenseNotes}</td>`
            _tmp += `<td>${element.expenseInputDateTime}<br>`
            _tmp += `<button type='button' id='btn_del_${element._id}' class='btn btn-secondary' onclick='removeExpenseCfm(this)'>X</button>`
            _tmp += `&nbsp;&nbsp;<button type='button' id='btn_del_cfm_${element._id}' class='btn btn-danger d-none' onclick='removeExpense(this)'>&check;</button>`
            _tmp += `</td>`
            _tmp += "</tr>"
            document.getElementById("tblBody").innerHTML += _tmp
        });

        document.getElementById("ytdValue").innerHTML   = lcy + ytdValue.toFixed(2)
        document.getElementById("mtdValue").innerHTML   = lcy + mtdValue.toFixed(2)
        document.getElementById("dailyValue").innerHTML = lcy + dailyValue.toFixed(2)

        monthlyListGroup= _(monthlyList).groupBy('label').map((dataRow, id) => ({
            label: id,
            sumValue: _.sumBy(dataRow, 'dataValue'),
        })).value()

        dailyListGroup = _(dailyList).groupBy('label').map((dataRow, id) => ({
                label: id,
                sumValue: _.sumBy(dataRow, 'dataValue'),
            })).value()

        document.getElementById("dailyValuePct").innerHTML = (dailyValue/dailySpendLimit*100).toFixed(0) + "%"
        if(dailyValue <= 0){
            
        }else if(dailyValue <= (dailySpendLimit * 0.8)){
            document.getElementById("dailyValBox").classList.add("bg-success")
            document.getElementById("dailyValBox").classList.add("text-white")
        }else if(dailyValue <= (dailySpendLimit)){
            document.getElementById("dailyValBox").classList.add("bg-warning")
            document.getElementById("dailyValBox").classList.add("text-white")
        }else{
            document.getElementById("dailyValBox").classList.add("bg-danger")
            document.getElementById("dailyValBox").classList.add("text-white")
        }


        let mtdDailyValAvg = mtdValue / dailyListGroup.length;
        // console.log(mtdDailyValAvg)
        document.getElementById("mtdValuePct").innerHTML = (mtdDailyValAvg/dailySpendLimit*100).toFixed(0) + "%"
        if(mtdDailyValAvg <= 0){
            
        }else if(mtdDailyValAvg <= (dailySpendLimit * 0.8)){
            document.getElementById("mtdValBox").classList.add("bg-success")
            document.getElementById("mtdValBox").classList.add("text-white")
        }else if(mtdDailyValAvg <= (dailySpendLimit)){
            document.getElementById("mtdValBox").classList.add("bg-warning")
            document.getElementById("mtdValBox").classList.add("text-white")
        }else{
            document.getElementById("mtdValBox").classList.add("bg-danger")
            document.getElementById("mtdValBox").classList.add("text-white")
        }
    });
}

function resetForm(){
    document.getElementById("display").innerHTML = "0";
    document.getElementById('final_numeric').innerHTML = lcy + " 0";
    document.getElementById('final_spend_types').innerHTML = "";
    document.getElementById('expenseNotes').value = "";

    spendTypes = [ ]
    
    var buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(function(button) {
        if (button.classList.contains('active')) {
            button.setAttribute('aria-pressed', 'false');
            button.classList.remove('active')
        }
    });
}

function addExpenses(multiplier) {    
    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readwrite');
        const store = tx.objectStore(dbStoreName);
        var _expense_entry = {
            expenseValue: document.getElementById('display').innerHTML,
            expenseTypes: spendTypes,
            expenseDate: document.getElementById("displayDate").innerHTML,
            expenseInputDateTime: new Date(),
            expenseNotes: document.getElementById('expenseNotes').value,
        }
        var _exp_id = objectHash.sha1(_expense_entry)
        _expense_entry._id = _exp_id
        store.add(_expense_entry);
        return tx.complete;
    }).then(() => {
        resetForm()
    });
}

function removeExpenseCfm(element) {
    if(document.getElementById("btn_del_cfm_"+element.id.substr(8)).classList.contains("d-none")){
        document.getElementById("btn_del_cfm_"+element.id.substr(8)).classList.remove("d-none")
    }else{
        document.getElementById("btn_del_cfm_"+element.id.substr(8)).classList.add("d-none")
    }
}

function removeExpense(element) {
    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readwrite');
        const store = tx.objectStore(dbStoreName);
        store.delete(element.id.substr(12));
        return tx.complete;
    }).then(() => {
        displayTasks();
    });
}

function downloadJSON() {
    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readonly');
        const store = tx.objectStore(dbStoreName);
        return store.getAll();
    }).then(tasks => {
        const data = JSON.stringify(tasks, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'yaet.json';
        a.click();
    });
}

function downloadCSV() {
    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readonly');
        const store = tx.objectStore(dbStoreName);
        return store.getAll();
    }).then(tasks => {
        const csvData = tasks.map(task => task.text).join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'yaet.csv';
        a.click();
    });
}

function resetDatabase() {
    Swal.fire({
        title: 'Proceed to reset database? Ensure you have download your data',
        showDenyButton: true,
        confirmButtonText: 'Yes, reset Database',
        denyButtonText: `No, thanks`,
    }).then((result) => {
        if (result.isConfirmed) {
            dbPromise.then(db => {
                const tx = db.transaction(dbStoreName, 'readwrite');
                const store = tx.objectStore(dbStoreName);
                return store.clear();
            }).then(() => {
                displayTasks();
            });
        }
    })
}

function showDailyExpensesChart(){
    dailyListGroup = dailyListGroup.sort((a, b) => {
        if (a.label < b.label) {
            return -1;
        }
        if (a.label > b.label) {
            return 1;
        }
        return 0;
    });
    ctx.data.labels = _.map(dailyListGroup, 'label');
    ctx.data.datasets[0].data =  _.map(dailyListGroup, 'sumValue');
    ctx.update();
}

function showMonthlyExpensesChart(){
    monthlyListGroup = monthlyListGroup.sort((a, b) => {
        if (a.label < b.label) {
            return -1;
        }
        if (a.label > b.label) {
            return 1;
        }
        return 0;
    });
    ctx.data.labels = _.map(monthlyListGroup, 'label');
    ctx.data.datasets[0].data =  _.map(monthlyListGroup, 'sumValue');
    ctx.update();
}

function showExpenseChart(chartType){
    if(document.getElementById('expenseChart').classList.contains("d-none")){
        new Promise((resolve,) => {
            if(chartType == 1){
                showDailyExpensesChart()
                resolve();
            }
            if(chartType == 2){
                showMonthlyExpensesChart()
                resolve();
            }
        }).then((resolveValue) => {   
            document.getElementById('expenseChart').classList.remove("d-none")
        })
    }else{
        document.getElementById('expenseChart').classList.add("d-none")
    }
}
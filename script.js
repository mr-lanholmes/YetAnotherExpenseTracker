var lcy = "S$"

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

function displayTasks() {
    document.getElementById("tblBody").innerHTML = ""

    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readonly');
        const store = tx.objectStore(dbStoreName);
        return store.getAll();
    }).then(expenses => {
        console.log(expenses)
        expenses.sort(function(a,b){
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.expenseInputDateTime) - new Date(a.expenseInputDateTime);
        });
        
        expenses.forEach(element => {
            let _tmp = ""
            _tmp += "<tr>"
            _tmp += `<td>${element.expenseDate}</td>`
            _tmp += `<td>${lcy} ${element.expenseValue}</td>`
            _tmp += `<td>${element.expenseTypes.join(", ")}<br>${element.expenseNotes}</td>`
            _tmp += `<td>${element.expenseInputDateTime}<br>`
            _tmp += `<button type='button' id='btn_del_${element._id}' class='btn btn-danger' onclick='removeExpense(this)'>X</button></td>`
            _tmp += "</tr>"
            document.getElementById("tblBody").innerHTML += _tmp
        });
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

function addExpenses() {    
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

function removeExpense(element) {
    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readwrite');
        const store = tx.objectStore(dbStoreName);
        console.log(element.id, element.id.substr(8))
        store.delete(element.id.substr(8));
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
    dbPromise.then(db => {
        const tx = db.transaction(dbStoreName, 'readwrite');
        const store = tx.objectStore(dbStoreName);
        return store.clear();
    }).then(() => {
        displayTasks();
    });
}
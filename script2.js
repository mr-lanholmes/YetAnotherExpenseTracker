
var spendTypes = [ ];
let itemsArray = localStorage.getItem('items') ? JSON.parse(localStorage.getItem('items')) : [ ];

function setDate(d){
    var currDate = d.getDate();
    var currMonth = d.getMonth();
    var currYear = d.getFullYear();
    var dateStr = currYear + "-" + currMonth + "-" + currDate;
    document.getElementById("dateSelector").valueAsDate = d
    document.getElementById("displayDate").innerHTML = moment(document.getElementById("dateSelector").valueAsDate).format('dddd, DD MMM YYYY');
}
setDate(new Date());

function changeDate(component){
    setDate(component.valueAsDate)
}

function addToDisplay(component) {
    var prevNumber = document.getElementById('display').innerHTML
    if(prevNumber=='0'){
        document.getElementById('display').innerHTML = component.innerHTML
        return
    }
    document.getElementById('display').innerHTML += component.innerHTML
                
    var t = document.getElementById('display').innerHTML;
    document.getElementById('display').innerHTML = t.indexOf(".") >= 0 ? t.slice(0, t.indexOf(".") + 3) : t;

    document.getElementById('final_numeric').innerHTML = lcy + " " + document.getElementById('display').innerHTML
}

function addToSpendType(component, name){
    document.getElementById('final_numeric').innerHTML = lcy + " " + document.getElementById('display').innerHTML
    
    if(component.getAttribute('aria-pressed') == "true"){
        spendTypes.push(name.toUpperCase())
    }else{
        spendTypes = spendTypes.filter(e => e !== name.toUpperCase())
    }
    document.getElementById('final_spend_types').innerHTML = spendTypes.join(", ")
}

function clearDisplay() {
    var prevNumber = document.getElementById('display').innerHTML
    if(document.getElementById('display').innerHTML.length > 0){
        document.getElementById('display').innerHTML = prevNumber.substring(0, prevNumber.length - 1)
    }
}
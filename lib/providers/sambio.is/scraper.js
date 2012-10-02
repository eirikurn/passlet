if (!~document.location.href.indexOf('/Invoice/')) {
  alert("Please click this bookmarklet on an invoice page.");
  return;
}

var INVOICE = /\d+/
  , COST = /(\d+\.)?\d+/
  , DATE = /\((\d+)\.(\d+)\.(\d+)\)/
  , TIME = /(\d+):(\d+)/
  , EVENT_NAME = /- (.+) \(/
  , invoiceNr, cost, otherInfo, date, time, eventName, passData;

invoiceNr = $('.smalltabs .tabSelected').text();
invoiceNr = (INVOICE.exec(invoiceNr) || [])[0];
invoiceNr = parseInt(invoiceNr, 10);

cost = $('#content .txt_big').text();
cost = (COST.exec(cost) || [""])[0].replace('.', '');
cost = parseInt(cost, 10);

otherInfo = $('#content tr:eq(1) .td_f').text();
date = (DATE.exec(otherInfo) || []);
time = (TIME.exec(otherInfo) || []);
date = new Date(parseInt(date[3],10), parseInt(date[2],10), parseInt(date[1],10), parseInt(time[1],10), parseInt(time[2],10));

eventName = (EVENT_NAME.exec(otherInfo) || [])[1];

if (isNaN(invoiceNr) || isNaN(cost) || isNaN(date.valueOf()) || !eventName) {
  alert('Trouble scraping ticket information.');
  return;
}

passData = {
  invoiceNr: invoiceNr,
  cost: cost,
  date: date,
  eventName: eventName
};

createPass(passData);
(function($, window, document, undefined) {

  'use strict';

  var VISIBLE_ROWS = 10;
  var model = { bills: [] };

  $(function() {

    Handlebars.registerHelper("dateFormat", function(date, formatOption) {
      var format = formatOption || 'LLLL';
      return moment(date).format(format);
    });
    Handlebars.registerHelper("numberFormat", function(value, digits) {
      return value.toFixed(digits.hash.digits);
    });

    $.getJSON('rest/consumption', function(bills) {
      console.log('got it');
      bills.sort(function(bill1, bill2) {
          return bill2.mileage - bill1.mileage;
        })
        .map(function(bill, index, data) {
          bill.date = new Date(bill.date);
          if (index < data.length - 1) {
            bill.distance = bill.mileage - data[index + 1].mileage;
          }
          bill.pricePerLiter = bill.price / bill.quantity;
          return bill;
        });
      model.bills = bills;
      updateView({ currentPage: 0 });
    });

    $('#page-navigation').on("click", ".pagination li.page-item", function(e) {
      updateView({ currentPage: 1 })
    });

  });

  function updateView(data) {
    updateTable(data);
    updatePagination(data);
  }

  function updateTable(data) {
    var consumptionTable = $('#consumption-table');
    var source = $("#consumption-row-template").html();
    var template = Handlebars.compile(source);

    var totalPages = Math.ceil(model.bills.length / VISIBLE_ROWS);
    var bills = model.bills.slice(data.currentPage * VISIBLE_ROWS, (data.currentPage + 1) * VISIBLE_ROWS);

    var substitute = template({ bills: bills });
    consumptionTable.find('tbody').replaceWith(substitute);
  }

  function updatePagination(data) {
    var pageNavigation = $('#page-navigation');
    var source = $("#pagination-template").html();
    var template = Handlebars.compile(source);

    var pages = [];
    var totalPages = Math.ceil(model.bills.length / VISIBLE_ROWS);
    for (var i = 0; i < totalPages; i++) {
      pages.push({ display: i + 1, active: i == data.currentPage });
    }

    var substitute = template({ pages: pages });
    pageNavigation.find('ul').replaceWith(substitute);
  }

})(jQuery, window, document);

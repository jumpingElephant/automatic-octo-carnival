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
    Handlebars.registerHelper("pageitem", function(index, active) {
      var paginationItemTemplate = Handlebars.compile($("#pagination-item-template").html());
      var r = paginationItemTemplate({ index: index, display: index + 1, active: active });
      return r;
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

    $('#new-entry-btn').on('click', function() {
      console.log('create new entry')
    });

    $('#page-navigation').on("click", ".pagination li.page-item", function(e) {
      var gotocmd = $(e.currentTarget).data('goto');
      if (typeof gotocmd === "number") {
        updateView({ currentPage: gotocmd })
      } else {
        var currentPage = $(e.currentTarget).parent().find('li.active').first().data('goto');
        if (gotocmd === "next") {
          currentPage = Math.min(currentPage + 1, Math.ceil(model.bills.length / VISIBLE_ROWS) - 1);
        } else if (gotocmd === "previous") {
          currentPage = Math.max(currentPage - 1, 0);
        }
        updateView({ currentPage: currentPage });
      }
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
    var paginationTemplate = Handlebars.compile($("#pagination-template").html());

    var pages = [];
    var totalPages = Math.ceil(model.bills.length / VISIBLE_ROWS);
    for (var i = 0; i < totalPages; i++) {
      pages.push({ index: i, display: i + 1, active: i == data.currentPage });
    }

    var substitute = paginationTemplate({ pages: pages });
    pageNavigation.find('ul').replaceWith(substitute);
  }

})(jQuery, window, document);

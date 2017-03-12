(function($, window, document, undefined) {

  'use strict';

  $(function() {
    var consumptionTable = $('#consumption-table');
    var source = $("#consumption-row-template").html();
    var template = Handlebars.compile(source);

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
      var substitute = template({ bills: bills });
      consumptionTable.find('tbody').replaceWith(substitute);

    });

  });

})(jQuery, window, document);

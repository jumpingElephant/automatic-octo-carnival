(function($, window, document, undefined) {

  'use strict';

  $(function() {
    console.log('it works');

    var consumptionTable = $('#consumption-table');
    var source = $("#consumption-row-template").html();
    var template = Handlebars.compile(source);

    var data = {
      bills: [{
        index: 1,
        date: "01.01.2017",
        mileage: 42000,
        totalPrice: 42
      }, {
        index: 2,
        date: "01.01.2017",
        mileage: 42000,
        totalPrice: 42
      }]
    };
    consumptionTable.append(template(data));

  });

})(jQuery, window, document);

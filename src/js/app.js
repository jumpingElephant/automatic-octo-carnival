(function($, window, document, undefined) {

  'use strict';

  $(function() {
    console.log('it works');

    var template = $('#consumption-row-template').html();
    var consumptionTable = $('#consumption-table');
    for (var i = 0; i < 3; i++) {
      consumptionTable.append(template);
    }

  });

})(jQuery, window, document);

(function($, window, document, undefined) {

  'use strict';

  var VISIBLE_ROWS = 10;
  var model = { bills: [] };

  $(function() {

    Handlebars.registerHelper("dateFormat", function(date, formatOption) {
      var format = formatOption || 'LLLL';
      return moment(date).format(format);
    });
    Handlebars.registerHelper("numberFormat", function(value, formatOption) {
      if (value) {
        var text = value.toFixed(formatOption.hash.digits);
        if (formatOption.hash.postfix) {
          text += " " + formatOption.hash.postfix;
        }
        return text;
      }
    });
    Handlebars.registerHelper("pageitem", function(index, active) {
      var paginationItemTemplate = Handlebars.compile($("#pagination-item-template").html());
      var r = paginationItemTemplate({ index: index, display: index + 1, active: active });
      return r;
    });

    loadCarSelection();
    loadData();

    $('#consumption-table').on('click', 'tr td button.btn-danger', function(e) {
      var id = $(e.currentTarget).data('id');
      if (id) {
        $.ajax({ url: 'api/consumption/Audi_A3/bills/' + id, type: 'DELETE' })
          .done(function(data) {
            loadData();
          });
      }
    });

    $('#page-navigation').on('click', '.pagination li.page-item', function(e) {
      var gotocmd = $(e.currentTarget).data('goto');
      if (typeof gotocmd === "number") {
        updateView({ currentPage: gotocmd });
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

    $('#entryModal #submitButton').on('click', saveBill);

    $('#mileageInput').keyup(function(e) {
      var mileage = Number.parseInt($(e.currentTarget).val());
      if (mileage) {
        $('#currentDistance').text(mileage - model.bills[0].mileage);
      }
    });
    $('#quantityInput, #priceInput').keyup(function(event) {
      var quantity = Number.parseFloat($('#quantityInput').val());
      var price = Number.parseFloat($('#priceInput').val());
      if (isFinite(quantity) && isFinite(price)) {
        var text = (price / quantity).toFixed(3);
        $('#pricePerLiter').val(text + ' €/l');
      }
    });
    $('#entryModal input').keyup(function(event) {
      if (event.keyCode === 13) {
        saveBill();
      }
    });
    $('#entryModal #dateInput').keydown(function(event) {

      var dateInput = $('#dateInput');
      var dateString = dateInput.val();

      var date = moment(dateString);
      if (!date.isValid()) {
        date = moment(dateString, 'DD.MM.YYYY');
      }
      if (date.isValid()) {
        var newDate;
        if (event.key === '-') {
          newDate = date.subtract(1, 'days');
        } else if (event.key === '+') {
          newDate = date.add(1, 'days');
        }
        if (newDate) {
          dateInput.val(newDate.format(nativeDateFormat()));
          event.preventDefault();
        }
      }
      if (event.key === 'h') {
        var newDate = moment();
        dateInput.val(newDate.format(nativeDateFormat()));
        event.preventDefault();
      }
    });
  });

  function saveBill() {
    var dateString = $('#dateInput').val();
    var mileage = $('#mileageInput').val();
    var quantity = $('#quantityInput').val();
    var price = $('#priceInput').val();

    var date = moment(dateString);
    if (!date.isValid()) {
      date = moment(dateString, 'DD.MM.YYYY');
    }
    if (!date.isValid()) {
      console.error('failed to parse dateString');
    }

    var entry = {
      date: date.format('YYYY-MM-DD'),
      mileage: mileage,
      quantity: quantity,
      price: price
    };
    $('#alert-container').empty();
    $.post({
      url: 'api/consumption/Audi_A3/bills',
      data: JSON.stringify(entry),
      dataType: 'json'
    }).done(function(msg) {
      $('#entryModal').modal('hide');
      loadData();
    }).fail(function(response) {
      var error = JSON.parse(response.responseText).error;
      $('#alert-container').append(createAlert({ summary: error.message }));
    });
  }

  function loadCarSelection() {
    $.getJSON('api/consumption', function(cars) {
      var carSelection = $('#car-selection');
      var source = $('#car-template').html();
      var template = Handlebars.compile(source);

      var substitute = template({ cars: cars });
      carSelection.replaceWith(substitute);
    });
  }

  function loadData(currentPage) {
    $.getJSON('api/consumption/Audi_A3/bills', function(bills) {

        bills.sort(function(bill1, bill2) {
            return bill2.mileage - bill1.mileage;
          })
          .map(function(bill, index, data) {
            bill.date = new Date(bill.date);
            if (index < data.length - 1) {
              bill.distance = bill.mileage - data[index + 1].mileage;
              bill.literPerCentum = bill.quantity * 100 / bill.distance;
            }
            bill.pricePerLiter = bill.price / bill.quantity;
            return bill;
          });
        model.bills = bills;
        updateView({ currentPage: currentPage || 0 });
      })
      .fail(function() {
        var tableContainer = $('#table-cntr');
        tableContainer.addClass('loading-failure');
      })
      .always(function() {
        var tableContainer = $('#table-cntr');
        tableContainer.removeClass('loading');
      });
  }

  $(document).ready(function() {
    $('#entryModal').on('show.bs.modal', function(event) {
      var button = $(event.relatedTarget);
      var mode = button.data('mode');
      var modal = $(this);
      if (mode === 'create') {
        modal.find('.modal-title').text('Neuer Eintrag');
        modal.find('.modal-body #dateInput').val(moment().format(nativeDateFormat()));
        modal.find('.modal-body #mileageInput').val(undefined);
        modal.find('.modal-body #quantityInput').val(undefined);
        modal.find('.modal-body #priceInput').val(undefined);
        modal.find('#submitButton').text('Erstellen');
      }
      if (model.bills[0]) {
        $('#lastEntryMileage').text(model.bills[0].mileage);
      }
      $('#currentDistance').text('-');
    });

    $('#entryModal').on('shown.bs.modal', function(event) {
      document.getElementById('dateInput').focus();
      document.getElementById('dateInput').select();
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

  function createAlert(msg) {
    var alertTemplate = Handlebars.compile($("#alert-template").html());
    return alertTemplate(msg);
  }

  function isDateSupported() {
    var i = document.createElement("input");
    i.setAttribute("type", "date");
    return i.type !== "text";
  }

  function nativeDateFormat() {
    if (isDateSupported()) {
      return 'YYYY-MM-DD';
    } else {
      return 'DD.MM.YYYY';
    }
  }

})(jQuery, window, document);

'use strict';

ci.newApp = {};

// ready event
ci.newApp.ready = function() {

  // selector cache
  var $checkbox = $('.ui.form').find('.ui.checkbox');
  var $dropdown = $('.ui.form').find('.ui.dropdown');
  var $dropdownAdd = $('.ui.form').find('.ui.dropdown.addition');

  // event handlers
  var handler = {

  };

  $checkbox.checkbox();
  $dropdown.dropdown({fullTextSearch: true});
  $dropdownAdd.dropdown({allowAdditions: true});
};


// attach ready event
$(document).ready(ci.newApp.ready);

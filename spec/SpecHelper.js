// Add an alias to make things more like rspec
var context  = describe;
var xcontext = xdescribe;

// Define some keycodes to make tests more readable
var KEYS = {
  TAB:          9,
  LEFT_ARROW:  37,
  UP_ARROW:    38,
  RIGHT_ARROW: 39,
  DOWN_ARROW:  40
};

// Function to trigger key presses (firefox)
function pressKey($table, keyCode) {
  var keypress = $.Event('keydown');
  keypress.which = keyCode;
  var element = $table.data('selectedCell');
  $(element).trigger(keypress);
}

beforeEach(function() {
  this.addMatchers({
    toBeSelectedIn: function($table) {
      return ($table.data('selectedCell').id == this.actual.id) &&
        (document.activeElement.id == this.actual.id);
    }
  });
});

// Disable fixture caching
var _oldLoadFixtures = loadFixtures;
loadFixtures = function(l) {
  _oldLoadFixtures(l + "?" + new Date());
};

// For debugging
function ut() {
  loadFixtures('uniform_table.html');
  $('#uniform-table').focusgrid({debug : true});
}
function ct() {
  loadFixtures('colspan_table.html');
  $('#colspan-table').focusgrid({debug : true});
}
function rt() {
  loadFixtures('rowspan_table.html');
  $('#rowspan-table').focusgrid({debug : true});
}
function ect() {
  loadFixtures('empty_cell_table.html');
  $('#empty-cell-table').focusgrid({debug : true});
}
function et() {
  loadFixtures('evil_table.html');
  $('#evil-table').focusgrid({debug : true});
}
function nict() {
  loadFixtures('no_initial_cell_table.html');
  $('#no-initial-cell-table').focusgrid({debug : true});
  $('#no-initial-cell-table-expert').focusgrid({debug : true,
                                                tabIndexStart: 600});
}
function nt() {
  loadFixtures('nested_table.html');
  $('#nested-table').focusgrid({debug : true});
}
function mt() {
  loadFixtures('multigrid_table.html');

  $('#multigrid-table').focusgrid({debug : true, grouping: ['.primary-row', '.secondary-row']});
  $('#even-odd-table').focusgrid({debug : true, 
                                  grouping: [':even', ':odd'],
                                  tabIndexStart: 600});
}

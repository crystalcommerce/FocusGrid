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
  loadFixtures('/__root__/spec/fixtures/uniform_table.html');
  $('#uniform-table').focusgrid({debug : true});
}
function ct() {
  loadFixtures('/__root__/spec/fixtures/colspan_table.html');
  $('#colspan-table').focusgrid({debug : true});
}
function rt() {
  loadFixtures('/__root__/spec/fixtures/rowspan_table.html');
  $('#rowspan-table').focusgrid({debug : true});
}
function ect() {
  loadFixtures('/__root__/spec/fixtures/empty_cell_table.html');
  $('#empty-cell-table').focusgrid({debug : true});
}
function et() {
  loadFixtures('/__root__/spec/fixtures/evil_table.html');
  $('#evil-table').focusgrid({debug : true});
}
function nict() {
  loadFixtures('/__root__/spec/fixtures/no_initial_cell_table.html');
  $('#no-initial-cell-table').focusgrid({debug : true});
  $('#no-initial-cell-table-expert').focusgrid({debug : true,
                                                tabIndexStart: 600});
}
function nt() {
  loadFixtures('/__root__/spec/fixtures/nested_table.html');
  $('#nested-table').focusgrid({debug : true});
}

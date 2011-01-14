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

// For debugging
function ut() {
  loadFixtures('/__root__/spec/fixtures/uniform_table.html');
  $('#uniform-table').focusgrid();
}
function ct() {
  loadFixtures('/__root__/spec/fixtures/colspan_table.html');
  $('#colspan-table').focusgrid();
}
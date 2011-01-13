// Add an alias to make things more like rspec
var context = describe;

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
  element.trigger(keypress);
}

function t() {
  loadFixtures('/__root__/spec/fixtures/uniform_table.html');
  $('#uniform-table').focusgrid();
}
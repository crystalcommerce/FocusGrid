describe("Focusgrid", function() {
  describe("jQuery.fn.focusgrid", function() {

    context("With a uniform table", function() {
      var $table;

      beforeEach(function() {
        loadFixtures('/__root__/spec/fixtures/uniform_table.html');
        $table = $('#uniform-table');
      });

      it("sets the focus to the first cell", function(){
        var firstCell = $('#input-1-1').get(0);

        $table.focusgrid();
        expect($table.data('selectedCell').get(0)).toEqual(firstCell);
        expect(document.activeElement).toEqual(firstCell);
      });

      describe("key bindings", function() {
        it("binds the right arrow key to move one cell right", function(){
          var secondCell = $('#input-2-1').get(0);

          $table.focusgrid();
          pressKey($table, KEYS.RIGHT_ARROW);

          expect($table.data('selectedCell').get(0)).toEqual(secondCell);
          expect(document.activeElement).toEqual(secondCell);
        });

        it("binds the left arrow key to move one cell left", function(){
          var firstCell = $('#input-1-1').get(0);

          $table.focusgrid();
          pressKey($table, KEYS.RIGHT_ARROW);
          pressKey($table, KEYS.LEFT_ARROW);

          expect($table.data('selectedCell').get(0)).toEqual(firstCell);
          expect(document.activeElement).toEqual(firstCell);
        });

        it("binds the down arrow key to move one cell down", function(){
          var secondCell = $('#input-1-2').get(0);

          $table.focusgrid();
          pressKey($table, KEYS.DOWN_ARROW);

          expect($table.data('selectedCell').get(0)).toEqual(secondCell);
          expect(document.activeElement).toEqual(secondCell);
        });

        it("binds the left arrow key to move one cell left", function(){
          var firstCell = $('#input-1-1').get(0);

          $table.focusgrid();
          pressKey($table, KEYS.DOWN_ARROW);
          pressKey($table, KEYS.UP_ARROW);

          expect($table.data('selectedCell').get(0)).toEqual(firstCell);
          expect(document.activeElement).toEqual(firstCell);
        });

        it("moves down with tab", function() {
          $table.focusgrid();
          var first  = parseInt($('#input-1-1').attr('tabindex'), 10);
          var second = parseInt($('#input-1-2').attr('tabindex'), 10);

          expect(second).toBeGreaterThan(first);
        });

        it("doesn't break at table boundaries (right-to-left)", function() {
          $table.focusgrid();
          var firstCell  = $('#input-1-1').get(0);
          var secondCell = $('#input-2-1').get(0);

          pressKey($table, KEYS.LEFT_ARROW);
          expect($table.data('selectedCell').get(0)).toEqual(firstCell);

          pressKey($table, KEYS.RIGHT_ARROW);
          expect($table.data('selectedCell').get(0)).toEqual(secondCell);
        });

        it("doesn't break at table boundaries (up-and-down)", function() {
          $table.focusgrid();
          var firstCell  = $('#input-1-1').get(0);
          var secondCell = $('#input-1-2').get(0);

          pressKey($table, KEYS.UP_ARROW);
          expect($table.data('selectedCell').get(0)).toEqual(firstCell);

          pressKey($table, KEYS.DOWN_ARROW);
          expect($table.data('selectedCell').get(0)).toEqual(secondCell);
        });
      });
    });

  });
});
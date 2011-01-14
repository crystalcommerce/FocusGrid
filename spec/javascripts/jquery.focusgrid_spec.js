describe("Focusgrid", function() {
  describe("jQuery.fn.focusgrid", function() {

    context("With a uniform table", function() {
      beforeEach(function() {
        loadFixtures('/__root__/spec/fixtures/uniform_table.html');
        this.$table = $('#uniform-table');
      });

      itShouldBehaveNormally();
    });

    context("With a table with colspans", function() {
      beforeEach(function() {
        loadFixtures('/__root__/spec/fixtures/colspan_table.html');
        this.$table = $('#colspan-table');
      });

      itShouldBehaveNormally();

      it("Honors colspans", function(){
        var fourthCell = $('#input-4-2').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);

        expect(fourthCell).toBeSelectedIn(this.$table);
      });
    });

    function itShouldBehaveNormally() {
      it("sets the focus to the first cell", function(){
        var firstCell = $('#input-1-1').get(0);

        this.$table.focusgrid();
        expect(firstCell).toBeSelectedIn(this.$table);
      });

      describe("key bindings", function() {
        it("binds the right arrow key to move one cell right", function(){
          var secondCell = $('#input-2-1').get(0);

          this.$table.focusgrid();
          pressKey(this.$table, KEYS.RIGHT_ARROW);

          expect(secondCell).toBeSelectedIn(this.$table);
        });

        it("binds the left arrow key to move one cell left", function(){
          var firstCell = $('#input-1-1').get(0);

          this.$table.focusgrid();
          pressKey(this.$table, KEYS.RIGHT_ARROW);
          pressKey(this.$table, KEYS.LEFT_ARROW);

          expect(firstCell).toBeSelectedIn(this.$table);
        });

        it("binds the down arrow key to move one cell down", function(){
          var secondCell = $('#input-1-2').get(0);

          this.$table.focusgrid();
          pressKey(this.$table, KEYS.DOWN_ARROW);

          expect(secondCell).toBeSelectedIn(this.$table);
        });

        it("binds the left arrow key to move one cell left", function(){
          var firstCell = $('#input-1-1').get(0);

          this.$table.focusgrid();
          pressKey(this.$table, KEYS.DOWN_ARROW);
          pressKey(this.$table, KEYS.UP_ARROW);

          expect(firstCell).toBeSelectedIn(this.$table);
        });

        it("moves down with tab", function() {
          this.$table.focusgrid();
          var first  = parseInt($('#input-1-1').attr('tabindex'), 10);
          var second = parseInt($('#input-1-2').attr('tabindex'), 10);

          expect(second).toBeGreaterThan(first);
        });

        it("doesn't break at table boundaries (right-to-left)", function() {
          this.$table.focusgrid();
          var firstCell  = $('#input-1-1').get(0);
          var secondCell = $('#input-2-1').get(0);

          pressKey(this.$table, KEYS.LEFT_ARROW);
          expect(firstCell).toBeSelectedIn(this.$table);

          pressKey(this.$table, KEYS.RIGHT_ARROW);
          expect(secondCell).toBeSelectedIn(this.$table);
        });

        it("doesn't break at table boundaries (up-and-down)", function() {
          this.$table.focusgrid();
          var firstCell  = $('#input-1-1').get(0);
          var secondCell = $('#input-1-2').get(0);

          pressKey(this.$table, KEYS.UP_ARROW);
          expect(firstCell).toBeSelectedIn(this.$table);

          pressKey(this.$table, KEYS.DOWN_ARROW);
          expect(secondCell).toBeSelectedIn(this.$table);
        });
      });
    }

  });
});

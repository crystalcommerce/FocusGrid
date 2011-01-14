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
      beforeEach(function(){
        loadFixtures('/__root__/spec/fixtures/colspan_table.html');
        this.$table = $('#colspan-table');
      });

      itShouldBehaveNormally();

      it("Honors colspans (right to left)", function() {
        var fourthCell = $('#input-4-2').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);

        expect(fourthCell).toBeSelectedIn(this.$table);
      });

      it("Honors colspans (up and down)", function() {
        var secondCell = $('#input-2-2').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);

        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.UP_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);
      });
    });

    context("With a table with rowspans", function() {
      beforeEach(function(){
        loadFixtures('/__root__/spec/fixtures/rowspan_table.html');
        this.$table = $('#rowspan-table');
      });

      itShouldBehaveNormally();

      it("Honors rowspans (right to left)", function() {
        var fourthCell = $('#input-1-4').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.LEFT_ARROW);

        expect(fourthCell).toBeSelectedIn(this.$table);
      });

      it("Honors rowspans (up and down)", function() {
        var secondCell = $('#input-1-2').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);

        pressKey(this.$table, KEYS.LEFT_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);

        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.LEFT_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);
      });
    });

    context("With a table with empty cells", function() {
      beforeEach(function(){
        loadFixtures('/__root__/spec/fixtures/empty_cell_table.html');
        this.$table = $('#empty-cell-table');
      });

       itShouldBehaveNormally();

       it("Skips cells without inputs (left to right)", function() {
         var thirdCell = $('#input-3-2').get(0);

         this.$table.focusgrid();
         pressKey(this.$table, KEYS.DOWN_ARROW);
         pressKey(this.$table, KEYS.RIGHT_ARROW);

         expect(thirdCell).toBeSelectedIn(this.$table);
       });

       it("Skips cells without inputs (up and down)", function() {
         var thirdCell = $('#input-2-3').get(0);

         this.$table.focusgrid();
         pressKey(this.$table, KEYS.RIGHT_ARROW);
         pressKey(this.$table, KEYS.DOWN_ARROW);

         expect(thirdCell).toBeSelectedIn(this.$table);
       });
    });

    context("With a table with all the weirdness", function() {
      beforeEach(function(){
        loadFixtures('/__root__/spec/fixtures/evil_table.html');
        this.$table = $('#evil-table');
      });

      itShouldBehaveNormally();

      it("Honors colspans (right to left)", function(){
        var fourthCell = $('#input-4-3').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);

        expect(fourthCell).toBeSelectedIn(this.$table);
      });

      xit("Honors colspans (up and down)", function(){
        var secondCell = $('#input-2-2').get(0);

        this.$table.focusgrid({debug : true});
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.UP_ARROW);

        expect(secondCell).toBeSelectedIn(this.$table); 
      });

      xit("Honors rowspans (right to left)", function() {});
      xit("Honors rowspans (up and down)", function() {});
      xit("Skips cells without inputs (left to right)", function() {});
      xit("Skips cells without inputs (up and down)", function() {});
    });

    function itShouldBehaveNormally() {
      it("sets the focus to the first cell", function(){
        var firstCell = $('#input-1-1').get(0);

        this.$table.focusgrid();
        expect(firstCell).toBeSelectedIn(this.$table);
      });

      it("sets the focus to a different cell if specified", function(){
        var lastCell = $('#input-4-4').get(0);

        this.$table.focusgrid({focus : lastCell});
        expect(lastCell).toBeSelectedIn(this.$table);
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

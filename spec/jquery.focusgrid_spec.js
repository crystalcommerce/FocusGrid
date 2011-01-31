describe("Focusgrid", function() {
  describe("jQuery.fn.focusgrid", function() {

    context("With a uniform table", function() {
      beforeEach(function() {
        loadFixtures('uniform_table.html');
        this.$table = $('#uniform-table');
      });

      itShouldBehaveNormally();
    });

    context("With a table with colspans", function() {
      beforeEach(function(){
        loadFixtures('colspan_table.html');
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

      it("Handles colspans on the right edge", function() {
        var thirdCell = $('#input-3-3').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        expect(thirdCell).toBeSelectedIn(this.$table);
      });

      it("sets the tab index as if it was in the first column", function() {
        this.$table.focusgrid();

        var tabOne = parseInt($('#input-2-1').attr('tabindex'), 10);
        var tabTwo = parseInt($('#input-2-2').attr('tabindex'), 10);
        expect(tabOne).toEqual(tabTwo - 1);
      });
    });

    context("With a table with rowspans", function() {
      beforeEach(function(){
        loadFixtures('rowspan_table.html');
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
        loadFixtures('empty_cell_table.html');
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
        loadFixtures('evil_table.html');
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

      it("Honors colspans (up and down)", function(){
        var secondCell = $('#input-2-2').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.UP_ARROW);

        expect(secondCell).toBeSelectedIn(this.$table); 
      });

      it("Honors rowspans (right to left)", function() {
        var thirdCell = $('#input-1-3').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.LEFT_ARROW);
        expect(thirdCell).toBeSelectedIn(this.$table);
      });

      it("Honors rowspans (up and down)", function() {
        var fifthCell = $('#input-2-5').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        expect(fifthCell).toBeSelectedIn(this.$table);
      });

      it("Skips cells without inputs (left to right)", function() {
        var fourthCell = $('#input-4-2').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        expect(fourthCell).toBeSelectedIn(this.$table);
      });

      it("Skips cells without inputs (up and down)", function() {
        var bigCell = $('#input-2-3').get(0);

        this.$table.focusgrid();
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        pressKey(this.$table, KEYS.UP_ARROW);
        expect(bigCell).toBeSelectedIn(this.$table);
      });
    });

    context("With a table with no starting input", function() {
      beforeEach(function() {
        loadFixtures('no_initial_cell_table.html');
      });

      it("selects the first input on the first row that has one", function() {
        this.$table = $('#no-initial-cell-table');
        var secondCell = $('#input-2-1').get(0);

        this.$table.focusgrid();

        expect(secondCell).toBeSelectedIn(this.$table);

        this.$table = $('#no-initial-cell-table-expert');
        this.$table.focusgrid();
        secondCell = $('#einput-2-2').get(0);

        expect(secondCell).toBeSelectedIn(this.$table);
      });
    });

    context("With thead, tfoot, th", function() {
      beforeEach(function() {
        loadFixtures('table_with_header.html');
        this.$table = $('#table-with-header');
      });

      itShouldBehaveNormally();
    });

    context("After being cleared and rebuild", function() {
      beforeEach(function() {
        loadFixtures('uniform_table.html');
        this.$table = $('#uniform-table');

        this.$table.focusgrid();
        this.$table.clearFocusgrid();
      });

      itShouldBehaveNormally();
    });

    context("After being reset", function() {
      beforeEach(function() {
        loadFixtures('uniform_table.html');
        this.$table = $('#uniform-table');

        this.$table.focusgrid();
      });

      it("preserves the focus", function() {
        var secondCell = $('#input-1-2').get(0);

        pressKey(this.$table, KEYS.DOWN_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);
        this.$table.resetFocusgrid();
        expect(secondCell).toBeSelectedIn(this.$table);
      });
    });

    context("A table with a nested table", function() {
      beforeEach(function() {
        loadFixtures('nested_table.html');
        this.$table = $('#nested-table');
      });

      itShouldBehaveNormally();

      it("finds inputs that at the root level, ignoring those in nested tables", function() {
        var secondCell = $('#input-1-3').get(0),
            thirdCell  = $('#input-1-2').get(0);

        this.$table.focusgrid();

        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);

        expect(secondCell).toBeSelectedIn(this.$table);

        pressKey(this.$table, KEYS.UP_ARROW);
        expect(thirdCell).toBeSelectedIn(this.$table);
      });

      it("finds inputs nested within elements which are not tables", function() {
        var secondCell = $('#input-1-4').get(0);

        this.$table.focusgrid();

        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);

        expect(secondCell).toBeSelectedIn(this.$table);
      });

      it("finds elements nested within elements which also contain tables", function() {
        var secondCell = $('#input-1-5').get(0);

        this.$table.focusgrid();

        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);
        pressKey(this.$table, KEYS.DOWN_ARROW);

        expect(secondCell).toBeSelectedIn(this.$table);
      });
    });

    context("With grouping options", function() {
      beforeEach(function() {
        loadFixtures('multigrid_table.html');
        this.$table = $('#multigrid-table');
      });

      itShouldBehaveNormally({grouping: ['.primary-row', '.secondary-row']});

      // Handle classes which don't even exist on the table
      itShouldBehaveNormally({grouping: ['.primary-row', '.bogus-row']});

      it("creates a sub-grid on other specified selectors", function() {
        var firstCell  = $('#sinput-1-1').get(0),
            secondCell = $('#sinput-1-2').get(0),
            thirdCell  = $('#sinput-2-2').get(0);


        this.$table.focusgrid({grouping: ['.primary-row', '.secondary-row']});

        firstCell.focus();

        pressKey(this.$table, KEYS.DOWN_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);

        pressKey(this.$table, KEYS.RIGHT_ARROW);
        expect(thirdCell).toBeSelectedIn(this.$table);
      });

      it("accepts arbitrary jQuery selectors", function() {
        var firstCell,
            secondCell = $('#eoinput-1-3').get(0),
            thirdCell  = $('#eoinput-2-3').get(0);

        this.$table = $('#even-odd-table');

        this.$table.focusgrid({grouping: [":even", ":odd"]});

        pressKey(this.$table, KEYS.DOWN_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        expect(thirdCell).toBeSelectedIn(this.$table);

        firstCell  = $('#eoinput-1-2').get(0),
        secondCell = $('#eoinput-1-4').get(0),
        thirdCell  = $('#eoinput-2-4').get(0);

        firstCell.focus();

        pressKey(this.$table, KEYS.DOWN_ARROW);
        expect(secondCell).toBeSelectedIn(this.$table);
        pressKey(this.$table, KEYS.RIGHT_ARROW);
        expect(thirdCell).toBeSelectedIn(this.$table);
      });

      it("resumes tabindex count in subsequent focusgrid groupings", function() {
        this.$table.focusgrid({grouping: ['.primary-row', '.secondary-row']});
        var lastPrimaryIndex = parseInt(this.$table
                                            .find('tr.primary-row :text:last')
                                            .attr('tabindex'), 10),
        firstSecondaryIndex = parseInt(this.$table
                                            .find('tr.secondary-row :text:first')
                                            .attr('tabindex'), 10);

        expect(firstSecondaryIndex).toEqual(lastPrimaryIndex + 1);
      });
    });

    function itShouldBehaveNormally(opts) {
      it("sets the focus to the first cell", function(){
        var firstCell = $('#input-1-1').get(0);

        this.$table.focusgrid(opts || {});
        expect(firstCell).toBeSelectedIn(this.$table);
      });

      it("sets the focus to a different cell if specified", function(){
        var lastCell = $('#input-4-4').get(0);

        this.$table.focusgrid({focus : lastCell});
        expect(lastCell).toBeSelectedIn(this.$table);
      });

      it("turns off autocomplete", function(){
        this.$table.focusgrid(opts || {});

        var firstCellAutocomplete = $('#input-1-1').attr('autocomplete');
        expect(firstCellAutocomplete).toEqual("off");
      });

      describe("key bindings", function() {
        it("binds the right arrow key to move one cell right", function(){
          var secondCell = $('#input-2-1').get(0);

          this.$table.focusgrid(opts || {});
          pressKey(this.$table, KEYS.RIGHT_ARROW);

          expect(secondCell).toBeSelectedIn(this.$table);
        });

        it("binds the left arrow key to move one cell left", function(){
          var firstCell = $('#input-1-1').get(0);

          this.$table.focusgrid(opts || {});
          pressKey(this.$table, KEYS.RIGHT_ARROW);
          pressKey(this.$table, KEYS.LEFT_ARROW);

          expect(firstCell).toBeSelectedIn(this.$table);
        });

        it("binds the down arrow key to move one cell down", function(){
          var secondCell = $('#input-1-2').get(0);

          this.$table.focusgrid(opts || {});
          pressKey(this.$table, KEYS.DOWN_ARROW);

          expect(secondCell).toBeSelectedIn(this.$table);
        });

        it("binds the left arrow key to move one cell left", function(){
          var firstCell = $('#input-1-1').get(0);

          this.$table.focusgrid(opts || {});
          pressKey(this.$table, KEYS.DOWN_ARROW);
          pressKey(this.$table, KEYS.UP_ARROW);

          expect(firstCell).toBeSelectedIn(this.$table);
        });

        it("moves down with tab", function() {
          this.$table.focusgrid(opts || {});
          var first  = parseInt($('#input-1-1').attr('tabindex'), 10);
          var second = parseInt($('#input-1-2').attr('tabindex'), 10);

          expect(second).toBeGreaterThan(first);
        });

        it("doesn't break at table boundaries (right-to-left)", function() {
          this.$table.focusgrid(opts || {});
          var firstCell  = $('#input-1-1').get(0);
          var secondCell = $('#input-2-1').get(0);

          pressKey(this.$table, KEYS.LEFT_ARROW);
          expect(firstCell).toBeSelectedIn(this.$table);

          pressKey(this.$table, KEYS.RIGHT_ARROW);
          expect(secondCell).toBeSelectedIn(this.$table);
        });

        it("doesn't break at table boundaries (up-and-down)", function() {
          this.$table.focusgrid(opts || {});
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

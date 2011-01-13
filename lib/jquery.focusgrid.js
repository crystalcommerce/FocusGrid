(function($){
  var KEYS = {
    TAB:          9,
    LEFT_ARROW:  37,
    UP_ARROW:    38,
    RIGHT_ARROW: 39,
    DOWN_ARROW:  40  
  };

  $.fn.focusgrid = function(options) {
    var opts = $.extend($.fn.focusgrid.defaults, options);
    $(this).each(function(){
      var vGrid = createGrid($(this), opts);
      bindGridListeners(vGrid);

      var $firstCell = $(this).find("tr td:first input");
      $(this).data('selectedCell', $firstCell);
      vGrid.currentX = 0;
      vGrid.currentY = 0;
      $firstCell.focus();
    });
    
    return $(this);
  };

  // Private functions
  function createGrid($table, opts) {
    var grid = $table.find('tr').map(function(){
       return $(this).find('td input');
    });

    var i = opts.tabIndexStart;
    for (var c = 0; c < grid[0].length; c++) {
      for (var r = 0; r < grid.length; r++) {
        $(grid[r][c]).attr('tabindex', i++);
      }
    }

    grid.options = opts;
    grid.table   = $table;

    return grid;
  }

  function bindGridListeners(grid) {
    grid.each(function(){
      $(this).each(function(){
        bindCellListeners($(this), grid);
      });
    });

    grid.table.keydown(function(e){
      var code = e.keyCode || e.which;
      switch(code) {
        case KEYS.RIGHT_ARROW:
          moveRight(grid);
          break;
        case KEYS.LEFT_ARROW:
          moveLeft(grid);
          break;
        case KEYS.DOWN_ARROW:
          moveDown(grid);
          break;
        case KEYS.UP_ARROW:
          moveUp(grid);
          break;
      }
    });
  }

  function moveRight(grid) {
    if (grid.currentX != (grid[0].length - 1)) {
      move(1, 0, grid);
    }
  }

  function moveLeft(grid) {
    if (grid.currentX != 0) {
      move(-1, 0, grid);
    }
  }

  function moveDown(grid) {
    if (grid.currentY != (grid.length -1)) {
      move(0, 1, grid);
    }
  }

  function moveUp(grid) {
    if (grid.currentY != 0) {
      move(0, -1, grid);
    }
  }

  function move(x, y, grid) {
    deselect(grid.table.data('selectedCell'), grid);
    grid.currentX = grid.currentX + x;
    grid.currentY = grid.currentY + y;
    var $selectedCell = $(grid[grid.currentY][grid.currentX]);
    select($selectedCell, grid);
    $selectedCell.focus();
    grid.table.data('selectedCell', $selectedCell);
  }

  function bindCellListeners($input, grid) {
    $input.blur(function(e){ deselect($input, grid); });
    $input.focus(function(e){ select($input, grid); });
  }

  function deselect($input, grid) {
    $input.removeClass(grid.options.selectedClass);
  }

  function select($input, grid) {
    $input.addClass(grid.options.selectedClass);
  }

  function debug(msg) {
    if (console && console.log) {
      console.log(msg);
    }
  }

  // User stuff
  $.fn.focusgrid.defaults = {
    selectedClass: 'selected-grid-cell',
    tabIndexStart: 500
  };

  $.fn.focusgrid.version = "0.1.0";
})(jQuery);
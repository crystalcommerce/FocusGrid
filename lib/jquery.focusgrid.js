(function($){
  var KEYS = {
    TAB:          9,
    LEFT_ARROW:  37,
    UP_ARROW:    38,
    RIGHT_ARROW: 39,
    DOWN_ARROW:  40  
  };
  var debugging = false;

  $.fn.focusgrid = function(options) {
    var opts = $.extend($.fn.focusgrid.defaults, options);
    if (opts.debug) {
      debugging = true;
    }
   
    $(this).each(function(){
      var grid = createGrid($(this), opts);
      bindGridListeners(grid);

      $(this).data('selectedCell', grid.activeCell);
      grid.activeCell.input.focus();
    });
    
    return $(this);
  };

  // Private functions
  function createGrid($table, opts) {
    var grid = {},
        matrix = [];

    $table.find('tr').each(function(r, row){
      matrix[r] = [];
      $(this).find('td').each(function() {
        var input = {
          input : $(this).find('input[type|="text"]:first').get(0)
        };
        for (var i = 0; i < getColspan(this); i++) {
          matrix[r].push(input);
        }
      });
    });

    linkCells(matrix, 0, 0);

    grid.options     = opts;
    grid.table       = $table;
    grid.activeCell  = matrix[0][0];

    setTabIndexes(grid);
    return grid;
  }

  function setTabIndexes(grid) {
    var i = grid.options.tabIndexStart;

    var columnPtr = grid.activeCell;
    var current = columnPtr;

    while (current != null) {
      $(current.input).attr('tabindex', i++);

      if (current.down) {
        current = current.down;
      } else if (columnPtr.right) {
        current = columnPtr.right;
        columnPtr = columnPtr.right;
      } else {
        current = null;
      }
    }
  }

  function linkCells(matrix, r, c) {
    var cell = matrix[r][c];

    // Set up link to the left
    if (c > 0 && cell.left == undefined) {
      var left = [r, c-1];
      while (left[0] >= 0 &&
             matrix[left[0]][left[1]] === cell) {
        left = [left[0], left[1]-1];
      }
      cell.left = matrix[left[0]][left[1]];
    }

    // Set up link to the right
    if (c < matrix[r].length-1 && cell.right == undefined) {
      var right = [r, c+1];
      while (right[0] < matrix[r].length &&
             matrix[right[0]][right[1]] === cell) {
        right = [right[0], right[1]+1];
      }
      cell.right = matrix[right[0]][right[1]];
    }

    // Set up link to above
    if (r > 0 && cell.up == undefined) {
      var up = [r-1, c];
      while (up[1] >= 0 &&
             matrix[up[0]][up[1]] === cell) {
        up = [up[0]-1, up[1]];
      }

      if (matrix[up[0]]) {
        cell.up = matrix[up[0]][up[1]];
      }
    }

    // Set up link to below
    if (r < matrix.length-1 && cell.down == undefined) {
      var down = [r+1, c];
      while (down[1] < matrix.length &&
             matrix[down[0]][down[1]] === cell) {
        down = [down[0]+1, down[1]];
      }

      if (matrix[down[0]]) {
        cell.down = matrix[down[0]][down[1]];
      }
    }

    // Process cells to the right
    if (c < matrix[r].length-1) {
      linkCells(matrix, r, c+1);
    }

    // Process cells down
    if (r < matrix.length-1) {
      linkCells(matrix, r+1, c);
    }
  }

  //TODO: support row/colspan 0

  function getColspan(el) {
    return parseInt($(el).attr('colspan'), 10) || 1;
  }

  function getRowspan(el) {
    return parseInt($(el).attr('rowspan'), 10) || 1;
  }

  function bindGridListeners(grid) {
    bindCellListeners(grid.activeCell, grid);

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
    if (grid.activeCell.right) {
      selectCell(grid.activeCell.right, grid);
    }
  }

  function moveLeft(grid) {
    if (grid.activeCell.left) {
      selectCell(grid.activeCell.left, grid);
    }
  }

  function moveDown(grid) {
    if (grid.activeCell.down) {
      selectCell(grid.activeCell.down, grid);
    }
  }

  function moveUp(grid) {
    if (grid.activeCell.up) {
      selectCell(grid.activeCell.up, grid);
    }
  }

  function selectCell(cell, grid) {
    deselect(grid.activeCell.input, grid);
    select(cell.input, grid);
    cell.input.focus();
    grid.activeCell = cell;
    grid.table.data('selectedCell', cell.input);
  }

  function bindCellListeners(cell, grid) {
    $(cell.input).blur(function(e){ deselect(cell.input, grid); });
    $(cell.input).focus(function(e){ selectCell(cell, grid); });

    // Now bind right and down
    if (cell.right) {
      bindCellListeners(cell.right, grid);
    }

    if (cell.down) {
      bindCellListeners(cell.down, grid);
    }
  }

  function deselect(input, grid) {
    debug("Deselect: " + input.id);
    grid.table.data('selectedCell', null);
    $(input).removeClass(grid.options.selectedClass);
  }

  function select(input, grid) {
    debug("Select: " + input.id);
    $(input).addClass(grid.options.selectedClass);
  }

  function debug(msg) {
    if (debugging && console && console.log) {
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

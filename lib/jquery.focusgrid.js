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
    var grid   = {},
        matrix = [];

    $table.find('tr').each(function(r, tr){
      if (matrix[r] === undefined) {
        matrix[r] = [];
      }

      var c = 0;
      $(this).find('td').each(function() {
        var input = {
          input : $(this).find('input[type|="text"]:first').get(0)
        };

        while (matrix[r][c] !== undefined) {
          c++;
        }

        var currentColumn = c;
        for (var i = 0; i < getColspan(this); i++) {
          for (var j = 0; j < getRowspan(this); j++) {
            if (matrix[r + j] === undefined) {
              matrix[r + j] = [];
            }
            matrix[r + j][currentColumn + i] = input;
          }
          c++;
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

    setLeftLink(cell, matrix, r, c);
    setRightLink(cell, matrix, r, c);
    setUpLink(cell, matrix, r, c);
    setDownLink(cell, matrix, r, c);

    // Process cells to the right
    if (c < matrix[r].length-1) {
      linkCells(matrix, r, c+1);
    }

    // Process cells down
    if (r < matrix.length-1) {
      linkCells(matrix, r+1, c);
    }
  }

  function setLeftLink(cell, matrix, r, c) {
    if (c > 0 && cell.left === undefined) {
      c--;
      while (c > 0 && unlinkableCell(matrix, r, c, cell)) {
        c--;
      }
      cell.left = matrix[r][c];
    }
  }

  function setRightLink(cell, matrix, r, c) {
    if (c < matrix[r].length-1 && cell.right === undefined) {
      c++;
      while (c < matrix[r].length && unlinkableCell(matrix, r, c, cell)) {
        c++;
      }
      cell.right = matrix[r][c];
    }
  }

  function setUpLink(cell, matrix, r, c) {
    if (r > 0 && cell.up === undefined) {
      r--;
      while (r > 0 && unlinkableCell(matrix, r, c, cell)) {
        r--;
      }

      if (matrix[r]) {
        cell.up = matrix[r][c];
      }
    }
  }

  function setDownLink(cell, matrix, r, c) {
    if (r < matrix.length-1 && cell.down === undefined) {
      r++;
      while (r < matrix.length && unlinkableCell(matrix, r, c, cell)) {
        r++;
      }

      if (matrix[r]) {
        cell.down = matrix[r][c];
      }
    }
  }

  function unlinkableCell(matrix, r, c, from) {
    return (matrix[r][c] === from ||
            matrix[r][c].input === undefined);
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

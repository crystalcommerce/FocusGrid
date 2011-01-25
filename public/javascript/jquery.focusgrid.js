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
      bindGridListener(grid);

      $(this).data('selectedCell', grid.activeCell.input);
      grid.activeCell.input.focus();
    });
    
    return $(this);
  };

  $.fn.clearFocusgrid = function() {
    $(this).each(function() {
      $(this).unbind('keydown');
      $(this).find(':text').each(function() {
        debug("Clearing: " + this.id);
        $(this).unbind('focus').unbind('blur');
      });
      $(this).data('selectedCell', null);
    });

    return $(this);
  };

  // Private functions
  function createGrid($table, opts) {
    var grid = {
      table: $table,
      taboffset: 0,
      options: opts
    };


    $(opts.grouping).each(function(idx, selector) {
      updateGridForSelector(grid, selector);
    });

    return grid;
  }

  //selector optional
  function updateGridForSelector(grid, selector) {
    selector = selector || "";
    var matrix = [],
        firstCell = undefined,
        row_selector = '> tr' + selector + ', > tbody > tr' + selector +
                       ', > thead > tr' + selector;

    debug('Setting up matrix for row selector ' + row_selector);


    grid.table.find(row_selector).each(function(r, tr){
      if (matrix[r] === undefined) {
        matrix[r]        = [];
      }

      var c = 0;
      $(tr).find('> td, > th').each(function() {
        // This selector first finds the first text field which isn't nested
        var cell = {
          input  : $(this).find(':not(table table :text):text:first').get(0),
          tabSet : false
        };

        if (firstCell === undefined && cell.input !== undefined) {
          debug("First input found! [" + cell.input.id + "]");
          firstCell = cell;
        }

        if (grid.options.focus && cell.input === grid.options.focus) {
          grid.activeCell = cell;
        }

        // Skip cells that have already been configured due to rowspans
        while (matrix[r][c] !== undefined) {
          c++;
        }

        var currentColumn = c;
        for (var i = 0; i < getColspan(this); i++) {
          for (var j = 0; j < getRowspan(this); j++) {
            if (matrix[r + j] === undefined) {
              matrix[r + j] = [];
            }
            matrix[r + j][currentColumn + i] = cell;
          }
          c++;
        }
      });
    });

    // Keep track of the tabindex to carry over into subsequent groupings
    grid.options.tabIndexStart += grid.taboffset;
    // On unused groupings (ones that don't have existing inputs), skip linking
    if (matrix.length > 0) linkCells(matrix, grid);

    if (!grid.activeCell) {
      grid.activeCell = firstCell;
    }
  }

  function linkCells(matrix, grid) {
    var m = matrix.length - 1,
        n = matrix[0].length - 1,
        i    = 0,
        iMin = 0,
        j    = 0,
        jMax = 0;

    while(!(i == n && j == m)) {
      debug("Linking cell: (" + i + "," + j + ")");
      linkCell(matrix, j, i, grid);

      if (j == 0 || i == n) {
        if (jMax < m) {
          jMax++;
        } else if (iMin < n) {
          iMin++;
        }

        j = jMax;
        i = iMin;
      } else {
        i++;
        j--;
      }
    }

    debug("Linking cell: (" + n + "," + m + ")");
    linkCell(matrix, m, n, grid);
  }

  function linkCell(matrix, r, c, grid) {
    var cell = matrix[r][c];
    if (cell.input === undefined) return;

    if (!cell.tabSet) {
      var idx = (matrix.length * c) + r + grid.options.tabIndexStart;
      grid.taboffset++;
      $(cell.input).attr('tabindex', idx);
      $(cell.input).attr('autocomplete', 'off');
      cell.tabSet = true;
    }

    bindCellListeners(cell, grid);

    setLeftLink(cell, matrix, r, c);
    setRightLink(cell, matrix, r, c);
    setUpLink(cell, matrix, r, c);
    setDownLink(cell, matrix, r, c);
  }

  function setLeftLink(cell, matrix, r, c) {
    if (c > 0 && cell.left === undefined) {
      c--;
      while (c > 0 && unlinkableCell(matrix, r, c, cell)) {
        c--;
      }
      if (matrix[r][c] && matrix[r][c].input) {
        cell.left = matrix[r][c];
      }
    }
  }

  function setRightLink(cell, matrix, r, c) {
    if (c < matrix[r].length-1 && cell.right === undefined) {
      c++;
      while (c < matrix[r].length && unlinkableCell(matrix, r, c, cell)) {
        c++;
      }

      if (matrix[r][c] && matrix[r][c].input) {
        cell.right = matrix[r][c];
      }
    }
  }

  function setUpLink(cell, matrix, r, c) {
    if (r > 0 && cell.up === undefined) {
      r--;
      while (r > 0 && unlinkableCell(matrix, r, c, cell)) {
        r--;
      }

      if (matrix[r] && matrix[r][c].input) {
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

      if (matrix[r] && matrix[r][c].input) {
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

  function bindGridListener(grid) {
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
    select(cell.input, grid);
    cell.input.focus();
    grid.activeCell = cell;
    grid.table.data('selectedCell', cell.input);
  }

  function bindCellListeners(cell, grid) {
    $(cell.input).blur(function(e){ deselect(cell.input, grid); });
    $(cell.input).focus(function(e){ selectCell(cell, grid); });
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
    tabIndexStart: 500,
    grouping: [null]
  };

  $.fn.focusgrid.version = "0.2.0";
})(jQuery);

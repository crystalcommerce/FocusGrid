FocusGrid
---------
Simple jQuery plugin for allowing keyboard navigation of text fields in a table
based purely on the semantics of the table.

Features
========
* Arrow keys move around
* Styling selected input
* Arbitrary starting focused element
* Vertical Tabbing (currently not optional)
* "Grouping" of rows to allow focus grid contexts
* Handles
* No external dependencies other than jQuery

API
===
To initialize the focusgrid;

    $('#myTable').focusgrid()

To disable the focusgrid:

    $('#myTable').clearFocusgrid()

To relaod the focusgrid (i.e. after dynamic structure changes to the table,
preserves focus):

    $('#myTable').resetFocusgrid()

Options
=======
FocusGrid takes an optional options object with the following options:
  * focus: default starting input. If none is specified, the upper-leftmost one
    is used.
  * debug: if true, debugging info will be logged to the console.
  * grouping: Array of grouping selectors to segregate rows into separate focus
    grids. An example would be: grouping: {':even', ':odd'} to put even/odd rows
    in separate focus grids . Defaults to no grouping.
  * tabIndexStart: integer starting number for the tab index. Defaults to 500.
  * selectedClass: CSS class to apply to selected input. Defaults to
    'selected-grid-cell'

Packaging
=========
For the time being you have to minify the library yourself
(public/images/jquery.focusgrid.js). To minify:

  bundle install
  rake build

The resultant minified file will appear in the pkg directory.

Known Issues
============
Rowspans/colspans of "0" are currently not supported correctly.

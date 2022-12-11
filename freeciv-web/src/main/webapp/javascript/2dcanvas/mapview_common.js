/**********************************************************************
    Freeciv-web - the web version of Freeciv. http://play.freeciv.org/
    Copyright (C) 2009-2015  The Freeciv-web project

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

***********************************************************************/


var mapview = {};
var mapdeco_highlight_table = {};
var mapdeco_crosshair_table = {};
var last_redraw_time = 0;
var MAPVIEW_REFRESH_INTERVAL = 10;

var mapview_slide = {};
mapview_slide['active'] = false;
mapview_slide['dx'] = 0;
mapview_slide['dy'] = 0;
mapview_slide['i'] = 0;
mapview_slide['max'] = 100;
mapview_slide['slide_time'] = 700;


function mapdeco_init()
{
  mapdeco_highlight_table = {};
  mapdeco_crosshair_table = {};

  init_game_unit_panel();
  init_chatbox();
  keyboard_input=true;
}


/**************************************************************************
  Centers the mapview around tile with given id.
**************************************************************************/
function center_tile_id(ptile_id)
{
  var ptile = tiles[ptile_id];
  center_tile_mapcanvas(ptile);
}


/****************************************************************************
  Translate from a cartesian system to the GUI system.  This function works
  on vectors, meaning it can be passed a (dx,dy) pair and will return the
  change in GUI coordinates corresponding to this vector.  It is thus more
  general than map_to_gui_pos.

  Note that a gui_to_map_vector function is not possible, since the
  resulting map vector may differ based on the origin of the gui vector.
  Note that is function is for isometric tilesets only.
****************************************************************************/
function map_to_gui_vector(map_dx, map_dy)
{
    /*
     * Convert the map coordinates to isometric GUI
     * coordinates.  We'll make tile map(0,0) be the origin, and
     * transform like this:
     *
     *                     3
     * 123                2 6
     * 456 -> becomes -> 1 5 9
     * 789                4 8
     *                     7
     */

    var gui_dx = ((map_dx - map_dy) * tileset_tile_width) >> 1;
    var gui_dy = ((map_dx + map_dy) * tileset_tile_height) >> 1;
    return {'gui_dx' : gui_dx, 'gui_dy' : gui_dy};
}

/****************************************************************************
  Change the mapview origin, clip it, and update everything.
****************************************************************************/
function set_mapview_origin(gui_x0, gui_y0)
{
  /* Normalize (wrap) the mapview origin. */
  var r = normalize_gui_pos(gui_x0, gui_y0);
  gui_x0 = r['gui_x'];
  gui_y0 = r['gui_y'];

  base_set_mapview_origin(gui_x0, gui_y0);
}

/****************************************************************************
  Move the GUI origin to the given normalized, clipped origin.  This may
  be called many times when sliding the mapview.
****************************************************************************/
function base_set_mapview_origin(gui_x0, gui_y0)
{
  /* We need to calculate the vector of movement of the mapview.  So
   * we find the GUI distance vector and then use this to calculate
   * the original mapview origin relative to the current position.  Thus
   * if we move one tile to the left, even if this causes GUI positions
   * to wrap the distance vector is only one tile. */
  var g = normalize_gui_pos(gui_x0, gui_y0);
  gui_x0 = g['gui_x'];
  gui_y0 = g['gui_y'];

  mapview['gui_x0'] = gui_x0;
  mapview['gui_y0'] = gui_y0;
}

/****************************************************************************
  Normalize (wrap) the GUI position.  This is equivalent to a map wrapping,
  but in GUI coordinates so that pixel accuracy is preserved.
****************************************************************************/
function normalize_gui_pos(gui_x, gui_y)
{
  var map_x, map_y, nat_x, nat_y, gui_x0, gui_y0, diff_x, diff_y;

  /* Convert the (gui_x, gui_y) into a (map_x, map_y) plus a GUI offset
   * from this tile. */
  var r = gui_to_map_pos(gui_x, gui_y);
  map_x = r['map_x'];
  map_y = r['map_y'];


  var s = map_to_gui_pos(map_x, map_y);
  gui_x0 = s['gui_dx'];
  gui_y0 = s['gui_dy'];

  diff_x = gui_x - gui_x0;
  diff_y = gui_y - gui_y0;


  /* Perform wrapping without any realness check.  It's important that
   * we wrap even if the map position is unreal, which normalize_map_pos
   * doesn't necessarily do. */
  var t = MAP_TO_NATIVE_POS(map_x, map_y);
  nat_x = t['nat_x'];
  nat_y = t['nat_y'];

  if (wrap_has_flag(WRAP_X)) {
    nat_x = FC_WRAP(nat_x, map['xsize']);
  }
  if (wrap_has_flag(WRAP_Y)) {
    nat_y = FC_WRAP(nat_y, map['ysize']);
  }

  var u = NATIVE_TO_MAP_POS(nat_x, nat_y);
  map_x = u['map_x'];
  map_y = u['map_y'];

  /* Now convert the wrapped map position back to a GUI position and add the
   * offset back on. */
  var v = map_to_gui_pos(map_x, map_y);
  gui_x = v['gui_dx'];
  gui_y = v['gui_dy'];

  gui_x += diff_x;
  gui_y += diff_y;

  return {'gui_x' : gui_x, 'gui_y' : gui_y};
}

/****************************************************************************
  Translate from gui to map coordinate systems.  See map_to_gui_pos().

  Note that you lose some information in this conversion.  If you convert
  from a gui position to a map position and back, you will probably not get
  the same value you started with.
****************************************************************************/
function gui_to_map_pos(gui_x, gui_y)
{

    var W = tileset_tile_width;
    var H = tileset_tile_height;

    /* The basic operation here is a simple pi/4 rotation; however, we
     * have to first scale because the tiles have different width and
     * height.  Mathematically, this looks like
     *   | 1/W  1/H | |x|    |x`|
     *   |          | | | -> |  |
     *   |-1/W  1/H | |y|    |y`|
     *
     * Where W is the tile width and H the height.
     *
     * In simple terms, this is
     *   map_x = [   x / W + y / H ]
     *   map_y = [ - x / W + y / H ]
     * where [q] stands for integer part of q.
     *
     * Here the division is proper mathematical floating point division.
     *
     * A picture demonstrating this can be seen at
     * http://bugs.freeciv.org/Ticket/Attachment/16782/9982/grid1.png.
     *
     * We have to subtract off a half-tile in the X direction before doing
     * the transformation.  This is because, although the origin of the tile
     * is the top-left corner of the bounding box, after the transformation
     * the top corner of the diamond-shaped tile moves into this position.
     *
     * The calculation is complicated somewhat because of two things: we
     * only use integer math, and C integer division rounds toward zero
     * instead of rounding down.
     *
     * For another example of this math, see canvas_to_city_pos().
     */

    gui_x -= W >> 1;
    var map_x = DIVIDE(gui_x * H + gui_y * W, W * H);
    var map_y = DIVIDE(gui_y * W - gui_x * H, W * H);

    return {'map_x' : map_x, 'map_y' : map_y};
}


/****************************************************************************
  Translate from map to gui coordinate systems.

  GUI coordinates are comparable to canvas coordinates but extend in all
  directions.  gui(0,0) == map(0,0).
****************************************************************************/
function map_to_gui_pos(map_x, map_y)
{
  /* Since the GUI origin is the same as the map origin we can just do a
   * vector conversion. */
  return map_to_gui_vector(map_x, map_y);
}

/****************************************************************************
  Finds the map coordinates corresponding to pixel coordinates.  The
  resulting position is unwrapped and may be unreal.
****************************************************************************/
function base_canvas_to_map_pos(canvas_x, canvas_y)
{
  return gui_to_map_pos(canvas_x + mapview.gui_x0,
                        canvas_y + mapview.gui_y0);
}

/**************************************************************************
  Finds the tile corresponding to pixel coordinates.  Returns that tile,
  or NULL if the position is off the map.
**************************************************************************/
function canvas_pos_to_tile(canvas_x, canvas_y)
{
  var map_x, map_y;

  var r = base_canvas_to_map_pos(canvas_x, canvas_y);
  map_x = r['map_x'];
  map_y = r['map_y'];
  /*FIXME: if (normalize_map_pos(&map_x, &map_y)) {
    return map_pos_to_tile(map_x, map_y);
  } else {
    return null;
  }*/
  return map_pos_to_tile(map_x, map_y);
}



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


var touch_start_x;
var touch_start_y;

var map_select_setting_enabled = true;
var map_select_check = false;
var map_select_check_started = 0;
var map_select_active = false;
var map_select_x;
var map_select_y;
var mouse_touch_started_on_unit = false;



/****************************************************************************
  Triggered when the mouse button is clicked UP on the mapview canvas.
****************************************************************************/
function mapview_mouse_click(e)
{
  var rightclick = false;
  var middleclick = false;

  if (!e) e = window.event;
  if (e.which) {
    rightclick = (e.which == 3);
    middleclick = (e.which == 2);
  } else if (e.button) {
    rightclick = (e.button == 2);
    middleclick = (e.button == 1 || e.button == 4);
  }
  if (rightclick) {
    /* right click to recenter. */
    if (!map_select_active || !map_select_setting_enabled) {
      context_menu_active = true;
      recenter_button_pressed(mouse_x, mouse_y);
    } else {
      context_menu_active = false;
      map_select_units(mouse_x, mouse_y);
    }
    map_select_active = false;
    map_select_check = false;

  } else if (!middleclick) {
    /* Left mouse button*/
    action_button_pressed(mouse_x, mouse_y, SELECT_POPUP);
    update_mouse_cursor();
  }
  keyboard_input = true;

}

/****************************************************************************
  Triggered when the mouse button is clicked DOWN on the mapview canvas.
****************************************************************************/
function mapview_mouse_down(e)
{
  var rightclick = false;
  var middleclick = false;

  if (!e) e = window.event;
  if (e.which) {
    rightclick = (e.which == 3);
    middleclick = (e.which == 2);
  } else if (e.button) {
    rightclick = (e.button == 2);
    middleclick = (e.button == 1 || e.button == 4);
  }

  if (!rightclick && !middleclick) {
    /* Left mouse button is down */
    if (goto_active) return;
    set_mouse_touch_started_on_unit(canvas_pos_to_tile(mouse_x, mouse_y));
    check_mouse_drag_unit(canvas_pos_to_tile(mouse_x, mouse_y));
    touch_start_x = mouse_x;
    touch_start_y = mouse_y;

  } else if (middleclick || e['altKey']) {
    popit();
    return false;
  } else if (rightclick && !map_select_active && is_right_mouse_selection_supported()) {
    map_select_check = true;
    map_select_x = mouse_x;
    map_select_y = mouse_y;
    map_select_check_started = new Date().getTime();

    /* The context menu blocks the right click mouse up event on some
     * browsers. */
    context_menu_active = false;
  }
}



/****************************************************************************
  This function is triggered when ending a touch event on a touch device,
  eg finger up from screen.
****************************************************************************/
function mapview_touch_end(e)
{
  action_button_pressed(touch_start_x, touch_start_y, SELECT_POPUP);
}


/****************************************************************************
  This function is triggered when the mouse is clicked on the city canvas.
****************************************************************************/
function city_mapview_mouse_click(e)
{
  var rightclick;
  if (!e) e = window.event;
  if (e.which) {
    rightclick = (e.which == 3);
  } else if (e.button) {
    rightclick = (e.button == 2);
  }

  if (!rightclick) {
    city_action_button_pressed(mouse_x, mouse_y);
  }


}


/**************************************************************************
  Do some appropriate action when the "main" mouse button (usually
  left-click) is pressed.  For more sophisticated user control use (or
  write) a different xxx_button_pressed function.
**************************************************************************/
function action_button_pressed(canvas_x, canvas_y, qtype)
{
  var ptile = canvas_pos_to_tile(canvas_x, canvas_y);

  if (can_client_change_view() && ptile != null) {
    /* FIXME: Some actions here will need to check can_client_issue_orders.
     * But all we can check is the lowest common requirement. */
    do_map_click(ptile, qtype, true);
  }
}


/**************************************************************************
  Do some appropriate action when the "main" mouse button (usually
  left-click) is pressed.  For more sophisticated user control use (or
  write) a different xxx_button_pressed function.
**************************************************************************/
function city_action_button_pressed(canvas_x, canvas_y)
{
  var ptile = canvas_pos_to_tile(canvas_x, canvas_y);

  if (can_client_change_view() && ptile != null) {
    /* FIXME: Some actions here will need to check can_client_issue_orders.
     * But all we can check is the lowest common requirement. */
    do_city_map_click(ptile);
  }
}


/**************************************************************************
  This will select and set focus to all the units which are in the 
  selected rectangle on the map when the mouse is selected using the right
  mouse button. 
  [canvas_x, canvas_y, map_select_x, map_select_y].
**************************************************************************/
function map_select_units(canvas_x, canvas_y)
{
  var selected_tiles = {};
  var selected_units = [];
  if (client_is_observer()) return;

  var start_x = (map_select_x < canvas_x) ? map_select_x : canvas_x; 
  var start_y = (map_select_y < canvas_y) ? map_select_y : canvas_y; 
  var end_x = (map_select_x < canvas_x) ? canvas_x : map_select_x; 
  var end_y = (map_select_y < canvas_y) ? canvas_y : map_select_y; 


  for (var x = start_x; x < end_x; x += 15) {
    for (var y = start_y; y < end_y; y += 15) {
      var ptile = canvas_pos_to_tile(x, y);
      if (ptile != null) {
        selected_tiles[ptile['tile']] = ptile;
      }
    }
  }

  for (var tile_id in selected_tiles) {
    var ptile = selected_tiles[tile_id];
    var cunits = tile_units(ptile);
    if (cunits == null) continue;
    for (var i = 0; i < cunits.length; i++) {
      var aunit = cunits[i];
      if (aunit['owner'] == client.conn.playing.playerno) {
        selected_units.push(aunit);
      }
    }
  }

  current_focus = selected_units;
  action_selection_next_in_focus(IDENTITY_NUMBER_ZERO);
  update_active_units_dialog();
}



/**************************************************************************
Received tile info text.
**************************************************************************/
function handle_web_info_text_message(packet)
{
  var message = decodeURIComponent(packet['message']);
  var lines = message.split('\n');

  /* When a line starts with the key, the regex value is used to break it
   * in four elements:
   * - text before the player's name
   * - player's name
   * - text after the player's name and before the status insertion point
   * - text after the status insertion point
  **/
  var matcher = {
    'Terri': /^(Territory of )([^(]*)(\s+\([^,]*)(.*)/,
    'City:': /^(City:[^|]*\|\s+)([^(]*)(\s+\([^,]*)(.*)/,
    'Unit:': /^(Unit:[^|]*\|\s+)([^(]*)(\s+\([^,]*)(.*)/
  };

  for (var i = 0; i < lines.length; i++) {
    var re = matcher[lines[i].substr(0, 5)];
    if (re !== undefined) {
      var pplayer = null;
      var split_txt = lines[i].match(re);
      if (split_txt != null && split_txt.length > 4) {
        pplayer = player_by_full_username(split_txt[2]);
      }
      if (pplayer != null &&
          (client.conn.playing == null || pplayer != client.conn.playing)) {
        lines[i] = split_txt[1]
                 + "<a href='#' onclick='javascript:nation_table_select_player("
                 + pplayer['playerno']
                 + ");' style='color: black;'>"
                 + split_txt[2]
                 + "</a>"
                 + split_txt[3]
                 + ", "
                 + get_player_connection_status(pplayer)
                 + split_txt[4];
      }
    }
  }
  message = lines.join("<br>\n");

  show_dialog_message("Tile Information", message);

}


/**********************************************************************
    Freeciv-web - the web version of Freeciv. http://play.freeciv.org/
    Copyright (C) 2009-2016  The Freeciv-web project

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

var vertex_colors_dirty = false;
var trees_need_update = true;

/**************************************************************************
 Updates the terrain vertex colors to set tile to known, unknown or fogged.
**************************************************************************/
function webgl_update_tile_known(old_tile, new_tile)
{
  if (new_tile == null || old_tile == null || tile_get_known(new_tile) == tile_get_known(old_tile) || landGeometry == null) return;
  vertex_colors_dirty = true;

  if (tile_terrain(new_tile).name != tile_terrain(old_tile).name && tile_terrain(old_tile).name == "Forest" || tile_terrain(old_tile).name == "Jungle" || tile_terrain(new_tile).name == "Forest" || tile_terrain(new_tile).name == "Jungle") {
    trees_need_update = true;
  }
}



/**************************************************************************
Updates the terrain vertex colors to set irrigation, farmland, or none.
**************************************************************************/
function webgl_update_farmland_irrigation_vertex_colors(ptile)
{
  if (ptile == null || landGeometry == null) return;
  vertex_colors_dirty = true;
}

/**************************************************************************
 This will update the fog of war and unknown tiles, and farmland/irrigation
 by storing these as vertex colors in the landscape mesh.
**************************************************************************/
function update_tiles_known_vertex_colors()
{
  if (!vertex_colors_dirty) return;

  const colors = [];

  for ( let iy = 0; iy < gridY1; iy ++ ) {
    for ( let ix = 0; ix < gridX1; ix ++ ) {
      var sx = ix % xquality, sy = iy % yquality;
      var mx = Math.floor((sx / 6) - 0.040), my = Math.floor((sy / 6) - 0.040);
      var ptile = map_pos_to_tile(mx, my);
        if (ptile != null) {
          var c = get_vertex_color_from_tile(ptile, ix, iy);
          colors.push(c[0], c[1], c[2]);
        } else {
          colors.push(0,0,0);
        }

    }
  }

  landGeometry.setAttribute( 'vertColor', new THREE.Float32BufferAttribute( colors, 3) );

  landGeometry.colorsNeedUpdate = true;
  vertex_colors_dirty = false;

  add_trees_to_landgeometry();

}


/**************************************************************************
 Returns the vertex colors (THREE.Color) of a tile. The color is used to
 set terrain type in the terrain fragment shader.
**************************************************************************/
function get_vertex_color_from_tile(ptile, vertex_x, vertex_y)
{
    var known_status_color = 0;
    if (tile_get_known(ptile) == TILE_KNOWN_SEEN) {
      known_status_color = 1.06;

      // Unit shadow
      var units = tile_units(ptile);
      if (units != null && units.length > 0 && units[0]['anim_list'].length == 0 && (vertex_x % 6)> 3 && (vertex_y % 6) > 3) {
        known_status_color = 0.35;
      }

      // City shadow
      var pcity = tile_city(ptile);
      if (pcity != null && (vertex_x % 6) > 1 && (vertex_y % 6) > 1) {
        known_status_color = 0.40;
      }

    } else if (tile_get_known(ptile) == TILE_KNOWN_UNSEEN) {
      known_status_color = 0.54;
    } else if (tile_get_known(ptile) == TILE_UNKNOWN) {
      known_status_color = 0;
    }

    if (active_city != null && ptile != null && (tile_get_known(ptile) == TILE_KNOWN_SEEN || tile_get_known(ptile) == TILE_KNOWN_UNSEEN)) {
      // Hightlight active city
      var ctile = city_tile(active_city);
      if (ptile['index'] == ctile['index']) {
        known_status_color = 1.06;
      } else if (is_city_tile(ptile, active_city)) {
        known_status_color = 1.06;
      } else {
        known_status_color = 0.20;
      }
    }

    var farmland_irrigation_color = 0;
    if (tile_has_extra(ptile, EXTRA_FARMLAND)) {
      farmland_irrigation_color = 1.0;
    } else if (tile_has_extra(ptile, EXTRA_IRRIGATION)) {
      farmland_irrigation_color = 0.5;
    } else {
      farmland_irrigation_color = 0;
    }

    return [known_status_color, farmland_irrigation_color,0];

}

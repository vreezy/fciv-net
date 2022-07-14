/**********************************************************************
    Freeciv-web - the web version of Freeciv. http://www.fciv.net/
    Copyright (C) 2009-2022  The Freeciv-web project

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


var heightmap = null;

/****************************************************************************
  Returns height offset for units. This will make units higher above cities.
****************************************************************************/
function get_unit_height_offset(punit)
{
  if (punit == null) return 0;
  var ptile = index_to_tile(punit['tile']);
  if (ptile == null) return 0;
  var pcity = tile_city(ptile);

  if (pcity != null) return 10;

  return 0;

}

/****************************************************************************
  Returns height offset for cities.
****************************************************************************/
function get_city_height_offset(pcity)
{
  if (pcity == null) return 0;
  var ptile = index_to_tile(pcity['tile']);
  if (ptile == null) return 0;

  if (tile_terrain(ptile) != null) {
      if (tile_terrain(ptile)['name'] == "Hills") return -6;
      if (tile_terrain(ptile)['name'] == "Mountains") return -10;
  }

  return 2;

}

/****************************************************************************
  Create heightmap based on tile.height.
****************************************************************************/
function create_heightmap()
{
  var start_heightmap = new Date().getTime();
  var heightmap_resolution_x = map.xsize * 4 + 1;
  var heightmap_resolution_y = map.ysize * 4 + 1;

  heightmap = new Array(heightmap_resolution_x);
  for (var hx = 0; hx < heightmap_resolution_x; hx++) {
    heightmap[hx] = new Array(heightmap_resolution_y);
  }

  // Make coastline more distinct, to make it easier to distinguish ocean from land.
  for (var x = 0; x < map.xsize ; x++) {
    for (var y = 0; y < map.ysize; y++) {
      var ptile = map_pos_to_tile(x, y);
      if (is_ocean_tile(ptile) && is_land_tile_near(ptile)) {
        ptile['height'] = 0.45;
      }
      if (!is_ocean_tile(ptile) && is_ocean_tile_near(ptile) && !tile_has_extra(ptile, EXTRA_RIVER)) {
        ptile['height'] = 0.55;
      }
    }
  }

  for (var x = 0; x < heightmap_resolution_x; x++) {
    for (var y = 0; y < heightmap_resolution_y; y++) {
      var gx = x / 4 - 0.5;
      var gy = y / 4 - 0.5;

      if (Math.round(gx) == gx && Math.round(gy) == gy) {
        var ptile = map_pos_to_tile(gx, gy);
        heightmap[x][y] = ptile['height'];
      } else {

        var neighbours = [
          { "x": Math.floor(gx), "y": Math.floor(gy) },
          { "x": Math.floor(gx), "y": Math.ceil(gy) },
          { "x": Math.ceil(gx),  "y": Math.floor(gy) },
          { "x": Math.ceil(gx),  "y": Math.ceil(gy) }];

        var norm = 0;
        var sum = 0;
        for (var i = 0; i < 4; i++) {
          var coords = neighbours[i];
          if (coords.x < 0 || coords.x >= map.xsize ||
              coords.y < 0 || coords.y >= map.ysize) {
            /* Outside of map, don't use in the sum */
            continue;
          }
          var dx = gx - coords.x;
          var dy = gy - coords.y;
          var distance = Math.sqrt(dx*dx + dy*dy);
          var ptile = map_pos_to_tile(coords.x, coords.y);
          sum += ptile['height'] / distance / distance;
          norm += 1. / distance / distance;
        }

        heightmap[x][y] = (sum / norm);
      }
    }
  }

  console.log("create_heightmap took: " + (new Date().getTime() - start_heightmap) + " ms.");

}


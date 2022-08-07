/**********************************************************************
    Fciv.net - the web version of Freeciv. http://www.fciv.net/
    Copyright (C) 2009-2022  The Fciv.net project

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


var city_worked_positions = {};

/****************************************************************************
Show labels with worked city tiles.
****************************************************************************/
function show_city_worked_tiles()
{
  if (active_city == null) return;

  city_label_positions[city_tile(active_city)['index']].visible = false;

  for (var tile_id in tiles) {
    var ptile = tiles[tile_id];
    if (active_city != null && ptile != null && ptile['worked'] != null
          && active_city['id'] == ptile['worked'] && active_city['food_output'] != null) {
      var ctile = city_tile(active_city);
      var d = map_distance_vector(ctile, ptile);
      var idx = get_city_dxy_to_index(d[0], d[1], active_city);
      var pos = map_to_scene_coords(ptile['x'], ptile['y']);
      var height = 5 + ptile['height'] * 100 + 10;

      var food_output = active_city['food_output'].substring(idx, idx + 1);
      var shield_output = active_city['shield_output'].substring(idx, idx + 1);
      var trade_output = active_city['trade_output'].substring(idx, idx + 1);

      /* The ruleset may use large values scaled down to get greater
       * granularity. */
      food_output = Math.floor(food_output / game_info.granularity);
      shield_output = Math.floor(shield_output / game_info.granularity);
      trade_output = Math.floor(trade_output / game_info.granularity);

      if (city_worked_positions[ptile['index']] == null) {
        var mesh = get_city_worked_mesh(food_output, shield_output, trade_output)
        mesh.matrixAutoUpdate = false;
        city_worked_positions[ptile['index']] = mesh;
        mesh.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] + 4);
        mesh.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + 18);
        mesh.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] + 10);
        mesh.rotation.y = Math.PI / 4;
        mesh.updateMatrix();
        if (scene != null) {
          scene.add(mesh);
        }
      }
    }
  }

}


/****************************************************************************
  Remove all city worked labels.
****************************************************************************/
function remove_city_worked_tiles() {
  for (var workedid in city_worked_positions) {
    scene.remove(city_worked_positions[workedid]);
    delete city_worked_positions[workedid];
  }

  if (active_city != null) {
      city_label_positions[city_tile(active_city)['index']].visible = true;
  }
}

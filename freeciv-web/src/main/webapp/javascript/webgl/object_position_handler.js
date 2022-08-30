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
var flag_dy = 0;
var flag_dx = 16;
var flag_dz = 18;

// stores unit positions on the map. tile index is key, unit 3d model is value.
var unit_positions = {};
// stores city positions on the map. tile index is key, unit 3d model is value.
var city_positions = {};
var city_label_positions = {};
var city_walls_positions = {};
var city_disorder_positions = {};

// stores flag positions on the map. tile index is key, unit 3d model is value.
var unit_flag_positions = {};
var unit_label_positions = {};
var unit_activities_positions = {};

var map_tile_label_positions = {};

var unit_health_positions = {};
var unit_healthpercentage_positions = {};

// stores tile extras (eg specials), key is extra + "." + tile_index.
var tile_extra_positions = {};

// key is tile id, value is three.js point object.
var extra_visibilities = {};

var selected_unit_indicator = null;
var selected_unit_material = null;
var selected_unit_material_counter = 0;

/****************************************************************************
  Handles unit positions
****************************************************************************/
function update_unit_position(ptile) {

  var visible_unit = find_visible_unit(ptile);
  var height = 5 + ptile['height'] * 100 + get_unit_height_offset(visible_unit);

  if (unit_positions[ptile['index']] != null && visible_unit == null) {
    // tile has no visible units, remove it from unit_positions.
    if (scene != null) scene.remove(unit_positions[ptile['index']]);
    delete unit_positions[ptile['index']];

    if (scene != null) scene.remove(unit_flag_positions[ptile['index']]);
    delete unit_flag_positions[ptile['index']];

    if (scene != null) scene.remove(unit_label_positions[ptile['index']]);
    delete unit_label_positions[ptile['index']];
    unit_activities_positions[ptile['index']] = null;

    if (scene != null) scene.remove(unit_health_positions[ptile['index']]);
    delete unit_health_positions[ptile['index']];
    unit_healthpercentage_positions[ptile['index']] = null;
  }

  if (unit_positions[ptile['index']] == null && visible_unit != null) {
    // add new unit to the unit_positions
    var unit_type_name = unit_type(visible_unit)['name'];
    if (unit_type_name == null) {
      console.error(unit_type_name + " model not loaded correcly.");
      return;
    }

    var new_unit = webgl_get_model(unit_type_name);
    if (new_unit == null) return;
    unit_positions[ptile['index']] = new_unit;
    var pos;
    if (visible_unit['anim_list'].length > 0) {
      var stile = tiles[visible_unit['anim_list'][0]['tile']];
      pos = map_to_scene_coords(stile['x'], stile['y']);
      height = 5 + stile['height'] * 100  + get_unit_height_offset(visible_unit);
    } else {
      pos = map_to_scene_coords(ptile['x'], ptile['y']);
    }
    new_unit.matrixAutoUpdate = false;
    new_unit.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - 4);
    new_unit.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height - 2);
    new_unit.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 4);
    var rnd_rotation = Math.floor(Math.random() * 8);
    new_unit.rotateOnAxis(new THREE.Vector3(0,1,0).normalize(), (convert_unit_rotation(rnd_rotation) * Math.PI * 2 / 8));
    new_unit.updateMatrix();

    if (scene != null) {
      scene.add(new_unit);
    }
    /* add flag. */
    var pflag = get_unit_nation_flag_sprite(visible_unit);
    var new_flag;
    if (unit_flag_positions[ptile['index']] == null) {
      new_flag = get_flag_shield_mesh(pflag['key']);
      new_flag.matrixAutoUpdate = false;
      unit_flag_positions[ptile['index']] = new_flag;
      new_flag.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - 10);
      new_flag.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + 20);
      new_flag.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 10);
      new_flag.rotation.y = Math.PI / 4;
      new_flag.updateMatrix();
      if (scene != null) {
        scene.add(new_flag);
      }
    }

    /* indicate focus unit*/
    var funit = get_focus_unit_on_tile(ptile);
    var selected_mesh;
    if (scene != null && funit != null && funit['id'] == visible_unit['id']) {
      if (selected_unit_indicator != null) {
        scene.remove(selected_unit_indicator);
        selected_unit_indicator = null;
      }
      if (visible_unit['anim_list'].length == 0) {
        selected_mesh = new THREE.Mesh( new THREE.RingGeometry( 18, 20, 30), selected_unit_material );
        selected_mesh.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - 2);
        selected_mesh.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + 2);
        selected_mesh.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 2);
        selected_mesh.rotation.x = -1 * Math.PI / 2;
        scene.add(selected_mesh);
        selected_unit_indicator = selected_mesh;
      }
    }

    anim_objs[visible_unit['id']] = {'unit' : visible_unit['id'], 'mesh' : new_unit, 'flag' : new_flag};


  } else if (unit_positions[ptile['index']] != null && visible_unit != null) {
    // Update of visible unit.
    // TODO: update_unit_position() contains _almost_ the same code twice. this is the duplicate part.
    var unit_type_name = unit_type(visible_unit)['name'];
    var pos;
    if (visible_unit['anim_list'].length > 0) {
      var stile = tiles[visible_unit['anim_list'][0]['tile']];
      pos = map_to_scene_coords(stile['x'], stile['y']);
      height = 5 + stile['height'] * 100  + get_unit_height_offset(visible_unit);
    } else {
      pos = map_to_scene_coords(ptile['x'], ptile['y']);
    }

    if (scene != null) scene.remove(unit_positions[ptile['index']]);
    delete unit_positions[ptile['index']];

    if (scene != null && unit_flag_positions[ptile['index']] != null) scene.remove(unit_flag_positions[ptile['index']]);
    delete unit_flag_positions[ptile['index']];

    var activity;
    if (unit_activities_positions[ptile['index']] != get_unit_activity_text(visible_unit) + tile_units(ptile).length
        && visible_unit['anim_list'].length == 0) {
      // add unit activity label
      if (scene != null && unit_label_positions[ptile['index']] != null) scene.remove(unit_label_positions[ptile['index']]);
      if (get_unit_activity_text(visible_unit) != null || tile_units(ptile).length > 1) {
        activity = create_unit_label(visible_unit, ptile);
        if (activity != null) {
          activity.matrixAutoUpdate = false;
          activity.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] + 8);
          activity.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + 28);
          activity.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 5);
          activity.rotation.y = Math.PI / 4;
          activity.updateMatrix();
          if (scene != null) scene.add(activity);
          unit_label_positions[ptile['index']] = activity;
        }
      }
      unit_activities_positions[ptile['index']] = get_unit_activity_text(visible_unit) + tile_units(ptile).length;
    }

    var new_unit_health_bar;
    if (unit_healthpercentage_positions[ptile['index']] != visible_unit['hp'] && visible_unit['anim_list'].length == 0) {
      if (scene != null && unit_health_positions[ptile['index']] != null) scene.remove(unit_health_positions[ptile['index']]);
      new_unit_health_bar = get_unit_health_mesh(visible_unit);
      new_unit_health_bar.matrixAutoUpdate = false;
      unit_health_positions[ptile['index']] = new_unit_health_bar;
      new_unit_health_bar.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - flag_dx);
      new_unit_health_bar.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + flag_dz+6);
      new_unit_health_bar.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - flag_dy);
      new_unit_health_bar.rotation.y = Math.PI / 4;
      new_unit_health_bar.updateMatrix();
      if (scene != null) {
        scene.add(new_unit_health_bar);
      }
      unit_healthpercentage_positions[ptile['index']] = visible_unit['hp'];
    }

    /* indicate focus unit*/
    var funit = get_focus_unit_on_tile(ptile);
    var selected_mesh;
    if (scene != null && funit != null && funit['id'] == visible_unit['id']) {
      if (selected_unit_indicator != null) {
        scene.remove(selected_unit_indicator);
        selected_unit_indicator = null;
      }
      if (visible_unit['anim_list'].length == 0) {
        selected_mesh = new THREE.Mesh( new THREE.RingGeometry( 18, 20, 30), selected_unit_material );
        selected_mesh.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - 2);
        selected_mesh.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + 2);
        selected_mesh.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 2);
        selected_mesh.rotation.x = -1 * Math.PI / 2;
        scene.add(selected_mesh);
        selected_unit_indicator = selected_mesh;
      }
    }

    if (unit_type_name == null) {
      console.error(unit_type_name + " model not loaded correcly.");
      return;
    }

    var new_unit = webgl_get_model(unit_type_name);
    if (new_unit == null) return;
    unit_positions[ptile['index']] = new_unit;
    unit_positions[ptile['index']]['unit_type'] = unit_type_name;

    new_unit.matrixAutoUpdate = false;
    new_unit.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - 4);
    new_unit.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height - 2);
    new_unit.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 4);
    new_unit.rotateOnAxis(new THREE.Vector3(0,1,0).normalize(), (convert_unit_rotation(visible_unit['facing']) * Math.PI * 2 / 8));
    new_unit.updateMatrix();

    if (scene != null) {
      scene.add(new_unit);
    }

    /* add flag. */
    var pflag = get_unit_nation_flag_sprite(visible_unit);
    var new_flag;
    if (unit_flag_positions[ptile['index']] == null) {
      new_flag = get_flag_shield_mesh(pflag['key']);
      new_flag.matrixAutoUpdate = false;
      unit_flag_positions[ptile['index']] = new_flag;
      new_flag.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - flag_dx);
      new_flag.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + flag_dz);
      new_flag.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - flag_dy);
      new_flag.rotation.y = Math.PI / 4;
      new_flag.updateMatrix();
      if (scene != null) {
        scene.add(new_flag);
      }
    }

    anim_objs[visible_unit['id']] = {'unit' : visible_unit['id'], 'mesh' : new_unit, 'flag' : new_flag};
  }

}

/****************************************************************************
  Handles city positions
****************************************************************************/
function update_city_position(ptile) {

  var pcity = tile_city(ptile);
  var punits = tile_units(ptile);

  var height = 5 + ptile['height'] * 100 + get_city_height_offset(pcity);

  if (city_positions[ptile['index']] != null && pcity == null) {
    // tile has no city, remove it from unit_positions.
    if (scene != null) scene.remove(city_positions[ptile['index']]);
    delete city_positions[ptile['index']];
    if (scene != null) scene.remove(city_label_positions[ptile['index']]);
    delete city_label_positions[ptile['index']];
    if (scene != null) scene.remove(city_walls_positions[ptile['index']]);
    delete city_walls_positions[ptile['index']];
    if (scene != null && city_disorder_positions[ptile['index']] != null) scene.remove(city_disorder_positions[ptile['index']]);
    delete city_disorder_positions[ptile['index']];
  }

  if (city_positions[ptile['index']] == null && pcity != null) {
    // add new city
    var model_name = city_to_3d_model_name(pcity);
    pcity['webgl_model_name'] = model_name;
    var new_city = webgl_get_model(model_name);
    if (new_city == null) return;
    city_positions[ptile['index']] = new_city;

    var pos = map_to_scene_coords(ptile['x'], ptile['y']);
    new_city.position.set(pos['x'] - 10, height, pos['y'] - 10);
    new_city.rotateOnAxis(new THREE.Vector3(0,1,0).normalize(), (2 * Math.PI * Math.random()));

    if (scene != null) {
      scene.add(new_city);
    }

    if (scene != null && pcity['walls'] && city_walls_positions[ptile['index']] == null) {
      var city_walls = webgl_get_model("citywalls");
      if (city_walls != null) {
        city_walls.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - 10);
        city_walls.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height);
        city_walls.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 10);
        city_walls.scale.x = city_walls.scale.y = city_walls.scale.z = get_citywalls_scale(pcity);
        scene.add(city_walls);
        city_walls_positions[ptile['index']] = city_walls;
      }
    }

    var city_label = create_city_label(pcity);
    city_label_positions[ptile['index']] = city_label;
    city_label.position.set(pos['x'] - 5, height + 30, pos['y'] - 15);
    city_label.rotation.y = Math.PI / 4;
    pcity['webgl_label_hash'] = pcity['name'] + pcity['size'] + pcity['production_value'] + "." + pcity['production_kind'] + punits.length;
    if (scene != null) scene.add(city_label);
    return;
  }

  if (city_positions[ptile['index']] != null && pcity != null) {
    // Update of visible city.
    var model_name = city_to_3d_model_name(pcity);
    if (pcity['webgl_model_name'] != model_name) {
      // update city model to a different size.
      if (scene != null) scene.remove(city_positions[ptile['index']]);
      pcity['webgl_model_name'] = model_name;
      var new_city = webgl_get_model(model_name);
      if (new_city == null) return;
      city_positions[ptile['index']] = new_city;

      var pos = map_to_scene_coords(ptile['x'], ptile['y']);
      new_city.position.set(pos['x'] - 10, height, pos['y'] - 10);
      new_city.rotateOnAxis(new THREE.Vector3(0,1,0).normalize(), (2 * Math.PI * Math.random()));

      if (scene != null) {
        scene.add(new_city);
      }

      if (scene != null && pcity['walls'] && city_walls_positions[ptile['index']] != null) {
        // remove city walls, they need updating.
        scene.remove(city_walls_positions[ptile['index']]);
        delete city_walls_positions[ptile['index']];
      }
    }
    var pos = map_to_scene_coords(ptile['x'], ptile['y']);

    if (scene != null && pcity['walls'] && city_walls_positions[ptile['index']] == null) {
      var city_walls = webgl_get_model("citywalls");
      if (city_walls != null) {
        city_walls.position.set(pos['x'] - 10, height, pos['y'] - 10);
        city_walls.scale.x = city_walls.scale.y = city_walls.scale.z = get_citywalls_scale(pcity);
        scene.add(city_walls);
        city_walls_positions[ptile['index']] = city_walls;
      }
    }

    if (pcity['webgl_label_hash'] != pcity['name'] + pcity['size'] + pcity['production_value'] + "." + pcity['production_kind'] + punits.length) {
      update_city_label(pcity);
      pcity['webgl_label_hash'] = pcity['name'] + pcity['size'] + pcity['production_value'] + "." +  pcity['production_kind'] + punits.length;
    }
  }

  // City civil disorder label
  if (scene != null && pcity != null) {
    if (city_disorder_positions[ptile['index']] == null && pcity['unhappy']) {
        // TODO: migrate all labels to use THREE.Sprite in this way:
        var city_disorder_sprite = create_city_disorder_sprite();
        city_disorder_sprite.position.set(pos['x'] - 5, height + 25, pos['y'] - 10);
        if (scene != null) scene.add(city_disorder_sprite);
        city_disorder_positions[ptile['index']] = city_disorder_sprite;

    } else if (city_disorder_positions[ptile['index']] != null && !pcity['unhappy']) {
      // Remove city civil disorder label
      scene.remove(city_disorder_positions[ptile['index']]);
      delete city_disorder_positions[ptile['index']];
    }
  }

}

/****************************************************************************
  Handles tile extras, such as specials.
****************************************************************************/
function update_tile_extras(ptile) {

  if (ptile == null || tile_get_known(ptile) == TILE_UNKNOWN) return;

  var height = 5 + ptile['height'] * 100;

  webgl_update_farmland_irrigation_vertex_colors(ptile);

  update_tile_extra_update_model(EXTRA_MINE, "Mine", ptile);
  update_tile_extra_update_model(EXTRA_HUT, "Hut", ptile);
  update_tile_extra_update_model(EXTRA_RUINS, "Ruins", ptile);
  update_tile_extra_update_model(EXTRA_AIRBASE, "Airbase", ptile);
  update_tile_extra_update_model(EXTRA_FORTRESS, "Fortress", ptile);

  // Render tile specials (extras), as 2D sprites from the 2D version.
  const extra_id = tile_resource(ptile);
  var extra_resource = (extra_id === null) ? null : extras[extra_id];
  if (extra_resource != null && scene != null && tile_extra_positions[extra_resource['id'] + "." + ptile['index']] == null && extra_visibilities[ptile['index']] == null) {
      var key = extra_resource['graphic_str'];
      var extra_texture = get_extra_texture(key);

      if (tile_has_extra(ptile, EXTRA_RIVER)) {
        height += 10;
      }
      if (extra_resource['name'] == "Gold" || extra_resource['name'] == "Iron") {
        height -= 5;
        if (tile_has_extra(ptile, EXTRA_RIVER) && tile_terrain(ptile)['name'] == "Mountains") {
          height -= 15;
        }
      }
      if (extra_resource['name'] == "Fish" || extra_resource['name'] == "Whales") {
        height = 52.4;
      }
      var pos = map_to_scene_coords(ptile['x'], ptile['y']);
      const extra_vertices = [];
      extra_vertices.push(pos['x'] - 10, height, pos['y'] - 10);

      var extra_geometry = new THREE.BufferGeometry();
      extra_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( extra_vertices, 3 ));
      var extra_material = new THREE.PointsMaterial( { size: 42, sizeAttenuation: true, map: extra_texture,  alphaTest: 0.2, transparent: true, opacity: 1.0 } );
      var extra_points = new THREE.Points( extra_geometry, extra_material );
      extra_material.transparent = true;
      scene.add(extra_points);
      extra_visibilities[ptile['index']] = extra_points;
  }

  if (tile_get_known(ptile) == TILE_KNOWN_SEEN && extra_visibilities[ptile['index']] != null) {
    extra_visibilities[ptile['index']].material.opacity = 1;
  } else if (tile_get_known(ptile) == TILE_KNOWN_UNSEEN && extra_visibilities[ptile['index']] != null) {
    extra_visibilities[ptile['index']].material.opacity = 0.8;
  }


}


/****************************************************************************
  Adds or removes a extra tile 3d model.
****************************************************************************/
function update_tile_extra_update_model(extra_type, extra_name, ptile)
{
  if (tile_extra_positions[extra_type + "." + ptile['index']] == null && tile_has_extra(ptile, extra_type)) {
    var height = 5 + ptile['height'] * 100;

    var model = webgl_get_model(extra_name);
    if (model == null) return;
    tile_extra_positions[extra_type + "." + ptile['index']] = model;
    var pos = map_to_scene_coords(ptile['x'], ptile['y']);
    model.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), pos['x'] - 10);
    model.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), height + 3);
    model.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), pos['y'] - 10);
    if (scene != null) scene.add(model);

  } else if (scene != null && tile_extra_positions[extra_type + "." + ptile['index']] != null && !tile_has_extra(ptile, extra_type)) {
    scene.remove(tile_extra_positions[extra_type + "." + ptile['index']]);
  }
}

/****************************************************************************
  Clears the selected unit indicator.
****************************************************************************/
function webgl_clear_unit_focus()
{
  if (scene != null && selected_unit_indicator != null) {
    scene.remove(selected_unit_indicator);
    selected_unit_indicator = null;
  }
}

/****************************************************************************
  Adds all units and cities to the map.
****************************************************************************/
function add_all_objects_to_scene()
{
  unit_positions = {};
  city_positions = {};
  city_label_positions = {};
  city_walls_positions = {};
  unit_flag_positions = {};
  unit_label_positions = {};
  unit_activities_positions = {};
  unit_health_positions = {};
  unit_healthpercentage_positions = {};
  tile_extra_positions = {};
  road_positions = {};
  rail_positions = {};

  for (var unit_id in units) {
    var punit = units[unit_id];
    var ptile = index_to_tile(punit['tile']);
    update_unit_position(ptile);
  }

  for (var city_id in cities) {
    var pcity = cities[city_id];
    update_city_position(city_tile(pcity));
  }

  for (var tile_id in tiles) {
    update_tile_extras(tiles[tile_id]);
  }


}
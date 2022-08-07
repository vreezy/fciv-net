/**********************************************************************
    Freeciv-web - the web version of Freeciv. http://play.freeciv.org/
    Copyright (C) 2009-2017  The Freeciv-web project

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

var webgl_textures = {};
var webgl_models = {};
var start_preload = 0;
var total_model_count = 0;
var load_count = 0;
var webgl_materials = {};

var meshes = {};

var model_filenames = ["AEGIS Cruiser",     "Helicopter",    "Pikemen",
                       "Alpine Troops",     "Horsemen",
                       "Archers",           "citywalls",        "Howitzer",      "Riflemen",
                       "Armor",             "Hut",
                       "Artillery",         "Cruise Missile",   "Ironclad",      "Settlers",
                       "AWACS",             "Cruiser",
                       "Barbarian Leader",  "Destroyer",        "Spy",
                       "Battleship",        "Diplomat",         "Knights",       "Stealth Bomber",
                       "Bomber",            "Dragoons",         "Legion",        "Submarine",
                       "Engineers",         "Marines",          "Transport",
                       "Cannon",            "Explorer",         "Mech. Inf.",    "Trireme",
                       "Caravan",           "Fighter",          "Mine",          "Warriors",
                       "Caravel",           "Musketeers",
                       "Carrier",           "Freight",          "Nuclear",
                       "Catapult",          "Frigate",          "Migrants",
                       "Cavalry",           "Paratroopers",     "Workers",
                       "Chariot",           "Galleon",          "Partisan",
                       "Phalanx",          "Ruins",
                       "Airbase",           "Fortress",
                       "city_european_0",
                       "city_european_1",
                       "city_european_2",
                       "city_european_3",
                       "city_european_4",
                       "city_modern_0",
                       "city_modern_1",
                       "city_modern_2",
                       "city_modern_3",
                       "city_modern_4"
                      ];

/****************************************************************************
  Preload textures and models
****************************************************************************/
function webgl_preload()
{
  $.blockUI({ message: "<h2>Downloading <span id='download_progress'></span></h2>" });
  start_preload = new Date().getTime();

  var loadingManager = new THREE.LoadingManager();
  loadingManager.onLoad = function () {
    webgl_preload_models();
  };

  var textureLoader = new THREE.ImageLoader( loadingManager );

  /* Preload tree sprite. */
  var tree_sprite = new THREE.Texture();
  webgl_textures["tree_1"] = tree_sprite;
  textureLoader.load( '/textures/tree_1.png', function ( image ) {
      tree_sprite.image = image;
      tree_sprite.needsUpdate = true;
  } );

  var jungle_sprite = new THREE.Texture();
  webgl_textures["jungle_1"] = jungle_sprite;
  textureLoader.load( '/textures/jungle_1.png', function ( image ) {
      jungle_sprite.image = image;
      jungle_sprite.needsUpdate = true;
  } );

  var city_disorder = new THREE.Texture();
  textureLoader.load( '/textures/city_civil_disorder.png', function ( image ) {
    city_disorder.image = image;
    city_disorder.needsUpdate = true;

    var material = new THREE.ShaderMaterial({
      vertexShader: document.getElementById('labels_vertex_shh').textContent,
      fragmentShader: document.getElementById('tex_fragment_shh').textContent,
      uniforms: {
        texture: { value: city_disorder },
        u_scale_factor: { value: 1 }
      }
    });
    material.transparent = true;
    webgl_materials['city_disorder'] = material;
  });

  for (var i = 0; i < tiletype_terrains.length ; i++) {
    var terrain_name = tiletype_terrains[i];
    textureLoader.load("/textures/large/" + terrain_name + ".png", handle_new_texture("/textures/large/" + terrain_name + ".png", terrain_name));
  }


  /* Preload road textures. */
  imgurl = "/textures/large/roads.png";
  textureLoader.load(imgurl, (function (url) {
          return function (image) {
                $("#download_progress").html(" road textures 15%");
                webgl_textures["roads"] = new THREE.Texture();
                webgl_textures["roads"].image = image;
                webgl_textures["roads"].wrapS = THREE.RepeatWrapping;
                webgl_textures["roads"].wrapT = THREE.RepeatWrapping;
                webgl_textures["roads"].magFilter = THREE.LinearFilter;
                webgl_textures["roads"].minFilter = THREE.LinearFilter;
                webgl_textures["roads"].needsUpdate = true;
            }
    })(imgurl)
  );

  /* Preload railroads textures. */
  imgurl = "/textures/large/railroads.png";

  textureLoader.load(imgurl, (function (url) {
          return function (image) {
                $("#download_progress").html(" railroad textures 25%");
                webgl_textures["railroads"] = new THREE.Texture();
                webgl_textures["railroads"].image = image;
                webgl_textures["railroads"].wrapS = THREE.RepeatWrapping;
                webgl_textures["railroads"].wrapT = THREE.RepeatWrapping;
                webgl_textures["railroads"].magFilter = THREE.LinearFilter;
                webgl_textures["railroads"].minFilter = THREE.LinearFilter;
                webgl_textures["railroads"].needsUpdate = true;
            }
    })(imgurl)
  );
}

/****************************************************************************
  ...
****************************************************************************/
function handle_new_texture(url, terrain_name)
{
  return function (image) {
                var texture = new THREE.Texture();
                texture.image = image;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearFilter;
                texture.needsUpdate = true;
                webgl_textures[terrain_name] = texture;
  }
}

/****************************************************************************
  Preload all models.
****************************************************************************/
function webgl_preload_models()
{
  total_model_count = model_filenames.length;
  for (var i = 0; i < model_filenames.length; i++) {
    load_model(model_filenames[i]);
  }
}

/****************************************************************************
 Load glTF (binary .glb) model from the server and import is as a model mesh.
****************************************************************************/
function load_model(filename)
{
  var url = "/gltf/" + filename + ".glb";

  const loader = new THREE.GLTFLoader();

  loader.load( url, function(data) {
    var model = data.scene;
    $("#download_progress").html(" 3D models " + Math.floor(30 + (0.7 * 100 * load_count / total_model_count)) + "%");

    model.traverse((node) => {
      if (node.isMesh) {
        node.material.flatShading = false;
        node.material.side = THREE.DoubleSide;
        node.material.needsUpdate = true;
        node.geometry.computeVertexNormals();
      }
    });

    model.scale.x = model.scale.y = model.scale.z = 12;
    webgl_models[filename] = model;
    load_count++;
    if (load_count == total_model_count) webgl_preload_complete();

   });
}

/****************************************************************************
 Returns a single 3D model mesh object.
****************************************************************************/
function webgl_get_model(filename)
{
  if (webgl_models[filename] != null) {
    return webgl_models[filename].clone();
  } else {
    return null;
  }
}

/****************************************************************************
 Returns a flag shield mesh
****************************************************************************/
function get_flag_shield_mesh(key)
{
  if (meshes[key] != null) return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1)
  if (sprites[key] == null || key.substring(0,8) != "f.shield") {
    console.log("Invalid flag shield key: " + key);
    return null;
  }

  /* resize flag to 32x16, since that is required by Three.js*/
  var fcanvas = document.createElement("canvas");
  fcanvas.width = 32;
  fcanvas.height = 16;
  var fcontext = fcanvas.getContext("2d");
  fcontext.drawImage(sprites[key], 0, 0,
                sprites[key].width, sprites[key].height,
                0,0,32,16);

  meshes[key] = canvas_to_user_facing_mesh(fcanvas, 32, 12, 13, true);
  return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1)
}

/****************************************************************************
 Returns a city worked mesh
****************************************************************************/
function get_city_worked_mesh(food, shields, trade)
{
  var key = food.toString() + shields.toString() + trade.toString();
  if (meshes[key] != null) return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1);

  var fcanvas = document.createElement("canvas");
  fcanvas.width = 64;
  fcanvas.height = 32;
  var fcontext = fcanvas.getContext("2d");

  var fkey = "city.t_food_" + food;
  fcontext.drawImage(sprites[fkey], 0, sprites[fkey].height / 2,
                sprites[fkey].width, sprites[fkey].height / 2,
                0,0,64,32);
  var skey = "city.t_shields_" + shields;
  fcontext.drawImage(sprites[skey], 0, sprites[fkey].height / 2,
                sprites[skey].width, sprites[skey].height / 2,
                0,0,64,32);
  var tkey = "city.t_trade_" + food;
  fcontext.drawImage(sprites[tkey], 0, sprites[fkey].height / 2,
                sprites[tkey].width, sprites[tkey].height / 2,
                0,0,64,32);

  meshes[key] = canvas_to_user_facing_mesh(fcanvas, 32, 32, 16, true);
  return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1)
}

/****************************************************************************
 Returns a extra texture
****************************************************************************/
function get_extra_texture(key)
{
  if (key != null && texture_cache[key] != null) {
      return texture_cache[key];
  }
  if (sprites[key] == null ) {
    console.log("Invalid extra key: " + key);
    return null;
  }

  var ecanvas = document.createElement("canvas");
  ecanvas.width = 42;
  ecanvas.height = 42;
  var econtext = ecanvas.getContext("2d");
  econtext.drawImage(sprites[key], 14, 6,
                sprites[key].width - 33, sprites[key].height,
                0,0,42,42);

  // Create a new texture out of the canvas
  var texture = new THREE.Texture(ecanvas);
  texture.needsUpdate = true;
  texture_cache[key] = texture;

  return texture;
}

/****************************************************************************
 Returns unit explosion mesh  (frame = [0-4].
****************************************************************************/
function get_unit_explosion_mesh(frame)
{
  var key = 'explode.unit_' + frame;
  if (meshes[key] != null) return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1);
  if (sprites[key] == null) {
    console.log("Invalid unit explosion key: " + key);
    return null;
  }

  var ecanvas = document.createElement("canvas");
  ecanvas.width = 32;
  ecanvas.height = 32;
  var econtext = ecanvas.getContext("2d");
  econtext.drawImage(sprites[key], 0, 0,
                sprites[key].width, sprites[key].height,
                0,0,32,32);

  meshes[key] = canvas_to_user_facing_mesh(ecanvas, 32, 32, 32, true);
  return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1);
}

/****************************************************************************
 Returns nuke explosion mesh
****************************************************************************/
function get_nuke_explosion_mesh(frame)
{
  var key = 'explode.nuke';
  if (meshes[key] != null) return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1)
  if (sprites[key] == null) {
    console.log("Invalid nuke explosion key: " + key);
    return null;
  }

  var ecanvas = document.createElement("canvas");
  ecanvas.width = 256;
  ecanvas.height = 256;
  var econtext = ecanvas.getContext("2d");
  econtext.drawImage(sprites[key], 0, 0,
                sprites[key].width, sprites[key].height,
                0,0,sprites[key].width,sprites[key].height);

  meshes[key] = canvas_to_user_facing_mesh(ecanvas, 180, 180, 176, true);
  return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1)
}

/****************************************************************************
 Returns a unit health mesh
****************************************************************************/
function get_unit_health_mesh(punit)
{
  if (punit == null || punit['hp'] == null) return null;
  var hp = punit['hp'];
  var unit_type = unit_types[punit['type']];
  var max_hp = unit_type['hp'];
  var healthpercent = 10 * Math.floor((10 * hp) / max_hp);
  var key = "unit_health_" + healthpercent;

  if (meshes[key] != null) return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1)

  var fcanvas = document.createElement("canvas");
  fcanvas.width = 32;
  fcanvas.height = 16;
  var ctx = fcanvas.getContext("2d");
  ctx.drawImage(sprites["unit.hp_" + healthpercent], 25, 10,
                22, 7,
                0,0,32,16);

  meshes[key] = canvas_to_user_facing_mesh(fcanvas, 32, 18, 3, true);
  return new THREE.InstancedMesh(meshes[key].geometry, meshes[key].material, 1)
}

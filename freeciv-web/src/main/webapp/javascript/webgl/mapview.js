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

var container, stats;
var scene, maprenderer;
var anaglyph_effect;

var plane, cube;
var mouse, raycaster;
var directionalLight;
var clock;
var webgl_controls;

var tiletype_terrains = ["lake","coast","floor","arctic","desert","forest","grassland","hills","jungle","mountains","plains","swamp","tundra", "beach"];

var landGeometry;
var landMesh;
var water;

var start_webgl;

var mapview_model_width;
var mapview_model_height;
var xquality;
var yquality;
var MAPVIEW_ASPECT_FACTOR = 35.71;


/****************************************************************************
  Start the Freeciv-web WebGL renderer
****************************************************************************/
function webgl_start_renderer()
{
  var new_mapview_width = $(window).width() - width_offset;
  var new_mapview_height;
  if (!is_small_screen()) {
    new_mapview_height = $(window).height() - height_offset;
  } else {
    new_mapview_height = $(window).height() - height_offset - 40;
  }

  if (!Detector.webgl) {
    swal("3D WebGL not supported by your browser or you don't have a 3D graphics card. Please go back and try the 2D version instead. ");
    return;
  }

  container = document.getElementById('canvas_div');
  camera = new THREE.PerspectiveCamera( 45, new_mapview_width / new_mapview_height, 1, 10000 );
  scene = new THREE.Scene();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  clock = new THREE.Clock();

  // Lights
  var ambientLight = new THREE.AmbientLight( 0x606060, 3.5 );
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight( 0xffffff, 4.0 );
  directionalLight.position.set( 0.5, 0.75, 1.0 ).normalize();
  scene.add( directionalLight );

  var enable_antialiasing = graphics_quality >= QUALITY_MEDIUM;
  var stored_antialiasing_setting = simpleStorage.get("antialiasing_setting", "");
  if (stored_antialiasing_setting != null && stored_antialiasing_setting == "false") {
    enable_antialiasing = false;
  }

  maprenderer = new THREE.WebGLRenderer( { antialias: enable_antialiasing} );

  if (is_small_screen() || $(window).width() <= 1366) {
    camera_dy = 390;
    camera_dx = 180;
    camera_dz = 180;
  }

  //maprenderer.setClearColor(0x000000);
  maprenderer.setPixelRatio(window.devicePixelRatio);
  maprenderer.setSize(new_mapview_width, new_mapview_height);
  container.appendChild(maprenderer.domElement);

  if (anaglyph_3d_enabled) {
    anaglyph_effect = new THREE.AnaglyphEffect( maprenderer );
    anaglyph_effect.setSize( new_mapview_width, new_mapview_height );
  }

  if (fcwDebug && Detector.webgl) {
    stats = new Stats();
    container.appendChild( stats.dom );
    console.log("MAX_FRAGMENT_UNIFORM_VECTORS:" + maprenderer.context.getParameter(maprenderer.context.MAX_FRAGMENT_UNIFORM_VECTORS));
  }

  animate();
}


/****************************************************************************
 This will render the map terrain mesh.
****************************************************************************/
function init_webgl_mapview() {
  start_webgl = new Date().getTime();

  selected_unit_material = new THREE.MeshBasicMaterial( { color: 0xf6f7bf, transparent: true, opacity: 0.5} );

  var textureLoader = new THREE.TextureLoader();
  var waterGeometry = new THREE.PlaneBufferGeometry( mapview_model_width - 10, mapview_model_height - 10 );

  water = new THREE.Water(waterGeometry, {
      color: '#55c0ff',
      scale: 10,
      flowDirection: new THREE.Vector2( 0.1, -0.1),
      textureWidth: 1024,
      textureHeight: 1024,
      reflectivity : 0.8,
      clipBias : 0.1,
      normalMap0 : textureLoader.load( '/textures/Water_1_M_Normal.jpg' ),
      normalMap1 : textureLoader.load( '/textures/Water_2_M_Normal.jpg' )

    } );

    water.rotation.x = - Math.PI * 0.5;
    water.translateOnAxis(new THREE.Vector3(0,0,1).normalize(), 50);
    water.translateOnAxis(new THREE.Vector3(1,0,0).normalize(), Math.floor(mapview_model_width / 2) - 500);
    water.translateOnAxis(new THREE.Vector3(0,1,0).normalize(), -mapview_model_height / 2);
    scene.add( water );

  /* heightmap image */
  create_heightmap();
  init_borders_image();
  init_roads_image();

  /* uniforms are variables which are used in the fragment shader fragment.js */
  var freeciv_uniforms = {
    maptiles: { type: "t", value: init_map_tiletype_image() },
    borders: { type: "t", value: update_borders_image() },
    map_x_size: { type: "f", value: map['xsize'] },
    map_y_size: { type: "f", value: map['ysize'] },
    terrains: {type: "t", value: webgl_textures["terrains"]},
    roadsmap: { type: "t", value: update_roads_image()},
    roadsprites: {type: "t", value: webgl_textures["roads"]},
    railroadsprites: {type: "t", value: webgl_textures["railroads"]}

  };

  /* create a WebGL shader for terrain. */
  var terrain_material = new THREE.ShaderMaterial({
    uniforms: freeciv_uniforms,
    vertexShader: document.getElementById('terrain_vertex_shh').innerHTML,
    fragmentShader: document.getElementById('terrain_fragment_shh').innerHTML,
    vertexColors: true
  });

  xquality = map.xsize * 4 + 1;
  yquality = map.ysize * 4 + 1;

  /* LandGeometry is a plane representing the landscape of the map. */
  landGeometry = new THREE.BufferGeometry();

  const width_half = mapview_model_width / 2;
  const height_half = mapview_model_height / 2;

  const gridX = Math.floor(xquality);
  const gridY = Math.floor(yquality);

  const gridX1 = gridX + 1;
  const gridY1 = gridY + 1;

  const segment_width = mapview_model_width / gridX;
  const segment_height = mapview_model_height / gridY;

  const indices = [];
  const vertices = [];
  const normals = [];
  const uvs = [];
  const colors = [];

  for ( let iy = 0; iy < gridY1; iy ++ ) {
    const y = iy * segment_height - height_half;
    for ( let ix = 0; ix < gridX1; ix ++ ) {
      const x = ix * segment_width - width_half;
      var sx = ix % xquality, sy = iy % yquality;

      vertices.push( x, -y, heightmap[sx][sy] * 100 );

      normals.push( 0, 0, 1 );

      uvs.push( ix / gridX );
      uvs.push( 1 - ( iy / gridY ) );

    }

  }

  for ( let iy = 0; iy < gridY; iy ++ ) {
    for ( let ix = 0; ix < gridX; ix ++ ) {
      const a = ix + gridX1 * iy;
      const b = ix + gridX1 * ( iy + 1 );
      const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
      const d = ( ix + 1 ) + gridX1 * iy;

      indices.push( a, b, d );
      indices.push( b, c, d );

    }
  }

  landGeometry.setIndex( indices );
  landGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  landGeometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
  landGeometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

  landGeometry.rotateX( - Math.PI / 2 );
  landGeometry.translate(Math.floor(mapview_model_width / 2) - 500, 0, Math.floor(mapview_model_height / 2));

  for ( let iy = 0; iy < gridY1; iy ++ ) {
    for ( let ix = 0; ix < gridX1; ix ++ ) {
      var sx = ix % xquality, sy = iy % yquality;
      var mx = Math.floor(sx / 4), my = Math.floor(sy / 4);
      var ptile = map_pos_to_tile(mx, my);
        if (ptile == null) {
          colors.push(0,0,0);
        } else if (tile_get_known(ptile) == TILE_KNOWN_SEEN) {
          colors.push(1,0,0);
        } else if (tile_get_known(ptile) == TILE_KNOWN_UNSEEN) {
          colors.push(0.40,0,0);
        } else if (tile_get_known(ptile) == TILE_UNKNOWN) {
          colors.push(0,0,0);
        } else {
          colors.push(0,0,0);
        }

    }
  }

  landGeometry.setAttribute( 'vertColor', new THREE.Float32BufferAttribute( colors, 3) );

  landGeometry.computeVertexNormals();
  landMesh = new THREE.Mesh( landGeometry, terrain_material );
  scene.add( landMesh );

  update_tiles_known_vertex_colors();
  setInterval(update_tiles_known_vertex_colors, 100);

  add_all_objects_to_scene();
  add_trees_to_landgeometry();
  setInterval(add_trees_to_landgeometry, 100);

  $.unblockUI();
  console.log("init_webgl_mapview took: " + (new Date().getTime() - start_webgl) + " ms.");

  benchmark_start = new Date().getTime();

}

/****************************************************************************
  Main animation method
****************************************************************************/
function animate() {
  if (scene == null) return;
  if (stats != null) stats.begin();
  if (mapview_slide['active']) update_map_slide_3d();

  update_animated_objects();


  if (selected_unit_indicator != null && selected_unit_material != null) {
    selected_unit_material.color.multiplyScalar (0.994);
    if (selected_unit_material_counter > 80) {
      selected_unit_material_counter = 0;
      selected_unit_material.color.setHex(0xf6f7bf);
    }
    selected_unit_material_counter++;
  }

  if (anaglyph_3d_enabled) {
    anaglyph_effect.render(scene,camera);
  } else {
    maprenderer.render(scene, camera);
  }

  if (goto_active) check_request_goto_path();
  if (stats != null) stats.end();
  if (initial_benchmark_enabled || benchmark_enabled) benchmark_frames_count++;

  if (webgl_controls != null && clock != null) webgl_controls.update(clock.getDelta());

  requestAnimationFrame(animate);
}

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

var trees_init = false;
var forest_geometry;
var jungle_geometry;

/****************************************************************************
  Prerender trees and jungle on known tiles.
****************************************************************************/
function add_trees_to_landgeometry() {

  const width_half = mapview_model_width / 2;
  const height_half = mapview_model_height / 2;

  const gridX = Math.floor(xquality);
  const gridY = Math.floor(yquality);

  const gridX1 = gridX + 1;
  const gridY1 = gridY + 1;
  const segment_width = mapview_model_width / gridX;
  const segment_height = mapview_model_height / gridY;

  var tree_points = null;
  var jungle_points = null;

  const forest_vertices = [];
  const jungle_vertices = [];
  const forest_colors = [];
  const jungle_colors = [];

  for ( let iy = 0; iy < gridY1; iy += 2 ) {
    const y = iy * segment_height - height_half;
    for ( let ix = 0; ix < gridX1; ix += 2 ) {
      const x = ix * segment_width - width_half;
      var sx = ix % xquality, sy = iy % yquality;
      var mx = Math.floor(sx / 6), my = Math.floor(sy / 6);
      var ptile = map_pos_to_tile(mx, my);

      if (ptile != null) {
        var terrain_name = tile_terrain(ptile).name;

        if (terrain_name == "Forest" && tile_get_known(ptile) != TILE_UNKNOWN) {
          var theight = Math.floor((100 * heightmap[sx][sy]) + 3 + (-5 + 3 * (1 + ((ix * iy) % 3))));
          forest_vertices.push(  x + 5, -y - 10, theight);
          var rnd = ((iy * ix) % 10) / 10;
          forest_colors.push(0.5 + (rnd - 0.5) / 2.0, 0.2 + rnd * 1.5, 0.6);
        }

        if (terrain_name == "Jungle" && tile_get_known(ptile) != TILE_UNKNOWN) {
          var theight = Math.floor((100 * heightmap[sx][sy]) + 5 + (-5 + 3 * (1 + ((ix * iy) % 3))));
          jungle_vertices.push(  x + 5, -y - 10, theight);
          var rnd = ((iy * ix) % 5) / 10;
          jungle_colors.push(0.5 + (rnd) / 2.0, 0.5 + rnd * 1.5, 0.8);
        }
      }
    }
  }

  if (!trees_init) {
    forest_geometry = new THREE.BufferGeometry();
    forest_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( forest_vertices, 3 ) );
    var forest_material = new THREE.PointsMaterial( { size: 30, sizeAttenuation: true, map: webgl_textures["tree_1"],  alphaTest: 0.3, transparent: true, opacity: 0.8 } );
    forest_geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( forest_colors, 3 ) );
    forest_material.vertexColors = true;
    tree_points = new THREE.Points( forest_geometry, forest_material );
    scene.add(tree_points);

    jungle_geometry = new THREE.BufferGeometry();
    jungle_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( jungle_vertices, 3 ) );
    var jungle_material = new THREE.PointsMaterial( { size: 25, sizeAttenuation: true, map: webgl_textures["jungle_1"],  alphaTest: 0.3, transparent: true , opacity: 1.0} );
    jungle_geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( jungle_colors, 3 ) );
    jungle_material.vertexColors = true;
    jungle_points = new THREE.Points( jungle_geometry, jungle_material );
    scene.add(jungle_points);

  } else {
    forest_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( forest_vertices, 3 ) );
    forest_geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( forest_colors, 3 ) );
    forest_geometry.computeBoundingSphere();

    jungle_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( jungle_vertices, 3 ) );
    jungle_geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( jungle_colors, 3 ) );
    jungle_geometry.computeBoundingSphere();
  }

  forest_geometry.rotateX( - Math.PI / 2 );
  forest_geometry.translate(Math.floor(mapview_model_width / 2) - 500, 0, Math.floor(mapview_model_height / 2));

  jungle_geometry.rotateX( - Math.PI / 2 );
  jungle_geometry.translate(Math.floor(mapview_model_width / 2) - 500, 0, Math.floor(mapview_model_height / 2));

  trees_init = true;

}


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

/* Amplio.tilespec ported to Javascript. */


var tileset_tile_width = 96;
var tileset_tile_height = 48;

var tileset_options = "+tilespec4+2007.Oct.26";

// A simple name for the tileset specified by this file:
var tileset_name = "amplio2";
var priority = 20;

var tileset_image_count = 3;

var normal_tile_width  = 96;
var normal_tile_height = 48;
var small_tile_width   = 15;
var small_tile_height  = 20;


// Do not blend hills and mountains together.
var is_mountainous = 0;

// Use roadstyle 0 (old iso style)
var roadstyle = 0;

// Fogstyle 2, darkness_style 4 : blended fog
var fogstyle = 2;
var darkness_style = 4;

// offset the flags by this amount when drawing units
var unit_flag_offset_x = 25;
var unit_flag_offset_y = 16;
var city_flag_offset_x = 2;
var city_flag_offset_y = 9;

var city_size_offset_x = 0;
var city_size_offset_y = 20;

var unit_activity_offset_x = 55;
var unit_activity_offset_y = 25;

// offset the units by this amount when drawing units
var unit_offset_x = 19;
var unit_offset_y = 14;

// Enable citybar
var is_full_citybar = 1;

// offset the citybar text by this amount (from the city tile origin)
var citybar_offset_y = 55;
var citybar_offset_x = 45;

// offset the tile label by this amount (from the city tile origin)
var tilelabel_offset_y = 15;
var tilelabel_offset_x = 0;

var dither_offset_x = [normal_tile_width/2, 0, normal_tile_width/2, 0];
var dither_offset_y = [0, normal_tile_height/2, normal_tile_height/2, 0];






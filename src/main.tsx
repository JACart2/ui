import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import maplibregl from 'maplibre-gl';
import * as ROSLIB from 'roslib';
import { Matrix, inverse } from 'ml-matrix';

var ros = new ROSLIB.Ros({
  url : 'ws://localhost:9090'
});

let graph_visual = new ROSLIB.Topic({
  ros : ros,
  name : '/graph_visual',
  messageType : 'visualization_msgs/msg/MarkerArray'
});
let visual_path = new ROSLIB.Topic({
	ros:ros,
	name: '/visual_path',
	messageType: 'visualization_msgs/msg/MarkerArray'
});

let limited_pose = new ROSLIB.Topic({
	ros:ros,
	name: '/limited_pose',
	messageType: 'geometry_msgs/msg/PoseStamped'
});

let protocol = new Protocol();
maplibregl.addProtocol("pmtiles",protocol.tile);
let map = new maplibregl.Map({
	container: 'map',
	style:"osm-liberty/style.json",
	center: [-78.869914,38.435491],
	zoom: 16,
});



let nav = new maplibregl.NavigationControl();
map.addControl(nav, 'top-left');

let A = new Matrix([[ -0.00000156,   0.00001108, -78.86214758],
 [ -0.00000849,  -0.00000137,  38.43388357],
 [  0,           0,           1        ]]);
let B = inverse(A);
	function T(position){
		const {x,y} = position;
		const [x2,y2,z] = A.mmul(Matrix.columnVector([x,y,1])).to1DArray();
		return [x2,y2];
	};
	function Y(lngLat){
		const {lat,lng} = lngLat;
		const [x2,y2,z] = B.mmul(Matrix.columnVector([lng,lat,1])).to1DArray();
		return [x2,y2];
	};
map.on('load', async () => {

let point= (x,y)=> ({
		'type': 'Feature',
                'geometry': {
			'type': 'Point',
			'coordinates': [x,y]
		}
		});

const image = await map.loadImage('osgeo-logo.png');
        map.addImage('custom-marker', image.data);
map.addSource('limited_pose', {
            'type': 'geojson',
            'data': point(-78.869914,38.435491)	});

function LineString(coordinates){
	return {
	'type': 'Feature',
	'geometry': {
		'type':'LineString',
		'coordinates': coordinates
	}		
};

}
map.addSource('visual_path',{
	'type':'geojson',
	'data': LineString([])
});
map.addSource('remaining_path',{
	'type':'geojson',
	'data': LineString([])
});

map.addLayer({
		'id':'visual_path',
		'type':'line',
		'source':'visual_path',
		'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#bdcff0', // '#6495ED',
		'line-opacity': 1,
                "line-width": {
          "base": 1.4,
          "stops": [
            [14, 0],
            [20, 18]
          ]
        }
            }
	});
map.addLayer({
		'id':'remaining_path',
		'type':'line',
		'source':'remaining_path',
		'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#6495ED',
		'line-opacity': 1,
                "line-width": {
          "base": 1.4,
          "stops": [
            [14, 0],
            [20, 18]
          ]
        }
            }
	});

let visual_path_coordinates = [];
visual_path.subscribe(function({markers}){
	visual_path_coordinates = markers.map((m)=>T(m.pose.position));
	map.getSource('visual_path').setData(LineString(visual_path_coordinates));
});

let clicked_point = new ROSLIB.Topic({
  ros : ros,
  name : '/clicked_point',
  messageType : 'geometry_msgs/msg/PointStamped'
});

let last_pos = [0,0];
limited_pose.subscribe(function(message){
	let [x1,y1] =T(message.pose.position);
	let source = map.getSource('limited_pose').setData(point(x1,y1));

	if(visual_path_coordinates.length>0){
		let closestInd = 0;
		let closestDist = Infinity;
		for(let i=0; i < visual_path_coordinates.length ; i++){
			const [x2,y2] = visual_path_coordinates[i];
			const dist = Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
			if(dist < closestDist){
				closestInd = i;
				closestDist = dist;
			};
		}
		let [x2,y2] = last_pos;
		const delta = Math.sqrt(Math.pow(x1-x2,2)+ Math.pow(y1-y2,2));
	    console.log(delta>0.0000001);
	    map.flyTo({
		center: [x1,y1],
		speed: 0.5,
	    	zoom: 18
	    });
		map.getSource('remaining_path').setData(LineString(visual_path_coordinates.slice(closestInd)));
	}

	last_pos = [x1,y1];
});

graph_visual.subscribe(function({markers}) {

	let arrows = markers.filter(({type})=>type==0);
	map.addSource('graph_visual', {
		'type':'geojson',
		'data':{
			'type':'Feature',
			'geometry':{
				'type':'MultiLineString',
				'coordinates': arrows.map(({points})=>points.map(T))
			}
		}
	});
	map.addLayer({
		'id':'graph_visual',
		'type':'line',
		'source':'graph_visual',
		'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#000',
		'line-opacity': 0.03,
                "line-width": {
          "base": 1.4,
          "stops": [
            [14, 0],
            [20, 18]
          ]
        }
            }
	});

});
map.addLayer({
            'id': 'limited_pose',
            'type': 'symbol',
            'source': 'limited_pose',
            'layout': {
                'icon-image': 'custom-marker',
            }
        });
// When a click event occurs on a feature in the places layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        map.on('click', 'graph_visual', (e) => {
	const [x,y] = Y(e.lngLat);
let target = new ROSLIB.Message({
	point:{x,y,z:0}
});
clicked_point.publish(target);


	    });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'graph_visual', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'graph_visual', () => {
            map.getCanvas().style.cursor = '';
        });
});

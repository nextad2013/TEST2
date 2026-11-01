// Only the axis closest to the stick position is active, including diagonal presses.
export function directionsFromStick(dx,dy,deadZone=10){
 if(Math.hypot(dx,dy)<=deadZone)return [];
 if(Math.abs(dx)>Math.abs(dy))return [dx>0?1:3];
 return [dy>0?2:0];
}
export function directionFromStick(dx,dy,deadZone=10){return directionsFromStick(dx,dy,deadZone)[0];}

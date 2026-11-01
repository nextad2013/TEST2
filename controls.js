// A single circular touch control chooses the dominant cardinal direction.
export function directionFromStick(dx,dy,deadZone=10){
 if(Math.hypot(dx,dy)<=deadZone)return undefined;
 return Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
}

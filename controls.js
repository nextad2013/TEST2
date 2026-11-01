// Diagonal stick sectors activate both axes; movement remains one grid step at a time.
export function directionsFromStick(dx,dy,deadZone=10){
 const x=Math.abs(dx),y=Math.abs(dy),largest=Math.max(x,y);
 if(Math.hypot(dx,dy)<=deadZone)return [];
 const horizontal=dx>0?1:3,vertical=dy>0?2:0;
 if(Math.min(x,y)>=largest*.32)return x>y?[horizontal,vertical]:[vertical,horizontal];
 return x>y?[horizontal]:[vertical];
}
export function directionFromStick(dx,dy,deadZone=10){return directionsFromStick(dx,dy,deadZone)[0];}

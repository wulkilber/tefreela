export type Box={left:number;top:number;right:number;bottom:number}
export function placeMenu(anchor:Box,viewport:{left:number;top:number;width:number;height:number},height:number,desiredWidth=264){
 const gap=8,minX=viewport.left+gap,minY=viewport.top+gap,maxX=viewport.left+viewport.width-gap,maxY=viewport.top+viewport.height-gap
 const width=Math.max(0,Math.min(desiredWidth,viewport.width-gap*2))
 const below=Math.max(0,maxY-anchor.bottom-gap),above=Math.max(0,anchor.top-gap-minY)
 const down=below>=Math.min(height,400)||below>=above
 const maxHeight=Math.max(0,Math.min(400,down?below:above,viewport.height-gap*2))
 const shown=Math.min(height,maxHeight)
 const left=Math.max(minX,Math.min(anchor.right-width,maxX-width))
 const top=Math.max(minY,Math.min(down?anchor.bottom+gap:anchor.top-gap-shown,maxY-shown))
 return {left,top,width,maxHeight,direction:down?"down":"up"}
}

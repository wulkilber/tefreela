import { useEffect, type RefObject } from "react"

/** Keyboard and focus behavior shared by the public navigation and filters. */
export function useDrawer(open:boolean,close:()=>void,panel:RefObject<HTMLElement|null>){
 useEffect(()=>{
  if(!open)return
  const previous=document.activeElement as HTMLElement|null
  const overflow=document.body.style.overflow
  document.body.style.overflow="hidden"
  const controls=()=>Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]')||[]).filter(element=>element.getClientRects().length>0)
  controls()[0]?.focus()
  function key(event:KeyboardEvent){
   if(event.key==="Escape"){event.preventDefault();close()}
   if(event.key==="Tab"){const items=controls(),first=items[0],last=items[items.length-1];if(!items.length)return;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
  }
  document.addEventListener("keydown",key)
  const media=window.matchMedia("(min-width:768px)")
  const resize=()=>{if(media.matches)close()}
  media.addEventListener("change",resize)
  return()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",key);media.removeEventListener("change",resize);previous?.focus({preventScroll:true})}
 },[open,panel,close])
}

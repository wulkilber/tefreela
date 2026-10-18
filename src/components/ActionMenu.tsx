import { createPortal } from "react-dom"
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router"
import { placeMenu } from "../lib/menu-position"
type Item={label:string;icon?:ReactNode;to?:string;onSelect?:()=>void;disabled?:boolean;danger?:boolean}
export default function ActionMenu({label,trigger,items,className=""}:{label:string;trigger:ReactNode;items:Item[];className?:string}){
 const [open,setOpen]=useState(false)
 const [position,setPosition]=useState<ReturnType<typeof placeMenu>|null>(null)
 const button=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null),id=useId()
 function close(restore=true){setOpen(false);if(restore)button.current?.focus({preventScroll:true})}
 useLayoutEffect(()=>{
  if(!open)return
  function update(){if(!button.current||!menu.current)return;const rect=button.current.getBoundingClientRect(),visual=window.visualViewport;setPosition(placeMenu(rect,{left:visual?.offsetLeft||0,top:visual?.offsetTop||0,width:visual?.width||innerWidth,height:visual?.height||innerHeight},menu.current.scrollHeight))}
  update()
  const outside=(event:PointerEvent)=>{const target=event.target as Node;if(!menu.current?.contains(target)&&!button.current?.contains(target))close(false)}
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close()} }
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);window.addEventListener("resize",update);window.addEventListener("scroll",update,true);window.visualViewport?.addEventListener("resize",update);window.visualViewport?.addEventListener("scroll",update)
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true);window.visualViewport?.removeEventListener("resize",update);window.visualViewport?.removeEventListener("scroll",update)}
 },[open])
 useLayoutEffect(()=>{if(open&&position)menu.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus({preventScroll:true})},[open,!!position])
 return <><button ref={button} className={`action-menu-trigger ${className}`} type="button" aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>{setPosition(null);setOpen(value=>!value)}} onKeyDown={event=>{if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();setOpen(true)}}}>{trigger}</button>{open&&createPortal(<div ref={menu} id={id} role="menu" aria-label={label} className="action-menu-panel" data-direction={position?.direction} style={{position:"fixed",left:position?.left||0,top:position?.top||0,width:position?.width||264,maxHeight:position?.maxHeight||"calc(100dvh - 16px)",visibility:position?"visible":"hidden"}} onKeyDown={event=>{
  const controls=Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')||[]),index=controls.indexOf(document.activeElement as HTMLElement)
  if(["ArrowDown","ArrowUp","Home","End"].includes(event.key)){event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?controls.length-1:(index+(event.key==="ArrowDown"?1:-1)+controls.length)%controls.length;controls[next]?.focus()}
  if(event.key==="Tab")close(false)
 }}>{items.map(item=>item.to&&!item.disabled?<Link key={item.label} to={item.to} role="menuitem" className={item.danger?"is-danger":""} onClick={()=>close(false)}>{item.icon}<span>{item.label}</span></Link>:<button key={item.label} type="button" role="menuitem" className={item.danger?"is-danger":""} disabled={item.disabled} onClick={()=>{close();item.onSelect?.()}}>{item.icon}<span>{item.label}</span></button>)}</div>,document.body)}</>
}

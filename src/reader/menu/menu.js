import React from "react"
import "./menu.css"

const Menu = (props) => (<>
  <div className="menu-background" invisible={props.visible ? undefined : ""}/>
  <div className="menu" invisible={props.visible ? undefined : ""}>
    test
  </div>
</>)

export default Menu

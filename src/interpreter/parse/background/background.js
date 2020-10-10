import React from "react"

const Background = (props) => (
  <div>
    <img src={"game/" + props.folder + props.image + ".png"} alt=""/>
  </div>
)

export default Background
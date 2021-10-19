import React from "react"
import {withRouter} from "react-router"
import "./background.css"

let Background = props => {
  let route
  switch (props.match.params.route) {
    case "rin":
    case "凛":
      route = "ubw"
      break
    case "sakura":
    case "桜":
      route = "hf"
      break
    default:
      route = "fate"
  }

  return <>
    <div className="home-background replaceable-image">
      <img src={"/static/images/" + "ta_back_fate" + ".webp"} visible={route === "fate" ? "" : undefined} alt=""/>
      <img src={"/static/images/" + "ta_back_ubw" + ".webp"} visible={route === "ubw" ? "" : undefined} alt=""/>
      <img src={"/static/images/" + "ta_back_hf" + ".webp"} visible={route === "hf" ? "" : undefined} alt=""/>

      {/*<img src={"/static/images/" + "tb_back_fate" + ".webp"} visible={route === "fate" ? "" : undefined} alt=""/>*/}
      {/*<img src={"/static/images/" + "tb_back_norealta" + ".webp"} visible={route === "ubw" ? "" : undefined} alt=""/>*/}
      {/*<img src={"/static/images/" + "tb_back_hf" + ".webp"} visible={route === "hf" ? "" : undefined} alt=""/>*/}
    </div>

    <div className="title-image replaceable-image">
      <img src={"/static/images/" + "ta_logo6_fate" + ".webp"} visible={route === "fate" ? "" : undefined} alt=""/>
      <img src={"/static/images/" + "ta_logo6_ubw" + ".webp"} visible={route === "ubw" ? "" : undefined} alt=""/>
      <img src={"/static/images/" + "ta_logo6_hf" + ".webp"} visible={route === "hf" ? "" : undefined} alt=""/>

      {/*<img src={"/static/images/" + "tb_logo6_fate" + ".webp"} visible={route === "fate" ? "" : undefined} alt=""/>*/}
      {/*<img src={"/static/images/" + "tb_logo6_ubw" + ".webp"} visible={route === "ubw" ? "" : undefined} alt=""/>*/}
      {/*<img src={"/static/images/" + "tb_logo6_hf" + ".webp"} visible={route === "hf" ? "" : undefined} alt=""/>*/}
    </div>
  </>
}


Background = withRouter(Background)
export default Background

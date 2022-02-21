import React from "react"
import {withRouter} from "react-router"
import {LocateImage} from "../../resources/lookup"
import Links from "../links/links"
import "./background.css"

let Background = props => {
  let route
  switch (props.match.params.route) {
    case "ubw":
    case "rin":
    case "凛":
      route = "ubw"
      break
    case "hf":
    case "sakura":
    case "桜":
      route = "hf"
      break
    default:
      route = "fate"
  }

  return <>
    <div className="home-background replaceable-image">
      <img src={LocateImage("ta_back_fate")} visible={route === "fate" ? "" : undefined} alt=""/>
      <img src={LocateImage("ta_back_ubw")} visible={route === "ubw" ? "" : undefined} alt=""/>
      <img src={LocateImage("ta_back_hf")} visible={route === "hf" ? "" : undefined} alt=""/>

      {/*<img src={"/static/images/" + "tb_back_fate" + ".webp"} visible={route === "fate" ? "" : undefined} alt=""/>*/}
      {/*<img src={"/static/images/" + "tb_back_norealta" + ".webp"} visible={route === "ubw" ? "" : undefined} alt=""/>*/}
      {/*<img src={"/static/images/" + "tb_back_hf" + ".webp"} visible={route === "hf" ? "" : undefined} alt=""/>*/}
    </div>

    <div className="top-section">
      <Links/>
      <div className="title-image replaceable-image">
        <img src={LocateImage("ta_logo6_fate")} visible={route === "fate" ? "" : undefined} alt=""/>
        <img src={LocateImage("ta_logo6_ubw")} visible={route === "ubw" ? "" : undefined} alt=""/>
        <img src={LocateImage("ta_logo6_hf")} visible={route === "hf" ? "" : undefined} alt=""/>

        {/*<img src={"/static/images/" + "tb_logo6_fate" + ".webp"} visible={route === "fate" ? "" : undefined} alt=""/>*/}
        {/*<img src={"/static/images/" + "tb_logo6_ubw" + ".webp"} visible={route === "ubw" ? "" : undefined} alt=""/>*/}
        {/*<img src={"/static/images/" + "tb_logo6_hf" + ".webp"} visible={route === "hf" ? "" : undefined} alt=""/>*/}
      </div>
    </div>
  </>
}


Background = withRouter(Background)
export default Background

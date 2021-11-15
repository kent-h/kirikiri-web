import React from "react"
import Discord from "./images/Discord-Logo-White.svg"
import Github from "./images/Github-Mark.svg"
import "./links.css"
import Reddit from "./images/Reddit_Mark_OnDark.svg"

const Links = () =>
  <div className="links-logos">
    <a href="https://discord.gg/ejespgUpgg">
      <img src={Discord} alt="Discord"/>
    </a>
    <a href="https://github.com/Kent-H/kirikiri-web">
      <img src={Github} alt="Github"/>
    </a>
    <a href="https://www.reddit.com/r/fatestaynight/comments/qbccnu/web_version_of_fatestay_night/">
      <img src={Reddit} alt="Reddit"/>
    </a>
  </div>

export default Links

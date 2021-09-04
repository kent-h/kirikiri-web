import React from "react"
import "./menu.css"

const Menu = props => <>
  <div className="menu-background" onClick={props.onClose} invisible={props.visible ? undefined : ""}/>
  <div className="menu" invisible={props.visible ? undefined : ""}>
    <div className="menu-push-bottom resizable-text">
      <div>
        <div className="menu-settings">
          Settings
        </div>
        <div className="menu-heading">
          Audio
        </div>
        {[{k: "Voices", v: "voice"}, {k: "Effects", v: "sound"}, {k: "Music", v: "bgm"}].map(elem => (
          <div className="menu-line" key={elem.v}>
            <div className="menu-property">{elem.k}
              <div className="menu-property-value">{props[elem.v]}%</div>
            </div>
            <div className="menu-slider">
              <input type="range"
                     className="slider"
                     min="0"
                     max="100"
                     step="5"
                     value={props[elem.v]}
                     onChange={e => {
                       const s = {}
                       s[elem.v] = e.target.value
                       props.setSaveState(s)
                     }}/>
            </div>
          </div>
        ))}

        <div className="menu-line">
          <div className="menu-property">Version</div>
          <div className="menu-flex">
            {[{k: "Vita", v: "vita"}, {k: "PS2", v: "ps2"}, {k: "Original", v: "original"}].map(elem => (
              <div className="menu-flex-item" key={elem.v}>
                <label>
                  <input type="radio"
                         value={elem.v}
                         checked={props.bgmVersion === elem.v}
                         onChange={e => props.setSaveState({bgmVersion: e.target.value})}/>
                  {elem.k}
                </label>
              </div>
            ))}
          </div>
        </div>

        <br/>
        <div className="menu-line">
          <div className="menu-property">Language</div>
          <div className="menu-flex">
            {[{k: "English", v: "eng"}, {k: "日本語", v: "jp"}, {v: "none"}].map(elem => (
              <div className="menu-flex-item" key={elem.v}>
                {elem.k && <label>
                  <input type="radio"
                         value={elem.v}
                         checked={props.lang === elem.v}
                         onChange={e => props.setSaveState({lang: e.target.value})}/>
                  {elem.k}
                </label>}
              </div>
            ))}
          </div>
        </div>

        <div style={{opacity: 0.2}}>
          <br/>
          <div className="menu-heading">
            Content (WIP)
          </div>

          <div className="menu-line">
            <div className="menu-property">Mature</div>
            <div className="menu-flex">
              {[{k: "Show", v: true}, {k: "Hide", v: false}, {v: "none"}].map(elem => (
                <div className="menu-flex-item" key={elem.v}>
                  {elem.k && <label>
                    <input type="radio"
                           value={elem.v}
                           checked={props.mature === elem.v}
                           onChange={e => props.setSaveState({mature: (e.target.value === "true")})}/>
                    {elem.k}
                  </label>}
                </div>
              ))}
            </div>
          </div>

          <div className="menu-line">
            <div className="menu-property">H</div>
            <div className="menu-flex">
              {[{k: "Censor", v: 0}, {k: "Uncensor", v: 1}, {k: "Decensor", v: 2}].map(elem => (
                <div className="menu-flex-item" key={elem.v}>
                  <label>
                    <input type="radio"
                           value={elem.v}
                           checked={props.h === elem.v}
                           onChange={e => props.setSaveState({h: parseInt(e.target.value, 10) || 0})}/>
                    {elem.k}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <br/>
        <br/>
      </div>
      <input type="submit" className="menu-ok" value="OK" onClick={(e) => {
        e.preventDefault()
        props.onClose()
      }}/>
    </div>
  </div>
</>

export default Menu

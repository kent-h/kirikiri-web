import React, {Component} from "react"
import {withRouter} from "react-router"
import ScriptLoader from "../interpreter/script-loader"
import Animation from "./animation/animation"
import {OptsProvider, Provider} from "./debug"
import Menu from "./menu/menu"
import "./reader.css"
import {ScrollWatcher} from "./scroll/watcher"

const getOptions = (s) => ({
  bgm: s.bgm / 100,
  voice: s.voice / 100,
  sound: s.sound / 100,
  lang: s.lang,
  mature: s.mature,
  h: s.h,
})

class Reader extends Component {
  constructor(props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.setSaveState = this.setSaveState.bind(this)

    const cookies = document.cookie
    const debug = /debug=(\d)(?:;|$)/.exec(cookies) || {}
    const bgm = /bgm=([^;]*)(?:;|$)/.exec(cookies) || {}
    const voice = /voice=([^;]*)(?:;|$)/.exec(cookies) || {}
    const sound = /sound=([^;]*)(?:;|$)/.exec(cookies) || {}
    const lang = /lang=([^;]*)(?:;|$)/.exec(cookies) || {}
    const mature = /mature=([^;]*)(?:;|$)/.exec(cookies) || {}
    const h = /h=([^;]*)(?:;|$)/.exec(cookies) || {}

    this.state = {
      showMenu: true,
      closedMenu: false,
      debugLevel: parseInt(debug[1], 10) || 0,
      bgm: bgm[1] ? parseInt(bgm[1], 10) : 50,
      voice: voice[1] ? parseInt(voice[1], 10) : 50,
      sound: sound[1] ? parseInt(sound[1], 10) : 50,
      lang: lang[1] || "eng",
      mature: !(mature[1] === "false"),
      h: parseInt(h[1], 10) || 0,
    }
    this.state.options = getOptions(this.state)
  }

  componentDidMount() {
    // document.addEventListener("click", this._handleDocumentClick, false)
    document.addEventListener("keydown", this.onKeyDown)
  }

  componentWillUnmount() {
    // document.removeEventListener("click", this._handleDocumentClick, false)
    document.removeEventListener("keydown", this.onKeyDown)
  }

  onKeyDown(e) {
    if (e.keyCode === 27) { // escape
      setTimeout(() => this.setState({
        showMenu: !this.state.showMenu,
        closedMenu: true,
        options: getOptions(this.state),
      }), 1)
    } else if (e.keyCode === 13) { // enter
      if (this.state.showMenu) {
        setTimeout(() => this.setState({
          showMenu: !this.state.showMenu,
          closedMenu: true,
          options: getOptions(this.state),
        }), 1)
      }
    } else if (e.keyCode === 192) { // tilda / back-tick
      this.setState(prevState => {
        const debugLevel = (prevState.debugLevel + 1) % 3
        document.cookie = "debug=" + debugLevel + ";SameSite=Strict"
        return {debugLevel: debugLevel}
      })
    }
  }

  setSaveState(val) {
    this.setState(val)

    const expires = ";SameSite=Strict;expires=" + new Date().setFullYear(new Date().getFullYear() + 10)
    const state = Object.assign({}, this.state, val)
    document.cookie = "bgm=" + state.bgm + expires
    document.cookie = "voice=" + state.voice + expires
    document.cookie = "sound=" + state.sound + expires
    document.cookie = "lang=" + state.lang + expires
    document.cookie = "mature=" + state.mature + expires
    document.cookie = "h=" + state.h + expires
  }

  render() {
    return <Provider value={this.state.debugLevel}>
      <OptsProvider value={this.state.options}>
        <ScrollWatcher key={this.state.options.lang} isOnTop={!this.state.showMenu}>
          {<Animation freezeFrame={!this.state.closedMenu}/>}

          <Menu visible={this.state.showMenu}
                setSaveState={this.setSaveState}
            // the setTimeout here is a terrible hack, it avoids timing issues since we currently have multiple listeners for the same key
                onClose={() => setTimeout(() => this.setState({
                  showMenu: false,
                  closedMenu: true,
                  options: getOptions(this.state),
                }), 1)}
                {...this.state}/>

          <div className="text-area">
            <div className="text resizable-text">
              <ScriptLoader lang={this.state.options.lang} storage={this.props.match.params.script + ".ks"}/>
              {/*// プロローグ1日目.ks プロローグ.ks first.ks*/}
            </div>
          </div>
        </ScrollWatcher>
      </OptsProvider>
    </Provider>
  }
}

Reader = withRouter(Reader)
export default Reader

import React, {Component} from "react"
import {Provider} from "../reader/debug"
import Menu from "./menu/menu"
import Tick from "./tick/tick"

const getOptions = (s) => ({
  bgm: s.bgm / 100,
  voice: s.voice / 100,
  sound: s.sound / 100,
  lang: s.lang,
  mature: s.mature,
  h: s.h,
  debugLevel: s.debugLevel,
})

class Options extends Component {
  constructor(props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.setSaveState = this.setSaveState.bind(this)
    this.setAutoplay = this.setAutoplay.bind(this)

    const cookies = document.cookie
    const debug = /debug=(\d)(?:;|$)/.exec(cookies) || {}
    const bgm = /bgm=([^;]*)(?:;|$)/.exec(cookies) || {}
    const voice = /voice=([^;]*)(?:;|$)/.exec(cookies) || {}
    const sound = /sound=([^;]*)(?:;|$)/.exec(cookies) || {}
    const lang = /lang=([^;]*)(?:;|$)/.exec(cookies) || {}
    const mature = /mature=([^;]*)(?:;|$)/.exec(cookies) || {}
    const h = /h=([^;]*)(?:;|$)/.exec(cookies) || {}

    this.state = {
      showMenu: false,
      canAutoplay: false,
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
      setTimeout(() => {
        if (this.state.showMenu) {
          this.setState({canAutoplay: true})
        }
        this.setState({
          showMenu: !this.state.showMenu,
          options: getOptions(this.state),
        })
      }, 1)
    } else if (e.keyCode === 13) { // enter
      setTimeout(() => {
        this.setState({canAutoplay: true})
        if (this.state.showMenu) {
          this.setState({
            showMenu: false,
            options: getOptions(this.state),
          })
        }
      }, 1)
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

  setAutoplay() {
    this.setState({canAutoplay: true})
  }

  render() {
    return <Provider value={Object.assign({}, this.state.options, {
      debugLevel: this.state.debugLevel,
      showMenu: this.state.showMenu,
      canAutoplay: this.state.canAutoplay,
      setAutoplay: this.setAutoplay,
      tick: <Tick onClick={() => this.setState({showMenu: true, canAutoplay: true})}/>,
    })}>
      {this.props.children}

      <Menu visible={this.state.showMenu}
            setSaveState={this.setSaveState}
        // the setTimeout here is a terrible hack, it avoids timing issues since we currently have multiple listeners for the same key
            onClose={() => setTimeout(() => this.setState({
              showMenu: false,
              canAutoplay: true,
              options: getOptions(this.state),
            }), 1)}
            {...this.state}/>
    </Provider>
  }
}

export default Options

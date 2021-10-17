import React, {Component, createRef} from "react"
import {withRouter} from "react-router-dom"
import {withOptions} from "../../reader/debug"
import {graph, graphR, sections} from "../../resources/generated/scene-index"
import {NumToRoute, RouteToNum} from "../../resources/lookup"
import Arrows from "./arrows/arrows"
import "./graph.css"
import Navigation from "./navigation/navigation"
import Section from "./section/section"

const empty = {}

const buildLookup = (sceneID, lookupGraph) => {
  return Object.keys(lookupGraph[sceneID] || {}).reduce((acc, sceneKey) => {
    lookupGraph[sceneID][sceneKey].forEach(id => {
      acc[sceneKey] = acc[sceneKey] || {}
      acc[sceneKey][sceneKey + "-" + id] = true
    })
    return acc
  }, {})
}

const sectionIDToDay = (id, lang) => {
  const match = /^(.)(\d*)/.exec(id)
  if (match) {
    if (lang === "jp") {
      return match[1] === "プ" ? "プロローグ" : match[2] + "日目"
    }
    return match[1] === "プ" ? "Prologue"
      : match[2] + ({
      "1": "st",
      "2": "nd",
      "3": "rd",
    }[match[2]] || "th") + " Day"
  }
}

class Graph extends Component {
  constructor(props) {
    super(props)
    this.onMouseOver = this.onMouseOver.bind(this)

    props.options.setAutoplay()

    this.relativeRef = createRef()
    this.positions = Object.keys(graph).reduce((acc, key) => {
      acc[key] = createRef()
      return acc
    }, Object.keys(graphR).reduce((acc, key) => {
      if (!acc[key]) {
        acc[key] = createRef()
      }
      return acc
    }, {}))
    this.sectionRefs = [[createRef(), createRef()], [createRef(), createRef(), createRef()]]

    this.state = {next: {}, prev: {}, paneMoving: true, mustUpdate: 0}
  }

  componentDidMount() {
    this.setState({ready: true}) // this.positions will now contain the location of each element, need to update the graph
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.options.lang !== this.props.options.lang || prevProps.options.h !== this.props.options.h) {
      this.setState({mustUpdate: this.state.mustUpdate + 1})
    }
  }

  onMouseOver(sceneID) {
    this.setState({
      hovered: sceneID,
      next: buildLookup(sceneID, graph),
      prev: buildLookup(sceneID, graphR),
    })
  }

  render() {
    const routeNum = RouteToNum(this.props.match.params.route)

    const addArray = (array, direction, first, refs) => array.map((elem, elemIndex) => {
      if (elem.v) {
        const doneBefore = this.doneBefore
        this.doneBefore = this.doneBefore || routeNum !== 0

        let marginLeft = undefined
        if (elemIndex === 0 && refs && refs[0].current) {
          const start = refs[0].current
          const end = (refs[routeNum] || refs[0]).current
          if (start && end) {
            const sr = start.getBoundingClientRect()
            const er = end.getBoundingClientRect()
            marginLeft = -(er.left + er.width / 2) + (sr.left) + "px"
          }
        }

        return <div key={elemIndex}
                    className={"section-vertical" + (elem.section ? " section-day" : "")}
                    ref={refs && refs[elemIndex]}
                    route={elem.section ? elem.section[0] : "undefined"}
                    onTransitionEnd={() => this.setState({paneMoving: false, mustUpdate: this.state.mustUpdate + 1})}
                    style={{
                      marginLeft: marginLeft,
                      transition: elemIndex === 0 && refs && doneBefore ? "margin-left 0.5s ease" : "margin-left 0.1s ease",
                    }}>

          {elem.section &&
          <div className="section-day-descriptor text-shadow">{sectionIDToDay(elem.section, this.props.options.lang)}</div>}
          {elem.section ?
            <Section key={elem.section}
                     section={elem}
                     refs={this.positions}
                     sectionRefs={this.sectionRefs}
                     hovered={this.state.hovered}
                     hoveredNext={this.state.next[elem.section] || empty}
                     hoveredPrev={this.state.prev[elem.section] || empty}
                     onMouseOver={this.onMouseOver}
                     onMouseOut={() => this.setState({hovered: null, next: {}, prev: {}})}/> :
            addArray(elem.v, "v", false)}
        </div>
      } else if (elem.h) {
        return <>
          {first && elemIndex === 1 &&
          <Navigation pane={routeNum}
                      onLeft={() => {
                        this.props.history.replace("/" + NumToRoute(routeNum <= 0 ? 0 : routeNum - 1, this.props.options.lang))
                        this.setState({paneMoving: routeNum !== 0})
                      }}
                      onRight={() => {
                        this.props.history.replace("/" + NumToRoute(routeNum >= 2 ? 2 : routeNum + 1, this.props.options.lang))
                        this.setState({paneMoving: routeNum !== 2})
                      }}/>}
          <div key={elemIndex} className="section-horizontal">
            {addArray(elem.h, "h", false, first && this.sectionRefs[elemIndex - 1])}
          </div>
        </>
      } else {
        throw new Error("unexpected element:" + elem)
      }
    })

    return <div className="graph" ref={this.relativeRef}>
      {this.relativeRef.current &&
      <Arrows relativeRef={this.relativeRef}
              positions={this.state.ready ? this.positions : {}}
              hovered={this.state.hovered}
              hoveredNext={this.state.next}
              hoveredPrev={this.state.prev}
              pane={routeNum}
              paneMoving={this.state.paneMoving}
              mustUpdate={this.state.mustUpdate}/>}

      {addArray(sections.v, "v", true)}
    </div>
  }
}

Graph = withRouter(withOptions(Graph))
export default Graph

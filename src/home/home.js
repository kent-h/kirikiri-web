import React from "react"
import Graph from "../graph/graph"
import {withOptions} from "../reader/debug"

let Home = (props) =>
  <>
    {props.options.tick}
    <Graph/>
  </>

Home = withOptions(Home)
export default Home

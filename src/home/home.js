import React from "react"
import {withOptions} from "../reader/debug"
import Background from "./background/background"
import Graph from "./graph/graph"
import Introduction from "./introduction/introduction"

let Home = (props) =>
  <>
    {props.options.tick}
    <Background/>
    <Introduction/>
    <Graph/>
  </>

Home = withOptions(Home)
export default Home

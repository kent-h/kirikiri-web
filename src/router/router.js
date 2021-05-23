import React from "react"
import {BrowserRouter as Router, Route, Switch} from "react-router-dom"
import Home from "../graph/graph"
import Options from "../options/options"
import Reader from "../reader/reader"

const Index = (props) => (
  <Options>
    <Router>
      <Switch>
        <Route exact path={["/:route(prologue|プロローグ|saber|セイバ|rin|凛|sakura|桜)", "/"]}>
          <Home/>
        </Route>
        <Route path={["/:route/:day/:chapter", "/:route/:chapter", "/:script"]}>
          <Reader/>
        </Route>
      </Switch>
    </Router>
  </Options>
)

export default Index

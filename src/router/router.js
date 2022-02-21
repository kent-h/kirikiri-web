import React from "react"
import {BrowserRouter as Router, Route, Switch, withRouter} from "react-router-dom"
import Home from "../home/home"
import Options from "../options/options"
import Reader from "../reader/reader"

const ResetReader = withRouter((props) => {
  const params = props.match.params
  return <Reader key={params.route + "/" + params.day + "/" + params.chapter + "/" + params.script}/>
})


const Index = (props) =>
  <Options>
    <Router>
      <Switch>
        <Route exact path={["/:route(prologue|プロローグ|fate|saber|セイバ|ubw|rin|凛|hf|sakura|桜)", "/"]}>
          <Home/>
        </Route>
        <Route path={["/:route/:day/:chapter", "/:route/:chapter", "/:script"]}>
          <ResetReader/>
        </Route>
      </Switch>
    </Router>
  </Options>

export default Index

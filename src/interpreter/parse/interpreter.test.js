import {evalMacroCondition} from "./interpreter"

test("evalMacroCondition", () => {
  expect(evalMacroCondition("mp.c!=void||mp.center!=void", {c: "x"})).toBe(true)
  expect(evalMacroCondition("mp.c!=void||mp.center!=void", {l: "x"})).toBe(false)
  expect(evalMacroCondition("mp.erase!='false'", {})).toBe(true)
  expect(evalMacroCondition("mp.erase!='false'", {erase: "false"})).toBe(false)
  expect(evalMacroCondition("mp.pos==''", {})).toBe(true)
  expect(evalMacroCondition("mp.a==1&&mp.b==2", {a: "1", b: "3"})).toBe(false)
  // anything it can't read is left to run
  expect(evalMacroCondition("f.layer_image['0']!=''", {})).toBeUndefined()
})

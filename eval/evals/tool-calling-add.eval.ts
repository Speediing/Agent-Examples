import {
  buildToolCallingPrompt,
  createToolCallingCustomTools
} from "../../examples/tool-calling-agent/ts/src/tools.js";
import { defineEval } from "../lib/define-eval.js";
import { includes } from "../lib/expect.js";

export default defineEval({
  description: "Tool agent adds 3 and 9",
  async test(t) {
    await t.send(buildToolCallingPrompt("add 3 and 9"));
    t.completed();
    t.calledTool("add");
    t.check(t.reply, includes("12"));
  },
  tools: createToolCallingCustomTools()
});

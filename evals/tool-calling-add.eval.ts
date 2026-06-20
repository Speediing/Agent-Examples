import { toolCallingAgent } from "../examples/tool-calling-agent/ts/src/agent.js";
import { defineEval } from "../eval/lib/define-eval.js";
import { includes } from "../eval/lib/expect.js";

export default defineEval({
  description: "Tool agent adds 3 and 9",
  agent: toolCallingAgent,
  async test(t) {
    await t.send("add 3 and 9");
    t.completed();
    t.calledTool("add");
    t.check(t.reply, includes("12"));
  }
});

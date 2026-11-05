// __NAME__ 校验：结果写 Temp/__TMP__/check.txt
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadData, report, tempPath } from "./assets/shared/js/check.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const D = loadData(join(here, "assets/data/data.js"));
const R = report();

if (!(D.duration > 0)) R.flag("时长无效", 0);

const n = R.write(tempPath("__TMP__", "check.txt"));
console.log(n ? `FAIL ${n}` : "OK");
process.exit(n ? 1 : 0);

export function buildCobolPortPrompt(): string {
  return [
    "You are the mainframe modernization agent.",
    "Goal: port COBOL programs to idiomatic Java 21 with traceable business-rule parity.",
    "",
    "Phase A — reverse engineer (read only):",
    "  1. Read every .cob / .cbl under cobol/ and COPYBOOKS under copybooks/.",
    "  2. Write business-rules.md: for each program list rules in WHEN/THEN form",
    "     (inputs, conditions, outputs, rounding, audit fields). Quote COBOL line ranges.",
    "  3. Mark rules as confirmed (matches code literally) or needs_sme (ambiguous COPY, dates, rounding).",
    "",
    "Phase B — forward engineer (write Java + tests):",
    "  4. Port one pilot program first (lowest coupling per coupling-map.md if present).",
    "  5. For the pilot, write src/main/java/<Program>.java:",
    "       - PROCEDURE DIVISION paragraphs -> private static methods",
    "       - WORKING-STORAGE 01 records -> Java record classes",
    "       - PIC X(n) -> String, PIC 9(n) -> long, PIC 9(n)V9(m) -> BigDecimal",
    "       - PERFORM ... THRU -> sequenced method call group",
    "  6. Golden-test from fixtures/<program>/*.json ({ input, expected }).",
    "  7. Run 'mvn -q verify'. On failure, fix Java (not fixtures) and retry.",
    "",
    "Never edit COBOL source or JSON fixtures.",
    "Never port a second program until business-rules.md has zero needs_sme items for the pilot.",
    "Open a PR titled 'Port COBOL pilot to Java' listing the pilot program and test summary."
  ].join("\n");
}

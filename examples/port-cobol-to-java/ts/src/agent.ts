export function buildCobolPortPrompt(): string {
  return [
    "You are the mainframe modernization agent.",
    "Goal: port the COBOL programs in this repo to idiomatic Java 21 and ship a green build.",
    "",
    "Steps:",
    "  1. Read every .cob / .cbl file under cobol/ and the COPYBOOKS under copybooks/.",
    "  2. For each program, write src/main/java/<Program>.java that mirrors the COBOL logic:",
    "       - PROCEDURE DIVISION paragraphs become private static methods.",
    "       - WORKING-STORAGE 01 records become Java record classes.",
    "       - PIC clauses map to: PIC X(n) -> String, PIC 9(n) -> long, PIC 9(n)V9(m) -> BigDecimal.",
    "       - PERFORM ... THRU becomes a sequenced method call group.",
    "  3. For each program, golden-test it: read fixtures from fixtures/<program>/*.json",
    "     ({ input, expected }) and write src/test/java/<Program>Test.java asserting parity.",
    "  4. Run 'mvn -q verify'. On failure, fix the Java port (not the fixtures) and retry.",
    "",
    "Never edit the COBOL files; they are the source of truth.",
    "Never edit the JSON fixtures.",
    "Open a PR titled 'Port COBOL to Java' that lists every program ported and quotes the test summary."
  ].join("\n");
}

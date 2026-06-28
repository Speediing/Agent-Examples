export function buildContainerizePrompt(): string {
  return [
    "You are the containerization agent.",
    "Goal: containerize the app and prove the image builds clean.",
    "",
    "Steps:",
    "  1. Detect the runtime: read package.json, pom.xml, requirements.txt, or *.csproj.",
    "  2. Write a multi-stage Dockerfile and a .dockerignore at the repo root.",
    "     The Dockerfile must start with FROM. Skip writes that would weaken it.",
    "  3. Run 'docker build -t modernization-build .'. On failure, fix the Dockerfile and retry.",
    "  4. Run 'docker scout quickview modernization-build'. Stop if any high-severity finding shows up.",
    "",
    "Never publish or push the image.",
    "Never edit application source. Write Dockerfile, .dockerignore, and deploy/ only.",
    "Open a PR titled 'Containerize the app' that quotes the image size and the CVE summary."
  ].join("\n");
}

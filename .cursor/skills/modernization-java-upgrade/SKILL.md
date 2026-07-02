---
name: modernization-java-upgrade
description: Upgrade Java 8 / Spring Boot 2 estates to Java 21 and Spring Boot 3.3 with mvn verify loops.
---

# Java and Spring Boot upgrade

Modernize pom.xml targets and fix javax → jakarta regressions until mvn verify passes.

## Workflow

1. Run `npm run upgrade:java:ts -- <owner>/<repo>`.
2. Scan the PR for pom changes and import fixes.
3. Confirm Flyway baselines when legacy migrations block startup.
## Command

`npm run upgrade:java:ts -- <owner>/<repo>`

## Site guide

/upgrade-java-spring-boot on the modernization cookbook.

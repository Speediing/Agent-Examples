---
name: modernization-containerize
description: Containerize legacy apps with multi-stage Dockerfiles and docker scout gates.
---

# Containerize legacy app

Detect runtime, write Dockerfile + .dockerignore, prove docker build and scout pass.

## Guardrails

- Do not edit application source.
- Never publish or push images from the agent run.
## Command

`npm run containerize:ts -- <owner>/<repo>`

## Site guide

/containerize-legacy-app on the modernization cookbook.

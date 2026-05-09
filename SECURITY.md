# Security Policy

## Supported Versions

HomeMCP-HUB is currently pre-1.0. Security fixes are expected to target the latest main branch unless a release policy is added later.

## Reporting a Vulnerability

Please do not disclose vulnerabilities publicly before maintainers have had a chance to investigate.

Until a dedicated security contact is published, report issues privately to the repository maintainer through the hosting platform's private vulnerability reporting feature if available.

Include:

- affected version or commit
- reproduction steps
- expected impact
- relevant configuration, with secrets removed

## Secrets

Plugins should use `SecretProvider` for secrets and avoid logging sensitive values. Configuration examples in this repository must not contain real credentials.

# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

As this project is in early development (pre-1.0), only the latest 0.0.x release receives security updates.

## Reporting a Vulnerability

We take security seriously. Please report vulnerabilities responsibly:

1. **Do NOT** open a public issue or pull request
2. Use [GitHub Security Advisories](https://github.com/openshuyi/ontograph-core/security/advisories/new) to report privately
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Time

- **Initial response**: Within 48 hours
- **Resolution**: Within 7 days for critical vulnerabilities
- **Disclosure**: Coordinated disclosure after fix is released

## Disclosure Policy

- We will acknowledge receipt within 48 hours
- We will keep you updated on progress toward a fix
- We will coordinate public disclosure after the vulnerability is patched
- If no response within 7 days, you may disclose responsibly

## Security Best Practices

This project implements several security measures:

- **No eval()**: Expression evaluation uses a safe AST-based evaluator
- **Prototype pollution protection**: Blacklists `__proto__`, `constructor`, `prototype`
- **Regex ReDoS protection**: Limits regex pattern length and input size
- **Recursion depth limits**: Prevents stack overflow from malicious expressions

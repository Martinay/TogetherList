#!/usr/bin/env python3
"""Structural guardrails; behavioral completeness remains a review responsibility."""
import argparse
import pathlib
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--base', help='PR base SHA; requires inventory review when production changes')
parser.add_argument('--report', help='Require a completed JUnit run with tests and no skips/failures')
args = parser.parse_args()
inventory = (ROOT / 'docs/e2e-coverage.md').read_text()
specs = sorted((ROOT / 'frontend/src/test/e2e').glob('*.e2e.test.ts'))
specs += [ROOT / 'frontend/src/test/e2e/offline.production.test.ts']
for spec in specs:
    assert spec.name in inventory, f'Uninventoried spec: {spec.name}'
    assert not re.search(r'\b(?:it|test|describe)\s*\.\s*(?:skip|todo|only|skipIf|runIf)\b', spec.read_text()), f'Focused/skipped/conditional test in {spec}'
for match in re.finditer(r'<Route path="([^"]+)"', (ROOT / 'frontend/src/App.tsx').read_text()):
    assert f'`{match[1]}`' in inventory, f'Uninventoried frontend route: {match[1]}'
for match in re.finditer(r'mux.Handle(?:Func)?\("([^"]+)"', (ROOT / 'backend/cmd/server/main.go').read_text()):
    assert f'`{match[1]}`' in inventory, f'Uninventoried backend route: {match[1]}'
if args.base:
    changes = subprocess.check_output(['git', 'diff', '--name-only', f'{args.base}...HEAD'], cwd=ROOT, text=True).splitlines()
    production = any(path.startswith(('frontend/src/features/', 'frontend/src/components/', 'frontend/src/api/', 'backend/internal/', 'backend/cmd/')) and not re.search(r'(?:_test\.go|\.(?:test|spec)\.[tj]sx?)$', path) for path in changes)
    production |= any(path in ('frontend/src/App.tsx', 'frontend/src/main.tsx', 'frontend/vite.config.ts') or path.startswith('frontend/public/') for path in changes)
    if production:
        assert 'docs/e2e-coverage.md' in changes, 'Production change requires an inventory update with coverage or an explicit reviewed rationale'
if args.report:
    tree = ET.parse(args.report)
    cases = tree.findall('.//testcase')
    assert cases, 'No E2E tests executed'
    assert not tree.findall('.//skipped'), 'E2E report contains skipped tests'
    assert not tree.findall('.//failure') and not tree.findall('.//error'), 'E2E report contains failures/errors'
    print(f'E2E report: {len(cases)} executed, zero skips/failures')
print(f'E2E policy: {len(specs)} inventoried specs; route inventory and no-skip checks passed')

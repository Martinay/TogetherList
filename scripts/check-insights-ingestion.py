#!/usr/bin/env python3
"""Validate workspace-based Application Insights in compiled ARM, including modules."""
import argparse
import json
import pathlib
import sys


def check(template):
    components = 0

    def visit(value):
        nonlocal components
        if isinstance(value, dict):
            if value.get('type', '').lower() == 'microsoft.insights/components':
                components += 1
                properties = value.get('properties', {})
                if not properties.get('WorkspaceResourceId'):
                    raise ValueError('Application Insights must retain WorkspaceResourceId')
                if properties.get('IngestionMode') != 'LogAnalytics':
                    raise ValueError('Workspace Application Insights must use IngestionMode LogAnalytics')
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(template)
    if not components:
        raise ValueError('No Application Insights components found in compiled ARM')
    return components


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('template', type=pathlib.Path)
    args = parser.parse_args()
    try:
        count = check(json.loads(args.template.read_text()))
    except (OSError, ValueError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        return 1
    print(f'PASS: {count} workspace Application Insights component(s) use LogAnalytics')
    return 0


if __name__ == '__main__':
    sys.exit(main())

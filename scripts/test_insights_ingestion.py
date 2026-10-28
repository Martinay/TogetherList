#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

CHECK = pathlib.Path(__file__).with_name('check-insights-ingestion.py')


class InsightsIngestionTests(unittest.TestCase):
    def component(self, mode='LogAnalytics'):
        return {
            'type': 'Microsoft.Insights/components',
            'properties': {
                'WorkspaceResourceId': '[resourceId("Microsoft.OperationalInsights/workspaces", "logs")]',
                'IngestionMode': mode,
            },
        }

    def nested(self, *resources):
        return {'resources': [{
            'type': 'Microsoft.Resources/deployments',
            'properties': {'template': {'resources': list(resources)}},
        }]}

    def run_check(self, template, expected, message):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'main.json'
            path.write_text(json.dumps(template))
            result = subprocess.run([sys.executable, str(CHECK), str(path)], capture_output=True, text=True)
            self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
            self.assertIn(message, result.stdout + result.stderr)

    def test_valid_root_and_deeply_nested_components(self):
        self.run_check({'resources': [self.component(), self.nested(self.nested(self.component()))]}, 0, 'PASS: 2')

    def test_nested_application_insights_mode_rejected(self):
        self.run_check(self.nested(self.component(), self.component('ApplicationInsights')), 1, 'must use IngestionMode LogAnalytics')

    def test_missing_mode_rejected(self):
        component = self.component()
        del component['properties']['IngestionMode']
        self.run_check(self.nested(component), 1, 'must use IngestionMode LogAnalytics')

    def test_missing_workspace_link_rejected(self):
        component = self.component()
        del component['properties']['WorkspaceResourceId']
        self.run_check(self.nested(component), 1, 'must retain WorkspaceResourceId')

    def test_no_components_rejected(self):
        self.run_check(self.nested(), 1, 'No Application Insights components found')


if __name__ == '__main__':
    unittest.main()

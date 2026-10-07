#!/usr/bin/env python3
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ReportPolicyTests(unittest.TestCase):
    def check_report(self, report, expected):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'results.xml'
            path.write_text(report)
            result = subprocess.run(['python3', str(ROOT / 'scripts/check-e2e-policy.py'), '--report', str(path)], capture_output=True, text=True)
            self.assertEqual(result.returncode == 0, expected, result.stdout + result.stderr)

    def test_complete_run(self):
        self.check_report('<testsuites><testsuite><testcase name="real scenario"/></testsuite></testsuites>', True)

    def test_empty_run_rejected(self):
        self.check_report('<testsuites/>', False)

    def test_skipped_run_rejected(self):
        self.check_report('<testsuites><testsuite><testcase><skipped/></testcase></testsuite></testsuites>', False)

    def test_failed_run_rejected(self):
        for tag in ['failure', 'error']:
            with self.subTest(tag=tag):
                self.check_report(f'<testsuites><testsuite><testcase><{tag}/></testcase></testsuite></testsuites>', False)

if __name__ == '__main__':
    unittest.main()

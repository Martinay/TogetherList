#!/usr/bin/env python3
import pathlib
import shutil
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

class ProductionPolicyTests(unittest.TestCase):
    def test_frontend_root_change_requires_inventory_review(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            for name in ['scripts', 'docs', 'frontend/src/test/e2e', 'backend/cmd/server']:
                (root / name).mkdir(parents=True, exist_ok=True)
            shutil.copy(ROOT / 'scripts/check-e2e-policy.py', root / 'scripts/check-e2e-policy.py')
            (root / 'frontend/src/App.tsx').write_text('')
            (root / 'backend/cmd/server/main.go').write_text('')
            (root / 'frontend/src/test/e2e/offline.production.test.ts').write_text('')
            (root / 'docs/e2e-coverage.md').write_text('offline.production.test.ts')
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=root, text=True, stderr=subprocess.STDOUT).strip()
            git('init', '-q')
            git('config', 'user.name', 'Policy test')
            git('config', 'user.email', 'policy@example.test')
            git('add', '.')
            git('commit', '-qm', 'fixture')
            base = git('rev-parse', 'HEAD')
            (root / 'frontend/src/i18n.ts').write_text('// Changed user-facing language behavior')
            git('add', '.')
            git('commit', '-qm', 'production change')
            def check():
                return subprocess.run(['python3', str(root / 'scripts/check-e2e-policy.py'), '--base', base], capture_output=True, text=True)
            self.assertNotEqual(check().returncode, 0, 'Production source change escaped inventory review')
            (root / 'docs/e2e-coverage.md').write_text('offline.production.test.ts: language scenarios reviewed')
            git('add', '.')
            git('commit', '-qm', 'inventory review')
            result = check()
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

if __name__ == '__main__':
    unittest.main()

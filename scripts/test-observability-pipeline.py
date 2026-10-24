#!/usr/bin/env python3
"""Exercise the deployment Collector config against a local AI ingestion stub.
Usage: python3 scripts/test-observability-pipeline.py /path/to/otelcol-contrib
All generated files are under TMPDIR. No Azure credentials or cloud calls.
"""
import gzip
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent.parent

def port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def main():
    envelopes = []
    class Receiver(BaseHTTPRequestHandler):
        def do_POST(self):
            body = self.rfile.read(int(self.headers['Content-Length']))
            if self.headers.get('Content-Encoding') == 'gzip':
                body = gzip.decompress(body)
            try:
                decoded = json.loads(body)
                rows = decoded if isinstance(decoded, list) else [decoded]
            except json.JSONDecodeError:
                rows = [json.loads(line) for line in body.splitlines()]
            envelopes.extend(rows)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps({'itemsReceived': len(rows), 'itemsAccepted': len(rows), 'errors': []}).encode())
        def log_message(self, *_):
            pass

    receiver = ThreadingHTTPServer(('127.0.0.1', 0), Receiver)
    thread = threading.Thread(target=receiver.serve_forever, daemon=True)
    thread.start()
    with tempfile.TemporaryDirectory(prefix='togetherlist-otel-', dir=os.environ['TMPDIR']) as directory:
        directory = Path(directory)
        collector_port, server_port = port(), port()
        config = (ROOT / 'infra/otel-collector.yaml').read_text().replace('127.0.0.1:4318', f'127.0.0.1:{collector_port}')
        (directory / 'collector.yaml').write_text(config)
        env = dict(os.environ, APPLICATIONINSIGHTS_CONNECTION_STRING=f'InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=http://127.0.0.1:{receiver.server_port}/')
        subprocess.run([sys.argv[1], 'validate', '--config', str(directory / 'collector.yaml')], env=env, check=True)
        subprocess.run(['go', 'build', '-o', str(directory / 'server'), './cmd/server'], cwd=ROOT / 'backend', check=True)
        with (directory / 'collector.log').open('w') as collector_log, (directory / 'server.log').open('w') as server_log:
            collector = subprocess.Popen([sys.argv[1], '--config', str(directory / 'collector.yaml')], env=env, stdout=collector_log, stderr=collector_log)
            server_env = dict(os.environ, PORT=str(server_port), DATA_DIR=str(directory / 'data'), STATIC_DIR='', OTEL_EXPORTER_OTLP_ENDPOINT=f'http://127.0.0.1:{collector_port}', TL_OTEL_SAMPLE_RATIO='1', OTEL_SDK_DISABLED='false')
            server = subprocess.Popen([str(directory / 'server')], env=server_env, stdout=server_log, stderr=server_log)
            try:
                for _ in range(100):
                    try:
                        with urllib.request.urlopen(f'http://127.0.0.1:{server_port}/health', timeout=1):
                            break
                    except (OSError, urllib.error.URLError):
                        time.sleep(.1)
                else:
                    raise AssertionError('backend did not become healthy')
                # Give Collector time to bind its receiver before SDK export.
                for _ in range(100):
                    try:
                        with socket.create_connection(('127.0.0.1', collector_port), timeout=.1):
                            break
                    except OSError:
                        time.sleep(.1)
                else:
                    raise AssertionError('Collector did not bind')
                req = urllib.request.Request(f'http://127.0.0.1:{server_port}/api/v1/list/create?token=QUERY_SECRET', data=b'{"name":"LIST_SECRET","creator":"PERSON_SECRET"}', headers={'Content-Type': 'application/json', 'Authorization': 'Bearer TOKEN_SECRET'})
                with urllib.request.urlopen(req) as response:
                    assert response.status == 201
                    list_id = json.load(response)['listId']
                with urllib.request.urlopen(f'http://127.0.0.1:{server_port}/api/v1/list/{list_id}') as response:
                    assert response.status == 200
                try:
                    urllib.request.urlopen(f'http://127.0.0.1:{server_port}/api/private-CAPABILITY_SECRET')
                except urllib.error.HTTPError as error:
                    assert error.code == 404
                server.send_signal(signal.SIGTERM)
                assert server.wait(timeout=10) == 0
                # Sidecars have no ordered shutdown in ACA; normally allow the
                # Collector's batch interval to elapse before stopping it.
                for _ in range(100):
                    types = {row.get('data', {}).get('baseType') for row in envelopes}
                    if {'RequestData', 'MessageData', 'MetricData'} <= types:
                        break
                    time.sleep(.1)
                collector.send_signal(signal.SIGTERM)
                assert collector.wait(timeout=10) == 0
                types = {row.get('data', {}).get('baseType') for row in envelopes}
                assert {'RequestData', 'MessageData', 'MetricData'} <= types, f'missing signals: {types}'
                requests = [row for row in envelopes if row['data']['baseType'] == 'RequestData']
                logs = [row for row in envelopes if row['data']['baseType'] == 'MessageData']
                assert len(requests) == 3 and len(logs) == 3, (len(requests), len(logs))
                assert any(row['data']['baseData']['responseCode'] == '404' for row in requests)
                assert all(any(log['tags']['ai.operation.id'] == row['tags']['ai.operation.id'] and log['tags']['ai.operation.parentId'] == row['data']['baseData']['id'] for log in logs) for row in requests), 'correlation lost in Collector conversion'
                payload = json.dumps(envelopes)
                for secret in [list_id, 'QUERY_SECRET', 'LIST_SECRET', 'PERSON_SECRET', 'TOKEN_SECRET', 'CAPABILITY_SECRET', '/health']:
                    assert secret not in payload, f'private value exported: {secret}'
                print(f'Collector pipeline passed: {len(requests)} requests, {len(logs)} correlated logs, {sum(row["data"]["baseType"] == "MetricData" for row in envelopes)} metric envelopes; privacy and SIGTERM flush verified')
            finally:
                for process in [server, collector]:
                    if process.poll() is None:
                        process.kill()
                        process.wait()
    receiver.shutdown()
    receiver.server_close()

if __name__ == '__main__':
    main()

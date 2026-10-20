import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from unittest.mock import Mock, patch

import dev


def local_settings(host="localhost"):
    return {
        "POSTGRES_DB": "portfolio_cms",
        "POSTGRES_USER": "portfolio_user",
        "POSTGRES_PASSWORD": "not-a-real-password",
        "DATABASE_URL": f"postgresql://portfolio_user:not-a-real-password@{host}:5432/portfolio_cms?schema=public",
        "DIRECT_URL": f"postgresql://portfolio_user:not-a-real-password@{host}:5432/portfolio_cms?schema=public",
    }


class LauncherTests(unittest.TestCase):
    def test_dotenv_reader_parses_quoted_values_without_logging_them(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / ".env"
            path.write_text('POSTGRES_PASSWORD="value with spaces # inside"\n# comment\n', encoding="utf-8")
            self.assertEqual(dev.read_dotenv(path), {"POSTGRES_PASSWORD": "value with spaces # inside"})

    def test_local_database_configuration_accepts_local_docker_urls(self):
        dev.validate_local_environment(local_settings())

    def test_local_database_configuration_rejects_remote_hosts(self):
        with self.assertRaisesRegex(dev.LauncherError, "local Docker PostgreSQL"):
            dev.validate_local_environment(local_settings("db.remote.example"))

    def test_local_database_configuration_rejects_mismatched_user_or_database(self):
        values = local_settings()
        values["DIRECT_URL"] = values["DIRECT_URL"].replace("portfolio_cms", "other_db")
        with self.assertRaisesRegex(dev.LauncherError, "Compose database name"):
            dev.validate_local_environment(values)

    def test_missing_environment_values_are_reported_without_values(self):
        with self.assertRaisesRegex(dev.LauncherError, "will not edit .env") as raised:
            dev.validate_local_environment({"POSTGRES_PASSWORD": "private-value"})
        self.assertNotIn("private-value", str(raised.exception))

    def test_compose_postgres_service_is_detected_from_resolved_config(self):
        config = {"services": {
            "cache": {"image": "redis:7"},
            "database": {"image": "postgres:17-alpine", "environment": {"POSTGRES_PASSWORD": "never print"}},
        }}
        completed = __import__("subprocess").CompletedProcess([], 0, json.dumps(config), "")
        with patch.object(dev, "run_capture", return_value=completed) as run:
            self.assertEqual(dev.detect_postgres_service(Path("."), {}, "docker"), "database")
            self.assertEqual(run.call_args.args[0], ["docker", "compose", "config", "--format", "json"])

    def test_compose_config_errors_are_sanitized(self):
        completed = __import__("subprocess").CompletedProcess([], 1, "", "password=private-value")
        with patch.object(dev, "run_capture", return_value=completed):
            with self.assertRaises(dev.LauncherError) as raised:
                dev.detect_postgres_service(Path("."), {}, "docker")
        self.assertNotIn("private-value", str(raised.exception))

    def test_launcher_overrides_parent_database_variables_with_local_dotenv_values(self):
        values = local_settings()
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://prod-secret@remote.example/db", "OTHER": "kept"}):
            child_env = dev.docker_environment(values)
        self.assertEqual(child_env["DATABASE_URL"], values["DATABASE_URL"])
        self.assertEqual(child_env["OTHER"], "kept")

    def test_postgres_readiness_waits_for_compose_health_check(self):
        outputs = [
            subprocess.CompletedProcess([], 0, "container-id\n", ""),
            subprocess.CompletedProcess([], 0, "starting\n", ""),
            subprocess.CompletedProcess([], 0, "container-id\n", ""),
            subprocess.CompletedProcess([], 0, "healthy\n", ""),
        ]
        with patch.object(dev, "run_capture", side_effect=outputs) as run, patch.object(dev.time, "monotonic", side_effect=[0, 0, 1, 1]):
            dev.wait_for_postgres(Path("."), "database", {}, "docker", timeout=5)
        self.assertEqual(run.call_count, 4)
        self.assertEqual(run.call_args_list[-1].args[0][1:3], ["inspect", "--format"])

    def test_unhealthy_postgres_reports_actionable_logs_command(self):
        outputs = [
            subprocess.CompletedProcess([], 0, "container-id\n", ""),
            subprocess.CompletedProcess([], 0, "unhealthy\n", ""),
        ]
        with patch.object(dev, "run_capture", side_effect=outputs):
            with self.assertRaisesRegex(dev.LauncherError, "docker compose logs"):
                dev.wait_for_postgres(Path("."), "database", {}, "docker", timeout=5)

    def test_dev_server_inherits_logs_and_ctrl_c_stops_only_the_web_process(self):
        process = Mock()
        process.wait.side_effect = KeyboardInterrupt
        output = StringIO()
        with patch.object(dev, "npm_args", return_value=(["npm.cmd", "run", "dev"], True)), \
             patch.object(dev.subprocess, "Popen", return_value=process) as start, \
             patch.object(dev, "stop_process_tree") as stop, \
             redirect_stdout(output):
            self.assertEqual(dev.start_dev_server(Path("."), {}), 0)
        self.assertNotIn("stdout", start.call_args.kwargs)
        self.assertNotIn("stderr", start.call_args.kwargs)
        stop.assert_called_once_with(process)
        self.assertIn("http://localhost:3000", output.getvalue())
        self.assertIn("PostgreSQL will remain running", output.getvalue())


if __name__ == "__main__":
    unittest.main()

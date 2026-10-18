#!/usr/bin/env python3
"""Safely start the local PostgreSQL and Next.js development environment."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import signal
import subprocess
import sys
import threading
import time
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
REQUIRED_FILES = (
    "docker-compose.yml",
    "package.json",
    "package-lock.json",
    ".env.example",
    "prisma.config.ts",
    "prisma/schema.prisma",
)
LOCAL_ENV_KEYS = ("POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD", "DATABASE_URL", "DIRECT_URL")
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


class LauncherError(Exception):
    """An actionable setup or runtime error safe to show in the terminal."""


def read_dotenv(path: Path) -> dict[str, str]:
    """Read the simple KEY=VALUE entries used by this repository's .env file."""
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            raise LauncherError(f"Invalid .env entry on line {line_number}. Correct the local environment file and retry.")
        key, raw_value = line.split("=", 1)
        key = key.strip()
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
            raise LauncherError(f"Invalid .env variable name on line {line_number}.")
        try:
            parts = shlex.split(raw_value, comments=True, posix=True)
        except ValueError:
            raise LauncherError(f"Invalid quoting in .env on line {line_number}.") from None
        values[key] = " ".join(parts)
    return values


def validate_local_environment(values: dict[str, str]) -> None:
    missing = [key for key in LOCAL_ENV_KEYS if not values.get(key, "").strip()]
    if missing:
        raise LauncherError(
            "Local database settings are missing or blank in .env. Copy .env.example to .env, "
            "then set POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, DATABASE_URL, and DIRECT_URL. "
            "The launcher will not edit .env for you."
        )
    for key in ("DATABASE_URL", "DIRECT_URL"):
        try:
            parsed = urlparse(values[key])
            port = parsed.port
        except ValueError:
            raise LauncherError(f"{key} is not a valid PostgreSQL URL; its value was withheld.") from None
        if parsed.scheme not in {"postgres", "postgresql"} or parsed.hostname not in LOCAL_HOSTS:
            raise LauncherError(
                f"{key} must point to the local Docker PostgreSQL instance (localhost), not a remote database. "
                "Set both local URLs in .env before starting the launcher."
            )
        if port not in (None, 5432) or parsed.path.lstrip("/") != values["POSTGRES_DB"]:
            raise LauncherError(f"{key} must use the local Compose database name and port 5432.")
        if parsed.username != values["POSTGRES_USER"]:
            raise LauncherError(f"{key} must use the same local database user as POSTGRES_USER.")


def docker_environment(dotenv_values: dict[str, str]) -> dict[str, str]:
    """Force Compose and child processes to use the validated local DB values."""
    return {**os.environ, **{key: dotenv_values[key] for key in LOCAL_ENV_KEYS}}


def run_capture(args: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True, check=False)
    except FileNotFoundError:
        raise LauncherError(f"Required command was not found: {args[0]}.") from None
    except OSError:
        raise LauncherError(f"Could not start required command: {args[0]}.") from None


def detect_postgres_service(root: Path, env: dict[str, str], docker: str = "docker") -> str:
    result = run_capture([docker, "compose", "config", "--format", "json"], cwd=root, env=env)
    if result.returncode != 0:
        raise LauncherError(
            "Docker Compose could not validate docker-compose.yml and .env. Check the local database settings "
            "and Compose file; command output was withheld to avoid exposing configuration values."
        )
    try:
        config = json.loads(result.stdout)
        services = config["services"]
    except (json.JSONDecodeError, KeyError, TypeError):
        raise LauncherError("Docker Compose returned an unreadable service configuration.") from None

    candidates = []
    for name, service in services.items():
        image = str(service.get("image", "")).lower()
        healthcheck = service.get("healthcheck", {}) or {}
        health_test = json.dumps(healthcheck.get("test", "")).lower()
        if "postgres" in image or "pg_isready" in health_test:
            candidates.append(name)
    if len(candidates) != 1:
        raise LauncherError(
            "Could not identify exactly one PostgreSQL service in docker-compose.yml. "
            "Keep one service using a PostgreSQL image or pg_isready health check."
        )
    return candidates[0]


def check_prerequisites(root: Path, *, need_node: bool = True, docker: str | None = None) -> tuple[str | None, dict[str, str]]:
    missing_files = [name for name in REQUIRED_FILES if not (root / name).is_file()]
    if missing_files:
        raise LauncherError("Expected project files are missing: " + ", ".join(missing_files))
    if sys.version_info < (3, 9):
        raise LauncherError("Python 3.9 or newer is required.")

    values = read_dotenv(root / ".env")
    validate_local_environment(values)

    docker_path = docker or shutil.which("docker")
    if not docker_path:
        raise LauncherError("Docker CLI was not found. Install Docker Desktop and make sure `docker` is on PATH.")
    daemon = run_capture([docker_path, "info", "--format", "{{.ServerVersion}}"], cwd=root)
    if daemon.returncode != 0:
        raise LauncherError("Docker Desktop or its daemon is unavailable. Start Docker Desktop, wait until it is ready, then retry.")
    compose = run_capture([docker_path, "compose", "version", "--short"], cwd=root)
    if compose.returncode != 0:
        raise LauncherError("Docker Compose v2 is unavailable. Update or enable Compose in Docker Desktop.")

    if need_node:
        for command, label in (("node", "Node.js"), ("npm", "npm")):
            if not shutil.which(command):
                raise LauncherError(f"{label} was not found on PATH. Install a supported Node.js version and restart the terminal.")
        if not (root / "node_modules" / "next" / "package.json").is_file():
            raise LauncherError("Project dependencies are not installed. From the repository root, run `npm ci`, then retry.")

    service = detect_postgres_service(root, docker_environment(values), docker_path)
    return service, values


def wait_for_postgres(root: Path, service: str, env: dict[str, str], docker: str, timeout: float = 90) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        listed = run_capture([docker, "compose", "ps", "-q", service], cwd=root, env=env)
        container_id = listed.stdout.strip() if listed.returncode == 0 else ""
        if container_id:
            inspected = run_capture(
                [docker, "inspect", "--format", "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", container_id],
                cwd=root,
                env=env,
            )
            state = inspected.stdout.strip().lower() if inspected.returncode == 0 else ""
            if state == "healthy":
                return
            if state == "unhealthy" or state == "exited":
                raise LauncherError("The local PostgreSQL container did not become healthy. Inspect it with `docker compose logs`.")
            if state == "running":
                ready = run_capture([docker, "compose", "exec", "-T", service, "pg_isready", "-q"], cwd=root, env=env)
                if ready.returncode == 0:
                    return
        threading.Event().wait(1)
    raise LauncherError("Timed out waiting for local PostgreSQL. Inspect it with `docker compose ps` and `docker compose logs`.")


def npm_args(root: Path, *args: str) -> tuple[list[str], bool]:
    npm = shutil.which("npm")
    if not npm:
        raise LauncherError("npm was not found on PATH.")
    return [npm, *args], os.name == "nt" and Path(npm).suffix.lower() in {".cmd", ".bat"}


def check_migrations(root: Path, env: dict[str, str]) -> None:
    args, use_shell = npm_args(root, "run", "db:migrate:status")
    result = subprocess.run(args, cwd=root, env=env, capture_output=True, text=True, shell=use_shell, check=False)
    if result.returncode != 0:
        raise LauncherError(
            "Could not confirm that the local database migrations are current. If migrations are pending, review "
            "the local database and run `npm run db:migrate:dev` manually. No migration was run by this launcher."
        )
    print("Local database migrations are current.")


def stop_process_tree(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    try:
        if os.name == "nt":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            process.send_signal(signal.SIGINT)
        process.wait(timeout=8)
    except (OSError, subprocess.TimeoutExpired):
        if os.name == "nt":
            taskkill = shutil.which("taskkill")
            if taskkill:
                subprocess.run([taskkill, "/PID", str(process.pid), "/T", "/F"], capture_output=True, check=False)
                return
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


def start_dev_server(root: Path, env: dict[str, str]) -> int:
    args, use_shell = npm_args(root, "run", "dev")
    print("\nWebsite: http://localhost:3000")
    print("Admin:   http://localhost:3000/admin/login")
    print("Press Ctrl+C to stop Next.js. PostgreSQL will remain running.\n", flush=True)
    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
    process = subprocess.Popen(args, cwd=root, env=env, shell=use_shell, creationflags=creationflags)
    try:
        return process.wait()
    except KeyboardInterrupt:
        print("\nStopping the Next.js development server (keeping PostgreSQL running)...", flush=True)
        stop_process_tree(process)
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Start the local PostgreSQL and Next.js development environment safely.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--check", action="store_true", help="check prerequisites and local configuration without starting services")
    group.add_argument("--stop-db", action="store_true", help="stop the local PostgreSQL service without deleting its data")
    args = parser.parse_args()

    try:
        if args.stop_db:
            service, values = check_prerequisites(ROOT, need_node=False)
            docker = shutil.which("docker") or "docker"
            result = subprocess.run([docker, "compose", "stop", service], cwd=ROOT, env=docker_environment(values), check=False)
            if result.returncode != 0:
                raise LauncherError("Docker Compose could not stop the local database service.")
            print(f"Stopped local PostgreSQL service `{service}`. Its Docker volume and data were preserved.")
            return 0

        service, values = check_prerequisites(ROOT)
        docker = shutil.which("docker") or "docker"
        env = docker_environment(values)
        if args.check:
            print(f"Prerequisites and local configuration are valid. PostgreSQL service detected: `{service}`.")
            return 0

        print(f"Starting local PostgreSQL service `{service}`...")
        started = run_capture([docker, "compose", "up", "-d", service], cwd=ROOT, env=env)
        if started.returncode != 0:
            raise LauncherError("Docker Compose could not start local PostgreSQL. Inspect `docker compose ps` and `docker compose logs`.")
        print("Waiting for PostgreSQL readiness...")
        wait_for_postgres(ROOT, service, env, docker)
        print("PostgreSQL is ready.")
        check_migrations(ROOT, env)
        return start_dev_server(ROOT, env)
    except LauncherError as error:
        print(f"Setup error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

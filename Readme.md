# fnote

**fnote – ultra-fast local-first operational log CLI (Bash + JSONL)**

[![Shell](https://img.shields.io/badge/shell-bash-green.svg)](https://www.gnu.org/software/bash/)
[![Storage](https://img.shields.io/badge/storage-JSONL-yellow.svg)](https://jsonlines.org/)

---

## ⚡ Overview

fnote is a minimal CLI tool designed to capture **operational logs directly from the terminal**.

It is designed for:

* incident tracking
* infrastructure notes
* hidden / filtered logs
* task capture
* operational brain dump

Everything is stored locally in a **single JSONL file**, with optional visual filtering using comments.

---

## 📂 Storage

```bash id="s3v9lm"
~/.fnote/dump.jsonl
```

---

## 🧠 Data format

fnote supports **two visual states inside the same file**:

### Active entries

```json id="k8q1zx"
{"date":"2026-04-30 13:16","note":"[TASK] Update firewall rules"}
```

### Hidden / visually ignored entries

Lines starting with `#`:

```json id="v2m7pl"
#{"date":"2026-04-30 13:16","note":"[OLD] deprecated task"}
```

> These entries are still stored, but visually filtered by `fn`.

---

## 🚀 Usage

### ➕ Add a log

```bash id="a1x9kp"
fn "texte"
```

---

### 📄 Show last 20 entries

```bash id="b4z8qf"
fn
```

* Automatically ignores lines starting with `#`
* Shows only active logs
* Returns last 20 entries

---

### 🔍 Search logs

```bash id="c7n2ws"
fn -s MOT
```

Uses `grep -i` on raw file.

Includes both visible and hidden entries.

---

### ✏️ Edit raw database

```bash id="d9m1ra"
fn edit
```

Opens:

```bash id="e5q0xt"
nano ~/.fnote/dump.jsonl
```

Full manual control, no abstraction.

---

## ⚙️ Help

```bash id="f6v3sk"
fn --help
```

---

## 🧾 Command reference

| Command     | Action                       |
| ----------- | ---------------------------- |
| `fn "text"` | Add a new log entry          |
| `fn`        | Show last 20 visible entries |
| `fn -s`     | Search all entries           |
| `fn edit`   | Open raw file in nano        |
| `fn --help` | Show help                    |

---

## 🧠 Design principles

* Local-first (no sync, no cloud)
* Single file storage
* JSONL append-only log
* Hybrid visibility system (`#` = hidden)
* No database
* No IDs
* Fully inspectable via UNIX tools

---

## 💡 Important behavior detail

fnote is not a pure journal:

* lines starting with `#` are **ignored by default display**
* but still exist in the file
* allowing lightweight “soft archive” behavior

---

## 📜 License

MIT

# fnote

**fnote – The fastest brain-dump CLI for Linux (JSONL storage)**  

[![Version](https://img.shields.io/badge/version-26.2.24.224-blue.svg)](https://github.com/medaey/fnote) 
[![Bash](https://img.shields.io/badge/bash-🟩-lightgrey)](https://www.gnu.org/software/bash/) 
[![JSON](https://img.shields.io/badge/json-🟨-lightgrey)](https://www.json.org/)

Capture vos idées instantanément depuis le terminal. Pas de gestion, pas de TODO complexe, juste **votre cerveau → fichier JSON**.

---

## 🌟 Exemple d’utilisation

```bash
# Ajouter une note
fn Acheter du lait

# Voir les 20 dernières notes
fn

# Rechercher un mot
fn -s lait

# Vider toutes les notes
fn -c
```
---

## 🚀 Installation

Installation rapide :

via `curl`

```bash
sudo curl -L https://raw.githubusercontent.com/medaey/fnote/main/fnote.sh -o /usr/local/bin/fn && sudo chmod 755 /usr/local/bin/fn
```

Ou avec `wget` :

```bash
sudo wget -O /usr/local/bin/fn https://raw.githubusercontent.com/medaey/fnote/main/fnote.sh && sudo chmod 755 /usr/local/bin/fn
```

> Vous pouvez maintenant utiliser la commande `fn` directement depuis le terminal.

---
## 🗂️ Structure du projet

```
fnote/
├── fnote.sh      # Script principal
├── LICENSE       # Licence du projet
└── README.md     # Documentation
```

---

## 🧠 Philosophie

fnote est conçu pour capturer vos pensées en **1 seconde**.
Pas d’organisation, pas de catégories, juste **note rapide et minimaliste.**

> Un brain-dump minimaliste pour le terminal.

---
## ⚡ Commandes
| Commande                                        | Description                                 |
| ----------------------------------------------- | ------------------------------------------- |
| `fn "texte"`                                    | Ajouter une note rapide                     |
| `fn`                                            | Afficher les 20 dernières notes             |
| *(les lignes commençant par `#` sont ignorées)* |                                             |
| `fn -s mot` ou `fn --search mot`                | Rechercher une note (insensible à la casse) |
| `fn -c` ou `fn --clear`                         | Vider toutes les notes                      |
| `fn -h` ou `fn --help`                          | Afficher l’aide                             |

---
## 📂 Stockage

Toutes les notes sont sauvegardées dans :

```
~/.fnote/dump.jsonl
```

Exemple de contenu (JSON Lines / one-line par note) :
```json
{"date":"2026-02-24 15:02","note":"Idée pour un projet SaaS"}
{"date":"2026-02-24 15:15","note":"Penser à acheter du lait"}
{"date":"2026-02-24 15:20","note":"Brainstorm pour fnote"}
```

---
## 💎 Avantages

- Capture **ultra rapide**
- Ultra minimaliste
- Stockage JSON → hackable et exportable facilement
- Compatible avec grep, fzf, awk, scripts shell
- Compatible avec jq, scripts shell, Python, Node.js
- Aucun plugin ou dépendance

---
## 📤 Export optionnel

Si vous voulez exploiter vos notes JSON, vous pouvez utiliser `jq` :

```bash
# Exporter toutes les notes en CSV
jq -r '[.date, .note] | @csv' ~/.fnote/dump.jsonl > notes.csv

# Exporter les notes contenant un mot-clé
jq -c --arg keyword "lait" 'select(.note | test($keyword;"i"))' ~/.fnote/dump.jsonl
```
> Note : l’export est **optionnel**, le cœur de fnote reste la capture **ultra rapide et minimaliste**.

---
## 📝 Contribuer

Si vous voulez améliorer fnote :

- Proposez des idées ultra-minimalistes
- Gardez la capture rapide comme priorité
- Évitez les fonctionnalités complexes qui ralentissent la prise de note
- Toute amélioration doit augmenter la rapidité ou la simplicité, jamais la complexité

---
## 📌 Licence

MIT License

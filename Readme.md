# fnote
fnote – Minimal CLI Note Manager for Linux (Bash + JSON)
[![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/medaey/fnote) 
[![Bash](https://img.shields.io/badge/bash-🟩-lightgrey)](https://www.gnu.org/software/bash/) 
[![JSON](https://img.shields.io/badge/json-🟨-lightgrey)](https://www.json.org/)

![Capture d'écran fnote](assets/fnote_screen.png)
**fnote** est un gestionnaire de notes minimaliste pour le terminal. Il permet de capturer rapidement des idées et informations avec un **ID unique**, un **état** et une **date de création**. Tout est stocké en JSON pour un accès simple et rapide.

🗂️ Structure du projet

```
fnote/
├── fnote.sh             # Script principal
├── assets/              # Dossier pour captures d'écran
│   └── fnote_screen.png
├── LICENSE              # Licence du projet
└── README.md            # Documentation
```

---

## 🚀 Installation

```bash
# 1️⃣ Cloner le dépôt
git clone https://github.com/medaey/fnote.git
cd fnote
chmod +x fnote.sh

# 2️⃣ Créer le dossier de stockage global
sudo mkdir -p /var/lib/fnote
sudo chown "$USER":"$USER" /var/lib/fnote

# 3️⃣ Copier le script dans ~/bin pour l'utiliser comme commande globale
mkdir -p ~/bin
cp fnote.sh ~/bin/fnote
chmod +x ~/bin/fnote

# 4️⃣ Créer un lien symbolique pour l'abréviation 'fn'
ln -sf ~/bin/fnote ~/bin/fn

# ✅ Utilisation :
# fnote add "Nouvelle note"    (ou fn add "Nouvelle note")
# fnote show 1                 (ou fn show 1)
# fnote ls                     (ou fn ls)
````

---

## 🛠️ Commandes principales

| Commande        | Alias | Description                              |
| --------------- | ----- | ---------------------------------------- |
| `a "titre"`     | —     | Ajouter une note avec le texte fourni    |
| `show <id>`     | —     | Afficher le détail d'une note            |
| `ls`            | —     | Lister les notes actives (TODO)          |
| `ls --all`      | —     | Lister toutes les notes (TODO + DONE)    |
| `s <id> <etat>` | —     | Changer l'état d'une note (TODO ou DONE) |
| `e <id>`        | —     | Éditer le texte d'une note via $EDITOR   |
| `rm <id>`       | —     | Supprimer une note                       |
| `rmlast`        | —     | Supprimer la dernière note ajoutée       |

---

## 💾 Stockage

* Toutes les notes sont dans **`/var/lib/fnote/notes.json`**
* Format simple et lisible
* Édition manuelle possible si nécessaire

---

## 🎯 Pourquoi fnote ?

* Pour **capturer rapidement les tâches en cours** sans interrompre le travail.
* Pour **ne rien oublier**, même en cas d’interruptions ou d’incidents.
* Minimaliste et rapide : tout se fait depuis le terminal, sans distraction.
* Chaque note est **identifiable par un ID unique** et peut être marquée **TODO ou DONE**.
* Idéal pour les sysadmins ou toute personne gérant plusieurs tâches simultanément.

---

## 📌 Exemples d’utilisation

### Ajouter une note

```bash
$ fnote add "Refaire salle informatique"
Note 1 ajoutée
```

### Lister les notes

```bash
$ fnote ls
[1] (TODO) - Refaire salle informatique
```

### Marquer comme terminée

```bash
$ fnote s 1 DONE
Note 1 → DONE
```

### Revenir en TODO

```bash
$ fnote s 1 TODO
Note 1 → TODO
```

### Afficher une note

```bash
$ fnote show 1
ID: 1
Texte: Refaire salle informatique
État: TODO
Créée: 2025-11-20T02:14:59
Modifiée: 2025-11-20T02:14:59
```

### Supprimer une note

```bash
$ fnote rm 1
Note 1 supprimée
```

### Supprimer la dernière note

```bash
$ fnote rmlast
Dernière note supprimée
```

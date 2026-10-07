# 🧠 fnote

> **Capturez vos idées et tâches en quelques secondes.**

**fnote** est une extension de navigateur minimaliste pour prendre rapidement des notes, tâches et idées.

<p align="center">
  <img src="preview.png" alt="Aperçu de fnote" width="600"/>
</p>

## ✨ Fonctionnalités

* ⚡ **Prise de notes rapide** — capturez une idée sans quitter votre navigation.
* 🏷️ **Tags** — utilisez `[TAG] ma note` pour organiser vos notes.
* 🎨 **Tags colorés** — une couleur est automatiquement associée à chaque tag.
* ✏️ **Édition rapide** — modifiez vos notes directement depuis l'interface.
* ↕️ **Réorganisation** — déplacez librement vos notes et conservez leur ordre.
* 🔄 **États** — marquez vos notes comme *En cours* ou *Traitées*.
* 💾 **Export JSONL** — exportez vos données au format `dump.jsonl`.
* 🔒 **Stockage local** — vos notes restent stockées localement dans le navigateur.

## 👜 Installation

### 🌐 Chrome Web Store

[Installer fnote depuis le Chrome Web Store](https://chromewebstore.google.com/detail/fnote/gpfldnlnnhdgooeccheppmjendompial)

<p align="center">
  <a href="https://chromewebstore.google.com/detail/fnote/gpfldnlnnhdgooeccheppmjendompial">
    <img src="chrome-web-store.png" alt="Installer fnote depuis le Chrome Web Store" width="600"/>
  </a>
</p>

### 🛠️ Installation manuelle

1. Téléchargez et décompressez `fnote-web-extension.zip`.
2. Ouvrez `chrome://extensions/`.
3. Activez le **Mode développeur**.
4. Cliquez sur **Charger l'extension non empaquetée**.
5. Sélectionnez le dossier contenant `manifest.json`.

Compatible avec les navigateurs basés sur Chromium : **Chrome, Brave, Edge, Vivaldi, etc.**

## 🚀 Utilisation

1. Cliquez sur l'icône **fnote** dans la barre d'extensions.
2. Saisissez votre note.
3. Ajoutez éventuellement un tag, par exemple :

```text
[DSI] Faire les VLAN du site de Paris
```

4. La note est enregistrée automatiquement.

Les notes peuvent ensuite être modifiées, réorganisées ou marquées comme traitées.

## 🔒 Données & confidentialité

fnote fonctionne en **local-first**.

* Les notes sont stockées localement dans le navigateur.
* Aucune synchronisation avec un serveur distant n'est nécessaire.
* Aucun compte n'est requis.
* Les données peuvent être exportées via `dump.jsonl`.

Le format JSONL permet de conserver une séparation simple entre l'interface et les données.

## 🛠️ Open Source

fnote est un projet open source.

* 📦 Extension : ce dépôt
* 💻 CLI : disponible dans le projet
* 🐛 Bugs & suggestions : [GitHub Issues](https://github.com/medaey/fnote/issues)

## 📄 Licence

MIT — voir [`LICENSE`](LICENSE).

#!/bin/bash

DIR="$HOME/.fnote"
FILE="$DIR/dump.jsonl"

mkdir -p "$DIR"
touch "$FILE"

show_help() {
    echo "fnote – ultra-fast brain-dump CLI (JSON Lines storage)"
    echo
    echo "Usage:"
    echo "  fn \"texte\"                 → ajouter une note"
    echo "  fn                          → afficher 20 dernières notes"
    echo "                                (les lignes commentées par # sont ignorées)"
    echo "  fn -s mot | --search mot    → rechercher une note (insensible à la casse)"
    echo "  fn -c     | --clear         → vider toutes les notes"
    echo "  fn -h | --help              → afficher ce message"
}

# Aucun argument → afficher dernières notes (ignorer les commentaires)
if [ $# -eq 0 ]; then
    grep -v '^#' "$FILE" | tail -n 20 # Affiche les 20 dernières notes dont .note ne commence pas par #
    exit 0
fi

case "$1" in
    -s|--search)
        shift
        grep -i -- "$*" "$FILE" # Recherche simple, insensible à la casse
        ;;
    -c|--clear)
        > "$FILE"
        echo "✔ cleared"
        ;;
    -h|--help)
        show_help
        ;;
    *)
        DATE=$(date '+%Y-%m-%d %H:%M')
        NOTE="$*"
        echo "{\"date\":\"$DATE\",\"note\":\"$NOTE\"}" >> "$FILE"
        echo "✔ saved"
        ;;
esac

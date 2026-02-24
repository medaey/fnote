#!/bin/bash

DIR="$HOME/.fnote"
FILE="$DIR/dump.jsonl"

mkdir -p "$DIR"
touch "$FILE"

show_help() {
    echo "fnote – ultra-fast brain-dump CLI (JSON Lines storage)"
    echo
    echo "Usage:"
    echo "  fn \"texte\"      → ajouter une note"
    echo "  fn               → afficher 20 dernières notes"
    echo "  fn -s mot        → rechercher une note"
    echo "  fn -c            → vider toutes les notes"
    echo "  fn -h | --help   → afficher ce message"
}

# Aucun argument → afficher dernières notes
if [ $# -eq 0 ]; then
    tail -n 20 "$FILE"
    exit 0
fi

case "$1" in
    -s)
        shift
        jq -c --arg search "$*" 'select(.note | test($search;"i"))' "$FILE"
        ;;
    -c)
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
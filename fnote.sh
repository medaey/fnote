#!/bin/bash

DIR="$HOME/.fnote"
FILE="$DIR/dump.json"

mkdir -p "$DIR"
touch "$FILE"

# Crée un tableau JSON vide si fichier vide
if [ ! -s "$FILE" ]; then
    echo "[]" > "$FILE"
fi

show_help() {
    echo "fnote – ultra-fast brain-dump CLI (JSON storage)"
    echo
    echo "Usage:"
    echo "  fnote \"texte\"      → ajouter une note"
    echo "  fnote               → afficher 20 dernières notes"
    echo "  fnote -s mot        → rechercher une note"
    echo "  fnote -c            → vider toutes les notes"
    echo "  fnote -h | --help   → afficher ce message"
}

# Aucun argument → afficher dernières notes
if [ $# -eq 0 ]; then
    jq '.[-20:] | reverse' "$FILE"
    exit 0
fi

case "$1" in
    -s)
        shift
        jq --arg search "$*" '[.[] | select(.note | test($search;"i"))]' "$FILE"
        ;;
    -c)
        echo "[]" > "$FILE"
        echo "✔ cleared"
        ;;
    -h|--help)
        show_help
        ;;
    *)
        DATE=$(date '+%Y-%m-%d %H:%M')
        NOTE="$*"
        TMP=$(mktemp)
        jq --arg d "$DATE" --arg n "$NOTE" '. += [{"date": $d, "note": $n}]' "$FILE" > "$TMP" && mv "$TMP" "$FILE"
        echo "✔ saved"
        ;;
esac
#!/bin/bash

DIR="$HOME/.fnote"
FILE="$DIR/dump.jsonl"

mkdir -p "$DIR"
touch "$FILE"

show_help() {
    echo "fnote – ultra-fast brain-dump CLI (JSON Lines storage)"
    echo
    echo "Usage:"
    echo "  fn \"texte\"                 ajouter une note"
    echo "  fn                          afficher 20 dernières notes"
    echo "                                (les lignes commençant par # sont ignorées)"
    echo "  -s, --search MOT            rechercher une note (insensible à la casse)"
    echo "  -c, --clear                 vider toutes les notes"
    echo "      --help                  afficher cette aide"
}

# Aucun argument → afficher dernières notes
if [ $# -eq 0 ]; then
    grep -v '^#' "$FILE" | tail -n 20
    exit 0
fi

case "$1" in
    --help)
        show_help
        exit 0
        ;;

    -s|--search)
        shift
        grep -i -- "$*" "$FILE"
        ;;

    -c|--clear)
        > "$FILE"
        echo "✔ cleared"
        ;;

    -*)
        echo "✖ Unknown option: $1"
        echo "Use --help to see available options."
        exit 1
        ;;

    *)
        DATE=$(date '+%Y-%m-%d %H:%M')
        NOTE="$*"
        NOTE="${NOTE//\"/\'}"   # protéger le JSON
        echo "{\"date\":\"$DATE\",\"note\":\"$NOTE\"}" >> "$FILE"
        echo "✔ saved"
        ;;
esac
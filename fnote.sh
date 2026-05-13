#!/bin/bash

DIR="$HOME/.fnote"
FILE="$DIR/dump.jsonl"

mkdir -p "$DIR"
touch "$FILE"

show_help() {
    echo "fnote – ultra-fast local-first notes CLI"
    echo
    echo "Usage:"
    echo "  fn \"texte\"            ajouter une note"
    echo "  fn                    afficher les 20 dernières notes"
    echo "  fn -s MOT            rechercher"
    echo "  fn edit              ouvrir la base dans nano"
    echo "  fn --help            aide"
}

# ---------- NO ARG ----------
if [ $# -eq 0 ]; then
    tail -n 20 "$FILE"
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

    edit)
        # SIMPLE, SANS LOGIQUE, SANS RISQUE
        nano "$FILE"
        ;;

    -*)
        echo "✖ option inconnue: $1"
        exit 1
        ;;

    *)
        DATE=$(date '+%Y-%m-%d %H:%M')
        NOTE="$*"

        # escape minimal safe
        NOTE="${NOTE//\"/\'}"

        echo "{\"date\":\"$DATE\",\"note\":\"$NOTE\"}" >> "$FILE"
        echo "✔ saved"
        ;;
esac

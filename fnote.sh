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
    echo "                                (les lignes commentées par # sont ignorées)"
    echo "  -s, --search MOT            rechercher une note (insensible à la casse)"
    echo "  -c, --clear                 vider toutes les notes"
    echo "  --help                      afficher ce message"
    echo
    echo "Notes:"
    echo "  Les lignes commençant par # dans dump.jsonl sont considérées comme des"
    echo "  commentaires et ne seront pas affichées par la commande fn."
    echo
    echo "Exemples:"
    echo "  fn \"Acheter du lait\"        ajoute une note"
    echo "  fn -s lait                   recherche toutes les notes contenant 'lait'"
    echo "  fn --clear                   supprime toutes les notes"
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
    --help)
        show_help
        ;;
    *)
        DATE=$(date '+%Y-%m-%d %H:%M')
        NOTE="$*"
        echo "{\"date\":\"$DATE\",\"note\":\"$NOTE\"}" >> "$FILE"
        echo "✔ saved"
        ;;
esac

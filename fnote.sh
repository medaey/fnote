#!/bin/bash
# fnote - Gestionnaire de notes minimaliste en terminal

# Répertoire de stockage global
STORAGE_DIR="/var/lib/fnote"
STORAGE_FILE="$STORAGE_DIR/notes.json"

# Créer le dossier si inexistant
if [ ! -d "$STORAGE_DIR" ]; then
    sudo mkdir -p "$STORAGE_DIR"
    sudo chown "$USER":"$USER" "$STORAGE_DIR"
fi

# Création du fichier si inexistant ou vide
if [ ! -f "$STORAGE_FILE" ] || [ ! -s "$STORAGE_FILE" ]; then
    echo "[]" > "$STORAGE_FILE"
fi

# Fonction pour générer un ID auto-incrémenté
generate_id() {
    last_id=$(jq 'if length==0 then 0 else .[-1].id end' "$STORAGE_FILE")
    echo $((last_id + 1))
}

# Ajouter une note
add_note() {
    title="$1"
    if [ -z "$title" ]; then
        echo "Erreur : pas de titre fourni."
        exit 1
    fi
    id=$(generate_id)
    date=$(date +"%Y-%m-%dT%H:%M:%S")
    jq --arg title "$title" --arg date "$date" --argjson id "$id" \
       '. += [{"id": $id, "titre": $title, "etat": "TODO", "date": $date, "details": []}]' \
       "$STORAGE_FILE" > tmp.$$.json && mv tmp.$$.json "$STORAGE_FILE"
    echo "Note $id créée le $date"
}

# Ajouter un détail à une note existante
attach_note() {
    id="$1"
    detail="$2"
    if [ -z "$id" ] || [ -z "$detail" ]; then
        echo "Usage: $0 attach <id> <détail>"
        exit 1
    fi
    jq --arg detail "$detail" --argjson id "$id" \
       '(.[] | select(.id==$id).details) += [$detail]' \
       "$STORAGE_FILE" > tmp.$$.json && mv tmp.$$.json "$STORAGE_FILE"
    echo "Détail ajouté à la note $id"
}

show_note() {
    arg="$1"

    # Déterminer le filtre
    if [[ "$arg" =~ ^[0-9]+$ ]]; then
        FILTER="select(.id == $arg)"
    else
        case "$arg" in
            --all)  FILTER='.' ;;
            --done) FILTER='select(.etat=="TERMINE")' ;;
            ""|--todo) FILTER='select(.etat!="TERMINE")' ;;
            *) echo "ID ou option invalide"; return ;;
        esac
    fi

    jq -r "
        .[] | $FILTER |
        \"[\(.id)] \" + (if .etat==\"TERMINE\" then \"✅\" else \"🔄\" end) + \" \(.date) - \(.titre)\",
        (.details | map(\"        ✏️ \" + .)[]?)
    " "$STORAGE_FILE"
}


# Lister toutes les notes (titre et état)
list_notes() {
    jq -r '.[] | "[\(.id)] \(.titre) - \(.etat)"' "$STORAGE_FILE"
}

# Marquer une note comme terminée
done_note() {
    id="$1"
    if [ -z "$id" ]; then
        echo "Usage: $0 done <id>"
        exit 1
    fi
    jq --argjson id "$id" '(.[] | select(.id==$id).etat) = "TERMINE"' \
       "$STORAGE_FILE" > tmp.$$.json && mv tmp.$$.json "$STORAGE_FILE"
    echo "Note $id marquée comme TERMINE"
}

# Supprimer une note
delete_note() {
    id="$1"
    if [ -z "$id" ]; then
        echo "Usage: $0 delete <id>"
        exit 1
    fi
    jq --argjson id "$id" 'del(.[] | select(.id==$id))' \
       "$STORAGE_FILE" > tmp.$$.json && mv tmp.$$.json "$STORAGE_FILE"
    echo "Note $id supprimée"
}

# Remettre une note en TODO (non done)
nodone_note() {
    id="$1"
    if [ -z "$id" ]; then
        echo "Usage: $0 nodone <id>"
        exit 1
    fi
    jq --argjson id "$id" '(.[] | select(.id==$id).etat) = "TODO"' \
       "$STORAGE_FILE" > tmp.$$.json && mv tmp.$$.json "$STORAGE_FILE"
    echo "Note $id remise en TODO"
}

# Supprimer la dernière note
remove_last_note() {
    jq '.[0:-1]' "$STORAGE_FILE" > tmp.$$.json && mv tmp.$$.json "$STORAGE_FILE"
    echo "Dernière note supprimée"
}

show_help() {
    echo "Usage:"
    echo "  fn | fnote [commande] [options]"
    echo ""
    echo "Commandes:"
    echo "  add <titre>                 Ajouter une note"
    echo "  attach|att <id> <détail>   Ajouter un détail à une note"
    echo "  list                        Lister toutes les notes"
    echo "  show <id>                   Afficher une note"
    echo "  show --all                  Afficher toutes les notes"
    echo "  show --done                 Afficher uniquement les notes terminées"
    echo "  done <id>                   Marquer une note comme terminée"
    echo "  nodone <id>                 Remettre une note en TODO"
    echo "  delete|del <id>             Supprimer une note"
    echo "  remove|rm                   Supprimer la dernière note"
    echo "  --help|-h                   Afficher cette aide"
}

# Menu de commande avec alias
case "$1" in
    add) add_note "$2" ;;
    attach|att) attach_note "$2" "$3" ;;
    show) show_note "$2" ;;
    --all) show_note --all ;;
    --done) show_note --done ;;
    list) list_notes ;;
    done) done_note "$2" ;;
    nodone) nodone_note "$2" ;;
    delete|del) delete_note "$2" ;;
    remove|rm) remove_last_note ;;
    --help|-h) show_help ;;
    "") show_note "" ;;
    *) echo "Commande inconnue. Utilise fnote --help" ;;
esac


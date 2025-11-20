#!/bin/bash
# fnote - gestionnaire de notes simple et rapide
# Mise à jour : création du répertoire + chown si nécessaire,
# génération d'ID robuste, gestion sûre des textes pour jq.

STORAGE_DIR="/var/lib/fnote"
STORAGE_FILE="$STORAGE_DIR/notes.json"

# --- Create storage dir (try user, fallback to sudo) and ensure ownership ---
if [ ! -d "$STORAGE_DIR" ]; then
    if mkdir -p "$STORAGE_DIR" 2>/dev/null; then
        :
    else
        # Tentative avec sudo si mkdir échoue (typique pour /var/lib)
        if command -v sudo >/dev/null 2>&1; then
            sudo mkdir -p "$STORAGE_DIR"
        else
            echo "Erreur : impossible de créer $STORAGE_DIR (sudo absent)." >&2
            exit 1
        fi
    fi
fi

# Si le dossier n'est pas à l'utilisateur courant, tenter chown (avec sudo si nécessaire)
uid_dir=$(stat -c %u "$STORAGE_DIR" 2>/dev/null || echo "")
my_uid=$(id -u)
if [ "$uid_dir" != "$my_uid" ]; then
    # Essayons de chown en tant qu'utilisateur courant (si possible via sudo)
    if chown "$USER":"$USER" "$STORAGE_DIR" 2>/dev/null; then
        :
    else
        if command -v sudo >/dev/null 2>&1; then
            sudo chown "$USER":"$USER" "$STORAGE_DIR" || {
                echo "Attention : échec du chown sur $STORAGE_DIR" >&2
            }
        else
            echo "Attention : $STORAGE_DIR n'appartient pas à $USER et sudo n'est pas disponible." >&2
        fi
    fi
fi

# Init du fichier
[ ! -f "$STORAGE_FILE" ] && echo "[]" > "$STORAGE_FILE"

# --- Vérifier que le JSON est un tableau ---
if [ -f "$STORAGE_FILE" ]; then
    type_json=$(jq 'type' "$STORAGE_FILE" 2>/dev/null)
    if [ "$type_json" != "\"array\"" ]; then
        tmpf="tmp.$$.json"
        jq -s '.' "$STORAGE_FILE" > "$tmpf" && mv "$tmpf" "$STORAGE_FILE"
    fi
fi

# --- Utils ---
generate_id() {
    # Retourne 1 si tableau vide / invalide, sinon max(id)+1
    jq -r 'if (type != "array") or (length == 0) then 1 else (map(.id) | map(if type=="number" then . else 0 end) | max + 1) end' "$STORAGE_FILE"
}

save_tmp_and_move() {
    tmp="tmp.$$.json"
    cat > "$tmp"
    mv "$tmp" "$STORAGE_FILE"
}

error() { echo "Erreur : $1" >&2; exit 1; }

# --- Commandes ---
add_note() {
    [ $# -eq 0 ] && error "aucun texte fourni"
    text="$*"
    id=$(generate_id)
    now=$(date +"%Y-%m-%dT%H:%M:%S")

    # Utiliser jq avec des arguments pour éviter les problèmes d'échappement
    tmp="tmp.$$.json"
    jq --arg text "$text" --arg now "$now" --argjson id "$id" \
       '. += [{"id": $id, "text": $text, "state": "TODO", "created": $now, "updated": $now}]' \
       "$STORAGE_FILE" > "$tmp" && mv "$tmp" "$STORAGE_FILE"

    echo "Note $id ajoutée"
}

list_notes() {
    filter='.[] | select(.state != "DONE")'
    [ "$1" = "--all" ] && filter='.[]'

    jq -r "$filter | \"[\(.id)] (\(.state)) - \(.text)\" " "$STORAGE_FILE"
}

show_note() {
    id="$1"
    [ -z "$id" ] && error "id manquant"

    jq -r ".[] | select(.id==$id) |
ID: \(.id)
Texte: \(.text)
État: \(.state)
Créée: \(.created)
Modifiée: \(.updated)" "$STORAGE_FILE"
}

edit_note() {
    id="$1"
    [ -z "$id" ] && error "id manquant"

    note=$(jq -r ".[] | select(.id==$id).text // \"\"" "$STORAGE_FILE")
    tmp=$(mktemp)
    printf '%s' "$note" > "$tmp"

    ${EDITOR:-nano} "$tmp"

    new=$(cat "$tmp")
    now=$(date +"%Y-%m-%dT%H:%M:%S")

    tmpf="tmp.$$.json"
    jq --arg new "$new" --arg now "$now" --argjson id "$id" \
       '(.[] | select(.id==$id) |= (.text=$new | .updated=$now))' \
       "$STORAGE_FILE" > "$tmpf" && mv "$tmpf" "$STORAGE_FILE"

    echo "Note $id mise à jour"
}

set_state() {
    id="$1"; state="$2"
    [ -z "$id" ] && error "id manquant"
    [ -z "$state" ] && error "état manquant"

    # --- Vérification de l'état ---
    case "$state" in
        TODO | DONE) ;;
        *) error "État invalide : $state. Utilisez TODO ou DONE";;
    esac

    now=$(date +"%Y-%m-%dT%H:%M:%S")

    tmpf="tmp.$$.json"
    jq --arg state "$state" --arg now "$now" --argjson id "$id" \
       '(.[] | select(.id==$id) |= (.state=$state | .updated=$now))' \
       "$STORAGE_FILE" > "$tmpf" && mv "$tmpf" "$STORAGE_FILE"

    echo "Note $id → $state"
}

delete_note() {
    id="$1"
    [ -z "$id" ] && error "id manquant"

    tmpf="tmp.$$.json"
    jq --argjson id "$id" 'del(.[] | select(.id==$id))' "$STORAGE_FILE" > "$tmpf" && mv "$tmpf" "$STORAGE_FILE"
    echo "Note $id supprimée"
}

remove_last_note() {
    tmpf="tmp.$$.json"
    jq '.[0:-1]' "$STORAGE_FILE" > "$tmpf" && mv "$tmpf" "$STORAGE_FILE"
    echo "Dernière note supprimée"
}

# --- Help ---
help() {
cat <<EOF
Usage : fnote <commande>

Commandes principales :
  a <texte>          Ajouter une note
  ls                 Lister les notes (cache les DONE)
  ls --all           Lister tout l'historique
  s <id> <state>     Changer l'état (TODO, DONE)
  e <id>             Éditer une note via \$EDITOR
  show <id>          Afficher une note
  rm <id>            Supprimer une note
  rmlast             Supprimer la dernière note ajoutée

États disponibles :
  TODO   (à faire)
  DONE   (terminée mais conservée dans l'historique)
EOF
}

# --- Router ---
case "$1" in
    a) shift; add_note "$@";;
    ls) list_notes "$2";;
    s) set_state "$2" "$3";;
    e) edit_note "$2";;
    show) show_note "$2";;
    rm) delete_note "$2";;
    rmlast) remove_last_note;;
    ""|--help|-h) help;;
    *) echo "Commande inconnue. Utilise: fnote --help";;
esac
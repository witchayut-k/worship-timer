#!/usr/bin/env bash
# Deploy Firestore security rules (and indexes) to the Firebase project in .firebaserc
#
# Prerequisites:
#   - firebase login (once): npx firebase-tools@latest login
#   - Anonymous Auth enabled in Firebase Console (Authentication → Sign-in method)
#
# Usage (from repo root or worship-timer/):
#   ./scripts/deploy-firestore-rules.sh
#   ./scripts/deploy-firestore-rules.sh --rules-only
#   ./scripts/deploy-firestore-rules.sh --dry-run

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RULES_ONLY=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --rules-only) RULES_ONLY=true ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      echo "Usage: $0 [--rules-only] [--dry-run]"
      echo "  --rules-only  Deploy firestore:rules only (skip indexes)"
      echo "  --dry-run     Validate rules without deploying"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f firestore.rules ]]; then
  echo "error: firestore.rules not found in $ROOT" >&2
  exit 1
fi

if [[ ! -f .firebaserc ]]; then
  echo "error: .firebaserc not found in $ROOT" >&2
  exit 1
fi

PROJECT="$(node -e "console.log(JSON.parse(require('fs').readFileSync('.firebaserc','utf8')).projects.default)")"
echo "Firebase project: $PROJECT"
echo "Rules file:       firestore.rules"

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run: validating rules..."
  npx firebase-tools@latest deploy --only firestore:rules --dry-run
  exit 0
fi

if [[ "$RULES_ONLY" == true ]]; then
  echo "Deploying Firestore rules only..."
  npx firebase-tools@latest deploy --only firestore:rules
else
  echo "Deploying Firestore rules and indexes..."
  npx firebase-tools@latest deploy --only firestore
fi

echo "Done."

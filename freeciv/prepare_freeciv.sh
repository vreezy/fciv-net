#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
cd "${DIR}"

# Fix line endings on Windows
sed -i 's/\r$//' freeciv-web.project

. ./version.txt

# Allow the user to override how Freeciv is downloaded.
if test -f dl_freeciv.sh ; then
  DL_FREECIV=dl_freeciv.sh
else
  DL_FREECIV=dl_freeciv_default.sh
fi

if ! ./$DL_FREECIV $FCREV ; then
  echo "Git checkout failed" >&2
  exit 1
fi

if ! ./apply_patches.sh ; then
  echo "Patching failed" >&2
  exit 1
fi

  mkdir -p build

  ( cd build
    meson ../freeciv -Dfreeciv-web=true -Dclients=[] -Dfcmp=[] \
          -Djson-protocol=true -Dnls=false -Daudio=false -Druledit=false \
          -Ddefault_library=static -Dprefix=${HOME}/freeciv \
          -Doptimization=3
    ninja
  )


echo "done"

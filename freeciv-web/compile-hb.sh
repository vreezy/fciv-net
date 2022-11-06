#!/bin/bash

handlebars src/main/webapp/webclient -e hbs -f target/freeciv-web/javascript/hbs-templates.js --knownOnly;
echo "Handlebars templates compiled."


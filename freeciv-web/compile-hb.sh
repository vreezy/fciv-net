#!/bin/bash

handlebars src/main/webapp/webclient -e hbs -f src/main/webapp/javascript/hbs-templates.js --knownOnly;
echo "Handlebars templates compiled."


#!/bin/bash
if [ -n "$NODE_VERSION" ]; then
    git clone https://github.com/creationix/nvm.git ~/.nvm
    source ~/.nvm/nvm.sh
    nvm install $NODE_VERSION
    node --version
    npm install
    npm test
else
    pip install -r python_scripts/requirements.pip
    pip install -r python_scripts/requirements-dev.pip
    flake8 python_scripts
    py.test --cov=python_scripts python_scripts
fi

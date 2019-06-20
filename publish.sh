#! /bin/sh

#if npm audit; then
  rm *orig* *toc\.*
  npm run build
  npm run-script document
  git add .
  echo "------------------>"
  echo "$1"
  #npm version patch -m "$1" --force
  npm version patch -m "upgrade" --force
  npm publish
  #git commit --amend --author='ouyang <jxfengzi@gmail.com>'
  git commit -m "$1" --author='ouyang <jxfengzi@gmail.com>'
  git push origin master --tags
#else
#  echo "Not publishing due to security vulnerabilites"
#fi

when you prepare a build
after checking the build number
in release version

rm -rf ./build
npm run build
git add build/
git commit -a -m "BUILD folder"